// application/hooks/useETA.ts
// Obtiene el ETA del repartidor cada 30 segundos.
// Solo se activa cuando el pedido está en picked_up u on_the_way.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../config/supabaseConfig'

const API_URL = process.env.API_BASE_URL

export interface ETAInfo {
    eta_minutos: number | null
    distancia_km: number | null
}

export const useETA = (pedidoId: string | null, activo: boolean) => {
    const [eta, setEta] = useState<ETAInfo | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (!pedidoId || !activo) {
            setEta(null)
            return
        }

        const fetchETA = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) return

                const res = await fetch(
                    `${API_URL}/pedidos/${pedidoId}/eta`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                    }
                )

                if (!res.ok) return

                const data = await res.json()
                setEta(data)
            } catch (e) {
                console.warn('Error obteniendo ETA:', e)
            }
        }

        // Obtener inmediatamente
        fetchETA()

        // Luego cada 30 segundos
        intervalRef.current = setInterval(fetchETA, 30_000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [pedidoId, activo])

    return { eta }
}