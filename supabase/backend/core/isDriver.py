from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from db.database import get_db
from exceptions.isDriver import NoEsRepartidor


def _get_user_id(user: dict):
    return user["sub"]

def require_driver(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
) -> str:
    """
    Dependency reutilizable. Inyectar en cualquier endpoint exclusivo de repartidores.

    Uso:
        @router.patch("/repartidores/estado")
        def update_estado(user_id: str = Depends(require_driver)):
            ...

    Retorna el user_id si el usuario tiene un perfil de repartidor activo.
    Lanza NoEsRepartidor (403) si no existe o está inactivo.
    """
    repartidor = db.execute(
        text(
            """
            SELECT id
            FROM repartidores
            WHERE user_id = :user_id
              AND activo  = TRUE
            LIMIT 1
            """
        ),
        {"user_id": _get_user_id(user)},
    ).fetchone()

    if not repartidor:
        raise NoEsRepartidor()

    return _get_user_id(user)