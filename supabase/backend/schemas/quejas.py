"""
schemas/quejas.py
─────────────────
Schemas de entrada/salida para el módulo de quejas y resoluciones.

Cambios v2:
  - QuejaContextoOut: campos nuevos para tiempos granulares y promedios históricos
"""

from pydantic import BaseModel
from typing import Optional
from schemas.enums import QuejaAccion


# ── Contexto de queja ─────────────────────────────────────────────────────────

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
    negocio_nombre: Optional[str]
    sucursal_nombre: Optional[str]

    # Tiempo estimado original del pedido
    tiempo_estimado_min: Optional[int]

    # Tiempos reales desglosados por responsable
    tiempo_entrega_real_min: Optional[int]       # total: creado → entregado
    tiempo_negocio_min: Optional[int]            # preparación: aceptado → preparado
    tiempo_repartidor_min: Optional[int]         # trayecto: recogido → entregado
    tiempo_espera_repartidor_min: Optional[int]  # espera en negocio: preparado → recogido

    # Promedios históricos del negocio (últimas 4 semanas)
    avg_tiempo_negocio_min: Optional[int]
    avg_tiempo_repartidor_min: Optional[int]
    avg_tiempo_total_min: Optional[int]
    total_pedidos_historico: int = 0

    items: list[ItemContexto] = []
    historial_quejas_30d: list[QuejaHistorialItem] = []


# ── Resolución ────────────────────────────────────────────────────────────────

class ResolucionIn(BaseModel):
    # Opcionales: para override manual (testing o soporte humano)
    accion_override: Optional[QuejaAccion] = None
    monto_override: Optional[float] = None


class ResolucionOut(BaseModel):
    queja_id: str
    pedido_id: str
    accion: str
    monto: Optional[float]
    razon_interna: str
    mensaje_usuario: str