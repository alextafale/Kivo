from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from db.database import get_db
from core.dependencies import get_current_user_id
from core.isDriver import require_driver

from schemas.repartidores import (
    RepartidorRegistro,
    RepartidorOut,
    RepartidorEstadoUpdate,
    PedidoDisponibleOut,
)
from services.repartidores import (
    registrar_repartidor,
    actualizar_estado,
    get_pedidos_disponibles,
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
def pedidos_disponibles(
    db: Session = Depends(get_db),
    user_id: str = Depends(require_driver),  # middleware isDriver
):
    return get_pedidos_disponibles(db)