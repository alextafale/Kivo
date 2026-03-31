from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import List

class ReaccionBase(BaseModel):
    tipo: str  # 👍 ❤️ 😂 😮 😢

class ReaccionCreate(ReaccionBase):
    pass

class ReaccionResponse(ReaccionBase):
    id: UUID4
    comentario_id: UUID4
    usuario_id: UUID4
    created_at: datetime

    class Config:
        from_attributes = True

class ConteoReaccion(BaseModel):
    tipo: str
    cantidad: int