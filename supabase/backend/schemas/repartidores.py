from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from enum import Enum


class DriverTipo(str, Enum):
    negocio  = "negocio"
    platform = "platform"
    freelance = "freelance"


class DriverEstado(str, Enum):
    offline   = "offline"
    available = "available"
    busy      = "busy"


# ── Registro ──────────────────────────────────────────────────────────────────

class RepartidorRegistro(BaseModel):
    """Body para POST /repartidores/registro"""
    tipo:     DriverTipo = DriverTipo.platform
    vehiculo: Optional[str] = Field(None, examples=["moto", "bici", "auto"])
    placa:    Optional[str] = None


class RepartidorOut(BaseModel):
    """Respuesta al registrar o consultar un repartidor."""
    id:              UUID
    user_id:         UUID
    negocio_id:      Optional[UUID]
    tipo:            DriverTipo
    estado:          DriverEstado
    vehiculo:        Optional[str]
    placa:           Optional[str]
    calificacion:    float
    total_entregas:  int
    activo:          bool
    creado_en:       datetime
    actualizado_en:  datetime

    class Config:
        from_attributes = True


# ── Cambio de estado ──────────────────────────────────────────────────────────

class RepartidorEstadoUpdate(BaseModel):
    """Body para PATCH /repartidores/estado"""
    estado: DriverEstado


# ── Pedidos disponibles ───────────────────────────────────────────────────────

class PedidoDisponibleOut(BaseModel):
    """Pedido en estado 'ready' disponible para que un repartidor lo tome."""
    id:                UUID
    order_number:      str
    sucursal_id:       UUID
    negocio_id:        UUID
    negocio_nombre:    str
    direccion_entrega: str
    total:             float
    costo_envio:       float
    creado_en:         datetime

    class Config:
        from_attributes = True

class UbicacionUpdate(BaseModel):
     lat: float
     lng: float
     pedido_id: Optional[UUID] = None
     rumbo: Optional[float] = None
     velocidad_kmh: Optional[float] = None

class PedidoEstadoUpdate(BaseModel):
    estado: str  # on_the_way | delivered
