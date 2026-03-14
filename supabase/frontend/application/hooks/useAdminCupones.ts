import { useState, useEffect, useCallback } from 'react'
import { CuponRepositoryImpl } from '../../infraestructure/repositories/CuponRepositoryImpl'
import type { Cupon, CuponCreate, CuponPatch } from '../../domain/entities/Cupon'

const cuponRepo = new CuponRepositoryImpl()

// Hook para gestión de cupones desde el panel admin
export const useAdminCupones = (negocioId: string) => {
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCupones = useCallback(async () => {
    if (!negocioId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await cuponRepo.getCupones(negocioId)
      setCupones(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar cupones')
    } finally {
      setIsLoading(false)
    }
  }, [negocioId])

  useEffect(() => {
    fetchCupones()
  }, [fetchCupones])

  const createCupon = useCallback(async (data: CuponCreate): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    try {
      const nuevo = await cuponRepo.createCupon(data)
      setCupones(prev => [nuevo, ...prev])
      return true
    } catch (e: any) {
      setError(e.message ?? 'Error al crear cupón')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  const updateCupon = useCallback(async (cuponId: string, data: CuponPatch): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    try {
      const actualizado = await cuponRepo.updateCupon(cuponId, data)
      setCupones(prev => prev.map(c => c.id === cuponId ? actualizado : c))
      return true
    } catch (e: any) {
      setError(e.message ?? 'Error al actualizar cupón')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  const deleteCupon = useCallback(async (cuponId: string): Promise<boolean> => {
    setError(null)
    try {
      await cuponRepo.deleteCupon(cuponId)
      setCupones(prev => prev.filter(c => c.id !== cuponId))
      return true
    } catch (e: any) {
      setError(e.message ?? 'Error al eliminar cupón')
      return false
    }
  }, [])

  const toggleActivo = useCallback(async (cuponId: string, activo: boolean): Promise<boolean> => {
    return updateCupon(cuponId, { activo })
  }, [updateCupon])

  return {
    cupones,
    isLoading,
    isSaving,
    error,
    fetchCupones,
    createCupon,
    updateCupon,
    deleteCupon,
    toggleActivo,
  }
}