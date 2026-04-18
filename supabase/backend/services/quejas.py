"""
services/quejas.py
──────────────────
Lógica de negocio para resolución automática de quejas de pedidos.

Flujo:
  1. get_queja_contexto()  → reúne datos del pedido + historial del usuario
  2. resolver_queja()      → llama al LLM (Qwen via Ollama) y persiste la resolución
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

# ── Constantes ───────────────────────────────────────────────────────────────

QWEN_MODEL      = "qwen2.5:7b"
OLLAMA_TIMEOUT  = 120.0


# ── 1. Contexto de queja ─────────────────────────────────────────────────────

def get_queja_contexto(db: Session, pedido_id: str, user_id: str) -> QuejaContextoOut:
    """
    Reúne toda la información relevante para que el LLM tome una decisión justa:
    - Datos del pedido (estado, total, tiempos)
    - Items del pedido
    - Historial de quejas del usuario en los últimos 30 días
    """

    # ── Pedido base ──────────────────────────────────────────────────────────
    pedido_row = db.execute(text("""
        SELECT
            p.id,
            p.order_number,
            p.estado,
            p.total,
            p.tiempo_estimado_min,
            p.creado_en,
            p.entregado_en,
            n.nombre  AS negocio_nombre,
            s.nombre  AS sucursal_nombre
        FROM pedidos p
        LEFT JOIN negocios  n ON n.id = p.negocio_id
        LEFT JOIN sucursales s ON s.id = p.sucursal_id
        WHERE p.id = :pedido_id
          AND p.user_id = :user_id
    """), {"pedido_id": pedido_id, "user_id": user_id}).mappings().first()

    if not pedido_row:
        raise HTTPException(404, "Pedido no encontrado o no pertenece al usuario")

    # Tiempo real de entrega en minutos (solo si ya fue entregado)
    tiempo_real: int | None = None
    if pedido_row["entregado_en"] and pedido_row["creado_en"]:
        delta = pedido_row["entregado_en"] - pedido_row["creado_en"]
        tiempo_real = int(delta.total_seconds() / 60)

    # ── Items del pedido ─────────────────────────────────────────────────────
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

    # ── Historial de quejas (últimos 30 días) ────────────────────────────────
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
        tiempo_entrega_real_min=tiempo_real,
        tiempo_estimado_min=pedido_row["tiempo_estimado_min"],
        items=items,
        historial_quejas_30d=historial,
        negocio_nombre=pedido_row["negocio_nombre"],
        sucursal_nombre=pedido_row["sucursal_nombre"],
    )


# ── 2. Llamada al LLM ────────────────────────────────────────────────────────

async def _llamar_llm(contexto: QuejaContextoOut) -> dict:
    """
    Construye el prompt, llama a Ollama y parsea la respuesta JSON del LLM.
    Devuelve: { "accion": str, "monto": float|null, "razon": str, "mensaje_usuario": str }
    """

    historial_txt = (
        "Ninguna queja reciente."
        if not contexto.historial_quejas_30d
        else "\n".join(
            f"  - {h.created_at[:10]}: {h.accion}"
            + (f" (${h.monto:.2f})" if h.monto else "")
            for h in contexto.historial_quejas_30d
        )
    )

    items_txt = "\n".join(
        f"  - {i.nombre} x{i.cantidad} = ${i.subtotal:.2f}"
        for i in contexto.items
    )

    tiempo_txt = "No disponible"
    if contexto.tiempo_entrega_real_min is not None:
        tiempo_txt = f"{contexto.tiempo_entrega_real_min} min (estimado: {contexto.tiempo_estimado_min or '?'} min)"

    system_prompt = (
        "Eres el sistema de resolución de quejas de Pídelo, una app de delivery. "
        "Tu tarea es decidir la acción más justa y razonable ante una queja de un cliente. "
        "Debes responder ÚNICAMENTE con un objeto JSON válido, sin texto adicional, "
        "con las claves: accion, monto, razon, mensaje_usuario.\n\n"
        "Acciones disponibles:\n"
        "  - reembolso_parcial: devuelve dinero al cliente (monto en MXN, entre 10% y 50% del total)\n"
        "  - cupon: emite cupón de descuento para próximo pedido (monto = valor del cupón)\n"
        "  - disculpa: solo envía mensaje de disculpa (monto = null)\n\n"
        "Criterios:\n"
        "  - Si el pedido llegó tarde (>20 min sobre el estimado) y es la primera queja → reembolso_parcial ~20%\n"
        "  - Si el usuario ya tuvo ≥2 quejas en 30 días → solo disculpa (evitar abuso)\n"
        "  - Si el pedido está cancelado o reembolsado → disculpa\n"
        "  - Caso general (queja válida, sin historial de abuso) → cupon\n\n"
        "El campo mensaje_usuario debe ser un mensaje amigable en español para mostrar al cliente."
    )

    user_prompt = (
        f"Información del pedido #{contexto.order_number or contexto.pedido_id[:8]}:\n"
        f"  Estado: {contexto.estado}\n"
        f"  Total: ${contexto.total:.2f} MXN\n"
        f"  Negocio: {contexto.negocio_nombre or 'Desconocido'}\n"
        f"  Tiempo de entrega: {tiempo_txt}\n"
        f"  Items:\n{items_txt}\n\n"
        f"Historial de quejas del usuario (últimos 30 días):\n{historial_txt}\n\n"
        "Responde SOLO con el JSON de resolución."
    )

    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") + "/api/chat"

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


# ── 3. Persistir y ejecutar resolución ──────────────────────────────────────

async def resolver_queja(
    db: Session,
    pedido_id: str,
    user_id: str,
    body: ResolucionIn,
) -> ResolucionOut:
    """
    1. Obtiene contexto
    2. Llama al LLM (o usa override manual)
    3. Persiste el resultado en quejas_resoluciones
    4. Ejecuta la acción (reembolso / cupón / disculpa)
    5. Retorna el resultado al cliente
    """

    # Verificar que el pedido exista y pertenezca al usuario
    contexto = get_queja_contexto(db, pedido_id, user_id)

    # ── Decisión ─────────────────────────────────────────────────────────────
    if body.accion_override:
        accion_str     = body.accion_override.value
        monto          = body.monto_override
        razon          = "Acción definida manualmente por el operador."
        mensaje_usuario = _mensaje_default(accion_str, monto)
    else:
        llm_result = await _llamar_llm(contexto)
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

    # ── Ejecutar acción (stub — conectar a módulo de pagos / cupones) ────────
    await _ejecutar_accion(accion_enum, pedido_id, user_id, monto_decimal, db)

    return ResolucionOut(
        queja_id       = str(queja.id),
        pedido_id      = pedido_id,
        accion         = accion_enum.value,
        monto          = monto_decimal,
        razon_interna  = razon,
        mensaje_usuario = mensaje_usuario,
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _mensaje_default(accion: str, monto: float | None) -> str:
    if accion == "reembolso_parcial":
        return f"Hemos procesado un reembolso parcial de ${monto:.2f} MXN a tu método de pago."
    if accion == "cupon":
        return f"Te enviamos un cupón de ${monto:.2f} MXN para tu próximo pedido. ¡Gracias por tu paciencia!"
    return "Lamentamos los inconvenientes. Tu experiencia nos importa y trabajamos para mejorar."


async def _ejecutar_accion(
    accion: QuejaAccion,
    pedido_id: str,
    user_id: str,
    monto: float | None,
    db: Session,
):
    """
    Punto de extensión para conectar con los módulos de pagos y cupones.
    Por ahora solo registra la intención; los módulos reales se integrán
    cuando Pagos (Stripe) y Cupones estén completos.
    """
    if accion == QuejaAccion.reembolso_parcial:
        # TODO: llamar a services.pagos.emitir_reembolso(pedido_id, monto)
        pass
    elif accion == QuejaAccion.cupon:
        # TODO: llamar a services.cupones.crear_cupon(user_id, monto)
        pass
    # disculpa: no requiere acción adicional
