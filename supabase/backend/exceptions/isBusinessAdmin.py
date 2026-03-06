from sqlalchemy.orm import Session
from models.negocios import Negocio
from schemas.negocios import NegocioOut
from exceptions.negocios import NegocioNoExistente
from typing import List,Optional

def isBusinessAdmin(user_id: UUID, db: Session) -> bool:
    return db.query(Negocio).filter(Negocio.user_id == user_id).first() is not None

class BusinessAdminNoExistente(Exception):
    def __init__(self, message: str = "El usuario no es administrador de ningun negocio"):
        self.message = message
        super().__init__(self.message)

class BusinessAdminYaExistente(Exception):
    def __init__(self, message: str = "El usuario ya es administrador de un negocio"):
        self.message = message
        super().__init__(self.message)

class BusinessAdminNoValido(Exception):
    def __init__(self, message: str = "El usuario no es administrador de ningun negocio"):
        self.message = message
        super().__init__(self.message)
        