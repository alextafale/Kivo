from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import Optional
from models.negocio_comentarios import NegocioComentario
from models.negocio_reacciones import NegocioReaccion, TipoReaccion
from models.negocio_admins import NegocioAdmin
from schemas.comentarios import ComentarioIn, ReaccionIn
from exceptions.comentarios import (
    ComentarioNoExistente, SinPermiso, ReaccionYaExiste, ReaccionNoExiste,
)


# ─── Comentarios ──────────────────────────────────────────────────────────────

def crear_comentario(
    db: Session,
    negocio_id: UUID,
    user_id: UUID,
    data: ComentarioIn,
) -> NegocioComentario:
    comentario = NegocioComentario(
        negocio_id=negocio_id,
        user_id=user_id,
        contenido=data.contenido,
    )
    db.add(comentario)
    db.commit()
    db.refresh(comentario)
    return comentario


def listar_comentarios(
    db: Session,
    negocio_id: UUID,
    pagina: int = 1,
    por_pagina: int = 20,
) -> dict:
    query = db.query(NegocioComentario).filter(
        NegocioComentario.negocio_id == negocio_id
    ).order_by(NegocioComentario.creado_en.desc())

    total = query.count()
    items = query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    return {
        "items":      items,
        "total":      total,
        "pagina":     pagina,
        "por_pagina": por_pagina,
        "hay_mas":    (pagina * por_pagina) < total,
    }


def eliminar_comentario(
    db: Session,
    negocio_id: UUID,
    comentario_id: UUID,
    user_id: UUID,
) -> None:
    comentario = db.query(NegocioComentario).filter(
        NegocioComentario.id == comentario_id,
        NegocioComentario.negocio_id == negocio_id,
    ).first()

    if not comentario:
        raise ComentarioNoExistente()

    es_autor = comentario.user_id == user_id
    es_admin = db.query(NegocioAdmin).filter(
        NegocioAdmin.negocio_id == negocio_id,
        NegocioAdmin.user_id == user_id,
    ).first() is not None

    if not es_autor and not es_admin:
        raise SinPermiso()

    db.delete(comentario)
    db.commit()


# ─── Reacciones ───────────────────────────────────────────────────────────────

def agregar_reaccion(
    db: Session,
    comentario_id: UUID,
    user_id: UUID,
    data: ReaccionIn,
) -> NegocioReaccion:
    comentario = db.query(NegocioComentario).filter(
        NegocioComentario.id == comentario_id
    ).first()
    if not comentario:
        raise ComentarioNoExistente()

    existente = db.query(NegocioReaccion).filter(
        NegocioReaccion.comentario_id == comentario_id,
        NegocioReaccion.user_id == user_id,
    ).first()
    if existente:
        raise ReaccionYaExiste()

    reaccion = NegocioReaccion(
        comentario_id=comentario_id,
        user_id=user_id,
        tipo=data.tipo,
    )
    db.add(reaccion)
    db.commit()
    db.refresh(reaccion)
    return reaccion


def quitar_reaccion(
    db: Session,
    comentario_id: UUID,
    user_id: UUID,
) -> None:
    reaccion = db.query(NegocioReaccion).filter(
        NegocioReaccion.comentario_id == comentario_id,
        NegocioReaccion.user_id == user_id,
    ).first()
    if not reaccion:
        raise ReaccionNoExiste()

    db.delete(reaccion)
    db.commit()


def conteo_reacciones(
    db: Session,
    comentario_id: UUID,
    user_id: Optional[UUID] = None,
) -> dict:
    comentario = db.query(NegocioComentario).filter(
        NegocioComentario.id == comentario_id
    ).first()
    if not comentario:
        raise ComentarioNoExistente()

    rows = db.query(
        NegocioReaccion.tipo,
        func.count(NegocioReaccion.id).label("conteo"),
    ).filter(
        NegocioReaccion.comentario_id == comentario_id
    ).group_by(NegocioReaccion.tipo).all()

    por_tipo = [{"tipo": r.tipo, "conteo": r.conteo} for r in rows]
    total    = sum(r["conteo"] for r in por_tipo)

    mi_reaccion = None
    if user_id:
        propia = db.query(NegocioReaccion).filter(
            NegocioReaccion.comentario_id == comentario_id,
            NegocioReaccion.user_id == user_id,
        ).first()
        mi_reaccion = propia.tipo if propia else None

    return {
        "comentario_id": comentario_id,
        "total":         total,
        "por_tipo":      por_tipo,
        "mi_reaccion":   mi_reaccion,
    }