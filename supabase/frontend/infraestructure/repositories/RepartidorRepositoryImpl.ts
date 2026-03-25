import { supabase } from '../../config/supabaseConfig'
import type { IRepartidorRepository, DriverEstado, RepartidorInfo, PedidoDisponible } from '../../domain/ports/repositories/lRepartidorRepository'

export class RepartidorRepositoryImpl implements IRepartidorRepository {
  
  async getMyInfo(userId: string): Promise<RepartidorInfo> {
    const { data, error } = await supabase
      .from('repartidores')
      .select('id, estado, vehiculo, calificacion, total_entregas')
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
        actualizado_en: new Date().toISOString() 
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
    // Equivalent to SQL:
    // SELECT p.id, p.order_number, n.nombre as negocio_nombre, p.direccion_entrega, p.total, p.costo_envio, p.creado_en
    // FROM pedidos p JOIN negocios n ON n.id = p.negocio_id
    // WHERE p.estado = 'ready' AND p.repartidor_id IS NULL ORDER BY p.creado_en ASC

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

    if (error) throw new Error(error.message)

    // Map the nested result to match the expected type
    return (data || []).map((p: any) => ({
      id: p.id,
      order_number: p.order_number,
      negocio_nombre: p.negocios?.nombre ?? 'Negocio desconocido',
      direccion_entrega: p.direccion_entrega,
      total: p.total,
      costo_envio: p.costo_envio,
      creado_en: p.creado_en
    }))
  }
async register(userId: string, tipo: string, vehiculo: string, placa: string | null): Promise<RepartidorInfo> {
  // Refrescar la sesión explícitamente antes del insert
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  console.log('[register] session?.user?.id:', session?.user?.id)
  console.log('[register] userId param:', userId)

  if (!session) {
    // Intentar refrescar el token
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed.session) {
      throw new Error('No hay sesión activa. Intenta cerrar sesión e ingresar de nuevo.')
    }
  }

  const { data, error } = await supabase
    .from('repartidores')
    .insert({
      user_id: userId,
      tipo,
      vehiculo,
      placa,
      activo: true,
      estado: 'available',
    })
    .select('id, estado, vehiculo, calificacion, total_entregas')
    .single()

  if (error) {
    console.log('[register] error completo:', JSON.stringify(error))
    throw new Error(error.message)
  }

  return data as RepartidorInfo
}
}

