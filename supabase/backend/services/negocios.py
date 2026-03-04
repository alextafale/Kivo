from sqlalchemy.orm import Session
from models.negocios import Negocio
from schemas.negocios import NegocioOut
from exceptions.negocios import NegocioNoExistente
from typing import List,Optional
from sqlalchemy import desc


def get_negocios(db: Session,categoria: Optional[str] = None,ciudad: Optional[str] = None) -> List[Negocio]:
    negocio = db.query(Negocio)

    if categoria:
        negocio = negocio.filter(Negocio.categoria == categoria)

    if ciudad:
        negocio = negocio.filter(Negocio.pais == ciudad)

    return negocio.all()


def get_negocio_por_id(db: Session, negocio_id: str):
    negocio = db.query(Negocio).filter(Negocio.id == negocio_id).first()
    if not negocio:
        raise NegocioNoExistente()
    return negocio
