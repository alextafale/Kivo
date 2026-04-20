"""
services/quejas.py
──────────────────
Lógica de negocio para resolución automática de quejas de pedidos.

Flujo:
  1. get_queja_contexto()  → reúne datos del pedido + historial + tiempos granulares
  2. resolver_queja()      → llama al LLM (Qwen via Ollama) y persiste la resolución

Cambios v2:
  - Contexto enriquecido: aceptado_en, preparado_en, recogido_en
  - Desglose de responsabilidad: tiempo_negocio vs tiempo_repartidor
  - Promedio histórico del negocio para contexto comparativo
  - Prompt actualizado para que Qwen pueda atribuir la causa del retraso
"""

import os
import json
import uuid
import httpx
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from models.quejas_resoluciones import QuejaResolucion, QuejaAccion
from schemas.quejas import (
    QuejaContextoOut,
    ItemContexto,
    QuejaHistorialItem,
    ResolucionIn,
    ResolucionOut,
)

# ── Constantes ────────────────────────────────────────────────────────────────

QWEN_MODEL     = "qwen2.5:7b"
OLLAMA_TIMEOUT = 120.0


# ── 1. Contexto de queja ──────────────────────────────────────────────────────

def get_queja_contexto(db: Session, pedido_id: str, user_id: str) -> QuejaContextoOut:
    """
    Reúne toda la información para que el LLM tome una decisión justa:
    - Timestamps granulares del pedido (negocio vs repartidor)
    - Promedio histórico del negocio (para detectar si es patrón o excepción)
    - Items del pedido
    - Historial de quejas del usuario en los últimos 30 días
    """

    # ── Pedido base con timestamps granulares ─────────────────────────────────
    pedido_row = db.execute(text("""
        SELECT
            p.id,
            p.order_number,
            p.estado,
            p.total,
            p.tiempo_estimado_min,
            p.creado_en,
            p.aceptado_en,
            p.preparado_en,
            p.recogido_en,
            p.entregado_en,
            n.nombre  AS negocio_nombre,
            n.id      AS negocio_id,
            s.nombre  AS sucursal_nombre
        FROM pedidos p
        LEFT JOIN negocios   n ON n.id = p.negocio_id
        LEFT JOIN sucursales s ON s.id = p.sucursal_id
        WHERE p.id      = :pedido_id
          AND p.user_id = :user_id
    """), {"pedido_id": pedido_id, "user_id": user_id}).mappings().first()

    if not pedido_row:
        raise HTTPException(404, "Pedido no encontrado o no pertenece al usuario")

    # ── Calcular desglose de tiempos ──────────────────────────────────────────
    # tiempo_negocio: desde que el pedido fue creado hasta que estuvo listo
    tiempo_negocio: int | None = None
    if pedido_row["preparado_en"] and pedido_row["aceptado_en"]:
        delta = pedido_row["preparado_en"] - pedido_row["aceptado_en"]
        tiempo_negocio = int(delta.total_seconds() / 60)

    # tiempo_repartidor: desde que recogió hasta que entregó
    tiempo_repartidor: int | None = None
    if pedido_row["entregado_en"] and pedido_row["recogido_en"]:
        delta = pedido_row["entregado_en"] - pedido_row["recogido_en"]
        tiempo_repartidor = int(delta.total_seconds() / 60)

    # tiempo_espera_repartidor: desde preparado hasta recogido (repartidor tardó en llegar)
    tiempo_espera_repartidor: int | None = None
    if pedido_row["recogido_en"] and pedido_row["preparado_en"]:
        delta = pedido_row["recogido_en"] - pedido_row["preparado_en"]
        tiempo_espera_repartidor = int(delta.total_seconds() / 60)

    # tiempo_total_real: desde creado hasta entregado
    tiempo_real: int | None = None
    if pedido_row["entregado_en"] and pedido_row["creado_en"]:
        delta = pedido_row["entregado_en"] - pedido_row["creado_en"]
        tiempo_real = int(delta.total_seconds() / 60)

    # ── Promedio histórico del negocio (últimas 4 semanas) ────────────────────
    historico_row = db.execute(text("""
        SELECT
            ROUND(AVG(
                EXTRACT(EPOCH FROM (preparado_en - aceptado_en)) / 60
            ))::int AS avg_tiempo_negocio_min,
            ROUND(AVG(
                EXTRACT(EPOCH FROM (entregado_en - recogido_en)) / 60
            ))::int AS avg_tiempo_repartidor_min,
            ROUND(AVG(
                EXTRACT(EPOCH FROM (entregado_en - creado_en)) / 60
            ))::int AS avg_tiempo_total_min,
            COUNT(*) AS total_pedidos_historico
        FROM pedidos
        WHERE negocio_id  = :negocio_id
          AND estado      = 'delivered'
          AND creado_en  >= now() - INTERVAL '4 weeks'
          AND preparado_en IS NOT NULL
          AND recogido_en  IS NOT NULL
          AND entregado_en IS NOT NULL
    """), {"negocio_id": str(pedido_row["negocio_id"])}).mappings().first()

    avg_tiempo_negocio    = historico_row["avg_tiempo_negocio_min"]    if historico_row else None
    avg_tiempo_repartidor = historico_row["avg_tiempo_repartidor_min"] if historico_row else None
    avg_tiempo_total      = historico_row["avg_tiempo_total_min"]      if historico_row else None
    total_historico       = historico_row["total_pedidos_historico"]   if historico_row else 0

    # ── Items del pedido ──────────────────────────────────────────────────────
    items_rows = db.execute(text("""
        SELECT nombre, cantidad, precio_unitario, subtotal
        FROM   pedido_items
        WHERE  pedido_id = :pedido_id
    """), {"pedido_id": pedido_id}).mappings().all()

    items = [
        ItemContexto(
            nombre=r["nombre"],
            cantidad=r["cantidad"],
            precio_unitario=float(r["precio_unitario"]),
            subtotal=float(r["subtotal"]),
        )
        for r in items_rows
    ]

    # ── Historial de quejas del usuario (últimos 30 días) ─────────────────────
    historial_rows = db.execute(text("""
        SELECT pedido_id, accion, monto, created_at
        FROM   quejas_resoluciones
        WHERE  usuario_id = :user_id
          AND  created_at >= now() - INTERVAL '30 days'
        ORDER  BY created_at DESC
    """), {"user_id": user_id}).mappings().all()

    historial = [
        QuejaHistorialItem(
            pedido_id=str(r["pedido_id"]),
            accion=r["accion"],
            monto=float(r["monto"]) if r["monto"] is not None else None,
            created_at=r["created_at"].isoformat(),
        )
        for r in historial_rows
    ]

    return QuejaContextoOut(
        pedido_id=str(pedido_row["id"]),
        order_number=pedido_row["order_number"],
        estado=pedido_row["estado"],
        total=float(pedido_row["total"] or 0),
        tiempo_estimado_min=pedido_row["tiempo_estimado_min"],
        # Tiempos reales desglosados
        tiempo_entrega_real_min=tiempo_real,
        tiempo_negocio_min=tiempo_negocio,
        tiempo_repartidor_min=tiempo_repartidor,
        tiempo_espera_repartidor_min=tiempo_espera_repartidor,
        # Promedios históricos del negocio
        avg_tiempo_negocio_min=avg_tiempo_negocio,
        avg_tiempo_repartidor_min=avg_tiempo_repartidor,
        avg_tiempo_total_min=avg_tiempo_total,
        total_pedidos_historico=int(total_historico or 0),
        # Relación
        items=items,
        historial_quejas_30d=historial,
        negocio_nombre=pedido_row["negocio_nombre"],
        sucursal_nombre=pedido_row["sucursal_nombre"],
    )


# ── 2. Llamada al LLM ─────────────────────────────────────────────────────────

async def _llamar_llm(contexto: QuejaContextoOut) -> dict:
    """
    Construye el prompt enriquecido, llama a Ollama y parsea la respuesta JSON.
    Devuelve: { "accion": str, "monto": float|null, "razon": str, "mensaje_usuario": str }
    """

    # ── Formatear historial de quejas ─────────────────────────────────────────
    historial_txt = (
        "Ninguna queja reciente."
        if not contexto.historial_quejas_30d
        else "\n".join(
            f"  - {h.created_at[:10]}: {h.accion}"
            + (f" (${h.monto:.2f})" if h.monto else "")
            for h in contexto.historial_quejas_30d
        )
    )

    # ── Formatear items ───────────────────────────────────────────────────────
    items_txt = "\n".join(
        f"  - {i.nombre} x{i.cantidad} = ${i.subtotal:.2f}"
        for i in contexto.items
    )

    # ── Formatear análisis de tiempos ─────────────────────────────────────────
    def _fmt(val: int | None, label: str) -> str:
        return f"{val} min" if val is not None else "N/D"

    tiempo_total   = _fmt(contexto.tiempo_entrega_real_min, "total")
    tiempo_estimado = f"{contexto.tiempo_estimado_min} min" if contexto.tiempo_estimado_min else "N/D"

    # Determinar si hubo retraso y de cuántos minutos
    retraso_min: int | None = None
    if contexto.tiempo_entrega_real_min and contexto.tiempo_estimado_min:
        retraso_min = contexto.tiempo_entrega_real_min - contexto.tiempo_estimado_min

    retraso_txt = (
        "Sin información suficiente para determinar retraso."
        if retraso_min is None
        else (
            f"El pedido llegó {retraso_min} min TARDE (real: {tiempo_total}, estimado: {tiempo_estimado})."
            if retraso_min > 0
            else f"El pedido llegó a tiempo (real: {tiempo_total}, estimado: {tiempo_estimado})."
        )
    )

    # Desglose de responsabilidad
    desglose_txt = "Sin desglose disponible."
    if contexto.tiempo_negocio_min is not None or contexto.tiempo_repartidor_min is not None:
        partes = []
        if contexto.tiempo_negocio_min is not None:
            avg_neg = contexto.avg_tiempo_negocio_min
            comp = f" (promedio del negocio: {avg_neg} min)" if avg_neg else ""
            partes.append(f"  • Negocio (preparación): {contexto.tiempo_negocio_min} min{comp}")
        if contexto.tiempo_espera_repartidor_min is not None:
            partes.append(f"  • Espera del repartidor en el negocio: {contexto.tiempo_espera_repartidor_min} min")
        if contexto.tiempo_repartidor_min is not None:
            avg_rep = contexto.avg_tiempo_repartidor_min
            comp = f" (promedio: {avg_rep} min)" if avg_rep else ""
            partes.append(f"  • Repartidor (trayecto): {contexto.tiempo_repartidor_min} min{comp}")
        desglose_txt = "\n".join(partes)

    historico_txt = (
        "Sin historial suficiente del negocio."
        if not contexto.total_pedidos_historico
        else (
            f"Basado en {contexto.total_pedidos_historico} pedidos recientes del negocio: "
            f"tiempo total promedio {contexto.avg_tiempo_total_min} min."
        )
    )

    # ── System prompt ─────────────────────────────────────────────────────────
    system_prompt = (
        "Eres el sistema de resolución de quejas de Kivo, una app de delivery en México. "
        "Tu tarea es decidir la acción más justa y razonable ante una queja de un cliente, "
        "considerando quién fue responsable del problema. "
        "Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, "
        "con las claves: accion, monto, razon, mensaje_usuario.\n\n"

        "Acciones disponibles:\n"
        "  - reembolso_parcial: devuelve dinero (monto en MXN, entre 10% y 50% del total)\n"
        "  - cupon: cupón de descuento para próximo pedido (monto = valor del cupón)\n"
        "  - disculpa: solo mensaje de disculpa (monto = null)\n\n"

        "Criterios de decisión:\n"
        "  1. Si el retraso fue causado principalmente por el NEGOCIO (preparación muy por encima del promedio)\n"
        "     → reembolso_parcial ~20% del total\n"
        "  2. Si el retraso fue causado principalmente por el REPARTIDOR (trayecto muy por encima del promedio)\n"
        "     → cupon con valor ~15% del total (el repartidor es independiente)\n"
        "  3. Si el retraso fue moderado (<15 min sobre el estimado) sin culpable claro\n"
        "     → cupon con valor ~10% del total\n"
        "  4. Si el usuario ya tuvo ≥2 quejas en los últimos 30 días\n"
        "     → disculpa solamente (evitar abuso del sistema)\n"
        "  5. Si el pedido está cancelado o reembolsado → disculpa\n"
        "  6. Si no hubo retraso real → disculpa con mensaje empático\n\n"

        "El campo 'razon' es para uso interno (explica la decisión en 1 línea).\n"
        "El campo 'mensaje_usuario' debe ser un mensaje amigable, humano y en español mexicano, "
        "mencionando la causa real del problema si se conoce. "
        "Evita frases genéricas como 'lamentamos los inconvenientes'."
    )

    # ── User prompt ───────────────────────────────────────────────────────────
    user_prompt = (
        f"Pedido #{contexto.order_number or contexto.pedido_id[:8]}:\n"
        f"  Negocio: {contexto.negocio_nombre or 'Desconocido'}\n"
        f"  Estado: {contexto.estado}\n"
        f"  Total: ${contexto.total:.2f} MXN\n\n"

        f"Análisis de tiempos:\n"
        f"  {retraso_txt}\n\n"

        f"Desglose por responsable:\n"
        f"{desglose_txt}\n\n"

        f"Contexto histórico del negocio:\n"
        f"  {historico_txt}\n\n"

        f"Items del pedido:\n{items_txt}\n\n"

        f"Historial de quejas del usuario (últimos 30 días):\n{historial_txt}\n\n"

        "Responde SOLO con el JSON de resolución."
    )

    # ── Llamada a Ollama ──────────────────────────────────────────────────────
    ollama_url = os.getenv("QWEN_HOST)", "http://localhost:11434") + "/api/chat"

    payload = {
        "model": QWEN_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
            "num_predict": 400,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(ollama_url, json=payload)
            response.raise_for_status()
            raw_content = response.json()["message"]["content"]
            return json.loads(raw_content)
    except httpx.TimeoutException:
        raise HTTPException(504, "El modelo tardó demasiado en responder")
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Error del modelo: {e.response.status_code}")
    except (KeyError, json.JSONDecodeError) as e:
        raise HTTPException(502, f"Respuesta del modelo inválida: {str(e)}")


# ── 3. Persistir y ejecutar resolución ───────────────────────────────────────

async def resolver_queja(
    db: Session,
    pedido_id: str,
    user_id: str,
    body: ResolucionIn,
) -> ResolucionOut:
    """
    1. Obtiene contexto enriquecido
    2. Llama al LLM (o usa override manual)
    3. Persiste el resultado en quejas_resoluciones
    4. Ejecuta la acción (reembolso / cupón / disculpa)
    5. Retorna el resultado al cliente
    """

    contexto = get_queja_contexto(db, pedido_id, user_id)

    # ── Decisión ──────────────────────────────────────────────────────────────
    if body.accion_override:
        accion_str      = body.accion_override.value
        monto           = body.monto_override
        razon           = "Acción definida manualmente por el operador."
        mensaje_usuario = _mensaje_default(accion_str, monto)
    else:
        llm_result      = await _llamar_llm(contexto)
        accion_str      = llm_result.get("accion", "disculpa")
        monto           = llm_result.get("monto")
        razon           = llm_result.get("razon", "")
        mensaje_usuario = llm_result.get("mensaje_usuario", _mensaje_default(accion_str, monto))

    # Normalizar acción
    try:
        accion_enum = QuejaAccion(accion_str)
    except ValueError:
        accion_enum = QuejaAccion.disculpa

    monto_decimal = float(monto) if monto is not None else None

    # ── Persistir ─────────────────────────────────────────────────────────────
    queja = QuejaResolucion(
        id            = uuid.uuid4(),
        pedido_id     = uuid.UUID(pedido_id),
        usuario_id    = uuid.UUID(user_id),
        accion        = accion_enum,
        monto         = monto_decimal,
        razon_interna = razon,
    )
    db.add(queja)
    db.commit()
    db.refresh(queja)

    # ── Ejecutar acción ───────────────────────────────────────────────────────
    await _ejecutar_accion(accion_enum, pedido_id, user_id, monto_decimal, db)

    return ResolucionOut(
        queja_id        = str(queja.id),
        pedido_id       = pedido_id,
        accion          = accion_enum.value,
        monto           = monto_decimal,
        razon_interna   = razon,
        mensaje_usuario = mensaje_usuario,
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mensaje_default(accion: str, monto: float | None) -> str:
    if accion == "reembolso_parcial":
        return f"Hemos procesado un reembolso de ${monto:.2f} MXN a tu método de pago. Disculpa la experiencia."
    if accion == "cupon":
        return f"Te enviamos un cupón de ${monto:.2f} MXN para tu próximo pedido. ¡Gracias por tu paciencia!"
    return "Recibimos tu queja y la tomamos muy en serio. Trabajamos para que no vuelva a ocurrir."


async def _ejecutar_accion(
    accion: QuejaAccion,
    pedido_id: str,
    user_id: str,
    monto: float | None,
    db: Session,
):
    """
    Punto de extensión para módulos de pagos y cupones.
    Stub activo — conectar cuando Stripe y Cupones estén listos.
    """
    if accion == QuejaAccion.reembolso_parcial:
        # TODO: services.pagos.emitir_reembolso(pedido_id, monto)
        pass
    elif accion == QuejaAccion.cupon:
        # TODO: services.cupones.crear_cupon(user_id, monto)
        pass