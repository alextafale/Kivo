import { useState, useEffect } from 'react'
import { NegocioRepositoryImpl } from '../../infraestructure/repositories/NegocioRepositoryImpl'
import type { NegocioResumen } from '../../domain/entities/Negocio'

const negocioRepo = new NegocioRepositoryImpl()

// Obtiene los negocios disponibles en una ciudad y categoría dadas
export const useNegociosPorCiudad = (ciudad: string | null, categoria: string) => {
  const [negocios, setNegocios] = useState<NegocioResumen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // No hacer fetch hasta tener la ciudad
    if (!ciudad) return

    const fetchNegocios = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await negocioRepo.getNegociosPorCiudad(ciudad, categoria)
        setNegocios(data)
      } catch (e) {
        console.error('[useNegociosPorCiudad] Error:', e)
        setError('No se pudieron cargar los negocios')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNegocios()
  }, [ciudad, categoria])

  return { negocios, isLoading, error }
}