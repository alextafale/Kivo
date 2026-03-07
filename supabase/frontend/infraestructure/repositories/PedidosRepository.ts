import type { Order } from '../../types/order'
import { API_URL } from '@env'

export class PedidosRepositoryImpl {

  async getPedidos(accessToken: string): Promise<Order[]> {
    const res = await fetch(`${API_URL}/api/v1/pedidos`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? 'Error al obtener pedidos')
    }
    return res.json()
  }

  async getPedidoById(accessToken: string, pedidoId: string): Promise<Order> {
    const res = await fetch(`${API_URL}/api/v1/pedidos/${pedidoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? 'Error al obtener pedido')
    }
    return res.json()
  }
}