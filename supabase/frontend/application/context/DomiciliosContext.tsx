// application/context/DomiciliosContext.tsx
// Supabase directo + caché para no recargar al regresar a la pantalla

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { DomicilioRepositoryImpl } from '../../infraestructure/repositories/DomicilioRepositoryImpl'
import {
  GetDomiciliosUseCase,
  CreateDomicilioUseCase,
  UpdateDomicilioUseCase,
  SetDefaultDomicilioUseCase,
  DeleteDomicilioUseCase,
} from '../../domain/useCases/DomicilioUseCases'
import type { Domicilio, DomicilioCreate, DomicilioUpdate } from '../../domain/entities/Domicilio'

const repo = new DomicilioRepositoryImpl()

type DomiciliosContextType = {
  domicilios:       Domicilio[]
  isLoading:        boolean
  error:            string | null
  fetchDomicilios:  (force?: boolean) => Promise<void>
  createDomicilio:  (data: DomicilioCreate)             => Promise<Domicilio>
  updateDomicilio:  (id: string, data: DomicilioUpdate) => Promise<Domicilio>
  setDefault:       (id: string)                        => Promise<void>
  deleteDomicilio:  (id: string)                        => Promise<void>
  defaultDomicilio: Domicilio | null
  clearError:       () => void
}

const DomiciliosContext = createContext<DomiciliosContextType | null>(null)

export const DomiciliosProvider = ({ children }: { children: ReactNode }) => {
  const [domicilios, setDomicilios] = useState<Domicilio[]>([])
  const [isLoading,  setIsLoading]  = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Caché: si ya cargamos una vez, no volvemos a llamar a Supabase
  // a menos que se llame fetchDomicilios(true) explícitamente (pull-to-refresh)
  const loaded = useRef(false)

  const handleError = (e: unknown) => {
    setError(e instanceof Error ? e.message : 'Error inesperado.')
  }

  // force=true lo usa el RefreshControl del pull-to-refresh
  const fetchDomicilios = useCallback(async (force = false) => {
    if (loaded.current && !force) return   // ← ya tenemos datos, no recargues
    setIsLoading(true)
    setError(null)
    try {
      const data = await new GetDomiciliosUseCase(repo).execute()
      setDomicilios(data)
      loaded.current = true
    } catch (e) {
      handleError(e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createDomicilio = useCallback(async (data: DomicilioCreate): Promise<Domicilio> => {
    setIsLoading(true)
    setError(null)
    try {
      const nuevo = await new CreateDomicilioUseCase(repo).execute(data)
      // Actualizar state local sin re-fetch
      setDomicilios(prev => {
        const lista = nuevo.esPredeterminado
          ? prev.map(d => ({ ...d, esPredeterminado: false }))
          : [...prev]
        return [...lista, nuevo]
      })
      return nuevo
    } catch (e) {
      handleError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateDomicilio = useCallback(async (id: string, data: DomicilioUpdate): Promise<Domicilio> => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await new UpdateDomicilioUseCase(repo).execute(id, data)
      setDomicilios(prev => prev.map(d => d.id === id ? updated : d))
      return updated
    } catch (e) {
      handleError(e)
      throw e
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setDefault = useCallback(async (id: string) => {
    // Optimistic update: actualizar UI inmediatamente sin esperar a Supabase
    setDomicilios(prev => prev.map(d => ({ ...d, esPredeterminado: d.id === id })))
    setError(null)
    try {
      await new SetDefaultDomicilioUseCase(repo).execute(id)
    } catch (e) {
      // Revertir si falla
      handleError(e)
      fetchDomicilios(true)
    }
  }, [fetchDomicilios])

  const deleteDomicilio = useCallback(async (id: string) => {
    // Optimistic update: quitar de la lista inmediatamente
    setDomicilios(prev => prev.filter(d => d.id !== id))
    setError(null)
    try {
      await new DeleteDomicilioUseCase(repo).execute(id)
    } catch (e) {
      // Revertir si falla
      handleError(e)
      fetchDomicilios(true)
    }
  }, [fetchDomicilios])

  const defaultDomicilio = domicilios.find(d => d.esPredeterminado) ?? null

  return (
    <DomiciliosContext.Provider value={{
      domicilios, isLoading, error,
      fetchDomicilios, createDomicilio, updateDomicilio,
      setDefault, deleteDomicilio,
      defaultDomicilio,
      clearError: () => setError(null),
    }}>
      {children}
    </DomiciliosContext.Provider>
  )
}

export const useDomicilios = (): DomiciliosContextType => {
  const ctx = useContext(DomiciliosContext)
  if (!ctx) throw new Error('useDomicilios debe usarse dentro de DomiciliosProvider')
  return ctx
}