export type Coordinates = {
    latitude: number
    longitude: number
}

export type OrderItem = {
    id: string
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
    notas: string | null
}

export type ActiveOrder = {
    id: string
    orderNumber: string
    estado: string
    negocioNombre: string
    negocioDireccion: string
    negocioUbicacion: Coordinates
    clienteNombre: string
    direccionEntrega: string
    clienteUbicacion: Coordinates | null
    items: OrderItem[]
    subtotal: number
    costoEnvio: number
    total: number
    tiempoEstimadoMin: number | null
    phase: 'to_business' | 'to_customer' | null
}
