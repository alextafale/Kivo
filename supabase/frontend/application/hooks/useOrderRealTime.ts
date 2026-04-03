// application/hooks/useOrderRealtime.ts
// Suscribe al canal de Supabase Realtime para un pedido específico.
// Cuando el backend cambia el estado, este hook lo refleja inmediatamente.

import { useState, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import { supabase } from '../../config/supabaseConfig'
import type { Order } from '../../types/order'

/**
 * Se suscribe a cambios en tiempo real del pedido.
 * Úsalo en Order.tsx y OrderTracking.tsx.
 *
 * @param pedidoId  ID del pedido a escuchar
 * @param initial   Estado inicial del pedido (para no mostrar nada vacío)
 */
export const useOrderRealtime = (pedidoId: string | null, initial: Order | null) => {
  const [order, setOrder] = useState<Order | null>(initial)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Sincronizar si el initial cambia desde fuera (primera carga)
    setOrder(initial)
  }, [initial])

  useEffect(() => {
    if (!pedidoId) return

    // Obtener estado fresco por si ocurrió un cambio antes de montar o en background
    const fetchLatest = async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('estado, tiempo_estimado_min')
        .eq('id', pedidoId)
        .single()
      
      if (data) {
        setOrder((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            status: data.estado,
            tiempoEstimadoMin: data.tiempo_estimado_min ?? prev.tiempoEstimadoMin,
          }
        })
      }
    }

    // Consultar el estado más actual de inmediato y agregar polling por si falla realtime
    fetchLatest()
    const pollingInterval = setInterval(fetchLatest, 5000)

    // Suscribirse a los cambios en background
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchLatest()
      }
    })

    // Suscribirse a cambios en la fila del pedido (Realtime)
    const channel = supabase
      .channel(`pedido:${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          const updated = payload.new as any
          console.log(`[Realtime] Pedido ${pedidoId} actualizado → estado: ${updated.estado}`)

          // Actualiza solo los campos que pueden cambiar, preserva el resto
          setOrder((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              status: updated.estado,
              // Campos opcionales que el backend puede haber actualizado
              tiempoEstimadoMin: updated.tiempo_estimado_min ?? prev.tiempoEstimadoMin,
            }
          })
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Canal pedido:${pedidoId} →`, status)
      })

    channelRef.current = channel

    return () => {
      // Limpiar al desmontar o cambiar pedidoId
      clearInterval(pollingInterval)
      supabase.removeChannel(channel)
      subscription.remove()
    }
  }, [pedidoId])

  return { order, setOrder }
}