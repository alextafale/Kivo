from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from models.negocio_reacciones import TipoReaccion


class ComentarioIn(BaseModel):
    contenido: str = Field(..., min_length=1, max_length=1000)


class ComentarioOut(BaseModel):
    id:          UUID
    negocio_id:  UUID
    user_id:     UUID
    contenido:   str
    creado_en:   datetime
    actualizado_en: datetime

    class ConfigDict:
        from_attributes = True


class ComentariosPaginados(BaseModel):
    items:    List[ComentarioOut]
    total:    int
    pagina:   int
    por_pagina: int
    hay_mas:  bool


class ReaccionIn(BaseModel):
    tipo: TipoReaccion


class ReaccionConteo(BaseModel):
    tipo:     TipoReaccion
    conteo:   int


class ReaccionesOut(BaseModel):
    comentario_id: UUID
    total:         int
    por_tipo:      List[ReaccionConteo]
    mi_reaccion:   Optional[TipoReaccion] = None