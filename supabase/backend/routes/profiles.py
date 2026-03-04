from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import SessionLocal
from core.dependencies import get_current_user_id
from schemas.profiles import ProfileResponse, ProfileUpdate
from services import profiles as profile_service


router = APIRouter(prefix="/me", tags=["Auth & Profiles"])


# ── Dependency: sesión de base de datos ──────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── GET /me ───────────────────────────────────────────────────────────────────
@router.get("", response_model=ProfileResponse)
def get_me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Retorna el perfil del usuario autenticado."""
    return profile_service.get_profile_by_id(db, user_id)


# ── PATCH /me ─────────────────────────────────────────────────────────────────
@router.patch("", response_model=ProfileResponse)
def update_me(
    body: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Actualiza nombre, apellido, teléfono y/o avatar del usuario autenticado."""
    return profile_service.update_profile(db, user_id, body)