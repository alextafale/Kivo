import uuid
from sqlalchemy import (Column,String,Boolean,TIMESTAMP,func)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from db.database import Base


class Domicilio(Base):
    __tablename__ = "domicilios"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    alias = Column(String(50), nullable=False)
    calle = Column(String(255), nullable=False)
    numero = Column(String(20), nullable=False)
    colonia = Column(String(100), nullable=False)
    ciudad = Column(String(100), nullable=False)
    estado = Column(String(100), nullable=False)
    codigo_postal = Column(String(10), nullable=False)
    referencias = Column(String(255), nullable=True)
    es_predeterminado = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

