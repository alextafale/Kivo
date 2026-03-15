import uuid
from sqlalchemy import (Numeric,Integer,ForeignKey,Column,String,Boolean,TIMESTAMP,func)
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sucursal_id = Column(UUID(as_uuid=True),ForeignKey("sucursales.id"), nullable=False)
    categoria_id = Column(UUID(as_uuid=True),ForeignKey("menu_categorias.id"), nullable=True)
    nombre = Column(String(50), nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(Numeric, nullable=False)
    precio_original = Column(Numeric, nullable=True)
    imagen_url = Column(String(255), nullable=True)
    es_popular = Column(Boolean, default=False)
    es_nuevo = Column(Boolean, default=False)
    disponible = Column(Boolean, default=True)
    tiempo_prep_min = Column(Integer, default=15)
    alergenos = Column(String(255), nullable=True)
    etiquetas = Column(String(255), nullable=True)
    personalizaciones = Column(String(255), nullable=True)
    orden = Column(Integer, default=0)
    creado_en = Column(TIMESTAMP, nullable=False, server_default=func.now())
    actualizado_en = Column(TIMESTAMP, nullable=False, onupdate=func.now())
