from sqlalchemy.orm import Session
from models.negocios import Negocio
from schemas.negocios import NegocioOut
from exceptions.negocios import NegocioNoExistente
from typing import List,Optional


def get_domicilios(db: Session, user_id: UUID) -> List[NegocioOut]:
    return db.query(Negocio).filter(Negocio.user_id == user_id).all()

def get_domicilio_por_id(db: Session, id: str) -> NegocioOut:
    return db.query(Negocio).filter(Negocio.id == id).first()

def crear_domicilio(db: Session, domicilio: NegocioOut) -> NegocioOut:
    return db.query(Negocio).filter(Negocio.id == id).first()

def actualizar_domicilio(db: Session, id: str, domicilio: NegocioOut) -> NegocioOut:
    return db.query(Negocio).filter(Negocio.id == id).first()

def eliminar_domicilio(db: Session, id: str) -> NegocioOut:
    return db.query(Negocio).filter(Negocio.id == id).first()
