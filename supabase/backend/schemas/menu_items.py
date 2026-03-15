from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class MenuItemBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    precio_original: Optional[float] = None
    imagen_url: Optional[str] = None
    es_popular: Optional[bool] = False
    es_nuevo: Optional[bool] = False
    disponible: Optional[bool] = True
    tiempo_prep_min: Optional[int] = 15
    alergenos: Optional[List[str]] = []
    etiquetas: Optional[List[str]] = []
    personalizaciones: Optional[List[str]] = []
    orden: Optional[int] = 0

class MenuItemCreate(MenuItemBase):
    sucursal_id: UUID
    categoria_id: UUID

class MenuItemOut(MenuItemBase):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True





"""
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sucursal_id uuid NOT NULL,
  categoria_id uuid,
  nombre text NOT NULL,
  descripcion text,
  precio numeric NOT NULL,
  precio_original numeric,
  imagen_url text,
  es_popular boolean DEFAULT false,
  es_nuevo boolean DEFAULT false,
  disponible boolean DEFAULT true,
  tiempo_prep_min integer DEFAULT 15,
  alergenos ARRAY DEFAULT '{}'::text[],
  etiquetas ARRAY DEFAULT '{}'::text[],
  personalizaciones jsonb DEFAULT '[]'::jsonb,
  orden integer DEFAULT 0,
  creado_en timestamp with time zone DEFAULT now(),
  actualizado_en timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id),
  CONSTRAINT menu_items_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.menu_categorias(id)
);
"""