import type { NegocioResumen } from '../../entities/Negocio'

// Contrato para obtener negocios disponibles por ciudad
export interface INegocioRepository {
  getNegociosPorCiudad(ciudad: string, categoria: string): Promise<NegocioResumen[]>
}