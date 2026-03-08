import { supabase } from '../../config/supabaseConfig'
import type { IAuthRepository } from '../../domain/ports/repositories/lAuthRepository'
import type { AuthSession } from '../../domain/entities/User'

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
    // 1. Intentar registrar
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(error.message)

    // 2. Si Supabase devuelve sesión directamente (confirmación desactivada)
    if (data.session) {
      return {
        accessToken: data.session.access_token,
        userId: data.session.user.id,
        email: data.session.user.email ?? '',
      }
    }

    // 3. Si no hay sesión (confirmación de email activa en Supabase),
    //    hacemos login automático para saltarla en desarrollo
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (loginError || !loginData.session) {
      throw new Error('Cuenta creada. Si no puedes entrar, revisa tu correo.')
    }

    return {
      accessToken: loginData.session.access_token,
      userId: loginData.session.user.id,
      email: loginData.session.user.email ?? '',
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