import type { INegocioRepository } from '../../domain/ports/repositories/lNegocioRepository'
import type { NegocioResumen } from '../../domain/entities/Negocio'


export class NegocioRepositoryImpl implements INegocioRepository {
  async getNegociosPorCiudad(
    ciudad: string,
    categoria: string,
    page: number,
    limit: number
  ): Promise<{ data: NegocioResumen[], total: number }> {
    try {
      const params = new URLSearchParams({
        ciudad,
        categoria,
        page: page.toString(),
        limit: limit.toString()
      });
      
      console.log(`${process.env.API_BASE_URL}/negocios/sucursales?${params}`);
      
      const response = await fetch(`${process.env.API_BASE_URL}/negocios/sucursales?${params}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) return { data: [], total: 0 };

      const json = await response.json();

      if (Array.isArray(json)) {
        return {
          data: json,
          total: json.length 
        };
      }

      return {
        data: json.data || [],
        total: json.total || 0
      };

    } catch (error) {
      console.error('[NegocioRepo] Error de red:', error);
      return { data: [], total: 0 };
    }
  }
}