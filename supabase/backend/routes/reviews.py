from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from db.database import SessionLocal
from schemas.negocios import NegocioOut
from schemas.sucursal_detalle_schema import SucursalDetalleResponse
from schemas.menu_items import MenuItemFrontendCreate, MenuItemFrontendUpdate
from schemas.reviews import ReviewOut, ReviewCreate
from services.reviews import create_review 
from core.dependencies import get_current_user
from fastapi import APIRouter, Depends, File, UploadFile, Form

router = APIRouter(prefix="/reviews",tags=["Reviews"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _get_user_id(user):
    return user['sub']

@router.post("", response_model=ReviewOut, status_code=201)
def crear_review(
    pedido_id: str = Form(...),
    sucursal_id: str =  Form(...),
    repartidor_id: str = Form(...),
    rating_comida: int = Form(...),
    rating_entrega: int = Form(...),
    rating_general: int = Form(...),
    comentario: Optional[str] = Form(None),
    es_anonima: Optional[bool] = Form(False),
    image_reviews: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    
    review_data = ReviewCreate(
        pedido_id = pedido_id,
        user_id = _get_user_id(user),
        sucursal_id = sucursal_id,
        repartidor_id = repartidor_id,  
        rating_comida = rating_comida,
        rating_entrega = rating_entrega,
        rating_general = rating_general,
        comentario = comentario,
        es_anonima = es_anonima
    )

    return create_review(db, review_data, image_reviews)