import uuid
from sqlalchemy import Column, Integer, String, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, BOOLEAN
from db.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pedido_id = Column(UUID(as_uuid=True),ForeignKey("public.pedidos.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True),ForeignKey("public.profiles.id"), nullable=False)
    sucursal_id = Column(UUID(as_uuid=True),ForeignKey("public.sucursales.id"), nullable=False)
    repartidor_id = Column(UUID(as_uuid=True), nullable=True)
    rating_comida = Column(Integer, nullable=True) 
    rating_entrega = Column(Integer, nullable=True)
    rating_general = Column(Integer, nullable=False)
    comentario = Column(String, nullable=True)
    imagenes = Column(ARRAY(String), nullable=True, default=[])
    es_anonima = Column(BOOLEAN, nullable=True, default=False)
    creado_en = Column(TIMESTAMP, nullable=False)

    __table_args__ = (
        {"schema": "public"},
    )
