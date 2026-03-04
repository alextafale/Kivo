from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from models.profiles import Profile
from schemas.profiles import ProfileUpdate


def get_profile_by_id(db: Session, user_id: str) -> Profile:
    """Obtiene el perfil del usuario autenticado. Lanza 404 si no existe."""
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado",
        )
    return profile


def update_profile(db: Session, user_id: str, data: ProfileUpdate) -> Profile:
    """Actualiza solo los campos enviados (PATCH parcial)."""
    profile = get_profile_by_id(db, user_id)

    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.actualizado_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)
    return profile