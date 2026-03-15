from sqlalchemy.orm import Session
from models.sucursales import Sucursal
from models.negocios import Negocio
from models.menu_items import MenuItem
from models.menu_categorias import MenuCategoria
from exceptions.sucursal import SucursalNoExistente
from typing import List,Optional

"""def get_sucursal_por_id(db: Session, sucursal_id: str):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise SucursalNoExistente()
    return sucursal"""

def get_sucursal_por_id(db: Session, sucursal_id: str):

    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()

    if not sucursal:
        raise Exception("Sucursal no encontrada")

    negocio = sucursal.negocio

    menu_items = (
        db.query(MenuItem, MenuCategoria)
        .join(MenuCategoria, MenuItem.categoria_id == MenuCategoria.id)
        .filter(MenuItem.sucursal_id == sucursal_id)
        .all()
    )

    menu = []

    for item, categoria in menu_items:
        menu.append({
            "id": item.id,
            "nombre": item.nombre,
            "precio": item.precio,
            "imagen_url": item.imagen_url,
            "descripcion": item.descripcion,
            "categoria": categoria.nombre
        })

    return {
        "id": sucursal.id,
        "nombre": negocio.nombre,
        "categoria": negocio.categoria,
        "logo_url": negocio.logo_url,
        "banner_url": negocio.banner_url,
        "calificacion": sucursal.calificacion,
        "tiempo_entrega": f"{sucursal.tiempo_entrega_min}-{int(sucursal.tiempo_entrega_min)+10}",
        "costo_envio": "Gratis",
        "descripcion": negocio.descripcion,
        "direccion": sucursal.direccion,
        "horarios": {
            "entre_semana": "9:00 - 22:00",
            "fin_semana": "9:00 - 22:00"
        },
        "menu": menu
    }
