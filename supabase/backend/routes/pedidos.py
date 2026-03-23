# routes/pedidos.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from db.database import SessionLocal
from core.dependencies import get_current_user_id
from models.pedidos import Pedido
from models.pedido_items import PedidoItem
from schemas.pedidos import PedidoIn, PedidoOut
from schemas.enums import PedidoEstado
from services.notification_service import send_push_notification
import uuid

router = APIRouter(tags=["Pedidos"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Transiciones válidas de estado ──────────────────────────────────────────
# Solo se puede avanzar en este orden, nunca retroceder ni saltar pasos
TRANSICIONES_VALIDAS: dict[str, list[str]] = {
    "pending":    ["confirmed", "cancelled"],
    "confirmed":  ["preparing", "cancelled"],
    "preparing":  ["ready",     "cancelled"],
    "ready":      ["picked_up"],
    "picked_up":  ["on_the_way"],
    "on_the_way": ["delivered"],
    "delivered":  [],
    "cancelled":  [],
    "refunded":   [],
}

# Campos de timestamp a actualizar según el nuevo estado
TIMESTAMP_POR_ESTADO: dict[str, str] = {
    "confirmed":  "aceptado_en",
    "preparing":  "aceptado_en",
    "ready":      "preparado_en",
    "picked_up":  "recogido_en",
    "on_the_way": "recogido_en",
    "delivered":  "entregado_en",
    "cancelled":  "cancelado_en",
}


class EstadoIn(BaseModel):
    estado: PedidoEstado
    motivo_cancelacion: str | None = None


# ─── GET /pedidos ─────────────────────────────────────────────────────────────

@router.get("/pedidos", summary="Obtener historial de pedidos")
def get_pedidos(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = text("""
        SELECT 
            p.id,
            p.order_number          AS "orderNumber",
            p.user_id               AS "userId",
            p.negocio_id            AS "negocioId",
            p.sucursal_id           AS "sucursalId",
            p.repartidor_id         AS "repartidorId",
            p.domicilio_id          AS "domicilioId",
            p.estado                AS status,
            p.total,
            p.subtotal,
            p.descuento,
            p.costo_envio           AS "costoEnvio",
            p.propina,
            p.notas,
            p.tiempo_estimado_min   AS "tiempoEstimadoMin",
            p.direccion_entrega     AS "deliveryAddress",
            p.cancelado_en          AS "canceladoEn",
            p.motivo_cancelacion    AS "motivoCancelacion",
            p.creado_en             AS date,
            n.nombre                AS "restaurantName",
            COALESCE(n.logo_url, '') AS "restaurantImage"
        FROM pedidos p
        LEFT JOIN negocios n ON n.id = p.negocio_id
        WHERE p.user_id = :user_id
        ORDER BY p.creado_en DESC
    """)
    result = db.execute(query, {"user_id": user_id})
    rows = result.mappings().all()
    return [dict(row) for row in rows]


# ─── GET /pedidos/{pedido_id} ─────────────────────────────────────────────────

@router.get("/pedidos/{pedido_id}", summary="Obtener pedido por ID")
def get_pedido(
    pedido_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    query = text("""
        SELECT 
            p.*,
            n.nombre                AS "restaurantName",
            COALESCE(n.logo_url, '') AS "restaurantImage"
        FROM pedidos p
        LEFT JOIN negocios n ON n.id = p.negocio_id
        WHERE p.id = :pedido_id
        AND p.user_id = :user_id
    """)
    result = db.execute(query, {"pedido_id": pedido_id, "user_id": user_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return dict(row)


# ─── GET /negocios/{negocio_id}/pedidos (para el negocio) ────────────────────

@router.get("/negocios/{negocio_id}/pedidos", summary="Pedidos del negocio (para ManageOrders)")
def get_pedidos_negocio(
    negocio_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Lista los pedidos activos del negocio.
    Solo el admin del negocio puede verlos.
    """
    # Verificar que el usuario es admin de este negocio
    admin = db.execute(
        text("SELECT id FROM negocio_admins WHERE negocio_id = :nid AND user_id = :uid"),
        {"nid": negocio_id, "uid": user_id},
    ).first()

    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver estos pedidos")

    query = text("""
        SELECT
            p.id,
            p.order_number      AS "orderNumber",
            p.estado            AS status,
            p.total,
            p.subtotal,
            p.costo_envio       AS "costoEnvio",
            p.notas,
            p.direccion_entrega AS "deliveryAddress",
            p.creado_en         AS date,
            pr.nombre           AS "clienteNombre",
            pr.telefono         AS "clienteTelefono"
        FROM pedidos p
        LEFT JOIN profiles pr ON pr.id = p.user_id
        WHERE p.negocio_id = :negocio_id
          AND p.estado NOT IN ('delivered', 'cancelled', 'refunded')
        ORDER BY p.creado_en DESC
    """)
    result = db.execute(query, {"negocio_id": negocio_id})
    return [dict(row) for row in result.mappings().all()]


# ─── PATCH /pedidos/{pedido_id}/estado ───────────────────────────────────────

@router.patch("/pedidos/{pedido_id}/estado", summary="Cambiar estado de un pedido")
async def cambiar_estado_pedido(
    pedido_id: str,
    body: EstadoIn,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Cambia el estado de un pedido.
    Solo el admin del negocio dueño del pedido puede hacerlo.
    Valida transiciones, actualiza timestamps y envía push al cliente.
    """
    # 1. Obtener el pedido
    pedido = db.execute(
        text("SELECT * FROM pedidos WHERE id = :id"),
        {"id": pedido_id},
    ).mappings().first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # 2. Verificar que el usuario es admin del negocio dueño del pedido
    admin = db.execute(
        text("""
            SELECT id FROM negocio_admins
            WHERE negocio_id = :nid AND user_id = :uid
        """),
        {"nid": str(pedido["negocio_id"]), "uid": user_id},
    ).first()

    if not admin:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este pedido")

    # 3. Validar transición de estado
    estado_actual = pedido["estado"]
    nuevo_estado = body.estado.value

    if nuevo_estado not in TRANSICIONES_VALIDAS.get(estado_actual, []):
        raise HTTPException(
            status_code=400,
            detail=f"No se puede cambiar de '{estado_actual}' a '{nuevo_estado}'",
        )

    # 4. Construir query de actualización con timestamp correspondiente
    timestamp_campo = TIMESTAMP_POR_ESTADO.get(nuevo_estado)
    timestamp_sql = f", {timestamp_campo} = NOW()" if timestamp_campo else ""

    motivo_sql = ""
    params: dict = {"id": pedido_id, "estado": nuevo_estado}

    if nuevo_estado == "cancelled" and body.motivo_cancelacion:
        motivo_sql = ", motivo_cancelacion = :motivo"
        params["motivo"] = body.motivo_cancelacion

    db.execute(
        text(f"""
            UPDATE pedidos
            SET estado         = :estado,
                actualizado_en = NOW()
                {timestamp_sql}
                {motivo_sql}
            WHERE id = :id
        """),
        params,
    )
    db.commit()

    # 5. Enviar push notification al cliente (async, no bloquea la respuesta)
    push_token = db.execute(
        text("SELECT expo_push_token FROM profiles WHERE id = :uid"),
        {"uid": str(pedido["user_id"])},
    ).scalar()

    if push_token:
        await send_push_notification(
            expo_push_token=push_token,
            estado=nuevo_estado,
            order_number=pedido.get("order_number"),
            pedido_id=pedido_id,
        )

    return {"ok": True, "estado": nuevo_estado}


# ─── POST /pedidos ────────────────────────────────────────────────────────────

@router.post("/pedidos", response_model=PedidoOut, summary="Crear pedido")
def create_pedido(
    pedido_in: PedidoIn,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    # 1. Obtener info de la sucursal
    sucursal = db.execute(
        text("SELECT * FROM sucursales WHERE id = :id"),
        {"id": str(pedido_in.sucursal_id)},
    ).mappings().first()

    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")

    # 2. Obtener dirección del domicilio
    domicilio = db.execute(
        text("SELECT * FROM domicilios WHERE id = :id"),
        {"id": str(pedido_in.domicilio_id)},
    ).mappings().first()

    if not domicilio:
        raise HTTPException(status_code=404, detail="Domicilio no encontrado")

    direccion_entrega = (
        f"{domicilio['calle']} {domicilio['numero_ext']}, "
        f"{domicilio['colonia']}, {domicilio['ciudad']}, {domicilio['estado']}"
    )

    # 3. Calcular totales
    subtotal = sum(item.precio_unitario * item.cantidad for item in pedido_in.items)
    costo_envio = sucursal.get("costo_envio", 0) or 0
    descuento = 0
    propina = pedido_in.propina or 0
    total = subtotal + costo_envio - descuento + propina

    # 4. Generar order_number
    order_number = f"PID-{uuid.uuid4().hex[:6].upper()}"

    # 5. Crear el pedido
    pedido = Pedido(
        id=uuid.uuid4(),
        user_id=user_id,
        sucursal_id=pedido_in.sucursal_id,
        negocio_id=sucursal["negocio_id"],
        domicilio_id=pedido_in.domicilio_id,
        direccion_entrega=direccion_entrega,
        order_number=order_number,
        estado="pending",
        notas=pedido_in.notas,
        cupon_id=pedido_in.cupon_id,
        subtotal=subtotal,
        costo_envio=costo_envio,
        descuento=descuento,
        propina=propina,
        total=total,
    )
    db.add(pedido)
    db.flush()

    # 6. Crear los items con snapshot de precios
    for item in pedido_in.items:
        pedido_item = PedidoItem(
            id=uuid.uuid4(),
            pedido_id=pedido.id,
            menu_item_id=item.menu_item_id,
            nombre=item.nombre,
            precio_unitario=item.precio_unitario,
            cantidad=item.cantidad,
            personalizaciones=item.personalizaciones,
            subtotal=item.precio_unitario * item.cantidad,
            notas=item.notas,
        )
        db.add(pedido_item)

    db.commit()
    db.refresh(pedido)

    items = db.query(PedidoItem).filter(PedidoItem.pedido_id == pedido.id).all()
    pedido.items = items

    return pedido