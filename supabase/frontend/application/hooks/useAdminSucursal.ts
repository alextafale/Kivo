import { useState, useEffect, useCallback } from 'react'
import { AdminRepositoryImpl } from '../../infraestructure/repositories/AdminRepositoryImpl'
import type { Sucursal, SucursalCreate, SucursalPatch } from '../../domain/entities/Negocio'

const adminRepo = new AdminRepositoryImpl()

export function useAdminSucursal(negocioId: string, sucursalId?: string) {
  const [sucursal, setSucursal] = useState<Sucursal | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [isSaving, setSaving]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Carga los horarios de la sucursal activa
  const fetchHorarios = useCallback(async () => {
    if (!negocioId || !sucursalId) return
    setLoading(true)
    setError(null)
    try {
      const horarios = await adminRepo.getHorarios(negocioId, sucursalId)
      setSucursal(prev => prev ? { ...prev, horarios } : null)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar horarios')
    } finally {
      setLoading(false)
    }
  }, [negocioId, sucursalId])

  useEffect(() => { if (sucursalId) fetchHorarios() }, [fetchHorarios])

  // Crea una nueva sucursal
  const createSucursal = useCallback(async (data: SucursalCreate): Promise<Sucursal | null> => {
    setSaving(true)
    setError(null)
    try {
      const nueva = await adminRepo.createSucursal(negocioId, data)
      setSucursal(nueva)
      return nueva
    } catch (e: any) {
      setError(e.message ?? 'Error al crear sucursal')
      return null
    } finally {
      setSaving(false)
    }
  }, [negocioId])

  // Actualiza campos de la sucursal (incluye horarios si se pasan)
  const updateSucursal = useCallback(async (patch: SucursalPatch): Promise<boolean> => {
    if (!sucursalId) return false
    setSaving(true)
    setError(null)
    try {
      const updated = await adminRepo.patchSucursal(negocioId, sucursalId, patch)
      setSucursal(updated)
      return true
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar sucursal')
      return false
    } finally {
      setSaving(false)
    }
  }, [negocioId, sucursalId])

  // Reemplaza solo los horarios
  const updateHorarios = useCallback(async (horarios: Sucursal['horarios']): Promise<boolean> => {
    if (!sucursalId) return false
    setSaving(true)
    setError(null)
    try {
      const updated = await adminRepo.patchHorarios(negocioId, sucursalId, horarios)
      setSucursal(updated)
      return true
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar horarios')
      return false
    } finally {
      setSaving(false)
    }
  }, [negocioId, sucursalId])

  return {
    sucursal,
    isLoading,
    isSaving,
    error,
    createSucursal,
    updateSucursal,
    updateHorarios,
    refetchHorarios: fetchHorarios,
  }
}