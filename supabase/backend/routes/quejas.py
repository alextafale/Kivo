"""
routes/quejas.py
────────────────
POST /api/v1/orders/{order_id}/queja       → contexto del pedido para el LLM
POST /api/v1/orders/{order_id}/resolucion  → ejecuta la resolución (LLM o manual)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import SessionLocal
from core.dependencies import get_current_user_id
from schemas.quejas import QuejaContextoOut, ResolucionIn, ResolucionOut
from services.quejas import get_queja_contexto, resolver_queja

router = APIRouter(prefix="/orders", tags=["Quejas & Resoluciones"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/{order_id}/queja",
    response_model=QuejaContextoOut,
    summary="Contexto de queja para resolución automática",
    description=(
        "Retorna el contexto completo del pedido: "
        "tiempo de entrega real vs prometido, items, total y "
        "historial de quejas del usuario en los últimos 30 días. "
        "Este contexto es consumido por el LLM para decidir la resolución."
    ),
)
def obtener_contexto_queja(
    order_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> QuejaContextoOut:
    return get_queja_contexto(db, order_id, user_id)


@router.post(
    "/{order_id}/resolucion",
    response_model=ResolucionOut,
    summary="Ejecutar resolución automática de queja",
    description=(
        "Llama al LLM (Qwen via Ollama) con el contexto del pedido y decide la acción: "
        "reembolso_parcial, cupon o disculpa. "
        "Persiste el resultado en quejas_resoluciones. "
        "Se puede pasar accion_override para saltarse el LLM (útil en testing)."
    ),
)
async def ejecutar_resolucion(
    order_id: str,
    body: ResolucionIn = ResolucionIn(),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ResolucionOut:
    return await resolver_queja(db, order_id, user_id, body)
