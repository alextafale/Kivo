# routes/push_tokens.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from db.database import SessionLocal
from core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Push Tokens"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _get_user_id(user: dict):
    return user["sub"]

class PushTokenIn(BaseModel):
    token: str


@router.post("/push-token", summary="Registrar Expo Push Token del usuario")
def save_push_token(
    body: PushTokenIn,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Guarda o actualiza el Expo Push Token del usuario autenticado en la tabla profiles.
    Se llama al iniciar la app si el usuario concedió permisos de notificaciones.
    """
    if not body.token.startswith("ExponentPushToken["):
        raise HTTPException(status_code=400, detail="Token inválido. Debe ser un ExponentPushToken.")

    db.execute(
        text("""
            UPDATE profiles
            SET expo_push_token = :token,
                actualizado_en  = NOW()
            WHERE id = :user_id
        """),
        {"token": body.token, "user_id": _get_user_id(user)},
    )
    db.commit()
    return {"ok": True}


@router.delete("/push-token", summary="Eliminar Expo Push Token (logout)")
def delete_push_token(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    """
    Limpia el token al hacer logout para no recibir notificaciones de sesiones cerradas.
    """
    db.execute(
        text("""
            UPDATE profiles
            SET expo_push_token = NULL,
                actualizado_en  = NOW()
            WHERE id = :user_id
        """),
        {"user_id": _get_user_id(user)},
    )
    db.commit()
    return {"ok": True}