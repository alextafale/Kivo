from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from typing import List
from schemas.sucursal_detalle_schema import SucursalDetalleResponse, CategoriaOrdenUpdate
from schemas.menu_items import MenuItemFrontendCreate, MenuItemFrontendUpdate
from schemas.reviews import ReviewOut
from schemas.negocios import NegocioOut
from services.sucursales import get_sucursal_por_id, add_menu_item, update_menu_item, delete_menu_item, toggle_item_disponibilidad, add_categoria, delete_categoria, reordenar_categorias, get_sucursales_cercanas
from fastapi import APIRouter, Depends, File, UploadFile, Form
from core.isBusinessAdmin import require_business_admin
from services.reviews import get_reviews_by_sucursal_id

router = APIRouter(prefix="/sucursales",tags=["Sucursales"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/cercanas", response_model=List[NegocioOut])
def obtener_sucursales_cercanas(latitud: float,longitud: float,radio_metros:int,page:int,limit:int, categoria: str | None = None, db: Session = Depends(get_db)):
    return get_sucursales_cercanas(db, latitud, longitud, radio_metros, page, limit, categoria)

@router.get("/{id}", response_model=SucursalDetalleResponse)
def obtener_sucursal_por_id(id: str, db: Session = Depends(get_db)):
    return get_sucursal_por_id(db, id)



@router.get("/{id}/reviews", response_model=List[ReviewOut])
def obtener_reviews(id: str, db: Session = Depends(get_db)):
    return get_reviews_by_sucursal_id(id,db)

@router.post("/{id}/menu")
def crear_item_menu(
    id: str,
    nombre: str = Form(...),
    descripcion: str = Form(...),
    precio: float = Form(...),
    disponible: bool = Form(...),
    categoria: str = Form(...),
    imagen: UploadFile = File(None),
    db: Session = Depends(get_db)
    ):
    item_data = MenuItemFrontendCreate(
        nombre=nombre,
        descripcion=descripcion,
        precio=precio,
        disponible=disponible,
        categoria=categoria
    )

    return add_menu_item(db, id, item_data, imagen)

@router.put("/negocios/{negocio_id}/sucursales/{sucursal_id}/menu/{item_id}")
def actualizar_item_menu(
    negocio_id: str,
    sucursal_id: str,
    item_id: str,
    nombre: str = Form(...),
    descripcion: str = Form(None),
    precio: float = Form(...),
    disponible: bool = Form(...),
    categoria: str = Form(...),
    imagen: UploadFile = File(None),
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    item_data = MenuItemFrontendUpdate(
        nombre=nombre,
        descripcion=descripcion,
        precio=precio,
        disponible=disponible,
        categoria=categoria
    )
    return update_menu_item(db, sucursal_id, item_id, item_data, imagen)

@router.delete("/negocios/{negocio_id}/sucursales/{sucursal_id}/menu/{item_id}", summary="Eliminar item del menú")
def eliminar_item_menu(
    negocio_id: str,
    sucursal_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return delete_menu_item(db, sucursal_id, item_id)


@router.patch("/negocios/{negocio_id}/sucursales/{sucursal_id}/menu/{item_id}/disponibilidad", summary="Toggle disponibilidad del item")
def toggle_disponibilidad(
    negocio_id: str,
    sucursal_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return toggle_item_disponibilidad(db, sucursal_id, item_id)


@router.post("/negocios/{negocio_id}/sucursales/{sucursal_id}/menu/categorias", summary="Crear categoría del menú")
def crear_categoria(
    negocio_id: str,
    sucursal_id: str,
    nombre: str = Form(...),
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return add_categoria(db, sucursal_id, nombre)


@router.delete("/negocios/{negocio_id}/sucursales/{sucursal_id}/menu/categorias/{categoria_id}", summary="Eliminar categoría del menú")
def eliminar_categoria(
    negocio_id: str,
    sucursal_id: str,
    categoria_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return delete_categoria(db, sucursal_id, categoria_id)

@router.put("/negocios/{negocio_id}/sucursales/{sucursal_id}/menu/categorias/orden", summary="Reordenar categorías del menú")
def reordenar_categorias_endpoint(
    negocio_id: str,
    sucursal_id: str,
    orden_data: CategoriaOrdenUpdate,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return reordenar_categorias(db, sucursal_id, orden_data)