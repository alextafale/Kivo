from sqlalchemy.orm import Session
from models.domicilios import Domicilio
from schemas.domicilios import DomicilioOut
from exceptions.domicilios import DomicilioNoExistente
from typing import List,Optional,UUID


def get_domicilios(db: Session, user_id: UUID) -> List[DomicilioOut]:
    return db.query(Domicilio).filter(Domicilio.user_id == user_id).all()

def get_domicilio_por_id(db: Session, id: str) -> DomicilioOut:
    domicilio = db.query(Domicilio).filter(Domicilio.id == id).first()

    if not domicilio:
        raise DomicilioNoExistente()

    return domicilio

def crear_domicilio(db: Session, domicilio: DomicilioOut) -> DomicilioOut:
    nuevo_domicilio = Domicilio(
        
    )

    db.add(nuevo_domicilio)
    db.commit()
    db.refresh(nuevo_domicilio)

    return nuevo_domicilio

def actualizar_domicilio(db: Session, id: str, domicilio: DomicilioOut) -> DomicilioOut:
    domicilio_a_actualizar = db.query(Domicilio).filter(Domicilio.id == id).first()

    if not domicilio_a_actualizar:
        raise DomicilioNoExistente()

    domicilio_a_actualizar.calle = domicilio.calle
    domicilio_a_actualizar.numero = domicilio.numero
    domicilio_a_actualizar.colonia = domicilio.colonia
    domicilio_a_actualizar.ciudad = domicilio.ciudad
    domicilio_a_actualizar.estado = domicilio.estado
    domicilio_a_actualizar.codigo_postal = domicilio.codigo_postal
    domicilio_a_actualizar.referencias = domicilio.referencias

    db.commit()
    db.refresh(domicilio)

    return domicilio

def eliminar_domicilio(db: Session, id: str) -> DomicilioOut:
    domicilio_a_eliminar = db.query(Domicilio).filter(Domicilio.id == id, Domicilio.activo == True).first()

    if not domicilio_a_eliminar:
        raise DomicilioNoExistente()

    domicilio_a_eliminar.activo = False
    db.commit()
    db.refresh(domicilio_a_eliminar)

    return domicilio_a_eliminar
