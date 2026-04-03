from fastapi import APIRouter, Depends
from typing import List,Optional
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.domicilios import DomicilioOut, DomicilioCreate
from services.domicilios import get_domicilios, get_domicilio_por_id, actualizar_domicilio, eliminar_domicilio

router = APIRouter(prefix="/domicilios",tags=["Domicilios"])

# Esta clase esta incorrecta, tenemos que ver bien el service de domicilio
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/',response_model=List[DomicilioOut])
def obtener_domicilios(
    user_id: str,
    db: Session = Depends(get_db)
):
    return get_domicilios(db,user_id)

@router.get('/{id}',response_model=DomicilioOut)
def obtener_domicilios_por_id(id:str,db:Session=Depends(get_db)):
    return get_domicilio_por_id(db,id)

@router.post('/',response_model=DomicilioOut)
def crear_domicilio(domicilio:DomicilioCreate,db:Session=Depends(get_db)):
    return crear_domicilio(domicilio,db)

@router.patch('/{id}',response_model=DomicilioOut)
def actualizar_domicilio(id:str,domicilio:DomicilioOut,db:Session=Depends(get_db)):
    return actualizar_domicilio(id,domicilio,db)

@router.delete('/{id}',response_model=DomicilioOut)
def eliminar_domicilio(id:str,db:Session=Depends(get_db)):
    return eliminar_domicilio(id,db)   