from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.sucursal_detalle_schema import SucursalDetalleResponse
from schemas.menu_items import MenuItemFrontendCreate, MenuItemFrontendUpdate
from services.sucursales import get_sucursal_por_id, add_menu_item, update_menu_item, delete_menu_item, toggle_item_disponibilidad, add_categoria, delete_categoria
from fastapi import APIRouter, Depends, File, UploadFile, Form
from core.isBusinessAdmin import require_business_admin

router = APIRouter(prefix="/sucursales",tags=["Sucursales"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{id}", response_model=SucursalDetalleResponse)
def obtener_sucursal_por_id(id: str, db: Session = Depends(get_db)):
    return get_sucursal_por_id(db, id)



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

@router.put("/{id}/menu/{item_id}")
def actualizar_item_menu(id: str, item_id: str, item_data: MenuItemFrontendUpdate, db: Session = Depends(get_db)):
    return update_menu_item(db, id, item_id, item_data, None)


@router.delete("/{id}/menu/{item_id}", summary="Eliminar item del menú")
def eliminar_item_menu(
    id: str,
    item_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return delete_menu_item(db, id, item_id)


@router.patch("/{id}/menu/{item_id}/disponibilidad", summary="Toggle disponibilidad del item")
def toggle_disponibilidad(
    id: str,
    item_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return toggle_item_disponibilidad(db, id, item_id)


@router.post("/{id}/menu/categorias", summary="Crear categoría del menú")
def crear_categoria(
    id: str,
    nombre: str = Form(...),
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return add_categoria(db, id, nombre)


@router.delete("/{id}/menu/categorias/{categoria_id}", summary="Eliminar categoría del menú")
def eliminar_categoria(
    id: str,
    categoria_id: str,
    db: Session = Depends(get_db),
    _user_id: str = Depends(require_business_admin)
):
    return delete_categoria(db, id, categoria_id)