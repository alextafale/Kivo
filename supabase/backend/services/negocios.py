from sqlalchemy.orm import Session
from models.negocios import Negocio
from models.sucursales import Sucursal
from schemas.negocios import NegocioOut
from exceptions.negocios import NegocioNoExistente
from typing import List,Optional


def get_negocios_sucursales(db: Session, ciudad: str, categoria: str):

    query = db.query(Negocio, Sucursal).join(
        Sucursal, Negocio.id == Sucursal.negocio_id
    ).filter(
        Negocio.activo == True,
        Sucursal.activo == True,
        Sucursal.ciudad == ciudad
    )

    if categoria != "All":
        query = query.filter(Negocio.categoria == categoria)

    resultados = query.all()

    negocios = []

    for negocio, sucursal in resultados:
        negocio.calificacion = sucursal.calificacion
        negocio.sucursal_id = sucursal.id
        negocios.append(negocio)

    return negocios


def get_negocio_por_id(db: Session, negocio_id: str):
    negocio = db.query(Negocio).filter(Negocio.id == negocio_id).first()
    if not negocio:
        raise NegocioNoExistente()
    return negocio
