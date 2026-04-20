// domain/entities/QuejaResolucion.ts
// Entidad pura — sin dependencias externas

export type QuejaAccion = 'reembolso_parcial' | 'cupon' | 'disculpa'

// Contexto completo del pedido para mostrar al usuario antes de enviar queja
export type QuejaContexto = {
    pedidoId: string
    orderNumber: string | null
    estado: string
    total: number
    negocioNombre: string | null
    sucursalNombre: string | null

    // Tiempo estimado vs real
    tiempoEstimadoMin: number | null
    tiempoEntregaRealMin: number | null

    // Desglose por responsable
    tiempoNegocioMin: number | null
    tiempoRepartidorMin: number | null
    tiempoEsperaRepartidorMin: number | null

    // Promedios históricos del negocio
    avgTiempoNegocioMin: number | null
    avgTiempoRepartidorMin: number | null
    avgTiempoTotalMin: number | null
    totalPedidosHistorico: number

    items: QuejaItem[]
    historialQuejas30d: QuejaHistorialItem[]
}

export type QuejaItem = {
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
}

export type QuejaHistorialItem = {
    pedidoId: string
    accion: QuejaAccion
    monto: number | null
    createdAt: string
}

// Resultado de la resolución automática por Qwen
export type QuejaResolucion = {
    quejaId: string
    pedidoId: string
    accion: QuejaAccion
    monto: number | null
    razonInterna: string
    mensajeUsuario: string
}