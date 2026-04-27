import type { ActiveOrder } from '../../entities/ActiveOrder'

// Puerto: contrato que la infraestructura debe implementar
export interface IDriverOrderRepository {
    // Suscripción Realtime: llama al callback cuando se asigna/cambia un pedido
    watchAssignedOrder(
        repartidorId: string,
        onOrder: (order: ActiveOrder | null) => void
    ): () => void // retorna función de cleanup (unsubscribe)

    // Marcar como recogido (picked_up)
    markPickedUp(orderId: string): Promise<void>

    // Marcar como en camino (on_the_way)
    markOnTheWay(orderId: string): Promise<void>

    // Marcar como entregado (delivered)
    markDelivered(orderId: string): Promise<void>
}