import uuid
from sqlalchemy import Column,String,ForeignKey,Boolean,TIMESTAMP,func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from db.database import Base

class Sucursal(Base):
    __tablename__ = "sucursales"
    id = Column(UUID(as_uuid=True),nullable=False,primary_key=True,default=uuid.uuid4)
    negocio_id = Column(UUID(as_uuid=True),ForeignKey("negocios.id"),nullable=False)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    direccion = Column(String, nullable=False)
    ciudad = Column(String, nullable=True)
    estado = Column(String, nullable=True)
    pais = Column(String, nullable=True, default="MX")
    codigo_postal = Column(String, nullable=True)
    ubicacion = Column(String, nullable=True)
    horarios = Column(ARRAY(String), nullable=True)
    radio_entrega_km = Column(String, nullable=True, default=5.0)  
    tiempo_entrega_min = Column(String, nullable=True, default=30)
    calificacion = Column(String, nullable=True, default=0)
    total_reviews = Column(String, nullable=True, default=0)
    activo = Column(Boolean, nullable=True, default=True)
    acepta_efectivo = Column(Boolean, nullable=True, default=True)
    acepta_tarjeta = Column(Boolean, nullable=True, default=False)
    creado_en = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now()
    )
    actualizado_en = Column(
        TIMESTAMP,
        nullable=False,
        server_default=func.now()
    )

    __table_args__ = (
        {"schema": "public"},
    )