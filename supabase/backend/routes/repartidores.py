from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime,timezone


from db.database import get_db
from core.dependencies import get_current_user_id
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
    user_id: str = Depends(get_current_user_id),  # solo auth, aún no es repartidor
):
    return registrar_repartidor(db, user_id, data)


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
def tomar(
    pedido_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),
):
    return tomar_pedido(db, user_id, pedido_id)

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
def update_pedido_estado(
    pedido_id: str,
    data: PedidoEstadoUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),
):
    """
    El repartidor avanza el estado del pedido.
    Solo puede avanzar de picked_up → on_the_way → delivered.
    """
    return avanzar_estado_pedido(db, user_id, pedido_id, data)


@router.get(
    "/pedidos/{pedido_id}/ubicacion",
    summary="Obtener ubicación actual del repartidor (para el cliente)",
)
def get_ubicacion_repartidor(
    pedido_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
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
        {"pedido_id": pedido_id, "user_id": user_id}
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Ubicación no encontrada")

    return dict(row)