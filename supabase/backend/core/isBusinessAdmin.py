from functools import lru_cache
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.dependencies import get_current_user_id
from db.database import get_db
from exceptions.isBusinessAdmin import NoEsAdminDelNegocio
from exceptions.negocios import NegocioNoExistente


def require_business_admin(negocio_id: str, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)) -> str:
    """
    Dependency reutilizable. Inyectar en cualquier endpoint que requiera
    que el usuario autenticado sea admin del negocio.

    Uso:
        @router.get("/admin/negocios/{negocio_id}")
        def get_negocio(negocio_id: str, user_id: str = Depends(require_business_admin)):
            ...

    Retorna el user_id si pasa la validación.
    Lanza NegocioNoExistente (404) o NoEsAdminDelNegocio (403).
    """

    # 1. Verificar que el negocio exista y esté activo
    negocio = db.execute(
        text("SELECT id FROM negocios WHERE id = :id AND activo = TRUE"),
        {"id": negocio_id},
    ).fetchone()

    if not negocio:
        raise NegocioNoExistente()

    # 2. Verificar que el user sea admin de ese negocio en negocio_admins
    admin = db.execute(
        text(
            """
            SELECT 1
            FROM negocio_admins
            WHERE negocio_id = :negocio_id
              AND user_id    = :user_id
            LIMIT 1
            """
        ),
        {"negocio_id": negocio_id, "user_id": user_id},
    ).fetchone()

    if not admin:
        raise NoEsAdminDelNegocio()

    return user_id


def require_business_admin_with_edit(
    negocio_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> str:
    """
    Variante estricta: además de ser admin, debe tener puede_editar_negocio = TRUE.
    Usar en PATCH /admin/negocios/:id para proteger campos sensibles.
    """

    negocio = db.execute(
        text("SELECT id FROM negocios WHERE id = :id AND activo = TRUE"),
        {"id": negocio_id},
    ).fetchone()

    if not negocio:
        raise NegocioNoExistente()

    admin = db.execute(
        text(
            """
            SELECT 1
            FROM negocio_admins
            WHERE negocio_id          = :negocio_id
              AND user_id             = :user_id
              AND puede_editar_negocio = TRUE
            LIMIT 1
            """
        ),
        {"negocio_id": negocio_id, "user_id": user_id},
    ).fetchone()

    if not admin:
        raise NoEsAdminDelNegocio()

    return user_id