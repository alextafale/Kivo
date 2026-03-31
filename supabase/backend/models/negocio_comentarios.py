from sqlalchemy import Column, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid


class NegocioComentario(Base):
    __tablename__ = "negocio_comentarios"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    negocio_id  = Column(UUID(as_uuid=True), ForeignKey("negocios.id"), nullable=False)
    user_id     = Column(UUID(as_uuid=True), nullable=False)
    contenido   = Column(Text, nullable=False)
    creado_en   = Column(DateTime(timezone=True), server_default="now()")
    actualizado_en = Column(DateTime(timezone=True), server_default="now()")

    reacciones  = relationship("NegocioReaccion", back_populates="comentario",
                               cascade="all, delete-orphan")