// domain/ports/repositories/IDomicilioRepository.ts

import type { Domicilio, DomicilioCreate, DomicilioUpdate } from '../../entities/Domicilio'

export interface IDomicilioRepository {
  getAll():                                      Promise<Domicilio[]>
  getById(id: string):                           Promise<Domicilio>
  create(data: DomicilioCreate):                 Promise<Domicilio>
  update(id: string, data: DomicilioUpdate):     Promise<Domicilio>
  setDefault(id: string):                        Promise<Domicilio>
  delete(id: string):                            Promise<void>
}