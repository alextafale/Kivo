import type { Coordinates } from '../../entities/ActiveOrder'

// Puerto: contrato para publicar y obtener ubicación en tiempo real
export interface IDriverLocationService {
  // Inicia el tracking GPS y publica a Supabase en intervalo
  startTracking(
    repartidorId: string,
    pedidoId: string,
    onLocationUpdate: (coords: Coordinates) => void
  ): () => void // retorna función de cleanup (detiene tracking)

  // Detiene el tracking
  stopTracking(): void
}