import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import { AuthRepositoryImpl } from '../../infraestructure/repositories/AuthRepositoryImpl'
import { AdminProfileRepositoryImpl } from '../../infraestructure/repositories/AdminProfileRepositoryImpl'
import type { AuthSession } from '../../domain/entities/User'
import type { AdminProfile } from '../../domain/ports/repositories/lAdminProfileRepository'

const authRepo         = new AuthRepositoryImpl()
const adminProfileRepo = new AdminProfileRepositoryImpl()

const SESSION_KEY = 'pidelo_session'

type AuthContextType = {
  session: AuthSession | null
  isLoading: boolean
  adminAccess: AdminProfile | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshAdminAccess: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session,     setSession]     = useState<AuthSession | null>(null)
  const [adminAccess, setAdminAccess] = useState<AdminProfile | null>(null)
  const [isLoading,   setIsLoading]   = useState(true)

  const loadAdminAccess = useCallback(async () => {
    try {
      const access = await adminProfileRepo.getMyAdminProfile()
      setAdminAccess(access)
    } catch {
      setAdminAccess(null)
    }
  }, [])

  // Llamado por BusinessOnboarding tras crear el negocio
  const refreshAdminAccess = useCallback(async () => {
    await loadAdminAccess()
  }, [loadAdminAccess])

  useEffect(() => {
    const restore = async () => {
      try {
        const activeSession = await authRepo.getSession()
        if (activeSession) {
          setSession(activeSession)
          await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(activeSession))
          await loadAdminAccess()
        } else {
          const stored = await SecureStore.getItemAsync(SESSION_KEY)
          if (stored) {
            const parsed: AuthSession = JSON.parse(stored)
            setSession(parsed)
            await loadAdminAccess()
          }
        }
      } catch {
        // Sin sesión válida
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [loadAdminAccess])

  const login = async (email: string, password: string) => {
    const newSession = await authRepo.login(email, password)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
    await loadAdminAccess()
  }

  const register = async (email: string, password: string) => {
    const newSession = await authRepo.register(email, password)
    setSession(newSession)
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(newSession))
    setAdminAccess(null) // nuevo usuario aún sin negocio
  }

  const logout = async () => {
    await authRepo.logout()
    setSession(null)
    setAdminAccess(null)
    await SecureStore.deleteItemAsync(SESSION_KEY)
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, adminAccess, login, register, logout, refreshAdminAccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}