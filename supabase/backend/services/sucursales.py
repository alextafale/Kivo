from sqlalchemy.orm import Session
from models.sucursales import Sucursal
from exceptions.sucursal import SucursalNoExistente
from typing import List,Optional

def get_sucursal_por_id(db: Session, sucursal_id: str):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise SucursalNoExistente()
    return sucursal
