from fastapi import APIRouter, Depends
from typing import List,Optional
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.negocios import NegocioOut
from services.negocios import get_negocios_sucursales,get_negocio_por_id

router = APIRouter(prefix="/negocios",tags=["Negocios"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/sucursales',response_model=List[NegocioOut])
def obtener_negocios(
    ciudad:str,
    categoria:str, 
    db: Session = Depends(get_db)
):
    return get_negocios_sucursales(db, categoria=categoria, ciudad=ciudad)

@router.get('/{id}',response_model=NegocioOut)
def obtener_negocios_por_id(id:str,db:Session=Depends(get_db)):
    return get_negocio_por_id(db,id)