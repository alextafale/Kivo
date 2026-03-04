from fastapi import Request
from fastapi.responses import JSONResponse
from exceptions.negocios import NegocioNoExistente

def register_exception_handlers(app):
    
    @app.exception_handler(NegocioNoExistente)
    async def usuario_no_existente_handler(
        equest: Request,
        exc: NegocioNoExistente  
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Negocio no encontrado"}
        )