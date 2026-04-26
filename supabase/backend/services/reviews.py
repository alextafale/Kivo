from sqlalchemy.orm import Session
from models.reviews import Review
from models.pedidos import Pedido
from models.profiles import Profile
from models.sucursales import Sucursal
from models.negocios import Negocio
from schemas.reviews import ReviewBase, ReviewCreate, ReviewOut
from exceptions.reviews import ReviewNoExistente, ReviewYaExistente
from exceptions.pedidos import PedidoNoExistente, PedidoNoEntregado
from exceptions.negocios import NegocioNoExistente
from exceptions.sucursal import SucursalNoExistente
from exceptions.comentarios import SinPermiso
from typing import List
from fastapi import UploadFile
from core.cloudinary import upload_image
from sqlalchemy import text
from uuid import UUID


def get_reviews_by_sucursal_id(sucursal_id: UUID, db: Session) -> List[ReviewOut]:
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise SucursalNoExistente()
    reviews = db.query(Review).filter(Review.sucursal_id == sucursal_id).all()
    return reviews

def get_reviews_by_negocio_id(negocio_id: UUID, db: Session) -> List[ReviewOut]:
    negocio = db.query(Negocio).filter(Negocio.id == negocio_id).first()
    if not negocio:
        raise NegocioNoExistente()
    
    reviews = db.query(Review).filter(Review.negocio_id == negocio_id).all()
    return reviews

def get_reviews_by_pedido_id(pedido_id: UUID, db: Session) -> ReviewOut:
    review = db.query(Review).filter(Review.pedido_id == pedido_id).first()

    if not review:
        raise ReviewNoExistente()
    return review

def get_reviews_by_repartidor_id(repartidor_id: UUID, db: Session) -> List[ReviewOut]:
    reviews = db.query(Review).filter(Review.repartidor_id == repartidor_id).all()
    return reviews

def get_reviews_by_user_id(user_id: UUID, db: Session) -> List[ReviewOut]:
    user = db.query(Profile).filter(Profile.id == user_id).first()

    if user.role != "customer":
        raise SinPermiso()

    reviews = db.query(Review).filter(Review.user_id == user_id).all()

    return reviews

def create_review(db: Session, review_in: ReviewCreate, imagenes:List[UploadFile]) -> ReviewOut:
    pedido = db.query(Pedido).filter(Pedido.id == review_in.pedido_id).first()
    
    if not pedido:
        raise PedidoNoExistente()
    
    if pedido.user_id != review_in.user_id:
        raise SinPermiso()

    if pedido.estado != "delivered":
        raise PedidoNoEntregado()
    
    review_existente = db.query(Review).filter(Review.pedido_id == review_in.pedido_id).first()
    if review_existente is not None:
        raise ReviewYaExistente()
    
    imagenes_url = []
    if imagenes and isinstance(imagenes, list):
        for imagen in imagenes:
            if imagen:
                url = upload_image(imagen)
                imagenes_url.append(url)
    
    nueva_review = Review(
        **review_in.model_dump(),
        imagenes=imagenes_url
    )
    
    try:
        db.add(nueva_review)
        db.commit()
        db.refresh(nueva_review)
    except Exception as e:
        db.rollback()
        raise e
    return nueva_review
