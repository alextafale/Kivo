import { useState, useEffect, useCallback } from 'react'
import { PedidosRepositoryImpl } from '../../infraestructure/repositories/PedidosRepository'
import { useAuth } from '../context/AuthContext'
import type { Order } from '../../types/order'

const pedidosRepo = new PedidosRepositoryImpl()

export const usePedidos = () => {
  const { session } = useAuth()
  const [pedidos, setPedidos] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPedidos = useCallback(async () => {
    if (!session?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await pedidosRepo.getPedidos(session.accessToken)
      setPedidos(data)
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar pedidos')
    } finally {
      setIsLoading(false)
    }
  }, [session?.accessToken])

  useEffect(() => {
    fetchPedidos()
  }, [fetchPedidos])

  const getPedidoById = async (pedidoId: string) => {
    if (!session?.accessToken) return null
    try {
      return await pedidosRepo.getPedidoById(session.accessToken, pedidoId)
    } catch (e: any) {
      throw new Error(e.message ?? 'Error al obtener pedido')
    }
  }

  return { pedidos, isLoading, error, fetchPedidos, getPedidoById }
}