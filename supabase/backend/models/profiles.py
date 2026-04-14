from sqlalchemy import Boolean, Column, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
import uuid


class Profile(Base):
    __tablename__ = "profiles"

    id             = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role           = Column(Text, nullable=False, default="customer")
    nombre         = Column(Text, nullable=True)
    apellido       = Column(Text, nullable=True)
    telefono       = Column(Text, nullable=True)
    avatar_url     = Column(Text, nullable=True)
    pais           = Column(Text, default="MX")
    idioma         = Column(Text, default="es")
    activo         = Column(Boolean, default=True)
    creado_en      = Column(TIMESTAMP(timezone=True))
    actualizado_en = Column(TIMESTAMP(timezone=True))

    __table_args__ = (
        {"schema": "public"},
    )