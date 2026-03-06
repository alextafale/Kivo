from sqlalchemy.orm import Session
from models.negocios import Negocio
from schemas.negocios import NegocioOut
from exceptions.negocios import NegocioNoExistente
from typing import List,Optional
from uuid import UUID

class DriverNoExistente(Exception):
    def __init__(self, message: str = "El usuario no es conductor"):
        self.message = message
        super().__init__(self.message)

class DriverYaExistente(Exception):
    def __init__(self, message: str = "El usuario ya es conductor"):
        self.message = message
        super().__init__(self.message)

class DriverNoValido(Exception):
    def __init__(self, message: str = "El usuario no es conductor"):
        self.message = message
        super().__init__(self.message)