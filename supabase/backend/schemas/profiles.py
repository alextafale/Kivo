from pydantic import BaseModel, HttpUrl
from typing import Optional
from uuid import UUID
from datetime import datetime


class ProfileResponse(BaseModel):
    """Schema de respuesta — GET /me"""
    id:             UUID
    role:           str
    nombre:         Optional[str]
    apellido:       Optional[str]
    telefono:       Optional[str]
    avatar_url:     Optional[str]
    pais:           Optional[str]
    idioma:         Optional[str]
    activo:         bool
    creado_en:      Optional[datetime]
    actualizado_en: Optional[datetime]

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    """Schema de entrada — PATCH /me (todos los campos opcionales)"""
    nombre:     Optional[str] = None
    apellido:   Optional[str] = None
    telefono:   Optional[str] = None
    avatar_url: Optional[str] = None