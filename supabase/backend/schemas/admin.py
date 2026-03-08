from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re


# =============================================================================
# Horarios JSONB
# Estructura esperada en sucursales.horarios:
# [
#   {"dia": "lunes", "abre": "09:00", "cierra": "22:00", "cerrado": false},
#   {"dia": "domingo", "abre": null,  "cierra": null,    "cerrado": true},
# ]
# =============================================================================

DIAS_VALIDOS = {
    "lunes", "martes", "miercoles", "miércoles",
    "jueves", "viernes", "sabado", "sábado", "domingo",
}

HORA_RE = re.compile(r"^\d{2}:\d{2}$")


class HorarioDia(BaseModel):
    dia: str = Field(..., examples=["lunes"])
    abre: Optional[str] = Field(None, examples=["09:00"])
    cierra: Optional[str] = Field(None, examples=["22:00"])
    cerrado: bool = Field(False)

    @field_validator("dia")
    @classmethod
    def dia_valido(cls, v: str) -> str:
        if v.lower() not in DIAS_VALIDOS:
            raise ValueError(f"Día inválido: '{v}'. Use lunes, martes… domingo.")
        return v.lower()

    @field_validator("abre", "cierra", mode="before")
    @classmethod
    def formato_hora(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not HORA_RE.match(v):
            raise ValueError(f"Hora inválida: '{v}'. Formato esperado HH:MM (ej: 09:00).")
        hora, minuto = map(int, v.split(":"))
        if not (0 <= hora <= 23 and 0 <= minuto <= 59):
            raise ValueError(f"Hora fuera de rango: '{v}'.")
        return v

    def model_post_init(self, __context) -> None:
        # Si el día está marcado como cerrado, abre/cierra deben ser nulos
        if self.cerrado and (self.abre or self.cierra):
            raise ValueError("Si 'cerrado' es true, 'abre' y 'cierra' deben ser null.")
        # Si no está cerrado, abre y cierra son obligatorios
        if not self.cerrado and (not self.abre or not self.cierra):
            raise ValueError("Si el día no es 'cerrado', 'abre' y 'cierra' son obligatorios.")


# =============================================================================
# Negocio — admin endpoints
# =============================================================================

class NegocioAdminRead(BaseModel):
    """Respuesta completa del negocio para el panel de administrador."""
    id: str
    slug: str
    nombre: str
    descripcion: Optional[str]
    logo_url: Optional[str]
    banner_url: Optional[str]
    categoria: str
    tags: List[str]
    pais: str
    activo: bool
    verificado: bool

    class Config:
        from_attributes = True


class NegocioPatch(BaseModel):
    """Campos actualizables por un admin con puede_editar_negocio = TRUE."""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    categoria: Optional[str] = None
    tags: Optional[List[str]] = None

    model_config = {"extra": "forbid"}   # rechazar campos desconocidos


# =============================================================================
# Sucursal — admin endpoints
# =============================================================================

class SucursalCreate(BaseModel):
    """Payload para crear una nueva sucursal bajo un negocio."""
    negocio_id: str
    nombre: str
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: str
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    pais: str = "MX"
    codigo_postal: Optional[str] = None
    horarios: List[HorarioDia] = Field(default_factory=list)
    radio_entrega_km: float = 5.0
    tiempo_entrega_min: int = 30
    acepta_efectivo: bool = True
    acepta_tarjeta: bool = False

    model_config = {"extra": "forbid"}


class SucursalPatch(BaseModel):
    """Campos actualizables de una sucursal existente."""
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    codigo_postal: Optional[str] = None
    horarios: Optional[List[HorarioDia]] = None
    radio_entrega_km: Optional[float] = None
    tiempo_entrega_min: Optional[int] = None
    activo: Optional[bool] = None
    acepta_efectivo: Optional[bool] = None
    acepta_tarjeta: Optional[bool] = None

    model_config = {"extra": "forbid"}


class SucursalAdminRead(BaseModel):
    """Respuesta completa de sucursal para el panel admin."""
    id: str
    negocio_id: str
    nombre: str
    telefono: Optional[str]
    whatsapp: Optional[str]
    direccion: str
    ciudad: Optional[str]
    estado: Optional[str]
    pais: str
    codigo_postal: Optional[str]
    horarios: List[HorarioDia]
    radio_entrega_km: float
    tiempo_entrega_min: int
    calificacion: float
    total_reviews: int
    activo: bool
    acepta_efectivo: bool
    acepta_tarjeta: bool

    class Config:
        from_attributes = True


# =============================================================================
# Onboarding — crear negocio nuevo
# =============================================================================

class NegocioCreate(BaseModel):
    """Payload para crear un negocio nuevo durante el onboarding del admin."""
    nombre: str
    slug: str
    categoria: str
    descripcion: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    pais: str = "MX"

    model_config = {"extra": "forbid"}


class OnboardingResponse(BaseModel):
    """Respuesta del onboarding completo: negocio + sucursal creados."""
    negocio: NegocioAdminRead
    sucursal: SucursalAdminRead