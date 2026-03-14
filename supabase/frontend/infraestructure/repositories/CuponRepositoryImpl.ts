import { supabase } from '../../config/supabaseConfig'
import type { ICuponRepository } from '../../domain/ports/repositories/lCuponRepository'
import type { Cupon, CuponCreate, CuponPatch, CuponValidacion } from '../../domain/entities/Cupon'

const TABLE = 'cupones'
const TABLE_USOS = 'cupones_uso'

// ─── Mapeo Supabase (snake_case) ↔ dominio (camelCase) ────────────────────────

function fromRow(row: any): Cupon {
  return {
    id:                  row.id,
    negocioId:           row.negocio_id,
    codigo:              row.codigo,
    descripcion:         row.descripcion         ?? null,
    tipo:                row.tipo,
    valor:               row.valor,
    minimoCompra:        row.minimo_compra        ?? null,
    maximoDescuento:     row.maximo_descuento     ?? null,
    fechaInicio:         row.fecha_inicio,
    fechaFin:            row.fecha_fin,
    usoMaximoTotal:      row.uso_maximo_total     ?? null,
    usoMaximoPorUsuario: row.uso_maximo_por_usuario,
    usosActuales:        row.usos_actuales        ?? 0,
    activo:              row.activo,
    creadoEn:            row.creado_en,
  }
}

function toRow(data: CuponCreate | CuponPatch): Record<string, any> {
  const row: Record<string, any> = {}
  if ('negocioId'           in data && data.negocioId           !== undefined) row.negocio_id              = data.negocioId
  if ('codigo'              in data && data.codigo              !== undefined) row.codigo                  = data.codigo
  if ('descripcion'         in data && data.descripcion         !== undefined) row.descripcion             = data.descripcion         ?? null
  if ('tipo'                in data && data.tipo                !== undefined) row.tipo                    = data.tipo
  if ('valor'               in data && data.valor               !== undefined) row.valor                   = data.valor
  if ('minimoCompra'        in data && data.minimoCompra        !== undefined) row.minimo_compra           = data.minimoCompra        ?? null
  if ('maximoDescuento'     in data && data.maximoDescuento     !== undefined) row.maximo_descuento        = data.maximoDescuento     ?? null
  if ('fechaInicio'         in data && data.fechaInicio         !== undefined) row.fecha_inicio            = data.fechaInicio
  if ('fechaFin'            in data && data.fechaFin            !== undefined) row.fecha_fin               = data.fechaFin
  if ('usoMaximoTotal'      in data && data.usoMaximoTotal      !== undefined) row.uso_maximo_total        = data.usoMaximoTotal      ?? null
  if ('usoMaximoPorUsuario' in data && data.usoMaximoPorUsuario !== undefined) row.uso_maximo_por_usuario  = data.usoMaximoPorUsuario
  if ('activo'              in data && data.activo              !== undefined) row.activo                  = data.activo
  return row
}

// ─── Helper: calcular descuento según tipo ────────────────────────────────────

function calcularDescuento(cupon: Cupon, subtotal: number): number {
  if (cupon.tipo === 'envio_gratis') return 0  // el descuento de envío se aplica aparte
  if (cupon.tipo === 'monto_fijo') return Math.min(cupon.valor, subtotal)
  // porcentaje
  const descuento = subtotal * (cupon.valor / 100)
  return cupon.maximoDescuento ? Math.min(descuento, cupon.maximoDescuento) : descuento
}

// ─── Implementación ───────────────────────────────────────────────────────────

export class CuponRepositoryImpl implements ICuponRepository {

  // Valida un código de cupón contra las reglas de negocio en cliente
  async validarCupon(codigo: string, subtotal: number, negocioId: string): Promise<CuponValidacion> {
    const ahora = new Date().toISOString()

    // Busca el cupón activo y vigente
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('codigo', codigo.toUpperCase())
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .lte('fecha_inicio', ahora)
      .gte('fecha_fin', ahora)
      .single()

    if (error || !data) {
      return { valido: false, cupon: null, descuento: 0, mensajeError: 'Cupón no válido o expirado' }
    }

    const cupon = fromRow(data)

    // Verificar usos totales
    if (cupon.usoMaximoTotal !== null && cupon.usosActuales >= cupon.usoMaximoTotal) {
      return { valido: false, cupon: null, descuento: 0, mensajeError: 'Este cupón ya alcanzó su límite de usos' }
    }

    // Verificar mínimo de compra
    if (cupon.minimoCompra !== null && subtotal < cupon.minimoCompra) {
      return {
        valido: false,
        cupon: null,
        descuento: 0,
        mensajeError: `Mínimo de compra: $${cupon.minimoCompra.toFixed(2)}`,
      }
    }

    // Verificar usos por usuario
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.id) {
      const { count } = await supabase
        .from(TABLE_USOS)
        .select('*', { count: 'exact', head: true })
        .eq('cupon_id', cupon.id)
        .eq('user_id', session.user.id)

      if ((count ?? 0) >= cupon.usoMaximoPorUsuario) {
        return { valido: false, cupon: null, descuento: 0, mensajeError: 'Ya usaste este cupón' }
      }
    }

    const descuento = calcularDescuento(cupon, subtotal)

    return { valido: true, cupon, descuento, mensajeError: null }
  }

  // Obtiene todos los cupones del negocio (admin)
  async getCupones(negocioId: string): Promise<Cupon[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('negocio_id', negocioId)
      .order('creado_en', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map(fromRow)
  }

  // Crea un nuevo cupón (admin)
  async createCupon(data: CuponCreate): Promise<Cupon> {
    const { data: created, error } = await supabase
      .from(TABLE)
      .insert(toRow(data))
      .select('*')
      .single()

    if (error || !created) throw new Error(error?.message ?? 'Error al crear cupón')
    return fromRow(created)
  }

  // Actualiza un cupón existente (admin)
  async updateCupon(cuponId: string, data: CuponPatch): Promise<Cupon> {
    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(toRow(data))
      .eq('id', cuponId)
      .select('*')
      .single()

    if (error || !updated) throw new Error(error?.message ?? 'Error al actualizar cupón')
    return fromRow(updated)
  }

  // Soft delete — desactiva el cupón en vez de borrarlo
  async deleteCupon(cuponId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ activo: false })
      .eq('id', cuponId)

    if (error) throw new Error(error?.message ?? 'Error al eliminar cupón')
  }
}