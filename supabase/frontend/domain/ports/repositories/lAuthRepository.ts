import type { AuthSession } from '../../entities/User'

// ─── Tipos de metadata por rol ────────────────────────────────────────────────

export type BusinessRegisterData = {
  nombre:    string
  apellido:  string
  telefono?: string
}

export type DriverRegisterData = {
  nombre:    string
  apellido:  string
  telefono?: string
  vehiculo:  'moto' | 'bici' | 'auto'
  placa?:    string
}
export type OAuthProvider = 'google' | 'twitter' | 'spotify'

export interface IAuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  registerCustomer(email: string, password: string): Promise<AuthSession>
  registerBusiness(email: string, password: string, data: BusinessRegisterData): Promise<AuthSession>
  registerDriver(email: string, password: string, data: DriverRegisterData): Promise<AuthSession>
  logout(): Promise<void>
  getSession(): Promise<AuthSession | null>
  signInWithOAuth(provider: OAuthProvider): Promise<void>
  
  // MFA Methods
  enrollMFA(): Promise<{ factorId: string; qrCode: string; secret: string }>
  verifyMFAEnrollment(factorId: string, code: string): Promise<void>
  challengeAndVerifyMFA(factorId: string, code: string): Promise<void>
}