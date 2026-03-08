import type { AdminProfile } from '../../entities/AdminProfile'

export type { AdminProfile }

// Contrato para obtener qué negocio(s) administra el usuario autenticado
export interface IAdminProfileRepository {
  getMyAdminProfile(): Promise<AdminProfile | null>
}