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
    const { data, error } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', negocioId)
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Negocio no encontrado')
    return data as Negocio
  }

  async patchNegocio(negocioId: string, data: NegocioPatch): Promise<Negocio> {
    const { data: updated, error } = await supabase
      .from('negocios')
      .update(data)
      .eq('id', negocioId)
      .select('*')
      .single()
    if (error || !updated) throw new Error(error?.message ?? 'Error al actualizar negocio')
    return updated as Negocio
  }

  // ── Sucursales ─────────────────────────────────────────────────────────────

  async createSucursal(negocioId: string, data: SucursalCreate): Promise<Sucursal> {
    const { data: nueva, error } = await supabase
      .from('sucursales')
      .insert({ ...data, negocio_id: negocioId })
      .select('*')
      .single()
    if (error || !nueva) throw new Error(error?.message ?? 'Error al crear sucursal')
    return nueva as Sucursal
  }
  async getSucursal(negocioId: string, sucursalId: string): Promise<Sucursal> {
  const { data, error } = await supabase
    .from('sucursales')
    .select('*')
    .eq('id', sucursalId)
    .eq('negocio_id', negocioId)
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Sucursal no encontrada')
  return data as Sucursal
}
  async patchSucursal(negocioId: string, sucursalId: string, data: SucursalPatch): Promise<Sucursal> {
    const { data: updated, error } = await supabase
      .from('sucursales')
      .update(data)
      .eq('id', sucursalId)
      .eq('negocio_id', negocioId)
      .select('*')
      .single()
    if (error || !updated) throw new Error(error?.message ?? 'Error al actualizar sucursal')
    return updated as Sucursal
  }

  // ── Horarios ───────────────────────────────────────────────────────────────

  async getHorarios(negocioId: string, sucursalId: string): Promise<Sucursal['horarios']> {
    const { data, error } = await supabase
      .from('sucursales')
      .select('horarios')
      .eq('id', sucursalId)
      .eq('negocio_id', negocioId)
      .single()
    if (error) throw new Error(error.message)
    // En Supabase JSONB puede retornar null si no hay horarios
    return (data?.horarios as Sucursal['horarios']) ?? []
  }

  async patchHorarios(negocioId: string, sucursalId: string, horarios: Sucursal['horarios']): Promise<Sucursal> {
    const { data: updated, error } = await supabase
      .from('sucursales')
      .update({ horarios })
      .eq('id', sucursalId)
      .eq('negocio_id', negocioId)
      .select('*')
      .single()
    if (error || !updated) throw new Error(error?.message ?? 'Error al actualizar horarios')
    return updated as Sucursal
  }
}