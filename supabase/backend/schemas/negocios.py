from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class NegocioBase(BaseModel):
    slug: str
    nombre: str
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    categoria: str
    tags: Optional[List[str]] = []
    pais: Optional[str] = None
    activo: bool = True
    verificado: bool = False


class NegocioCreate(BaseModel):
    slug: str = Field(..., min_length=3, description="URL amigable del negocio")
    nombre: str = Field(..., min_length=1)
    categoria: str = Field(..., description="Categoría principal del negocio")
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    pais: Optional[str] = None

class NegocioUpdate(BaseModel):
    slug: Optional[str] = None
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    categoria: Optional[str] = None
    tags: Optional[List[str]] = None
    pais: Optional[str] = None
    fecha_entrega: Optional[datetime] = None


class NegocioOut(NegocioBase):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime

    class ConfigDict:
        from_attributes = True