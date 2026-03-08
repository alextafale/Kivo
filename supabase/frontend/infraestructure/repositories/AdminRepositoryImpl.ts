import { supabase } from '../../config/supabaseConfig'
import type { IAdminRepository } from '../../domain/ports/repositories/lAdminRepository'
import type { Negocio, NegocioPatch, Sucursal, SucursalCreate, SucursalPatch } from '../../domain/entities/Negocio'
import { API_URL } from '@env'

// Obtiene el JWT activo de Supabase para enviarlo al backend FastAPI
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('No hay sesión activa')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export class AdminRepositoryImpl implements IAdminRepository {

  // ── Negocio ────────────────────────────────────────────────────────────────

  async getNegocio(negocioId: string): Promise<Negocio> {
    return apiFetch<Negocio>(`/api/v1/admin/negocios/${negocioId}`)
  }

  async patchNegocio(negocioId: string, data: NegocioPatch): Promise<Negocio> {
    return apiFetch<Negocio>(`/api/v1/admin/negocios/${negocioId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ── Sucursales ─────────────────────────────────────────────────────────────

  async createSucursal(negocioId: string, data: SucursalCreate): Promise<Sucursal> {
    return apiFetch<Sucursal>(`/api/v1/admin/negocios/${negocioId}/sucursales`, {
      method: 'POST',
      body: JSON.stringify({ ...data, negocio_id: negocioId }),
    })
  }

  async patchSucursal(negocioId: string, sucursalId: string, data: SucursalPatch): Promise<Sucursal> {
    return apiFetch<Sucursal>(`/api/v1/admin/negocios/${negocioId}/sucursales/${sucursalId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // ── Horarios ───────────────────────────────────────────────────────────────

  async getHorarios(negocioId: string, sucursalId: string): Promise<Sucursal['horarios']> {
    const res = await apiFetch<{ sucursal_id: string; horarios: Sucursal['horarios'] }>(
      `/api/v1/admin/negocios/${negocioId}/sucursales/${sucursalId}/horarios`
    )
    return res.horarios
  }

  async patchHorarios(negocioId: string, sucursalId: string, horarios: Sucursal['horarios']): Promise<Sucursal> {
    return apiFetch<Sucursal>(
      `/api/v1/admin/negocios/${negocioId}/sucursales/${sucursalId}/horarios`,
      {
        method: 'PATCH',
        body: JSON.stringify({ horarios }),
      }
    )
  }
}