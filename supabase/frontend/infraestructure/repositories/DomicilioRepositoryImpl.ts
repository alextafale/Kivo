// infraestructure/repositories/DomicilioRepositoryImpl.ts
// Usa Supabase directo — sin FastAPI

import { supabase } from '../../config/supabaseConfig'
import type { IDomicilioRepository } from '../../domain/ports/repositories/lDomicilioRepository'
import type { Domicilio, DomicilioCreate, DomicilioUpdate } from '../../domain/entities/Domicilio'

const TABLE = 'domicilios'

// ─── Mapeo Supabase (snake_case) ↔ dominio (camelCase) ────────────────────────

function fromRow(row: any): Domicilio {
  let coordenadas = null
  if (row.ubicacion) {
    try {
      // PostGIS devuelve WKT: "POINT(-102.02 20.33)"
      const match = row.ubicacion.match(/POINT\(([^ ]+) ([^ )]+)\)/)
      if (match) {
        coordenadas = {
          longitud: parseFloat(match[1]),
          latitud:  parseFloat(match[2]),
        }
      }
    } catch {}
  }

  return {
    id:               row.id,
    userId:           row.user_id,
    etiqueta:         row.etiqueta          ?? 'Casa',
    calle:            row.calle,
    numeroExt:        row.numero_ext        ?? null,
    numeroInt:        row.numero_int        ?? null,
    colonia:          row.colonia           ?? null,
    ciudad:           row.ciudad            ?? null,
    estado:           row.estado            ?? null,
    pais:             row.pais              ?? 'MX',
    codigoPostal:     row.codigo_postal     ?? null,
    referencias:      row.referencias       ?? null,
    coordenadas,
    esPredeterminado: row.es_predeterminado ?? false,
    activo:           row.activo            ?? true,
    creadoEn:         row.creado_en,
    actualizadoEn:    row.actualizado_en,
  }
}

function toRow(data: DomicilioCreate | DomicilioUpdate): Record<string, any> {
  const row: Record<string, any> = {}
  if (data.etiqueta         !== undefined) row.etiqueta          = data.etiqueta
  if (data.calle            !== undefined) row.calle             = data.calle
  if (data.numeroExt        !== undefined) row.numero_ext        = data.numeroExt    || null
  if (data.numeroInt        !== undefined) row.numero_int        = data.numeroInt    || null
  if (data.colonia          !== undefined) row.colonia           = data.colonia      || null
  if (data.ciudad           !== undefined) row.ciudad            = data.ciudad       || null
  if (data.estado           !== undefined) row.estado            = data.estado       || null
  if (data.pais             !== undefined) row.pais              = data.pais         || 'MX'
  if (data.codigoPostal     !== undefined) row.codigo_postal     = data.codigoPostal || null
  if (data.referencias      !== undefined) row.referencias       = data.referencias  || null
  if (data.esPredeterminado !== undefined) row.es_predeterminado = data.esPredeterminado
  if (data.coordenadas !== undefined) {
    row.ubicacion = data.coordenadas
      ? `POINT(${data.coordenadas.longitud} ${data.coordenadas.latitud})`
      : null
  }
  return row
}

// ─── Helper: obtener user_id desde la sesión local ────────────────────────────
// getSession() lee de SecureStore sin llamada de red — nunca lanza "No hay sesión"
// si el usuario ya pasó por el login.

async function getUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user?.id) return session.user.id
  // Fallback: refrescar sesión si el token local expiró
  const { data: { session: refreshed } } = await supabase.auth.refreshSession()
  if (refreshed?.user?.id) return refreshed.user.id
  throw new Error('Sesión expirada. Por favor vuelve a iniciar sesión.')
}

// ─── Implementación ───────────────────────────────────────────────────────────

export class DomicilioRepositoryImpl implements IDomicilioRepository {

  async getAll(): Promise<Domicilio[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('activo', true)
      .order('es_predeterminado', { ascending: false })
      .order('creado_en', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []).map(fromRow)
  }

  async getById(id: string): Promise<Domicilio> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single()

    if (error) throw new Error(error.message)
    return fromRow(data)
  }

  async create(data: DomicilioCreate): Promise<Domicilio> {
    const userId = await getUserId()
    const row    = { ...toRow(data), user_id: userId }

    const { data: created, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return fromRow(created)
  }

  async update(id: string, data: DomicilioUpdate): Promise<Domicilio> {
    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(toRow(data))
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return fromRow(updated)
  }

  async setDefault(id: string): Promise<Domicilio> {
    // El trigger trg_single_default_address en Supabase desactiva el anterior
    const { data: updated, error } = await supabase
      .from(TABLE)
      .update({ es_predeterminado: true })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    return fromRow(updated)
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
      .from(TABLE)
      .update({ activo: false, es_predeterminado: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }
}