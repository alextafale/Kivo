import uuid
from sqlalchemy import (Column, String, Numeric, Integer, Text, TIMESTAMP, func)
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id                   = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number         = Column(String, nullable=True)
    user_id              = Column(UUID(as_uuid=True), nullable=False)
    sucursal_id          = Column(UUID(as_uuid=True), nullable=True)
    negocio_id           = Column(UUID(as_uuid=True), nullable=True)
    repartidor_id        = Column(UUID(as_uuid=True), nullable=True)
    domicilio_id         = Column(UUID(as_uuid=True), nullable=True)
    direccion_entrega    = Column(Text, nullable=True)
    estado               = Column(String, nullable=False)
    notas                = Column(Text, nullable=True)
    cupon_id             = Column(UUID(as_uuid=True), nullable=True)
    subtotal             = Column(Numeric, nullable=True)
    descuento            = Column(Numeric, nullable=True)
    costo_envio          = Column(Numeric, nullable=True)
    propina              = Column(Numeric, nullable=True)
    total                = Column(Numeric, nullable=True)
    tiempo_estimado_min  = Column(Integer, nullable=True)
    aceptado_en          = Column(TIMESTAMP(timezone=True), nullable=True)
    preparado_en         = Column(TIMESTAMP(timezone=True), nullable=True)
    recogido_en          = Column(TIMESTAMP(timezone=True), nullable=True)
    entregado_en         = Column(TIMESTAMP(timezone=True), nullable=True)
    cancelado_en         = Column(TIMESTAMP(timezone=True), nullable=True)
    motivo_cancelacion   = Column(Text, nullable=True)
    creado_en            = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    actualizado_en       = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())