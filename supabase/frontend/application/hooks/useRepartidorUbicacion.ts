// application/hooks/useRepartidorUbicacion.ts
// Obtiene la ubicación del repartidor via el backend y se actualiza
// cada 5 segundos usando polling mientras el pedido está en camino.

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../config/supabaseConfig'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export interface UbicacionRepartidor {
  lat: number
  lng: number
  rumbo: number | null
  velocidad_kmh: number | null
  registrado_en: string
}

/**
 * Obtiene la ubicación del repartidor cada 5 segundos.
 *
 * ¿Por qué polling en lugar de Realtime?
 * La tabla repartidor_ubicacion usa el tipo geography de PostGIS
 * que Supabase Realtime no puede deserializar directamente.
 * El backend ya hace la conversión con ST_X/ST_Y y devuelve lat/lng.
 */
export const useRepartidorUbicacion = (pedidoId: string | null) => {
  const [ubicacion, setUbicacion] = useState<UbicacionRepartidor | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pedidoId) {
      setUbicacion(null)
      return
    }

    const fetchUbicacion = async () => {
      try {
        // Obtener el token de la sesión activa
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const res = await fetch(
          `${process.env.API_BASE_URL}/repartidores/pedidos/${pedidoId}/ubicacion`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        )

        if (!res.ok) return

        const data = await res.json()
        setUbicacion({
          lat: data.lat,
          lng: data.lng,
          rumbo: data.rumbo ?? null,
          velocidad_kmh: data.velocidad_kmh ?? null,
          registrado_en: data.registrado_en,
        })
      } catch (e) {
        console.warn('Error obteniendo ubicación:', e)
      }
    }

    // Obtener inmediatamente
    fetchUbicacion()

    // Luego cada 5 segundos
    intervalRef.current = setInterval(fetchUbicacion, 5_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [pedidoId])

  return { ubicacion }
}