import { supabase } from '../../config/supabaseConfig'
import type { IAuthRepository, BusinessRegisterData, DriverRegisterData } from '../../domain/ports/lNegocioRepository.ts/lAuthRepository'
import type { AuthSession } from '../../domain/entities/User'

export class AuthRepositoryImpl implements IAuthRepository {

  // ─── Login ────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
    if (!data.session) throw new Error('No se obtuvo sesión')

    return {
      accessToken: data.session.access_token,
      userId:      data.session.user.id,
      email:       data.session.user.email ?? '',
      role:        data.session.user.user_metadata?.role ?? '',
    }
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  /**
   * Lógica común de signUp: intenta registrar y si Supabase no devuelve
   * sesión (confirmación de email activa), hace login automático.
   */
private async signUp(
  email:    string,
  password: string,
  metadata: Record<string, unknown>,
): Promise<AuthSession> {
  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
  if (error) throw new Error(error.message)

  // Supabase devuelve sesión directamente si confirmación está desactivada
  if (signUpData.session) {
    // ✅ Hidratar explícitamente la sesión en el cliente de Supabase
    await supabase.auth.setSession({
      access_token:  signUpData.session.access_token,
      refresh_token: signUpData.session.refresh_token,
    })
    return {
      accessToken: signUpData.session.access_token,
      userId:      signUpData.session.user.id,
      email:       signUpData.session.user.email ?? '',
      role:        signUpData.session.user.user_metadata?.role ?? '',
    }
  }

  // Fallback: login automático para desarrollo (confirmación activa)
  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({ email, password })

  if (loginError || !loginData.session) {
    throw new Error('Cuenta creada. Si no puedes entrar, revisa tu correo.')
  }

  // ✅ El signInWithPassword ya hidrata la sesión internamente, no hace falta setSession
  return {
    accessToken: loginData.session.access_token,
    userId:      loginData.session.user.id,
    email:       loginData.session.user.email ?? '',
    role:        loginData.session.user.user_metadata?.role ?? '',
  }
}

  // ─── Registros por rol ────────────────────────────────────────────────────

  async registerCustomer(email: string, password: string): Promise<AuthSession> {
    return this.signUp(email, password, {
      role: 'customer',
    })
  }

  async registerBusiness(
    email:    string,
    password: string,
    data:     BusinessRegisterData,
  ): Promise<AuthSession> {
    return this.signUp(email, password, {
      role:     'business_admin',
      nombre:   data.nombre,
      apellido: data.apellido,
      telefono: data.telefono ?? null,
    })
  }

  async registerDriver(
    email:    string,
    password: string,
    data:     DriverRegisterData,
  ): Promise<AuthSession> {
    return this.signUp(email, password, {
      role:     'driver',
      nombre:   data.nombre,
      apellido: data.apellido,
      telefono: data.telefono ?? null,
      vehiculo: data.vehiculo,
      placa:    data.placa ?? null,
    })
  }

  // ─── Sesión ───────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async getSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null

    return {
      accessToken: data.session.access_token,
      userId:      data.session.user.id,
      email:       data.session.user.email ?? '',
      role:        data.session.user.user_metadata?.role ?? '',
    }
  }
}