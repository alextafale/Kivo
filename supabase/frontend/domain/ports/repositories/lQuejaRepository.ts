// domain/ports/repositories/IQuejaRepository.ts
// Contrato que la infraestructura debe cumplir

import type { QuejaContexto, QuejaResolucion } from '../../entities/QuejaResolucion'

export interface IQuejaRepository {
    // Obtiene el contexto completo del pedido para mostrar al usuario
    getContexto(pedidoId: string): Promise<QuejaContexto>

    // Dispara la resolución automática por Qwen
    resolver(pedidoId: string): Promise<QuejaResolucion>
}