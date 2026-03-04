import uuid
from sqlalchemy import (Column,String,Boolean,TIMESTAMP,func)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from db.database import Base



class Negocio(Base):
    __tablename__ = "negocios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String, nullable=False)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)
    categoria = Column(String, nullable=False)
    tags = Column(ARRAY(String), nullable=True)
    pais = Column(String, nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    verificado = Column(Boolean, nullable=False, default=False)
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