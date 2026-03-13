from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.dependencies import get_current_user_id
from db.database import get_db
from exceptions.isDriver import NoEsRepartidor


def require_driver(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
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
        {"user_id": user_id},
    ).fetchone()

    if not repartidor:
        raise NoEsRepartidor()

    return user_id