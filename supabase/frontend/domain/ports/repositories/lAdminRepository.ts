import type { Negocio, NegocioPatch, Sucursal, SucursalCreate, SucursalPatch } from '../../entities/Negocio'

// Contrato que la infraestructura debe cumplir para el panel admin
export interface IAdminRepository {
  // Negocio
  getNegocio(negocioId: string): Promise<Negocio>
  patchNegocio(negocioId: string, data: NegocioPatch): Promise<Negocio>

  // Sucursales
  createSucursal(negocioId: string, data: SucursalCreate): Promise<Sucursal>
  patchSucursal(negocioId: string, sucursalId: string, data: SucursalPatch): Promise<Sucursal>

  // Horarios
  getHorarios(negocioId: string, sucursalId: string): Promise<Sucursal['horarios']>
  patchHorarios(negocioId: string, sucursalId: string, horarios: Sucursal['horarios']): Promise<Sucursal>
}