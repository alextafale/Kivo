// application/hooks/useOrderRealtime.ts
// Suscribe al canal de Supabase Realtime para un pedido específico.
// Cuando el backend cambia el estado, este hook lo refleja inmediatamente.

import { useState, useEffect, useRef } from 'react'
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

    // Suscribirse a cambios en la fila del pedido
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
      supabase.removeChannel(channel)
    }
  }, [pedidoId])

  return { order, setOrder }
}