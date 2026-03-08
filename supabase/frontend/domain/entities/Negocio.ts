// Entidades puras — sin imports externos

export type Negocio = {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  logo_url: string | null
  banner_url: string | null
  categoria: string
  tags: string[]
  pais: string
  activo: boolean
  verificado: boolean
}

export type HorarioDia = {
  dia: string
  abre: string | null
  cierra: string | null
  cerrado: boolean
}

export type Sucursal = {
  id: string
  negocio_id: string
  nombre: string
  telefono: string | null
  whatsapp: string | null
  direccion: string
  ciudad: string | null
  estado: string | null
  pais: string
  codigo_postal: string | null
  horarios: HorarioDia[]
  radio_entrega_km: number
  tiempo_entrega_min: number
  calificacion: number
  total_reviews: number
  activo: boolean
  acepta_efectivo: boolean
  acepta_tarjeta: boolean
}

export type SucursalCreate = Omit<Sucursal, 'id' | 'calificacion' | 'total_reviews'>
export type SucursalPatch = Partial<SucursalCreate>
export type NegocioPatch = Partial<Pick<Negocio, 'nombre' | 'descripcion' | 'logo_url' | 'banner_url' | 'categoria' | 'tags'>>