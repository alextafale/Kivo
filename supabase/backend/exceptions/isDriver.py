class NoEsRepartidor(Exception):
    """El usuario autenticado no tiene perfil de repartidor."""
    pass


class RepartidorYaExiste(Exception):
    """El usuario ya tiene un perfil de repartidor registrado."""
    pass


class RepartidorNoEncontrado(Exception):
    """No se encontró el repartidor solicitado."""
    pass