import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { AuthRepositoryImpl } from '../../infraestructure/repositories/AuthRepositoryImpl'
import type { AuthSession } from '../../domain/entities/User'

// Instancia única del repositorio
const authRepo = new AuthRepositoryImpl()

const SESSION_KEY = 'pidelo_session'

type AuthContextType = {
  session: AuthSession | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)  // true al arrancar para revisar sesión guardada

  // Al montar: restaurar sesión guardada en SecureStore
  useEffect(() => {
    const restore = async () => {
      try {
        // Primero intenta con Supabase (token activo)
        const activeSession = await authRepo.getSession()
        if (activeSession) {
          setSession(activeSession)
          await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(activeSession))
        } else {
          // Fallback: SecureStore local
          const stored = await SecureStore.getItemAsync(SESSION_KEY)
          if (stored) setSession(JSON.parse(stored))
        }
      } catch {
        // Sin sesión válida — usuario debe iniciar sesión
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const login = async (email: string, password: string) => {
    const newSession = await authRepo.login(email, password)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
  }

  const register = async (email: string, password: string) => {
    const newSession = await authRepo.register(email, password)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
  }

  const logout = async () => {
    await authRepo.logout()
    setSession(null)
    await SecureStore.deleteItemAsync(SESSION_KEY)
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}