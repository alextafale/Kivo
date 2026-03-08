import { useState, useEffect, useCallback } from 'react'
import { AdminRepositoryImpl } from '../../infraestructure/repositories/AdminRepositoryImpl'
import type { Negocio, NegocioPatch } from '../../domain/entities/Negocio'

const adminRepo = new AdminRepositoryImpl()

export function useAdminNegocio(negocioId: string) {
  const [negocio, setNegocio]   = useState<Negocio | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [isSaving, setSaving]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Carga inicial del negocio
  const fetchNegocio = useCallback(async () => {
    if (!negocioId) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminRepo.getNegocio(negocioId)
      setNegocio(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar el negocio')
    } finally {
      setLoading(false)
    }
  }, [negocioId])

  useEffect(() => { fetchNegocio() }, [fetchNegocio])

  // Actualiza campos del negocio
  const updateNegocio = useCallback(async (patch: NegocioPatch): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      const updated = await adminRepo.patchNegocio(negocioId, patch)
      setNegocio(updated)
      return true
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar el negocio')
      return false
    } finally {
      setSaving(false)
    }
  }, [negocioId])

  return { negocio, isLoading, isSaving, error, updateNegocio, refetch: fetchNegocio }
}