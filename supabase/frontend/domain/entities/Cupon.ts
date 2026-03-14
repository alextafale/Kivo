// Entidades puras de cupones — sin imports externos

export type TipoCupon = 'porcentaje' | 'monto_fijo' | 'envio_gratis'

export type Cupon = {
  id: string
  negocioId: string
  codigo: string
  descripcion: string | null
  tipo: TipoCupon
  valor: number              // porcentaje (0-100) o monto fijo en MXN
  minimoCompra: number | null
  maximoDescuento: number | null
  fechaInicio: string        // ISO string
  fechaFin: string           // ISO string
  usoMaximoTotal: number | null
  usoMaximoPorUsuario: number
  usosActuales: number
  activo: boolean
  creadoEn: string
}

export type CuponValidacion = {
  valido: boolean
  cupon: Cupon | null
  descuento: number          // monto calculado a descontar
  mensajeError: string | null
}

export type CuponCreate = Omit<Cupon, 'id' | 'usosActuales' | 'creadoEn'>
export type CuponPatch = Partial<Pick<Cupon,
  'descripcion' | 'valor' | 'minimoCompra' | 'maximoDescuento' |
  'fechaFin' | 'usoMaximoTotal' | 'usoMaximoPorUsuario' | 'activo'
>>