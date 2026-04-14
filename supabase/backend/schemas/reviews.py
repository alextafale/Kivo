from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional


class ReviewBase(BaseModel):
    pedido_id: UUID
    user_id: UUID
    sucursal_id: UUID
    repartidor_id: UUID
    rating_comida: int
    rating_entrega: int
    rating_general: int
    comentario: Optional[str]
    imagenes: Optional[List[str]]
    es_anonima: Optional[bool]

class ReviewCreate(BaseModel):
    pedido_id: UUID
    user_id: UUID
    sucursal_id: UUID
    repartidor_id: UUID
    rating_comida: int
    rating_entrega: int
    rating_general: int
    comentario: Optional[str]
    es_anonima: Optional[bool]


class ReviewOut(ReviewBase):
    id: UUID
    creado_en: datetime

    class ConfigDict:
        from_attributes = True

