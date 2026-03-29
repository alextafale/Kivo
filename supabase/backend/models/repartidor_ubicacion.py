import uuid
from sqlalchemy import Column, Numeric, String
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from db.database import Base

class RepartidorUbicacion(Base):
    __tablename__ = "repartidor_ubicacion"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repartidor_id = Column(UUID(as_uuid=True), nullable=False)
    pedido_id     = Column(UUID(as_uuid=True), nullable=True)
    # ubicacion es geography — lo manejamos con queries raw
    rumbo         = Column(Numeric, nullable=True)
    velocidad_kmh = Column(Numeric, nullable=True)
    registrado_en = Column(TIMESTAMP(timezone=True), nullable=True)