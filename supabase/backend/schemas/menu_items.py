from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class MenuItemBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    precio_original: Optional[float] = None
    imagen_url: Optional[str] = None
    es_popular: Optional[bool] = False
    es_nuevo: Optional[bool] = False
    disponible: Optional[bool] = True
    tiempo_prep_min: Optional[int] = 15
    alergenos: Optional[List[str]] = []
    etiquetas: Optional[List[str]] = []
    personalizaciones: Optional[List[str]] = []
    orden: Optional[int] = 0

class MenuItemCreate(MenuItemBase):
    sucursal_id: UUID
    categoria_id: UUID

class MenuItemOut(MenuItemBase):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True


class MenuItemFrontendCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    imagen_url: Optional[str] = None
    disponible: Optional[bool] = True
    categoria: str

class MenuItemFrontendUpdate(MenuItemFrontendCreate):
    pass