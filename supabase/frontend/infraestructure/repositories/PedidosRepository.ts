import type { Order } from '../../types/order'

export class PedidosRepositoryImpl {

  async getPedidos(accessToken: string): Promise<Order[]> {
<<<<<<< HEAD
    const res = await fetch(`${API_URL}/pedidos`, {
=======
    console.log("accessToken",accessToken);
    const res = await fetch(`${process.env.API_BASE_URL}/pedidos`, {
>>>>>>> 42c9ecae4a2a3831381bf8c53127f3bc8fccbc53
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
    const res = await fetch(`${process.env.API_BASE_URL}/pedidos/${pedidoId}`, {
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