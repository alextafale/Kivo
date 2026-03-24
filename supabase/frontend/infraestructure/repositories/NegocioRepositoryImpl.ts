import type { INegocioRepository } from '../../domain/ports/repositories/lNegocioRepository'
import type { NegocioResumen } from '../../domain/entities/Negocio'

const BASE_URL = 'https://kivo-v1.onrender.com/api/v1'

// Implementación concreta — consume el endpoint FastAPI
export class NegocioRepositoryImpl implements INegocioRepository {

  // Obtiene los negocios que tienen sucursal en la ciudad dada
  async getNegociosPorCiudad(ciudad: string, categoria: string): Promise<NegocioResumen[]> {
    try {
      const params = new URLSearchParams({ ciudad, categoria })
      const response = await fetch(`${BASE_URL}/negocios/sucursales?${params}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        console.warn('[NegocioRepo] Error HTTP:', response.status)
        return []
      }

      const data = await response.json()
      return data as NegocioResumen[]
    } catch (error) {
      console.error('[NegocioRepo] Error de red:', error)
      return []
    }
  }
}