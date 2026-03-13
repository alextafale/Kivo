from enum import Enum

class PedidoEstado(str, Enum):
    pending    = "pending"
    confirmed  = "confirmed"
    preparing  = "preparing"
    ready      = "ready"
    picked_up  = "picked_up"
    on_the_way = "on_the_way"
    delivered  = "delivered"
    cancelled  = "cancelled"
    refunded   = "refunded"