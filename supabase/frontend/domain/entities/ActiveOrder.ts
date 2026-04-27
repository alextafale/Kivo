// Entidad que representa el pedido activo asignado al repartidor
export type OrderItem = {
    id: string
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
    notas: string | null
}

export type Coordinates = {
    latitude: number
    longitude: number
}

// Fases del flujo de entrega desde perspectiva del repartidor
export type DeliveryPhase = 'to_business' | 'to_customer' | null

export type ActiveOrder = {
    id: string
    orderNumber: string
    estado: string
    // Negocio
    negocioNombre: string
    negocioDireccion: string
    negocioUbicacion: Coordinates
    // Cliente
    clienteNombre: string
    direccionEntrega: string
    clienteUbicacion: Coordinates | null
    // Items
    items: OrderItem[]
    // Montos
    subtotal: number
    costoEnvio: number
    total: number
    // Tiempos
    tiempoEstimadoMin: number | null
    // Fase actual del repartidor
    phase: DeliveryPhase
}