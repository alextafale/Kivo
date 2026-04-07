from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import SessionLocal
from core.dependencies import get_current_user
from schemas.profiles import ProfileResponse, ProfileUpdate
from services.profiles import get_profile_by_id, update_profile


router = APIRouter(prefix="/me", tags=["Auth & Profiles"])


# ── Dependency: sesión de base de datos ──────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _get_user_id(user: dict):
    return user["sub"]

# ── GET /me ───────────────────────────────────────────────────────────────────
@router.get("", response_model=ProfileResponse)
def get_me(
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna el perfil del usuario autenticado."""
    return get_profile_by_id(db, _get_user_id(user))


# ── PATCH /me ─────────────────────────────────────────────────────────────────
@router.patch("", response_model=ProfileResponse)
def update_me(
    body: ProfileUpdate,
    user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualiza nombre, apellido, teléfono y/o avatar del usuario autenticado."""
    return update_profile(db, _get_user_id(user), body)