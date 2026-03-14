import type { Cupon, CuponCreate, CuponPatch, CuponValidacion } from '../../entities/Cupon'

// Contrato del repositorio de cupones
// No recibe accessToken — Supabase lo maneja internamente via RLS
export interface ICuponRepository {
  // Cliente: valida un código antes de confirmar el pedido
  validarCupon(codigo: string, subtotal: number, negocioId: string): Promise<CuponValidacion>

  // Admin: obtiene todos los cupones del negocio
  getCupones(negocioId: string): Promise<Cupon[]>

  // Admin: crea un nuevo cupón
  createCupon(data: CuponCreate): Promise<Cupon>

  // Admin: actualiza un cupón existente
  updateCupon(cuponId: string, data: CuponPatch): Promise<Cupon>

  // Admin: elimina (desactiva) un cupón
  deleteCupon(cuponId: string): Promise<void>
}