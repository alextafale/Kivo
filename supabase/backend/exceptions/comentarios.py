from fastapi import HTTPException, status


class ComentarioNoExistente(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comentario no encontrado"
        )


class SinPermiso(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para realizar esta acción"
        )


class ReaccionYaExiste(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya tienes una reacción en este comentario"
        )


class ReaccionNoExiste(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tienes una reacción en este comentario"
        )