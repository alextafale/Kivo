from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from db.database import SessionLocal
from core.dependencies import get_current_user
from schemas.pedidos import PedidoIn, PedidoOut
from schemas.enums import PedidoEstado

from services.pedidos import get_pedido,get_pedidos,get_pedidos_negocio, change_estado_pedido, create_pedido, get_metricas_negocio


router = APIRouter(tags=["Pedidos"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



class EstadoIn(BaseModel):
    estado: PedidoEstado
    motivo_cancelacion: str | None = None


def _get_user_id(user: dict):
    return user["sub"]


@router.get("/pedidos")
def obtener_pedidos(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return get_pedidos(db, _get_user_id(user))


@router.get("/pedidos/{pedido_id}")
def obtener_pedido_por_id(
    pedido_id: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return get_pedido(db, pedido_id, _get_user_id(user))


@router.get("/negocios/{negocio_id}/pedidos")
def obtener_pedidos_negocio(
    negocio_id: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return get_pedidos_negocio(db, negocio_id, _get_user_id(user))


@router.patch("/pedidos/{pedido_id}/estado")
async def cambiar_estado_pedido(
    pedido_id: str,
    body: EstadoIn,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return await change_estado_pedido(
        db,
        pedido_id,
        _get_user_id(user),
        body
    )


@router.post("/pedidos", response_model=PedidoOut)
def crear_pedido(
    pedido_in: PedidoIn,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return create_pedido(
        db,
        pedido_in,
        _get_user_id(user)
    )


@router.get("/negocios/{negocio_id}/metricas")
def obtener_metricas_negocio(
    negocio_id: str,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    return get_metricas_negocio(
        db,
        negocio_id,
        _get_user_id(user)
    )