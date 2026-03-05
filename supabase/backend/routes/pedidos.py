from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
# from core.dependencies import get_current_user_id
from models.pedidos import Pedido
from schemas.pedidos import PedidoOut
from typing import List
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/pedidos",tags=["Pedidos"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[PedidoOut])
def get_pedidos(
    db: Session = Depends(get_db)
   # ,user_id: str = Depends(get_current_user_id)
):
    #pedidos = db.query(Pedido).filter(Pedido.user_id == user_id).all()
    pedidos = db.query(Pedido).all()
    return pedidos

@router.get("/{id}", response_model=PedidoOut)
def get_pedido_By_Id(
    id: str,
    db: Session = Depends(get_db)
    #,user_id: str = Depends(get_current_user_id)
):
    pedido = db.query(Pedido).filter(
        Pedido.id == id
        #,Pedido.user_id == user_id
    ).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    return pedido