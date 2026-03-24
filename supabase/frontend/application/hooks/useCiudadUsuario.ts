import { useState, useEffect } from 'react'
import { DomicilioRepositoryImpl } from '../../infraestructure/repositories/DomicilioRepositoryImpl'

const domicilioRepo = new DomicilioRepositoryImpl()

// Retorna la ciudad del domicilio predeterminado del usuario autenticado.
// No necesita AuthContext — el repo obtiene el userId desde la sesión de Supabase.
export const useCiudadUsuario = () => {
  const [ciudad, setCiudad] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCiudad = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const domicilio = await domicilioRepo.getPredeterminado()
        setCiudad(domicilio?.ciudad ?? null)
      } catch (e: any) {
        console.warn('[useCiudadUsuario] Error:', e.message)
        setError(e.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCiudad()
  }, [])

  return { ciudad, isLoading, error }
}