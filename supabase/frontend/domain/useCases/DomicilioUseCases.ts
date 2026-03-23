// domain/usecases/DomicilioUseCases.ts

import type { IDomicilioRepository } from '../ports/lNegocioRepository.ts/lDomicilioRepository'
import type { Domicilio, DomicilioCreate, DomicilioUpdate, Coordenadas } from '../entities/Domicilio'

// ── Listar ────────────────────────────────────────────────────────────────────

export class GetDomiciliosUseCase {
  constructor(private readonly repo: IDomicilioRepository) {}
  async execute(): Promise<Domicilio[]> {
    return this.repo.getAll()
  }
}

// ── Crear ─────────────────────────────────────────────────────────────────────

export class CreateDomicilioUseCase {
  constructor(private readonly repo: IDomicilioRepository) {}

  async execute(data: DomicilioCreate): Promise<Domicilio> {
    if (!data.calle?.trim()) throw new Error('La calle es obligatoria.')
    if (data.coordenadas) this.validarCoordenadas(data.coordenadas)
    return this.repo.create(data)
  }

  private validarCoordenadas({ latitud, longitud }: Coordenadas) {
    if (latitud < -90 || latitud > 90)    throw new Error('Latitud inválida.')
    if (longitud < -180 || longitud > 180) throw new Error('Longitud inválida.')
  }
}

// ── Actualizar ────────────────────────────────────────────────────────────────

export class UpdateDomicilioUseCase {
  constructor(private readonly repo: IDomicilioRepository) {}
  async execute(id: string, data: DomicilioUpdate): Promise<Domicilio> {
    if (!id) throw new Error('ID requerido.')
    return this.repo.update(id, data)
  }
}

// ── Predeterminado ────────────────────────────────────────────────────────────

export class SetDefaultDomicilioUseCase {
  constructor(private readonly repo: IDomicilioRepository) {}
  async execute(id: string): Promise<Domicilio> {
    if (!id) throw new Error('ID requerido.')
    return this.repo.setDefault(id)
  }
}

// ── Eliminar ──────────────────────────────────────────────────────────────────

export class DeleteDomicilioUseCase {
  constructor(private readonly repo: IDomicilioRepository) {}
  async execute(id: string): Promise<void> {
    if (!id) throw new Error('ID requerido.')
    return this.repo.delete(id)
  }
}