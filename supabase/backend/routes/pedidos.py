from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from db.database import SessionLocal
from core.dependencies import get_current_user, get_current_user_id
from schemas.pedidos import PedidoIn, PedidoOut
from schemas.enums import PedidoEstado

from services.pedidos import get_pedido, get_pedidos, get_pedidos_negocio, change_estado_pedido, create_pedido, get_metricas_negocio

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
    user=Depends(get_current_user),
):
    return get_pedidos(db, _get_user_id(user))


@router.get("/pedidos/{pedido_id}")
def obtener_pedido_por_id(
    pedido_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_pedido(db, pedido_id, _get_user_id(user))


@router.get("/negocios/{negocio_id}/pedidos")
def obtener_pedidos_negocio(
    negocio_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_pedidos_negocio(db, negocio_id, _get_user_id(user))


@router.patch("/pedidos/{pedido_id}/estado")
async def cambiar_estado_pedido(
    pedido_id: str,
    body: EstadoIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
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
    user=Depends(get_current_user),
):
    return create_pedido(
        db,
        pedido_in,
        _get_user_id(user)
    )


@router.get("/pedidos/{pedido_id}/eta", summary="Obtener ETA del repartidor")
def get_eta(
    pedido_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    row = db.execute(
        text("""
            SELECT
                ST_Distance(
                    ru.ubicacion::geography,
                    d.ubicacion::geography
                ) / 1000.0 AS distancia_km
            FROM pedidos p
            JOIN domicilios d ON d.id = p.domicilio_id
            JOIN repartidor_ubicacion ru ON ru.repartidor_id = p.repartidor_id
            WHERE p.id = :pedido_id
              AND p.user_id = :user_id
              AND p.estado IN ('picked_up', 'on_the_way')
        """),
        {"pedido_id": pedido_id, "user_id": user_id}
    ).mappings().first()

    if not row:
        return {"eta_minutos": None, "distancia_km": None}

    distancia_km = float(row["distancia_km"])
    velocidad_promedio = 30
    eta_minutos = round((distancia_km / velocidad_promedio) * 60)
    eta_minutos = max(1, eta_minutos)

    return {
        "eta_minutos": eta_minutos,
        "distancia_km": round(distancia_km, 2)
    }


@router.get("/negocios/{negocio_id}/metricas", summary="Métricas de pedidos del negocio")
def obtener_metricas_negocio(
    negocio_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return get_metricas_negocio(
        db,
        negocio_id,
        _get_user_id(user)
    )