import uuid
from sqlalchemy import Column, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base

class NegocioAdmin(Base):
    __tablename__ = "negocio_admins"
    __table_args__ = (
        UniqueConstraint("negocio_id", "user_id", name="uq_negocio_user"),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    negocio_id = Column(UUID(as_uuid=True), ForeignKey("public.negocios.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.profiles.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # business, repartidor, cliente

    negocio = relationship("Negocio", back_populates="admins")
    usuario = relationship("Profile", back_populates="negocio_admins")