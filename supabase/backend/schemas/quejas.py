from pydantic import BaseModel
from typing import Optional
from enum import Enum


class QuejaAccionEnum(str, Enum):
    reembolso_parcial = "reembolso_parcial"
    cupon             = "cupon"
    disculpa          = "disculpa"


# ── Respuesta de /queja ──────────────────────────────────────────────────────

class ItemContexto(BaseModel):
    nombre: str
    cantidad: int
    precio_unitario: float
    subtotal: float


class QuejaHistorialItem(BaseModel):
    pedido_id: str
    accion: str
    monto: Optional[float]
    created_at: str


class QuejaContextoOut(BaseModel):
    pedido_id: str
    order_number: Optional[str]
    estado: str
    total: float
    tiempo_entrega_real_min: Optional[int]
    tiempo_estimado_min: Optional[int]
    items: list[ItemContexto]
    historial_quejas_30d: list[QuejaHistorialItem]
    # campos útiles para el LLM
    negocio_nombre: Optional[str]
    sucursal_nombre: Optional[str]


# ── Body de /resolucion ──────────────────────────────────────────────────────

class ResolucionIn(BaseModel):
    """
    El frontend puede llamar sin body y el backend invocará el LLM automáticamente,
    o puede pasar la acción directamente (útil para pruebas / override manual).
    """
    accion_override: Optional[QuejaAccionEnum] = None   # si viene, se salta el LLM
    monto_override:  Optional[float]           = None


# ── Respuesta de /resolucion ──────────────────────────────────────────────────

class ResolucionOut(BaseModel):
    queja_id: str
    pedido_id: str
    accion: str
    monto: Optional[float]
    razon_interna: str
    mensaje_usuario: str            # texto humanizado para mostrar al usuario
