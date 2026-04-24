import { useState, useEffect, useCallback, useRef } from 'react'
import type { ActiveOrder, Coordinates } from '../../domain/entities/ActiveOrder'
import { DriverOrderRepositoryImpl } from '../../infraestructure/repositories/DriverOrderRepositoryImpl'
import { DriverLocationServiceImpl } from '../../infraestructure/services/DriverLocationServiceImpl'

const orderRepo = new DriverOrderRepositoryImpl()
const locationService = new DriverLocationServiceImpl()

type UseDriverRouteReturn = {
    order: ActiveOrder | null
    driverLocation: Coordinates | null
    isLoading: boolean
    isUpdating: boolean
    error: string | null
    destination: Coordinates | null
    confirmPickup: () => Promise<void>
    confirmOnTheWay: () => Promise<void>
    confirmDelivered: () => Promise<void>
}

export const useDriverRoute = (userId: string | null): UseDriverRouteReturn => {
    const [order, setOrder] = useState<ActiveOrder | null>(null)
    const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [repartidorId, setRepartidorId] = useState<string | null>(null)

    const stopTrackingRef = useRef<(() => void) | null>(null)

    // 0. Resolver repartidorId (UUID interno) a partir del userId de Auth
    useEffect(() => {
        if (!userId) return
        orderRepo.getRepartidorId(userId).then(id => {
            if (id) setRepartidorId(id)
            else setIsLoading(false)
        })
    }, [userId])

    // Suscripción Realtime al pedido asignado
    useEffect(() => {
        if (!repartidorId) {
            return
        }

        setIsLoading(true)
        const unsubscribe = orderRepo.watchAssignedOrder(repartidorId, (newOrder) => {
            setOrder(newOrder)
            setIsLoading(false)
        })

        return unsubscribe
    }, [repartidorId])

    // Iniciar/detener tracking GPS cuando hay pedido activo
    useEffect(() => {
        if (stopTrackingRef.current) {
            stopTrackingRef.current()
            stopTrackingRef.current = null
        }

        if (!order || !repartidorId || order.phase === null) {
            return
        }

        const stopTracking = locationService.startTracking(
            repartidorId,
            order.id,
            (coords) => setDriverLocation(coords)
        )
        stopTrackingRef.current = stopTracking

        return () => {
            stopTracking()
            stopTrackingRef.current = null
        }
    }, [order?.id, order?.phase, repartidorId])

    const destination: Coordinates | null = order
        ? order.phase === 'to_business'
            ? order.negocioUbicacion
            : order.phase === 'to_customer'
                ? order.clienteUbicacion
                : null
        : null

    const confirmPickup = useCallback(async () => {
        if (!order) return
        setIsUpdating(true)
        setError(null)
        try {
            await orderRepo.markPickedUp(order.id)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al confirmar recogida')
        } finally {
            setIsUpdating(false)
        }
    }, [order])

    const confirmOnTheWay = useCallback(async () => {
        if (!order) return
        setIsUpdating(true)
        setError(null)
        try {
            await orderRepo.markOnTheWay(order.id)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al iniciar viaje')
        } finally {
            setIsUpdating(false)
        }
    }, [order])

    const confirmDelivered = useCallback(async () => {
        if (!order) return
        setIsUpdating(true)
        setError(null)
        try {
            await orderRepo.markDelivered(order.id)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al confirmar entrega')
        } finally {
            setIsUpdating(false)
        }
    }, [order])

    return {
        order,
        driverLocation,
        isLoading,
        isUpdating,
        error,
        destination,
        confirmPickup,
        confirmOnTheWay,
        confirmDelivered,
    }
}
