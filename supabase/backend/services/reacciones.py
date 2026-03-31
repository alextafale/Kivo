from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID
from typing import List, Dict
from app.models.reaccion import NegocioReaccion
from app.schemas.reaccion import ReaccionCreate

def add_reaccion(db: Session, comentario_id: UUID, usuario_id: UUID, reaccion: ReaccionCreate) -> NegocioReaccion:
    # Verificar que el comentario existe
    db_reaccion = NegocioReaccion(
        comentario_id=comentario_id,
        usuario_id=usuario_id,
        tipo=reaccion.tipo
    )
    try:
        db.add(db_reaccion)
        db.commit()
        db.refresh(db_reaccion)
        return db_reaccion
    except IntegrityError:
        db.rollback()
        raise ValueError("Ya existe una reacción de este usuario para este comentario")

def remove_reaccion(db: Session, comentario_id: UUID, usuario_id: UUID) -> bool:
    result = db.query(NegocioReaccion).filter(
        NegocioReaccion.comentario_id == comentario_id,
        NegocioReaccion.usuario_id == usuario_id
    ).delete()
    db.commit()
    return result > 0

def get_reacciones_count(db: Session, comentario_id: UUID) -> List[Dict[str, any]]:
    from sqlalchemy import func
    counts = db.query(
        NegocioReaccion.tipo,
        func.count(NegocioReaccion.id).label('cantidad')
    ).filter(NegocioReaccion.comentario_id == comentario_id).group_by(NegocioReaccion.tipo).all()
    return [{"tipo": row[0], "cantidad": row[1]} for row in counts]