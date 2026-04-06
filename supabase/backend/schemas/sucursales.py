from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class Horario(BaseModel):
    dia: str
    abre: str
    cierra: str
    cerrado: bool

class SucursalBase(BaseModel):
    negocio_id: UUID
    nombre: str
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: str
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    pais: Optional[str] = None
    codigo_postal: Optional[str] = None
    ubicacion: Optional[str] = None
    horarios: Optional[List[Horario]] = Field(default_factory=list)
    radio_entrega_km: Optional[float] = Field(default=5.0)
    tiempo_entrega_min: Optional[int] = Field(default=30)
    calificacion: Optional[float] = Field(default=0)
    total_reviews: Optional[int] = Field(default=0)
    activo: Optional[bool] = Field(default=True)
    acepta_efectivo: Optional[bool] = Field(default=True)
    acepta_tarjeta: Optional[bool] = Field(default=False)

class SucursalCreate(BaseModel):
    negocio_id: UUID
    nombre: str = Field(..., min_length=1)
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    direccion: str = Field(..., min_length=1)
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    pais: Optional[str] = None
    codigo_postal: Optional[str] = None
    ubicacion: Optional[str] = None
    horarios: Optional[List[Horario]] = Field(default_factory=list)
    radio_entrega_km: Optional[float] = Field(default=5.0)
    tiempo_entrega_min: Optional[int] = Field(default=30)
    calificacion: Optional[float] = Field(default=0)
    total_reviews: Optional[int] = Field(default=0)
    activo: Optional[bool] = Field(default=True)
    acepta_efectivo: Optional[bool] = Field(default=True)
    acepta_tarjeta: Optional[bool] = Field(default=False)

    
class SucursalOut(SucursalBase):
    id: UUID
    costo_envio: int
    creado_en: datetime
    actualizado_en: datetime

    class ConfigDict:
        from_attributes = True