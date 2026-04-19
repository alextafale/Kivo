from sqlalchemy.orm import Session
from models.pedido_items import PedidoItem
from models.pedidos import Pedido
from exceptions.pedidos import PedidoNoExistente
from core.cloudinary import upload_image
from sqlalchemy import text
from uuid import UUID


def get_pedidos_items_by_pedido_id(db: Session, pedido_id: UUID):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()

    if not pedido:
        raise PedidoNoExistente()
    
    return db.query(PedidoItem).filter(PedidoItem.pedido_id == pedido_id).all()