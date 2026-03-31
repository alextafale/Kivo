from fastapi import APIRouter, Depends, Query
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.comentarios import (
    ComentarioIn, ComentarioOut, ComentariosPaginados,
    ReaccionIn, ReaccionesOut,
)
from services.comentarios import (
    crear_comentario, listar_comentarios, eliminar_comentario,
    agregar_reaccion, quitar_reaccion, conteo_reacciones,
)
from dependencies.auth import get_current_user

router = APIRouter(prefix="/negocios", tags=["Comentarios"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Comentarios ──────────────────────────────────────────────────────────────

@router.post("/{negocio_id}/comentarios", response_model=ComentarioOut, status_code=201)
def publicar_comentario(
    negocio_id: UUID,
    data: ComentarioIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return crear_comentario(db, negocio_id=negocio_id, user_id=current_user["id"], data=data)


@router.get("/{negocio_id}/comentarios", response_model=ComentariosPaginados)
def obtener_comentarios(
    negocio_id: UUID,
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return listar_comentarios(db, negocio_id=negocio_id, pagina=pagina, por_pagina=por_pagina)


@router.delete("/{negocio_id}/comentarios/{comentario_id}", status_code=204)
def borrar_comentario(
    negocio_id: UUID,
    comentario_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    eliminar_comentario(
        db,
        negocio_id=negocio_id,
        comentario_id=comentario_id,
        user_id=current_user["id"],
    )


# ─── Reacciones ───────────────────────────────────────────────────────────────

@router.post("/{negocio_id}/comentarios/{comentario_id}/reacciones", status_code=201)
def poner_reaccion(
    negocio_id: UUID,
    comentario_id: UUID,
    data: ReaccionIn,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return agregar_reaccion(
        db,
        comentario_id=comentario_id,
        user_id=current_user["id"],
        data=data,
    )


@router.delete("/{negocio_id}/comentarios/{comentario_id}/reacciones", status_code=204)
def eliminar_reaccion(
    negocio_id: UUID,
    comentario_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    quitar_reaccion(db, comentario_id=comentario_id, user_id=current_user["id"])


@router.get("/{negocio_id}/comentarios/{comentario_id}/reacciones", response_model=ReaccionesOut)
def ver_reacciones(
    negocio_id: UUID,
    comentario_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user),
):
    user_id = current_user["id"] if current_user else None
    return conteo_reacciones(db, comentario_id=comentario_id, user_id=user_id)