from sqlalchemy import Column, ForeignKey, DateTime, Enum as PgEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid
import enum


class TipoReaccion(str, enum.Enum):
    like    = "like"
    love    = "love"
    haha    = "haha"
    wow     = "wow"
    sad     = "sad"


class NegocioReaccion(Base):
    __tablename__ = "negocio_reacciones"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comentario_id = Column(UUID(as_uuid=True), ForeignKey("public.negocio_comentarios.id",
                           ondelete="CASCADE"), nullable=False)
    user_id       = Column(UUID(as_uuid=True), nullable=False)
    tipo          = Column(PgEnum(TipoReaccion, name="tipo_reaccion", create_type=False),
                           nullable=False)
    creado_en     = Column(DateTime(timezone=True), server_default="now()")

    comentario    = relationship("NegocioComentario", back_populates="reacciones")

    __table_args__ = (
        {"schema": "public"},
    )