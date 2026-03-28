import { supabase } from '../../config/supabaseConfig'

import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import * as QueryParams from 'expo-auth-session/build/QueryParams'

import type { IAuthRepository, BusinessRegisterData, DriverRegisterData, OAuthProvider } from '../../domain/ports/repositories/lAuthRepository'
import type { AuthSession } from '../../domain/entities/User'

WebBrowser.maybeCompleteAuthSession()

export class AuthRepositoryImpl implements IAuthRepository {


  async signInWithOAuth(provider: OAuthProvider): Promise<void> {
    const redirectTo = Linking.createURL('')

    console.log('\n\n--- OAUTH DEBUG URIs ---')
    console.log('Redirect URI:', redirectTo)
    console.log('------------------------\n\n')

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Manejamos el browser manualmente
      },
    })

    if (error) throw new Error(error.message)
    if (!data.url) throw new Error('No se recibió URL de autorización')

    console.log('Supabase Login URL Generada:', data.url)

    // Abre el browser del sistema
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    )

    console.log('WebBrowser Result:', result)

    if (result.type === 'success') {
      // Usar QueryParams de expo-auth-session para parsear el deep link
      // porque URL() nativo en RN falla extrayendo fragments de esquemas custom
      const { params, errorCode } = QueryParams.getQueryParams(result.url)

      if (errorCode) throw new Error(errorCode)

      const access_token = params?.access_token
      const refresh_token = params?.refresh_token

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: access_token,
          refresh_token: refresh_token,
        })
        if (sessionError) throw new Error(sessionError.message)
      } else {
         console.warn("OAuth success but no access_token parsed from:", result.url);
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

    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalError) throw new Error(aalError.message)
    
    return {
      accessToken: data.session.access_token,
      userId:      data.session.user.id,
      email:       data.session.user.email ?? '',
      role:        data.session.user.user_metadata?.role ?? '',
      requiresMfa: aalData.nextLevel === 'aal2' && aalData.currentLevel === 'aal1',
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

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

    return {
      accessToken: data.session.access_token,
      userId:      data.session.user.id,
      email:       data.session.user.email ?? '',
      role:        data.session.user.user_metadata?.role ?? '',
      requiresMfa: aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1',
    }
  }
  
  // ─── MFA ──────────────────────────────────────────────────────────────────

  async enrollMFA(): Promise<{ factorId: string; qrCode: string; secret: string }> {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) throw new Error(error.message)
    return {
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    }
  }

  async verifyMFAEnrollment(factorId: string, code: string): Promise<void> {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) throw new Error(challengeError.message)

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    if (verifyError) throw new Error(verifyError.message)
  }

  async challengeAndVerifyMFA(factorId: string, code: string): Promise<void> {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError) throw new Error(challengeError.message)

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })
    if (verifyError) throw new Error(verifyError.message)
  }
}