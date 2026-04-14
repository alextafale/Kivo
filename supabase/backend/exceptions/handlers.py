from fastapi import Request
from fastapi.responses import JSONResponse
from exceptions.domicilios import DomicilioNoExistente
from exceptions.menu_items import ItemNoExistente
from exceptions.negocios import NegocioNoExistente
from exceptions.pedidos import PedidoNoExistente, PedidoNoEntregado
from exceptions.reviews import ReviewYaExistente, ReviewNoExistente
from exceptions.sucursal import SucursalNoExistente
from exceptions.isBusinessAdmin import NoEsAdminDelNegocio


def register_exception_handlers(app):


    @app.exception_handler(DomicilioNoExistente)
    async def domicilio_no_existente_handler(
        request: Request,
        exc: DomicilioNoExistente,
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Domicilio no encontrado"},
        )
    
    @app.exception_handler(ItemNoExistente)
    async def item_no_existente_handler(
        request: Request,
        exc: ItemNoExistente,
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Item no encontrado"},
        )
    
    @app.exception_handler(NegocioNoExistente)
    async def negocio_no_existente_handler(
        request: Request,
        exc: NegocioNoExistente,
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Negocio no encontrado"},
        )
    
    @app.exception_handler(PedidoNoExistente)
    async def pedido_no_existente_handler(
        request: Request,
        exc: PedidoNoExistente,
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Pedido no encontrado"},
        )
    
    @app.exception_handler(PedidoNoEntregado)
    async def pedido_no_entregado_handler(
        request: Request,
        exc: PedidoNoEntregado,
    ):
        return JSONResponse(
            status_code=409,
            content={"detail": "Pedido no entregado"},
        )

    @app.exception_handler(ReviewYaExistente)
    async def review_ya_existente_handler(
        request: Request,
        exc: ReviewYaExistente,
    ):
        return JSONResponse(
            status_code=409,
            content={"detail": "Review ya existente"},
        )
    
    @app.exception_handler(ReviewNoExistente)
    async def review_no_existente_handler(
        request: Request,
        exc: ReviewNoExistente,
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Review no encontrada"},
        )

    @app.exception_handler(SucursalNoExistente)
    async def sucursal_no_existente_handler(
        request: Request,
        exc: SucursalNoExistente,
    ):
        return JSONResponse(
            status_code=404,
            content={"detail": "Sucursal no encontrada"},
        )

    @app.exception_handler(NoEsAdminDelNegocio)
    async def no_es_admin_negocio_handler(
        request: Request,
        exc: NoEsAdminDelNegocio,
    ):
        return JSONResponse(
            status_code=403,
            content={"detail": "No tienes permisos para administrar este negocio"},
        )