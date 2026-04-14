import uuid
from sqlalchemy import Column, String, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base

class NegocioReaccion(Base):
    __tablename__ = "negocio_reacciones"
    __table_args__ = (
        UniqueConstraint("comentario_id", "usuario_id", name="uq_comentario_usuario"),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    comentario_id = Column(UUID(as_uuid=True), ForeignKey("public.negocio_comentarios.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(UUID(as_uuid=True), ForeignKey("public.profiles.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(2), nullable=False)  # 👍 ❤️ 😂 😮 😢
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    comentario = relationship("NegocioComentario", back_populates="reacciones")
    usuario = relationship("Profile", back_populates="reacciones")

    __table_args__ = (
        {"schema": "public"},
    )