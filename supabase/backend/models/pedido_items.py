import uuid
from sqlalchemy import Column, String, Numeric, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from db.database import Base

class PedidoItem(Base):
    __tablename__ = "pedido_items"

    id               = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pedido_id        = Column(UUID(as_uuid=True), nullable=False)
    menu_item_id     = Column(UUID(as_uuid=True), nullable=True)
    nombre           = Column(String, nullable=False)
    precio_unitario  = Column(Numeric, nullable=False)
    cantidad         = Column(Integer, nullable=False)
    personalizaciones = Column(JSONB, nullable=True)
    subtotal         = Column(Numeric, nullable=False)
    notas            = Column(Text, nullable=True)

    __table_args__ = (
        {"schema": "public"},
    )