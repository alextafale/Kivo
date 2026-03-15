from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal


from core.isBusinessAdmin import require_business_admin, require_business_admin_with_edit
from schemas.admin import (
    NegocioAdminRead,
    NegocioPatch,
    SucursalCreate,
    SucursalPatch,
    SucursalAdminRead,
)
from services.admin import (
    get_negocio_admin,
    patch_negocio,
    create_sucursal,
    patch_sucursal,
)

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =============================================================================
# Negocio
# =============================================================================

@router.get(
    "/negocios/{negocio_id}",
    response_model=NegocioAdminRead,
    summary="Ver detalle completo del negocio (solo admins)",
)
def get_negocio(
    negocio_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin),   # ← middleware
):
    """
    Retorna todos los campos del negocio.
    Solo accesible si el usuario autenticado aparece en negocio_admins.
    """
    return get_negocio_admin(db, negocio_id)


@router.patch(
    "/negocios/{negocio_id}",
    response_model=NegocioAdminRead,
    summary="Actualizar negocio (requiere puede_editar_negocio = TRUE)",
)
def update_negocio(
    negocio_id: str,
    payload: NegocioPatch,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin_with_edit),  # ← permisos estrictos
):
    """
    PATCH semántico: solo actualiza los campos enviados.
    Requiere puede_editar_negocio = TRUE en negocio_admins.
    """
    return patch_negocio(db, negocio_id, payload)


# =============================================================================
# Sucursales + Horarios
# =============================================================================

@router.post(
    "/negocios/{negocio_id}/sucursales",
    response_model=SucursalAdminRead,
    status_code=201,
    summary="Crear sucursal con horarios",
)
def create_nueva_sucursal(
    negocio_id: str,
    payload: SucursalCreate,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin),
):
    """
    Crea una sucursal bajo el negocio.
    Los horarios se validan con Pydantic antes de guardarse como JSONB.

    Ejemplo de horarios:
    ```json
    [
      {"dia": "lunes",   "abre": "09:00", "cierra": "22:00", "cerrado": false},
      {"dia": "domingo", "abre": null,    "cierra": null,    "cerrado": true}
    ]
    ```
    """
    # Forzar que el negocio_id del path coincida con el del body
    payload.negocio_id = negocio_id
    return create_sucursal(db, payload)


@router.patch(
    "/negocios/{negocio_id}/sucursales/{sucursal_id}",
    response_model=SucursalAdminRead,
    summary="Actualizar sucursal y/o sus horarios",
)
def update_sucursal(
    negocio_id: str,
    sucursal_id: str,
    payload: SucursalPatch,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin),
):
    """
    PATCH semántico sobre la sucursal.
    Si se incluye `horarios`, reemplaza el array JSONB completo.
    Si no se incluye, los horarios existentes no se tocan.
    """
    return patch_sucursal(db, sucursal_id, negocio_id, payload)


# =============================================================================
# Horarios — endpoints dedicados (lectura y reemplazo)
# =============================================================================

@router.get(
    "/negocios/{negocio_id}/sucursales/{sucursal_id}/horarios",
    summary="Leer horarios de la sucursal",
)
def get_horarios(
    negocio_id: str,
    sucursal_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin),
):
    """Devuelve solo el array de horarios JSONB de la sucursal."""
    from services.admin import get_sucursal_admin
    sucursal = get_sucursal_admin(db, sucursal_id)
    return {"sucursal_id": sucursal_id, "horarios": sucursal["horarios"]}


@router.patch(
    "/negocios/{negocio_id}/sucursales/{sucursal_id}/horarios",
    summary="Reemplazar horarios de la sucursal",
)
def update_horarios(
    negocio_id: str,
    sucursal_id: str,
    payload: SucursalPatch,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin),
):
    """
    Reemplaza el array de horarios completo.
    Enviar solo el campo `horarios` en el body.
    """
    return patch_sucursal(db, sucursal_id, negocio_id, payload)


# =============================================================================
# Onboarding — POST /admin/onboarding/negocio
# Sin middleware isBusinessAdmin (el user aún no tiene negocio)
# =============================================================================

from schemas.admin import NegocioCreate, OnboardingResponse
from services.admin import create_negocio_onboarding
from core.dependencies import get_current_user_id

@router.post(
    "/onboarding/negocio",
    response_model=NegocioAdminRead,
    status_code=201,
    summary="Crear negocio nuevo durante onboarding (no requiere negocio previo)",
)
def onboarding_crear_negocio(
    payload: NegocioCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),   # solo JWT válido, sin isBusinessAdmin
):
    """
    Endpoint de onboarding: crea el negocio y lo vincula al user_id.
    No usa require_business_admin porque el usuario aún no tiene negocio asignado.
    """
    return create_negocio_onboarding(db, user_id, payload)