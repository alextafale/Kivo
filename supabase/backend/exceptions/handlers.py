from fastapi import Request
from fastapi.responses import JSONResponse
from exceptions.negocios import NegocioNoExistente
from exceptions.sucursal import SucursalNoExistente

def register_exception_handlers(app):
    
    @app.exception_handler(NegocioNoExistente)
    async def negocio_no_existente_handler(
        equest: Request,
        exc: NegocioNoExistente  
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Negocio no encontrado"}
        )
    
    @app.exception_handler(SucursalNoExistente)
    async def sucursal_no_existente_handler(
        equest: Request,
        exc: SucursalNoExistente  
    ):
        
        return JSONResponse(
            status_code=404,
            content={"detail": "Sucursal no encontrada"}
        )