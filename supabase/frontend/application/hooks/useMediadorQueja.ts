// application/hooks/useMediadorQueja.ts
// Orquesta el flujo completo del mediador IA: contexto → confirmación → resolución

import { useState, useCallback } from 'react'
import { QuejaRepositoryImpl } from '../../infraestructure/repositories/QuejaRepositoryImpl'
import type { QuejaContexto, QuejaResolucion } from '../../domain/entities/QuejaResolucion'

type Estado = 'idle' | 'cargando_contexto' | 'esperando_confirmacion' | 'resolviendo' | 'resuelto' | 'error'

type UseMediadorQuejaReturn = {
    estado: Estado
    contexto: QuejaContexto | null
    resolucion: QuejaResolucion | null
    error: string | null
    // Paso 1: carga el contexto y muestra el resumen al usuario
    iniciarQueja: (pedidoId: string) => Promise<void>
    // Paso 2: el usuario confirma → Qwen decide y resuelve
    confirmarQueja: () => Promise<void>
    // Resetea el estado (para cerrar el modal)
    resetear: () => void
}

const repo = new QuejaRepositoryImpl()

export function useMediadorQueja(): UseMediadorQuejaReturn {
    const [estado, setEstado] = useState<Estado>('idle')
    const [contexto, setContexto] = useState<QuejaContexto | null>(null)
    const [resolucion, setResolucion] = useState<QuejaResolucion | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pedidoIdActivo, setPedidoIdActivo] = useState<string | null>(null)

    // ── Paso 1: obtener contexto ───────────────────────────────────────────────
    const iniciarQueja = useCallback(async (pedidoId: string) => {
        setEstado('cargando_contexto')
        setError(null)
        setContexto(null)
        setResolucion(null)
        setPedidoIdActivo(pedidoId)

        try {
            const ctx = await repo.getContexto(pedidoId)
            setContexto(ctx)
            setEstado('esperando_confirmacion')
        } catch (e: any) {
            setError(e.message ?? 'No se pudo cargar el contexto de la queja')
            setEstado('error')
        }
    }, [])

    // ── Paso 2: confirmar y resolver ──────────────────────────────────────────
    const confirmarQueja = useCallback(async () => {
        if (!pedidoIdActivo) return
        setEstado('resolviendo')
        setError(null)

        try {
            const res = await repo.resolver(pedidoIdActivo)
            setResolucion(res)
            setEstado('resuelto')
        } catch (e: any) {
            setError(e.message ?? 'No se pudo procesar la queja')
            setEstado('error')
        }
    }, [pedidoIdActivo])

    const resetear = useCallback(() => {
        setEstado('idle')
        setContexto(null)
        setResolucion(null)
        setError(null)
        setPedidoIdActivo(null)
    }, [])

    return {
        estado,
        contexto,
        resolucion,
        error,
        iniciarQueja,
        confirmarQueja,
        resetear,
    }
}