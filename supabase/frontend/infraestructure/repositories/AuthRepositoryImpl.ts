import { supabase } from '../../config/supabaseConfig'
import type { IAuthRepository } from '../../domain/ports/repositories/lAuthRepository'
import type { AuthSession } from '../../domain/entities/User'

// Implementación concreta — usa Supabase Auth
export class AuthRepositoryImpl implements IAuthRepository {

  async login(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('No se obtuvo sesión')

    return {
      accessToken: data.session.access_token,
      userId: data.session.user.id,
      email: data.session.user.email ?? '',
    }
  }

  async register(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Revisa tu correo para confirmar el registro')

    return {
      accessToken: data.session.access_token,
      userId: data.session.user.id,
      email: data.session.user.email ?? '',
    }
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async getSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null

    return {
      accessToken: data.session.access_token,
      userId: data.session.user.id,
      email: data.session.user.email ?? '',
    }
  }
}