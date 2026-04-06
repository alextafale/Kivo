from sqlalchemy.orm import Session
from models.negocios import Negocio
from models.sucursales import Sucursal
from schemas.negocios import NegocioUpdate
from exceptions.negocios import NegocioNoExistente
from typing import List, Optional
from fastapi import UploadFile
from core.cloudinary import upload_image
from uuid import UUID


def get_negocios_sucursales(db: Session, ciudad: str, categoria: str, page: Optional[int], limit: Optional[int]):

    query = db.query(Negocio, Sucursal).join(
        Sucursal, Negocio.id == Sucursal.negocio_id
    ).filter(
        Negocio.activo == True,
        Sucursal.activo == True,
        Sucursal.ciudad == ciudad
    )

    if categoria not in ("Todos", "All", ""):
        query = query.filter(Negocio.categoria.ilike(f"%{categoria}%"))

    resultados = query.offset((page - 1) * limit).limit(limit).all()

    negocios = []
    for negocio, sucursal in resultados:
        negocio.calificacion = sucursal.calificacion
        negocio.sucursal_id = sucursal.id
        negocios.append(negocio)

    return negocios


def get_negocio_por_id(db: Session, negocio_id: UUID):
    negocio = db.query(Negocio).filter(Negocio.id == negocio_id).first()
    if not negocio:
        raise NegocioNoExistente()

    return negocio

def get_sucursales_por_id_de_negocio(db: Session, negocio_id: UUID):
    sucursales = db.query(Sucursal).filter(
        Sucursal.negocio_id == negocio_id, 
        Sucursal.activo == True
    ).all()

    return sucursales


def put_negocio_por_id(
        db: Session, 
        negocio_id: str, 
        negocio_atualizado:NegocioUpdate, 
        imagen_logo:Optional[UploadFile],
        imagen_banner:Optional[UploadFile]
    ):
    try:
        negocio = db.query(Negocio).filter(Negocio.id == negocio_id).first()
        if not negocio:
            raise NegocioNoExistente()
        
        if(imagen_logo is not None):
            negocio.logo_url = upload_image(imagen_logo)
        else:
            negocio.logo_url = negocio.logo_url

        if(imagen_banner is not None):
            negocio.banner_url = upload_image(imagen_banner)
        else:
            negocio.banner_url = negocio.banner_url

        negocio.nombre = negocio_atualizado.nombre
        negocio.slug = negocio_atualizado.slug
        negocio.descripcion = negocio_atualizado.descripcion
        negocio.categoria = negocio_atualizado.categoria
        negocio.tags = negocio_atualizado.tags
        negocio.pais = negocio_atualizado.pais

        db.commit()
        db.refresh(negocio)
        return negocio
        
    except:
        db.rollback()
        raise
