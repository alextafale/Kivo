from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional
from enum import Enum

class PedidoEstado(str, Enum):
    pending    = "pending"
    confirmed  = "confirmed"
    preparing  = "preparing"
    ready      = "ready"
    picked_up  = "picked_up"
    on_the_way = "on_the_way"
    delivered  = "delivered"
    cancelled  = "cancelled"
    refunded   = "refunded"

class PedidoOut(BaseModel):
    id:                  UUID
    order_number:        Optional[str]
    user_id:             UUID
    sucursal_id:         Optional[UUID]
    negocio_id:          Optional[UUID]
    repartidor_id:       Optional[UUID]
    domicilio_id:        Optional[UUID]
    direccion_entrega:   Optional[str]
    estado:              PedidoEstado
    notas:               Optional[str]
    subtotal:            Optional[Decimal]
    descuento:           Optional[Decimal]
    costo_envio:         Optional[Decimal]
    propina:             Optional[Decimal]
    total:               Optional[Decimal]
    tiempo_estimado_min: Optional[int]
    aceptado_en:         Optional[datetime]
    preparado_en:        Optional[datetime]
    recogido_en:         Optional[datetime]
    entregado_en:        Optional[datetime]
    cancelado_en:        Optional[datetime]
    motivo_cancelacion:  Optional[str]
    creado_en:           datetime
    actualizado_en:      datetime

    class Config:
        from_attributes = True