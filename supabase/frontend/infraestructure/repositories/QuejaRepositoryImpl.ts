// infrastructure/repositories/QuejaRepositoryImpl.ts
// Adaptador HTTP — llama al backend FastAPI y mapea snake_case → camelCase

import { supabase } from '../../../../supabase/frontend/config/supabaseConfig'
import type { IQuejaRepository } from '../../domain/ports/repositories/lQuejaRepository'
import type {
    QuejaContexto,
    QuejaResolucion,
    QuejaItem,
    QuejaHistorialItem,
} from '../../domain/entities/QuejaResolucion'

const BASE_URL = process.env.API_BASE_URL ?? ''

// ── Helpers de mapeo ──────────────────────────────────────────────────────────

function mapItem(raw: any): QuejaItem {
    return {
        nombre: raw.nombre,
        cantidad: raw.cantidad,
        precioUnitario: raw.precio_unitario,
        subtotal: raw.subtotal,
    }
}

function mapHistorial(raw: any): QuejaHistorialItem {
    return {
        pedidoId: raw.pedido_id,
        accion: raw.accion,
        monto: raw.monto ?? null,
        createdAt: raw.created_at,
    }
}

function mapContexto(raw: any): QuejaContexto {
    return {
        pedidoId: raw.pedido_id,
        orderNumber: raw.order_number ?? null,
        estado: raw.estado,
        total: raw.total,
        negocioNombre: raw.negocio_nombre ?? null,
        sucursalNombre: raw.sucursal_nombre ?? null,
        tiempoEstimadoMin: raw.tiempo_estimado_min ?? null,
        tiempoEntregaRealMin: raw.tiempo_entrega_real_min ?? null,
        tiempoNegocioMin: raw.tiempo_negocio_min ?? null,
        tiempoRepartidorMin: raw.tiempo_repartidor_min ?? null,
        tiempoEsperaRepartidorMin: raw.tiempo_espera_repartidor_min ?? null,
        avgTiempoNegocioMin: raw.avg_tiempo_negocio_min ?? null,
        avgTiempoRepartidorMin: raw.avg_tiempo_repartidor_min ?? null,
        avgTiempoTotalMin: raw.avg_tiempo_total_min ?? null,
        totalPedidosHistorico: raw.total_pedidos_historico ?? 0,
        items: (raw.items ?? []).map(mapItem),
        historialQuejas30d: (raw.historial_quejas_30d ?? []).map(mapHistorial),
    }
}

function mapResolucion(raw: any): QuejaResolucion {
    return {
        quejaId: raw.queja_id,
        pedidoId: raw.pedido_id,
        accion: raw.accion,
        monto: raw.monto ?? null,
        razonInterna: raw.razon_interna,
        mensajeUsuario: raw.mensaje_usuario,
    }
}

// ── Implementación ────────────────────────────────────────────────────────────

export class QuejaRepositoryImpl implements IQuejaRepository {

    private async _getToken(): Promise<string> {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) throw new Error('Sin sesión activa')
        return token
    }

    async getContexto(pedidoId: string): Promise<QuejaContexto> {
        const token = await this._getToken()

        const res = await fetch(`${BASE_URL}/orders/${pedidoId}/queja`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.detail ?? 'Error al obtener contexto de queja')
        }

        return mapContexto(await res.json())
    }

    async resolver(pedidoId: string): Promise<QuejaResolucion> {
        const token = await this._getToken()

        const res = await fetch(`${BASE_URL}/orders/${pedidoId}/resolucion`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}), // Sin override → Qwen decide
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.detail ?? 'Error al resolver queja')
        }

        return mapResolucion(await res.json())
    }
}