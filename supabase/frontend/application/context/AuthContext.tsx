import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { AuthRepositoryImpl } from '../../infraestructure/repositories/AuthRepositoryImpl'
import { AdminProfileRepositoryImpl } from '../../infraestructure/repositories/AdminProfileRepositoryImpl'
import type { AuthSession } from '../../domain/entities/User'
import type { AdminProfile } from '../../domain/ports/repositories/lAdminProfileRepository'
import type { BusinessRegisterData, DriverRegisterData, OAuthProvider } from '../../domain/ports/repositories/lAuthRepository'

const authRepo         = new AuthRepositoryImpl()
const adminProfileRepo = new AdminProfileRepositoryImpl()

const SESSION_KEY = 'pidelo_session'

type AuthContextType = {
  session:            AuthSession | null
  isLoading:          boolean
  adminAccess:        AdminProfile | null
  login:              (email: string, password: string) => Promise<void>
  registerCustomer:   (email: string, password: string) => Promise<void>
  registerBusiness:   (email: string, password: string, data: BusinessRegisterData) => Promise<void>
  registerDriver:     (email: string, password: string, data: DriverRegisterData) => Promise<void>
  logout:             () => Promise<void>
  refreshAdminAccess: () => Promise<void>
  signInWithOAuth:    (provider: OAuthProvider) => Promise<void>
}

// Agregar signInWithOAuth al contexto
const signInWithOAuth = async (provider: OAuthProvider) => {
  await authRepo.signInWithOAuth(provider)
  // El listener onAuthStateChange en tu contexto detectará la sesión automáticamente
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session,     setSession]     = useState<AuthSession | null>(null)
  const [adminAccess, setAdminAccess] = useState<AdminProfile | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  // Solo carga adminAccess si el rol es business_admin.
  // Evita el error PGRST116 para clientes y repartidores.
  const loadAdminAccess = useCallback(async (role?: string) => {
    if (role !== 'business_admin') {
      setAdminAccess(null)
      return
    }
    try {
      const access = await adminProfileRepo.getMyAdminProfile()
      setAdminAccess(access)
    } catch {
      setAdminAccess(null)
    }
  }, [])

  // refreshAdminAccess se llama desde BusinessOnboarding, siempre es business_admin
  const refreshAdminAccess = useCallback(async () => {
    await loadAdminAccess('business_admin')
  }, [loadAdminAccess])

  // Restaurar sesión al arrancar la app
  useEffect(() => {
const restore = async () => {
  try {
    const activeSession = await authRepo.getSession()
    if (activeSession) {
      setSession(activeSession)
      await loadAdminAccess(activeSession.role)
    }
  } catch {
    // sin sesión válida
  } finally {
    setIsLoading(false)
  }
}
    restore()
  }, [loadAdminAccess])

  // ─── Login ────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const newSession = await authRepo.login(email, password)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
    await loadAdminAccess(newSession.role)
  }

  // ─── Registros ────────────────────────────────────────────────────────────

  const registerCustomer = async (email: string, password: string) => {
    const newSession = await authRepo.registerCustomer(email, password)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
    setAdminAccess(null)
  }

  const registerBusiness = async (
    email:    string,
    password: string,
    data:     BusinessRegisterData,
  ) => {
    const newSession = await authRepo.registerBusiness(email, password, data)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
    setAdminAccess(null)
  }

  const registerDriver = async (
    email:    string,
    password: string,
    data:     DriverRegisterData,
  ) => {
    const newSession = await authRepo.registerDriver(email, password, data)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
    setAdminAccess(null)
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  const logout = async () => {
    await authRepo.logout()
    setSession(null)
    setAdminAccess(null)
    await SecureStore.deleteItemAsync(SESSION_KEY)
  }

  const signInWithOAuth = async (provider: OAuthProvider) => {
    await authRepo.signInWithOAuth(provider)
    // Nota: El manejo de la sesión se hace mediante eventos o manualmente
    // en AuthRepositoryImpl, por lo que aquí no actualizamos setSession
    // directamente a menos que el flujo lo requiera.
    // Sin embargo, para mayor robustez, podemos intentar restaurar sesión post-oauth:
    const activeSession = await authRepo.getSession()
    if (activeSession) {
      setSession(activeSession)
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(activeSession))
      await loadAdminAccess(activeSession.role)
    }
  }

  return (
    <AuthContext.Provider value={{
      session,
      isLoading,
      adminAccess,
      login,
      registerCustomer,
      registerBusiness,
      registerDriver,
      logout,
      refreshAdminAccess,
      signInWithOAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}