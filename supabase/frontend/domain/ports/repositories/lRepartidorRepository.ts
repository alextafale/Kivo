export type DriverEstado = 'offline' | 'available' | 'busy'

export type RepartidorInfo = {
  id: string
  estado: DriverEstado
  vehiculo: string | null
  calificacion: number | null
  total_entregas: number
  foto_url?: string | null   // foto de perfil del repartidor
}

export type PedidoDisponible = {
  id: string
  order_number: string
  negocio_nombre: string
  direccion_entrega: string
  total: number
  costo_envio: number
  creado_en: string
}

export interface IRepartidorRepository {
  getMyInfo(userId: string): Promise<RepartidorInfo>
  updateEstado(userId: string, nuevoEstado: DriverEstado): Promise<DriverEstado>
  getPedidosDisponibles(): Promise<PedidoDisponible[]>
  register(userId: string, tipo: string, vehiculo: string, placa: string | null): Promise<RepartidorInfo>
  tomarPedido(pedidoId: string): Promise<void>
  // Sube foto al bucket y devuelve URL pública
  uploadFoto(repartidorId: string, localUri: string, mimeType: string): Promise<string>
  // Persiste la URL pública en la columna foto_url
  updateFotoUrl(repartidorId: string, fotoUrl: string): Promise<void>
}