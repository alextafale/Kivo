import uuid
from sqlalchemy import Column, Numeric, Text, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SAEnum
from db.database import Base
import enum


class QuejaAccion(str, enum.Enum):
    reembolso_parcial = "reembolso_parcial"
    cupon             = "cupon"
    disculpa          = "disculpa"


class QuejaResolucion(Base):
    __tablename__ = "quejas_resoluciones"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pedido_id      = Column(UUID(as_uuid=True), nullable=False)
    usuario_id     = Column(UUID(as_uuid=True), nullable=False)
    accion         = Column(SAEnum(QuejaAccion, name="queja_accion"), nullable=False)
    monto          = Column(Numeric(10, 2), nullable=True)
    razon_interna  = Column(Text, nullable=False)
    created_at     = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        {"schema": "public"},
    )
