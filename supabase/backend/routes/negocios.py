from fastapi import APIRouter, Depends
from typing import List,Optional
from sqlalchemy.orm import Session
from db.database import SessionLocal
from schemas.negocios import NegocioOut,NegocioUpdate
from schemas.sucursales import SucursalOut
from services.negocios import get_negocios_sucursales,get_negocio_por_id, get_sucursales_por_id_de_negocio,put_negocio_por_id
from fastapi import Form, UploadFile, File

router = APIRouter(prefix="/negocios",tags=["Negocios"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/sucursales',response_model=List[NegocioOut],description="Devuelve todos los negocios de una ciudad con sus sucursales agregando paginacion")
def obtener_negocios(
    ciudad:str,
    categoria:str,
    page:Optional[int]=1,
    limit:Optional[int]=10, 
    db: Session = Depends(get_db)
):

    return get_negocios_sucursales(db, categoria=categoria, ciudad=ciudad, page=page, limit=limit)

@router.get('/{id}',response_model=NegocioOut,description="Devuelve un negocio por id",responses={404:{"description":"Negocio no encontrado"}})
def obtener_negocios_por_id(id:str,db:Session=Depends(get_db)):
    return get_negocio_por_id(db,id)

@router.get('/{negocio_id}/sucursales',response_model=List[SucursalOut],description="Devuelve todas las sucursales de un negocio",responses={404:{"description":"Negocio no encontrado"}})
def obtener_sucursales_por_id_de_negocio(negocio_id:str,db:Session=Depends(get_db)):
    return get_sucursales_por_id_de_negocio(db,negocio_id)


@router.put('/{id}',response_model=NegocioOut, description="Actualiza un negocio por id",responses={404:{"description":"Negocio no encontrado"}})
def actualizar_negocio(
    id:str,
    slug: str = Form(...),
    nombre: str = Form(...),
    descripcion: str = Form(...),
    logo_url: UploadFile = File(None),
    banner_url: UploadFile = File(None),
    categoria: str = Form(...),
    tags: List[str] = Form(...),
    pais: str = Form(...),
    db:Session=Depends(get_db)
):
    item_data = NegocioUpdate(
        slug=slug,
        nombre=nombre,    
        descripcion=descripcion,
        logo_url=logo_url,    
        banner_url=banner_url,    
        categoria=categoria,    
        tags=tags,    
        pais=pais
    )

    return put_negocio_por_id(db,id,item_data,logo_url,banner_url)
    
