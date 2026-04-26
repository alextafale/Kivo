from sqlalchemy.orm import Session
from sqlalchemy import text, func
from fastapi import HTTPException
from models.pedidos import Pedido
from models.pedido_items import PedidoItem
from models.sucursales import Sucursal
from models.domicilios import Domicilio
from models.negocio_admin import NegocioAdmin
from models.profiles import Profile
from schemas.pedidos import PedidoIn,ConfirmarPedidoIn
from exceptions.domicilios import DomicilioNoExistente
from exceptions.sucursal import SucursalNoExistente
from exceptions.pedidos import PedidoNoExistente
from services.notification_service import send_push_notification
import uuid


TRANSICIONES_VALIDAS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["preparing", "cancelled"],
    "preparing": ["ready", "cancelled"],
    "ready": ["picked_up"],
    "picked_up": ["on_the_way"],
    "on_the_way": ["delivered"],
    "delivered": [],
    "cancelled": [],
    "refunded": [],
}

TIMESTAMP_POR_ESTADO = {
    "confirmed": "aceptado_en",
    "preparing": "aceptado_en",
    "ready": "preparado_en",
    "picked_up": "recogido_en",
    "on_the_way": "recogido_en",
    "delivered": "entregado_en",
    "cancelled": "cancelado_en",
}


def get_pedidos(db: Session, user_id: str):
    result = db.execute(text("""
        SELECT 
            p.id,
            p.order_number AS "orderNumber",
            p.estado AS status,
            p.total,
            p.creado_en AS date,
            n.nombre AS "restaurantName",
            COALESCE(n.logo_url, '') AS "restaurantImage"
        FROM pedidos p
        LEFT JOIN negocios n ON n.id = p.negocio_id
        WHERE p.user_id = :user_id
        ORDER BY p.creado_en DESC
    """), {"user_id": user_id})

    return [dict(row) for row in result.mappings().all()]



def get_pedido(db: Session, pedido_id: str, user_id: str):
    pedido = db.query(Pedido).filter(
        Pedido.id == pedido_id,
        Pedido.user_id == user_id
    ).first()

    if not pedido:
        raise PedidoNoExistente()

    return pedido



def get_pedidos_negocio(db: Session, negocio_id: str, user_id: str):

    admin = db.query(NegocioAdmin).filter(
        NegocioAdmin.negocio_id == negocio_id,
        NegocioAdmin.user_id == user_id
    ).first()

    if not admin:
        raise HTTPException(403, "Sin permiso")

    result = db.execute(text("""
        SELECT
            p.id,
            p.order_number AS "orderNumber",
            p.estado AS status,
            p.total,
            p.creado_en AS date,
            pr.nombre AS "clienteNombre"
        FROM pedidos p
        LEFT JOIN profiles pr ON pr.id = p.user_id
        WHERE p.negocio_id = :negocio_id
        AND p.estado NOT IN ('delivered', 'cancelled', 'refunded')
        ORDER BY p.creado_en DESC
    """), {"negocio_id": negocio_id})

    return [dict(row) for row in result.mappings().all()]



async def change_estado_pedido(db: Session, pedido_id: str, user_id: str, body):

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise PedidoNoExistente()

    admin = db.query(NegocioAdmin).filter(
        NegocioAdmin.negocio_id == pedido.negocio_id,
        NegocioAdmin.user_id == user_id
    ).first()

    if not admin:
        raise HTTPException(403, "Sin permiso")

    estado_actual = pedido.estado
    nuevo_estado = body.estado.value

    if nuevo_estado not in TRANSICIONES_VALIDAS.get(estado_actual, []):
        raise HTTPException(400, "Transición inválida")

    # actualizar estado
    pedido.estado = nuevo_estado

    # timestamps
    campo = TIMESTAMP_POR_ESTADO.get(nuevo_estado)
    if campo:
        setattr(pedido, campo, func.now())

    if nuevo_estado == "cancelled":
        pedido.motivo_cancelacion = body.motivo_cancelacion

    db.commit()

    # push notification
    profile = db.query(Profile).filter(Profile.id == pedido.user_id).first()

    if profile and profile.expo_push_token:
        await send_push_notification(
            expo_push_token=profile.expo_push_token,
            estado=nuevo_estado,
            order_number=pedido.order_number,
            pedido_id=str(pedido.id),
        )

    return {"ok": True, "estado": nuevo_estado}



def create_pedido(db: Session, pedido_in: PedidoIn, user_id: str):
    try:
        sucursal = db.query(Sucursal).filter(
            Sucursal.id == pedido_in.sucursal_id
        ).first()

        if not sucursal:
            raise SucursalNoExistente()

        domicilio = db.query(Domicilio).filter(
            Domicilio.id == pedido_in.domicilio_id
        ).first()

        if not domicilio:
            raise DomicilioNoExistente()

        direccion = f"{domicilio.calle} {domicilio.numero_ext}"

        subtotal = sum(i.precio_unitario * i.cantidad for i in pedido_in.items)
        costo_envio = sucursal.costo_envio or 0
        total = subtotal + costo_envio

        pedido = Pedido(
            id=uuid.uuid4(),
            user_id=user_id,
            sucursal_id=sucursal.id,
            negocio_id=sucursal.negocio_id,
            domicilio_id=domicilio.id,
            direccion_entrega=direccion,
            estado="pending",
            subtotal=subtotal,
            total=total,
        )

        db.add(pedido)
        db.flush()

        for item in pedido_in.items:
            db.add(PedidoItem(
                id=uuid.uuid4(),
                pedido_id=pedido.id,
                menu_item_id=item.menu_item_id,
                nombre=item.nombre,
                precio_unitario=item.precio_unitario,
                cantidad=item.cantidad,
                subtotal=item.precio_unitario * item.cantidad
            ))

        db.commit()
        db.refresh(pedido)

        return pedido

    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))



def get_metricas_negocio(db: Session, negocio_id: str, user_id: str):

    admin = db.query(NegocioAdmin).filter(
        NegocioAdmin.negocio_id == negocio_id,
        NegocioAdmin.user_id == user_id
    ).first()

    if not admin:
        raise HTTPException(403, "Sin permiso")

    result = db.execute(text("""
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE estado = 'delivered') AS entregados,
            COUNT(*) FILTER (WHERE estado = 'cancelled') AS cancelados
        FROM pedidos
        WHERE negocio_id = :negocio_id
    """), {"negocio_id": negocio_id}).mappings().first()

    return dict(result)

def confirmar_entrega_cliente(
    db: Session,
    pedido_id: str,
    user_id: str,
    confirmacion:ConfirmarPedidoIn
) -> dict:
    # El cliente confirma la entrega de su pedido.
    pedido = db.query(Pedido).filter(
        Pedido.id == pedido_id,
        Pedido.user_id == user_id,
        Pedido.estado == 'pending_confirmation'
    ).first()
 
    if not pedido:
        raise PedidoNoExistente()
 
    now = func.now()
 
    pedido.estado = 'delivered'
    pedido.confirmado_por_cliente = True
    pedido.confirmado_en = now
    pedido.tiene_problema = confirmacion.tiene_problema
 
    if confirmacion.tiene_problema and confirmacion.descripcion_problema:
        pedido.motivo_cancelacion = confirmacion.descripcion_problema
 
    db.commit()
 
    return {
        "ok": True,
        "estado": "delivered",
        "confirmado_por_cliente": True,
        "tiene_problema": confirmacion.tiene_problema
    }
 
 