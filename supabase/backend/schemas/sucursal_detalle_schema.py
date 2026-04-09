from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID


class HorariosResponse(BaseModel):
    entre_semana: str
    fin_semana: str


class MenuItemDetalle(BaseModel):
    id: UUID
    nombre: str
    precio: float
    imagen_url: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: str


class CategoriaDetalle(BaseModel):
    id: UUID
    nombre: str

class SucursalDetalleResponse(BaseModel):
    id: UUID
    negocio_id: UUID
    nombre: str
    categoria: str
    logo_url: Optional[str]
    banner_url: Optional[str]
    calificacion: float
    tiempo_entrega: str
    costo_envio: str
    descripcion: Optional[str]
    direccion: str
    horarios: HorariosResponse
    menu: List[MenuItemDetalle]
    categorias: Optional[List[CategoriaDetalle]] = []

class CategoriaOrdenUpdateItem(BaseModel):
    id: UUID
    orden: int

class CategoriaOrdenUpdate(BaseModel):
    categorias: List[CategoriaOrdenUpdateItem]