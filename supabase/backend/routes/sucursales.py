from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.sucursales import SucursalOut
from services.sucursales import get_sucursal_por_id

router = APIRouter(prefix="/sucursales",tags=["Sucursales"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/{id}',response_model=SucursalOut)
def obtener_sucursal_por_id(id:str,db:Session=Depends(get_db)):
    return get_sucursal_por_id(db,id)