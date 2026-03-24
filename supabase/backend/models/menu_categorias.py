import uuid
from sqlalchemy import (Integer,ForeignKey,Column,String,Boolean,TIMESTAMP,func)
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class MenuCategoria(Base):
    __tablename__ = "menu_categorias"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sucursal_id = Column(UUID(as_uuid=True),ForeignKey("public.sucursales.id"), nullable=False)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(String(255), nullable=True)
    imagen_url = Column(String(255), nullable=True)
    orden = Column(Integer, default=0)
    activo = Column(Boolean, default=True)
    creado_en = Column(TIMESTAMP, nullable=False, server_default=func.now())

    __table_args__ = (
        {"schema": "public"},
    )
