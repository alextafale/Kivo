import type { IProfileRepository } from '../../domain/ports/lNegocioRepository.ts/lProfileRepository'
import type { User } from '../../domain/entities/User'
import { API_URL } from '@env'

// Implementación concreta — llama a FastAPI /api/v1/me
export class ProfileRepositoryImpl implements IProfileRepository {

  async getMe(accessToken: string): Promise<User> {
    const res = await fetch(`${API_URL}/api/v1/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? 'Error al obtener perfil')
    }
    return res.json()
  }

  async updateMe(
    accessToken: string,
    data: Partial<Pick<User, 'nombre' | 'apellido' | 'telefono' | 'avatar_url'>>
  ): Promise<User> {
    const res = await fetch(`${API_URL}/api/v1/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? 'Error al actualizar perfil')
    }
    return res.json()
  }
}