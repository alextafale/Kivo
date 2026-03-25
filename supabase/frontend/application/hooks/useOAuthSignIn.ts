// application/hooks/useOAuthSignIn.ts
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { OAuthProvider } from '../../domain/ports/repositories/lAuthRepository'

export const useOAuthSignIn = () => {
  const { signInWithOAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoading(true)
    setError(null)
    try {
      await signInWithOAuth(provider)
    } catch (e: any) {
      if (e.message !== 'Login cancelado por el usuario') {
        setError(e.message ?? 'Error al autenticar')
      }
    } finally {
      setLoading(false)
    }
  }

  return { handleOAuthSignIn, loading, error }
}