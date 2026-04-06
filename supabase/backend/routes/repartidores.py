from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime,timezone


from db.database import get_db
from core.dependencies import get_current_user
from core.isDriver import require_driver

from schemas.repartidores import (
    RepartidorRegistro,
    RepartidorOut,
    RepartidorEstadoUpdate,
    PedidoDisponibleOut,
    UbicacionUpdate,
    PedidoEstadoUpdate,
)
from services.repartidores import (
    registrar_repartidor,
    actualizar_estado,
    get_pedidos_disponibles,
)
from services.repartidores import (
    registrar_repartidor,
    actualizar_estado,
    get_pedidos_disponibles,
    tomar_pedido,          # ← nuevo
    actualizar_ubicacion,
    avanzar_estado_pedido,
)
from services.notification_service import send_push_notification

def _get_user_id(user: dict):
    return user["sub"]

router = APIRouter(prefix="/repartidores", tags=["Repartidores"])


@router.post(
    "/registro",
    response_model=RepartidorOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar perfil de repartidor",
    description="Crea el perfil de repartidor para el usuario autenticado. El perfil debe tener role 'driver'.",
)
def registro(
    data: RepartidorRegistro,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),  # solo auth, aún no es repartidor
):
    return registrar_repartidor(db, _get_user_id(user), data)


@router.patch(
    "/estado",
    response_model=RepartidorOut,
    summary="Actualizar estado del repartidor",
    description="Cambia el estado a offline, available o busy. Solo repartidores activos.",
)
def update_estado(
    data: RepartidorEstadoUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),  # middleware isDriver
):
    return actualizar_estado(db, user_id, data)


@router.get(
    "/pedidos-disponibles",
    response_model=list[PedidoDisponibleOut],
    summary="Ver pedidos disponibles para tomar",
    description="Retorna pedidos en estado 'ready' sin repartidor asignado. Solo repartidores activos.",
)
@router.post(
    "/pedidos/{pedido_id}/tomar",
    summary="Tomar un pedido disponible",
    description="Asigna el pedido al repartidor y lo marca como picked_up. Solo repartidores available.",
)
async def tomar(
    pedido_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),
):
    result = tomar_pedido(db, user_id, pedido_id)
    
    # Enviar push notification
    pedido_info = db.execute(
        text("SELECT p.user_id, p.order_number, pr.expo_push_token FROM pedidos p JOIN profiles pr ON pr.id = p.user_id WHERE p.id = :id"),
        {"id": pedido_id}
    ).mappings().first()

    if pedido_info and pedido_info.get("expo_push_token"):
        await send_push_notification(
            expo_push_token=pedido_info["expo_push_token"],
            estado="picked_up",
            order_number=pedido_info["order_number"],
            pedido_id=pedido_id,
        )
        
    return result

def pedidos_disponibles(
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),  # middleware isDriver
):
    return get_pedidos_disponibles(db)

@router.post(
    "/ubicacion",
    summary="Actualizar ubicación GPS del repartidor",
)
def update_ubicacion(
    data: UbicacionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),
):
    """
    El repartidor manda su ubicación GPS cada N segundos.
    Hace upsert en repartidor_ubicacion usando el repartidor_id del usuario.
    """
    return actualizar_ubicacion(db, user_id, data)


@router.patch(
    "/pedidos/{pedido_id}/estado",
    summary="Avanzar estado del pedido (on_the_way → delivered)",
)
async def update_pedido_estado(
    pedido_id: str,
    data: PedidoEstadoUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),
):
    """
    El repartidor avanza el estado del pedido.
    Solo puede avanzar de picked_up → on_the_way → delivered.
    """
    result = avanzar_estado_pedido(db, user_id, pedido_id, data)
    
    # Enviar push notification
    pedido_info = db.execute(
        text("SELECT p.user_id, p.order_number, pr.expo_push_token FROM pedidos p JOIN profiles pr ON pr.id = p.user_id WHERE p.id = :id"),
        {"id": pedido_id}
    ).mappings().first()

    if pedido_info and pedido_info.get("expo_push_token"):
        estado_str = data.estado.value if hasattr(data.estado, 'value') else data.estado
        await send_push_notification(
            expo_push_token=pedido_info["expo_push_token"],
            estado=estado_str,
            order_number=pedido_info["order_number"],
            pedido_id=pedido_id,
        )
        
    return result


@router.get(
    "/pedidos/{pedido_id}/ubicacion",
    summary="Obtener ubicación actual del repartidor (para el cliente)",
)
def get_ubicacion_repartidor(
    pedido_id: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    El cliente consulta la ubicación del repartidor asignado a su pedido.
    """
    row = db.execute(
        text("""
            SELECT
                ST_X(ru.ubicacion::geometry) AS lng,
                ST_Y(ru.ubicacion::geometry) AS lat,
                ru.rumbo,
                ru.velocidad_kmh,
                ru.registrado_en
            FROM repartidor_ubicacion ru
            JOIN pedidos p ON p.repartidor_id = ru.repartidor_id
            WHERE p.id = :pedido_id
              AND p.user_id = :user_id
            ORDER BY ru.registrado_en DESC
            LIMIT 1
        """),
        {"pedido_id": pedido_id, "user_id": _get_user_id(user)}
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    return dict(row)