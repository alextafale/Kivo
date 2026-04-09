from sqlalchemy.orm import Session
from models.sucursales import Sucursal
from models.negocios import Negocio
from models.menu_items import MenuItem
from models.menu_categorias import MenuCategoria
from exceptions.sucursal import SucursalNoExistente
from exceptions.menu_items import ItemNoExistente
from typing import List,Optional
from schemas.menu_items import MenuItemFrontendCreate, MenuItemFrontendUpdate
from fastapi import HTTPException,UploadFile
from core.cloudinary import upload_image


def get_sucursal_por_id(db: Session, sucursal_id: str):

    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()

    if not sucursal:
        raise SucursalNoExistente()

    negocio = sucursal.negocio

    menu_items = (
        db.query(MenuItem, MenuCategoria)
        .join(MenuCategoria, MenuItem.categoria_id == MenuCategoria.id)
        .filter(
            MenuItem.sucursal_id == sucursal_id,
            MenuItem.activo == True
        )
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
            "disponible": bool(item.disponible) if item.disponible is not None else True,
            "categoria": categoria.nombre,
            "categoria_id": str(categoria.id), 
            "disponible": item.disponible, 
        })

    categorias_activas = db.query(MenuCategoria).filter(
        MenuCategoria.sucursal_id == sucursal_id,
        MenuCategoria.activo == True
    ).all()

    return {
        "id": sucursal.id,
        "negocio_id": negocio.id,
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
        "menu": menu,
        "categorias": [{"id": str(c.id), "nombre": c.nombre} for c in categorias_activas]
    }

def add_menu_item(db: Session, sucursal_id: str, item_data: MenuItemFrontendCreate, imagen:Optional[UploadFile]):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise SucursalNoExistente()

    categoria_nombre = item_data.categoria.strip()
    categoria = db.query(MenuCategoria).filter(
        MenuCategoria.nombre == categoria_nombre, 
        MenuCategoria.sucursal_id == sucursal_id
    ).first()
    
    if not categoria:
        categoria = MenuCategoria(
            sucursal_id=sucursal.id,
            nombre=categoria_nombre,
            activo=True
        )
        db.add(categoria)
        db.flush()
        
        
    if(imagen is not None):
        imagen_url = upload_image(imagen)
    else:
        imagen_url = None
        

    nuevo_item = MenuItem(
        sucursal_id=sucursal.id,
        categoria_id=categoria.id,
        nombre=item_data.nombre,
        descripcion=item_data.descripcion,
        precio=item_data.precio,
        imagen_url=imagen_url,
        disponible=item_data.disponible
    )
    try:
        db.add(nuevo_item)
        db.commit()
        db.refresh(nuevo_item)
        return nuevo_item
    except:
        db.rollback()
        raise Exception("Error al crear el item")

def update_menu_item(db: Session, sucursal_id: str, item_id: str, item_data: MenuItemFrontendUpdate, imagen:Optional[UploadFile]):
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.sucursal_id == sucursal_id).first()
    if not item:
        raise ItemNoExistente()
        
    categoria_nombre = item_data.categoria.strip()
    categoria = db.query(MenuCategoria).filter(
        MenuCategoria.nombre == categoria_nombre, 
        MenuCategoria.sucursal_id == sucursal_id
    ).first()
    
    if not categoria:
        categoria = MenuCategoria(
            sucursal_id=sucursal_id,
            nombre=categoria_nombre,
            activo=True
        )
        db.add(categoria)
        db.flush()
        
    if(imagen is not None):
        imagen_url = upload_image(imagen)
    else:
        imagen_url = item.imagen_url
        
    item.categoria_id = categoria.id
    item.nombre = item_data.nombre
    item.descripcion = item_data.descripcion
    item.precio = item_data.precio
    item.imagen_url = imagen_url
    item.disponible = item_data.disponible
    
    db.commit()
    db.refresh(item)
    return item

def delete_menu_item(db: Session, sucursal_id: str, item_id: str):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.sucursal_id == sucursal_id
    ).first()
    if not item:
        raise ItemNoExistente()

    # Soft delete 
    item.activo = False
    db.commit()
    return {"ok": True, "message": "Item eliminado correctamente"}

def toggle_item_disponibilidad(db: Session, sucursal_id: str, item_id: str):
    item = db.query(MenuItem).filter(
        MenuItem.id == item_id,
        MenuItem.sucursal_id == sucursal_id
    ).first()
    if not item:
        raise ItemNoExistente()

    # Invertir disponibilidad
    item.disponible = not item.disponible
    db.commit()
    db.refresh(item)
    return {"ok": True, "disponible": item.disponible}


def add_categoria(db: Session, sucursal_id: str, nombre: str):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise SucursalNoExistente()

    # Verificar que no exista ya una categoría con ese nombre
    existente = db.query(MenuCategoria).filter(
        MenuCategoria.nombre == nombre.strip(),
        MenuCategoria.sucursal_id == sucursal_id,
        MenuCategoria.activo == True
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")

    categoria = MenuCategoria(
        sucursal_id=sucursal_id,
        nombre=nombre.strip(),
        activo=True
    )
    db.add(categoria)
    db.commit()
    db.refresh(categoria)
    return categoria


def delete_categoria(db: Session, sucursal_id: str, categoria_id: str):
    categoria = db.query(MenuCategoria).filter(
        MenuCategoria.id == categoria_id,
        MenuCategoria.sucursal_id == sucursal_id
    ).first()

    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    # Verificar que no tenga items activos
    items_activos = db.query(MenuItem).filter(
        MenuItem.categoria_id == categoria_id,
        MenuItem.activo == True
    ).count()

    if items_activos > 0:
        raise HTTPException(
            status_code=400,
            detail=f"No puedes eliminar una categoría con {items_activos} items activos"
        )

    # Soft delete
    categoria.activo = False
    db.commit()
    return {"ok": True, "message": "Categoría eliminada correctamente"}
