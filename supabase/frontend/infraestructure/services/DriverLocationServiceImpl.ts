import * as Location from 'expo-location'
import { supabase } from '../../config/supabaseConfig'
import type { IDriverLocationService } from '../../domain/ports/services/lDriverLocationService'
import type { Coordinates } from '../../domain/entities/ActiveOrder'

const TRACKING_INTERVAL_MS = 5000 // publicar cada 5 segundos

export class DriverLocationServiceImpl implements IDriverLocationService {
    private subscription: Location.LocationSubscription | null = null
    private publishInterval: ReturnType<typeof setInterval> | null = null
    private lastCoords: Coordinates | null = null

    startTracking(
        repartidorId: string,
        pedidoId: string,
        onLocationUpdate: (coords: Coordinates) => void
    ): () => void {
        this.setupTracking(repartidorId, pedidoId, onLocationUpdate)
        return () => this.stopTracking()
    }

    private async setupTracking(
        repartidorId: string,
        pedidoId: string,
        onLocationUpdate: (coords: Coordinates) => void
    ) {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
            console.warn('[DriverLocation] Permiso de ubicación denegado')
            return
        }

        // Suscripción continua al GPS (alta precisión)
        this.subscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 3000,
                distanceInterval: 10, // metros mínimos para emitir actualización
            },
            (location) => {
                const coords: Coordinates = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                }
                this.lastCoords = coords
                onLocationUpdate(coords)
            }
        )

        // Publicar a Supabase en intervalo separado (no en cada GPS tick)
        this.publishInterval = setInterval(async () => {
            if (!this.lastCoords) return
            const { latitude, longitude } = this.lastCoords

            try {
                const { error } = await supabase.from('repartidor_ubicacion').upsert({
                    repartidor_id: repartidorId,
                    pedido_id: pedidoId,
                    // PostGIS POINT: longitude primero
                    ubicacion: `POINT(${longitude} ${latitude})`,
                    registrado_en: new Date().toISOString(),
                }, { onConflict: 'repartidor_id' })

                if (error) {
                    console.warn('[DriverLocation] Error Supabase (red?):', error.message)
                }
            } catch (e) {
                // Captura error de red (TypeError: Network request failed)
                console.info('[DriverLocation] Fallo conexión temporal')
            }
        }, TRACKING_INTERVAL_MS)
    }

    stopTracking(): void {
        if (this.subscription) {
            this.subscription.remove()
            this.subscription = null
        }
        if (this.publishInterval) {
            clearInterval(this.publishInterval)
            this.publishInterval = null
        }
        this.lastCoords = null
    }
}