from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from typing import Optional, Any

class PedidoItemIn(BaseModel):
    menu_item_id: Optional[UUID] = None
    nombre: str
    precio_unitario: Decimal
    cantidad: int
    personalizaciones: Optional[Any] = None
    notas: Optional[str] = None

class PedidoItemOut(BaseModel):
    id: UUID
    pedido_id: UUID
    menu_item_id: Optional[UUID]
    nombre: str
    precio_unitario: Decimal
    cantidad: int
    personalizaciones: Optional[Any]
    subtotal: Decimal
    notas: Optional[str]

    class Config:
        from_attributes = True