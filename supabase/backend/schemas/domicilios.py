from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional


class DomicilioBase(BaseModel):
    slug: str
    user_id: UUID
    etiqueta: str
    calle: str
    numero_exterior: str
    numero_interior: Optional[str] = None
    colonia: str
    ciudad: str
    estado: str
    pais: str
    codigo_postal: str
    referencias: Optional[str] = None
    ubicacion: Optional[str] = None
    es_predeterminado: bool = False
    activo: bool = True
    creado_en: datetime
    actualizado_en: datetime

class DomicilioCreate(BaseModel):
    slug: str
    user_id: UUID
    etiqueta: str
    calle: str
    numero_exterior: str
    numero_interior: Optional[str] = None
    colonia: str
    ciudad: str
    estado: str
    pais: str
    codigo_postal: str
    referencias: Optional[str] = None
    ubicacion: Optional[str] = None
    es_predeterminado: bool = False
    activo: bool = True
    creado_en: datetime
    actualizado_en: datetime

class DomicilioUpdate(BaseModel):
    slug: Optional[str] = None
    user_id: Optional[UUID] = None
    etiqueta: Optional[str] = None
    calle: Optional[str] = None
    numero_exterior: Optional[str] = None
    numero_interior: Optional[str] = None
    colonia: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    pais: Optional[str] = None
    codigo_postal: Optional[str] = None
    referencias: Optional[str] = None
    ubicacion: Optional[str] = None
    es_predeterminado: Optional[bool] = None
    activo: Optional[bool] = None
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None

class DomicilioOut(BaseModel):
    slug: str
    user_id: UUID
    etiqueta: str
    calle: str
    numero_exterior: str
    numero_interior: Optional[str] = None
    colonia: str
    ciudad: str
    estado: str
    pais: str
    codigo_postal: str
    referencias: Optional[str] = None
    ubicacion: Optional[str] = None
    es_predeterminado: bool = False
    activo: bool = True
    creado_en: datetime
    actualizado_en: datetime

    class ConfigDict:
        from_attributes = True  
