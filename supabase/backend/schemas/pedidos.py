from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional, List
from schemas.enums import PedidoEstado
from schemas.pedido_items import PedidoItemIn, PedidoItemOut


class PedidoIn(BaseModel):
    sucursal_id: UUID
    domicilio_id: UUID
    notas: Optional[str] = None
    cupon_id: Optional[UUID] = None
    propina: Optional[Decimal] = Decimal('0')
    items: List[PedidoItemIn]


class PedidoOut(BaseModel):
    id: UUID
    order_number: Optional[str]
    user_id: UUID
    sucursal_id: Optional[UUID]
    negocio_id: Optional[UUID]
    repartidor_id: Optional[UUID]
    domicilio_id: Optional[UUID]
    direccion_entrega: Optional[str]
    estado: PedidoEstado
    notas: Optional[str]
    subtotal: Optional[Decimal]
    descuento: Optional[Decimal]
    costo_envio: Optional[Decimal]
    propina: Optional[Decimal]
    total: Optional[Decimal]
    tiempo_estimado_min: Optional[int]
    creado_en: datetime
    actualizado_en: datetime
    items: Optional[List[PedidoItemOut]] = []

    class Config:
        from_attributes = True