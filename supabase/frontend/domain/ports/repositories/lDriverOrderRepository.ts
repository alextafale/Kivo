import type { ActiveOrder } from '../../entities/ActiveOrder'

export interface IDriverOrderRepository {
    watchAssignedOrder(
        repartidorId: string,
        onOrder: (order: ActiveOrder | null) => void
    ): () => void

    markPickedUp(orderId: string): Promise<void>
    markOnTheWay(orderId: string): Promise<void>
    markDelivered(orderId: string): Promise<void>
}
