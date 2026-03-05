import { useState, useEffect, useCallback } from 'react'
import { ProfileRepositoryImpl } from '../../infraestructure/repositories/ProfileRepositoryImpl'
import { useAuth } from '../context/AuthContext'
import type { User } from '../../domain/entities/User'

const profileRepo = new ProfileRepositoryImpl()

export const useProfile = () => {
  const { session } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carga el perfil del backend
  const fetchProfile = useCallback(async () => {
    if (!session?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await profileRepo.getMe(session.accessToken)
      setProfile(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar perfil')
    } finally {
      setIsLoading(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Actualiza nombre, teléfono o avatar vía PATCH /me
  const updateProfile = async (
    data: Partial<Pick<User, 'nombre' | 'apellido' | 'telefono' | 'avatar_url'>>
  ) => {
    if (!session?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const updated = await profileRepo.updateMe(session.accessToken, data)
      setProfile(updated)
    } catch (e: any) {
      setError(e.message ?? 'Error al actualizar perfil')
      throw e  // para que la pantalla pueda mostrar el Alert
    } finally {
      setIsLoading(false)
    }
  }

  return { profile, isLoading, error, fetchProfile, updateProfile }
}