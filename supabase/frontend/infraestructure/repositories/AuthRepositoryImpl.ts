import { supabase } from '../../config/supabaseConfig'

import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'

import type { IAuthRepository, BusinessRegisterData, DriverRegisterData, OAuthProvider } from '../../domain/ports/repositories/lAuthRepository'
import type { AuthSession } from '../../domain/entities/User'

WebBrowser.maybeCompleteAuthSession()

export class AuthRepositoryImpl implements IAuthRepository {


  async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    // Construye el redirect URI para Expo Go / builds
    const redirectTo = makeRedirectUri({
      // En producción usa tu scheme: 'pidelo'
      // En Expo Go se genera automáticamente
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Manejamos el browser manualmente
      },
    })

    if (error) throw new Error(error.message)
    if (!data.url) throw new Error('No se recibió URL de autorización')

    // Abre el browser del sistema
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    )

    if (result.type === 'success') {
      // Extraer tokens del callback URL
      const url = new URL(result.url)
      
      // Supabase regresa los tokens en el fragment (#) o como query params
      const params = new URLSearchParams(
        url.hash ? url.hash.substring(1) : url.search.substring(1)
      )

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (sessionError) throw new Error(sessionError.message)
      }
    } else if (result.type === 'cancel') {
      throw new Error('Login cancelado por el usuario')
    }
  }

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