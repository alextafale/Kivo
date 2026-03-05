import type { AuthSession } from '../../entities/User'

// Contrato de autenticación — la infraestructura lo implementa
export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  register(email: string, password: string): Promise<AuthSession>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
}