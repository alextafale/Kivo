export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  restaurantName: string
  restaurantImage: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  date: string
  orderNumber: string
  deliveryAddress: string

  userId: string
  sucursalId: string | null
  negocioId: string | null
  repartidorId: string | null
  domicilioId: string | null
  notas: string | null
  subtotal: number | null
  descuento: number | null
  costoEnvio: number | null
  propina: number | null
  tiempoEstimadoMin: number | null
  canceladoEn: string | null
  motivoCancelacion: string | null

  // Cupón aplicado (opcional)
  cuponId: string | null
  codigoCupon: string | null
}

// Parámetros que se pasan a OrderSummary desde la pantalla de detalle del negocio
export interface OrderSummaryParams {
  items: OrderItem[]
  negocioId: string
  negocioNombre: string
  direccionEntrega: string
  costoEnvio: number
}

// Parámetros que OrderSummary pasa a ConfirmPayment
export interface ConfirmPaymentParams {
  items: OrderItem[]
  negocioId: string
  subtotal: number
  descuento: number
  costoEnvio: number
  total: number
  codigoCupon?: string
  cuponId?: string
  notas?: string
  direccionEntrega: string
}