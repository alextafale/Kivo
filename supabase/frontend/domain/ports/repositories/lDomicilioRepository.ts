import type { Domicilio, DomicilioCreate, DomicilioUpdate } from '../../entities/Domicilio'

export interface IDomicilioRepository {
  getAll(): Promise<Domicilio[]>
  getById(id: string): Promise<Domicilio>
  getPredeterminado(): Promise<Domicilio | null>  // lee userId internamente desde la sesión
  create(data: DomicilioCreate): Promise<Domicilio>
  update(id: string, data: DomicilioUpdate): Promise<Domicilio>
  setDefault(id: string): Promise<Domicilio>
  delete(id: string): Promise<void>
}