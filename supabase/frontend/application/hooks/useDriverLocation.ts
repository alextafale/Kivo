import { useEffect, useRef, useCallback } from 'react'
import * as Location from 'expo-location'

const API_URL = process.env.EXPO_PUBLIC_API_URL

/**
 * useDriverLocation — Hook para tracking GPS del repartidor
 *
 * ¿Qué hace?
 * Pide permisos de GPS, obtiene la ubicación cada 10 segundos
 * y la manda al backend con POST /repartidores/ubicacion.
 *
 * ¿Cómo funciona?
 * - Se activa solo cuando isActive es true (repartidor en estado busy)
 * - Se detiene automáticamente cuando isActive cambia a false
 * - Usa un intervalo que se limpia al desmontar para evitar memory leaks
 */
export function useDriverLocation({
  isActive,
  accessToken,
  pedidoId,
}: {
  isActive: boolean
  accessToken: string | null
  pedidoId?: string | null
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sendLocation = useCallback(async () => {
    if (!accessToken) return

    try {
      // Obtener ubicación actual con alta precisión
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const { latitude, longitude, heading, speed } = location.coords

      await fetch(`${API_URL}/repartidores/ubicacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
          pedido_id: pedidoId ?? null,
          rumbo: heading ?? null,
          velocidad_kmh: speed ? speed * 3.6 : null, // m/s → km/h
        }),
      })
    } catch (e) {
      console.warn('Error enviando ubicación:', e)
    }
  }, [accessToken, pedidoId])

  useEffect(() => {
    if (!isActive) {
      // Limpiar intervalo si el repartidor no está activo
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Pedir permisos de GPS
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.warn('Permiso de ubicación denegado')
        return
      }

      // Enviar ubicación inmediatamente al activarse
      await sendLocation()

      // Luego cada 10 segundos
      intervalRef.current = setInterval(sendLocation, 10_000)
    }

    start()

    // Cleanup — limpiar intervalo al desmontar o cuando isActive cambia
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isActive, sendLocation])
}