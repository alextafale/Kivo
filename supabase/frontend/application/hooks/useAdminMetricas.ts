import { useState, useEffect, useCallback } from 'react'
import { AdminRepositoryImpl } from '../../infraestructure/repositories/AdminRepositoryImpl'
import type { MetricasNegocio } from '../../domain/entities/Negocio'

const adminRepo = new AdminRepositoryImpl()

export function useAdminMetricas(negocioId: string) {
  const [metricas, setMetricas]   = useState<MetricasNegocio | null>(null)
  const [isLoading, setLoading]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const fetchMetricas = useCallback(async () => {
    if (!negocioId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminRepo.getMetricas(negocioId)
      setMetricas(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar métricas')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => { fetchMetricas() }, [fetchMetricas])

  return { metricas, isLoading, error, refetch: fetchMetricas }
}