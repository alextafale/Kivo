import type { User } from '../../entities/User'

// Contrato de perfil — llama al backend FastAPI
export interface IProfileRepository {
  getMe(accessToken: string): Promise<User>
  updateMe(accessToken: string, data: Partial<Pick<User, 'nombre' | 'apellido' | 'telefono' | 'avatar_url'>>): Promise<User>
}