import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '../../config/supabaseConfig'
import type {
  IRepartidorRepository,
  DriverEstado,
  RepartidorInfo,
  PedidoDisponible,
} from '../../domain/ports/repositories/lRepartidorRepository'

export class RepartidorRepositoryImpl implements IRepartidorRepository {

  async getMyInfo(userId: string): Promise<RepartidorInfo> {
    const { data, error } = await supabase
      .from('repartidores')
      .select('id, estado, vehiculo, calificacion, total_entregas, foto_url')
      .eq('user_id', userId)
      .eq('activo', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('No se encontró el perfil de repartidor activo para este usuario.')
      }
      throw new Error(error.message)
    }

    return data as RepartidorInfo
  }

  async updateEstado(userId: string, nuevoEstado: DriverEstado): Promise<DriverEstado> {
    const { data, error } = await supabase
      .from('repartidores')
      .update({
        estado: nuevoEstado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('activo', true)
      .select('estado')
      .single()

    if (error) throw new Error(error.message)
    return data.estado as DriverEstado
  }

  async tomarPedido(pedidoId: string): Promise<void> {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Sin sesión activa')

    const res = await fetch(`${process.env.API_URL}/repartidores/pedidos/${pedidoId}/tomar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail ?? `Error ${res.status}`)
    }
  }

  async getPedidosDisponibles(): Promise<PedidoDisponible[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        order_number,
        direccion_entrega,
        total,
        costo_envio,
        creado_en,
        negocios!inner(nombre)
      `)
      .eq('estado', 'ready')
      .is('repartidor_id', null)
      .order('creado_en', { ascending: true })

    console.log('Pedidos disponibles:', data)  // ← agregar esto
    console.log('Error:', error)

    if (error) throw new Error(error.message)

    return (data || []).map((p: any) => ({
      id: p.id,
      order_number: p.order_number,
      negocio_nombre: p.negocios?.nombre ?? 'Negocio desconocido',
      direccion_entrega: p.direccion_entrega,
      total: p.total,
      costo_envio: p.costo_envio,
      creado_en: p.creado_en,
    }))
  }

  async register(
    userId: string,
    tipo: string,
    vehiculo: string,
    placa: string | null,
  ): Promise<RepartidorInfo> {
    const { data: { session }, } = await supabase.auth.getSession()

    if (!session) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshed.session) {
        throw new Error('No hay sesión activa. Intenta cerrar sesión e ingresar de nuevo.')
      }
    }

    const { data, error } = await supabase
      .from('repartidores')
      .insert({ user_id: userId, tipo, vehiculo, placa, activo: true, estado: 'available' })
      .select('id, estado, vehiculo, calificacion, total_entregas, foto_url')
      .single()

    if (error) throw new Error(error.message)
    return data as RepartidorInfo
  }

  // ── Foto de perfil ────────────────────────────────────────────────────────

  // Sube la foto al bucket "avatars" en la carpeta drivers/{repartidorId}/
  async uploadFoto(repartidorId: string, localUri: string, mimeType: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: 'base64',
    })

    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Sin sesión activa')
    const path = `drivers/${session.user.id}/avatar.${ext}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes.buffer, { contentType: mimeType, upsert: true })

    if (error) throw new Error(`Error al subir foto: ${error.message}`)

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return `${data.publicUrl}?t=${Date.now()}`
  }

  // Persiste la URL pública en la columna foto_url de la fila del repartidor
  async updateFotoUrl(repartidorId: string, fotoUrl: string): Promise<void> {
    const { error } = await supabase
      .from('repartidores')
      .update({ foto_url: fotoUrl })
      .eq('id', repartidorId)

    if (error) throw new Error(`Error al guardar foto: ${error.message}`)
  }
}