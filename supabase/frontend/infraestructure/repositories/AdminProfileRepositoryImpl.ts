import { supabase } from '../../config/supabaseConfig'
import type { IAdminProfileRepository } from '../../domain/ports/repositories/lAdminProfileRepository'
import type { AdminProfile } from '../../domain/entities/AdminProfile'
import { API_URL } from '@env'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('No hay sesión activa')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export class AdminProfileRepositoryImpl implements IAdminProfileRepository {
  /**
   * Consulta si el usuario autenticado es admin de algún negocio.
   * Retorna null si no tiene ningún negocio asignado (es cliente/driver).
   */
  async getMyAdminProfile(): Promise<AdminProfile | null> {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_URL}/api/v1/admin/me`, { headers })

      // 403/404 → usuario no es admin, no es error crítico
      if (res.status === 403 || res.status === 404) return null
      if (!res.ok) throw new Error(`Error ${res.status}`)

      return res.json() as Promise<AdminProfile>
    } catch {
      return null
    }
  }
}