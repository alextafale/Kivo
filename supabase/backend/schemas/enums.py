from enum import Enum

class PedidoEstado(str, Enum):
    pending    = "pending"
    confirmed  = "confirmed"
    preparing  = "preparing"
    ready      = "ready"
    picked_up  = "picked_up"
    on_the_way = "on_the_way"
    pending_confirmation = "pending_confirmation"
    delivered  = "delivered"
    cancelled  = "cancelled"
    refunded   = "refunded"

class QuejaAccion(str, Enum):
    reembolso_parcial = "reembolso_parcial"
    cupon             = "cupon"
    disculpa          = "disculpa"