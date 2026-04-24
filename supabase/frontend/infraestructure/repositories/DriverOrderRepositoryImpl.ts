import { supabase } from '../../config/supabaseConfig'
import type { IDriverOrderRepository } from '../../domain/ports/repositories/lDriverOrderRepository'
import type { ActiveOrder, Coordinates, OrderItem } from '../../domain/entities/ActiveOrder'

// Helper: convierte geometry PostGIS "POINT(lng lat)" a Coordinates
function parsePoint(geo: unknown): Coordinates | null {
    if (!geo) return null
    // Supabase retorna geometry como string WKT: "POINT(-101.9 20.3)"
    if (typeof geo === 'string') {
        const match = geo.match(/POINT\(([^ ]+) ([^ )]+)\)/)
        if (match) {
            return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) }
        }
    }
    // A veces viene como objeto {type: 'Point', coordinates: [lng, lat]}
    if (typeof geo === 'object' && geo !== null && 'coordinates' in geo) {
        const coords = (geo as { coordinates: number[] }).coordinates
        return { longitude: coords[0], latitude: coords[1] }
    }
    return null
}

// Mapea la fila completa de Supabase a ActiveOrder
function fromRow(row: Record<string, unknown>): ActiveOrder {
    const sucursal = row.sucursales as Record<string, unknown>
    const negocio = (sucursal?.negocios ?? row.negocios) as Record<string, unknown>
    const profile = row.profiles as Record<string, unknown>
    const items = (row.pedido_items as Record<string, unknown>[]) ?? []

    const negocioUbicacion = parsePoint(sucursal?.ubicacion) ?? { latitude: 0, longitude: 0 }
    const clienteUbicacion = parsePoint(row.direccion_ubicacion)

    const mappedItems: OrderItem[] = items.map((i) => ({
        id: i.id as string,
        nombre: i.nombre as string,
        cantidad: i.cantidad as number,
        precioUnitario: parseFloat(String(i.precio_unitario)),
        subtotal: parseFloat(String(i.subtotal)),
        notas: (i.notas as string) ?? null,
    }))

    // Determinar fase según estado actual
    const estado = row.estado as string
    let phase: ActiveOrder['phase'] = null
    if (['confirmed', 'preparing', 'ready'].includes(estado)) {
        phase = 'to_business'
    } else if (['picked_up', 'on_the_way'].includes(estado)) {
        phase = 'to_customer'
    }

    return {
        id: row.id as string,
        orderNumber: row.order_number as string,
        estado,
        negocioNombre: (negocio?.nombre ?? sucursal?.nombre ?? 'Negocio') as string,
        negocioDireccion: sucursal?.direccion as string ?? '',
        negocioUbicacion,
        clienteNombre: profile 
            ? `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim() || 'Cliente'
            : 'Cliente',
        direccionEntrega: row.direccion_entrega as string,
        clienteUbicacion,
        items: mappedItems,
        subtotal: parseFloat(String(row.subtotal)),
        costoEnvio: parseFloat(String(row.costo_envio ?? 0)),
        total: parseFloat(String(row.total)),
        tiempoEstimadoMin: (row.tiempo_estimado_min as number) ?? null,
        phase,
    }
}

const PEDIDO_SELECT = `
  id,
  order_number,
  estado,
  subtotal,
  costo_envio,
  total,
  tiempo_estimado_min,
  direccion_entrega,
  direccion_ubicacion,
  sucursales (
    id,
    nombre,
    direccion,
    ubicacion,
    negocios ( nombre )
  ),
  profiles!user_id ( nombre, apellido ),
  pedido_items (
    id,
    nombre,
    cantidad,
    precio_unitario,
    subtotal,
    notas
  )
`

export class DriverOrderRepositoryImpl implements IDriverOrderRepository {
    async getRepartidorId(userId: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('repartidores')
            .select('id')
            .eq('user_id', userId)
            .eq('activo', true)
            .maybeSingle()

        if (error || !data) return null
        return data.id
    }

    watchAssignedOrder(
        repartidorId: string,
        onOrder: (order: ActiveOrder | null) => void
    ): () => void {
        // Carga inicial: pedido asignado activo
        supabase
            .from('pedidos')
            .select(PEDIDO_SELECT)
            .eq('repartidor_id', repartidorId)
            .in('estado', ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'])
            .order('creado_en', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    console.error('[DriverOrderRepo] carga inicial error:', error)
                    return
                }
                onOrder(data ? fromRow(data as Record<string, unknown>) : null)
            })

        // Suscripción Realtime: cambios en pedidos asignados al repartidor
        const channel = supabase
            .channel(`driver-order-${repartidorId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pedidos',
                    filter: `repartidor_id=eq.${repartidorId}`,
                },
                async (payload) => {
                    const newEstado = (payload.new as Record<string, unknown>)?.estado as string
                    const activeStates = ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way']

                    if (!activeStates.includes(newEstado)) {
                        // Pedido entregado o cancelado — limpiar
                        onOrder(null)
                        return
                    }

                    // Re-fetch completo para tener joins (sucursal, items, profile)
                    const { data } = await supabase
                        .from('pedidos')
                        .select(PEDIDO_SELECT)
                        .eq('id', (payload.new as Record<string, unknown>).id)
                        .maybeSingle()

                    onOrder(data ? fromRow(data as Record<string, unknown>) : null)
                }
            )
            .subscribe()

        // Cleanup: desuscribir al desmontar
        return () => {
            supabase.removeChannel(channel)
        }
    }

    async markPickedUp(orderId: string): Promise<void> {
        const { error } = await supabase
            .from('pedidos')
            .update({
                estado: 'picked_up',
                recogido_en: new Date().toISOString(),
            })
            .eq('id', orderId)

        if (error) throw new Error(`Error al marcar recogido: ${error.message}`)
    }

    async markOnTheWay(orderId: string): Promise<void> {
        const { error } = await supabase
            .from('pedidos')
            .update({ estado: 'on_the_way' })
            .eq('id', orderId)

        if (error) throw new Error(`Error al marcar en camino: ${error.message}`)
    }

    async markDelivered(orderId: string): Promise<void> {
        const { error } = await supabase
            .from('pedidos')
            .update({
                estado: 'delivered',
                entregado_en: new Date().toISOString(),
            })
            .eq('id', orderId)

        if (error) throw new Error(`Error al marcar entregado: ${error.message}`)
    }
}