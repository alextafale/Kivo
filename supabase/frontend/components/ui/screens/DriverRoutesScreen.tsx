import React, { useRef, useEffect } from 'react'
import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Platform,
    TouchableOpacity,
    Linking,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'
import type { ActiveOrder, Coordinates } from '../../../domain/entities/ActiveOrder'
import { useDriverRoute } from '../../../application/hooks/useDriverRoute'
import { useAuth } from '../../../application/context/AuthContext'

// ─── Colores ────────────────────────────────────────────────────────────────
const KIVO_GREEN = '#2E7D32'
const KIVO_GREEN_LIGHT = '#4CAF50'
const ORANGE = '#F57C00'
const SURFACE = '#FFFFFF'
const BORDER = '#E0E0E0'
const TEXT_PRIMARY = '#1A1A1A'
const TEXT_SECONDARY = '#757575'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
    `$${amount.toFixed(2)}`

const DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 }

// ─── Sub-componentes ─────────────────────────────────────────────────────────

const PhaseHeader = ({ order }: { order: ActiveOrder }) => {
    const isTooBusiness = order.phase === 'to_business'
    return (
        <View style={[styles.phaseHeader, { backgroundColor: isTooBusiness ? KIVO_GREEN : ORANGE }]}>
            <MaterialIcons
                name={isTooBusiness ? 'storefront' : 'home'}
                size={34}
                color="#fff"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.phaseTitle}>
                    {isTooBusiness ? 'Recoger pedido' : 'Entregar al cliente'}
                </Text>
                <Text style={styles.phaseSubtitle}>
                    {isTooBusiness ? order.negocioDireccion : order.direccionEntrega}
                </Text>
            </View>
        </View>
    )
}

const OrderDetails = ({ order }: { order: ActiveOrder }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pedido #{order.orderNumber}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{order.estado.replace('_', ' ')}</Text>
            </View>
        </View>

        <View style={styles.separator} />

        {/* Negocio */}
        <View style={styles.infoRow}>
            <View style={styles.rowLabelGroup}>
                <MaterialIcons name="store" size={18} color={TEXT_SECONDARY} />
                <Text style={styles.infoLabel}> Negocio</Text>
            </View>
            <Text style={styles.infoValue}>{order.negocioNombre}</Text>
        </View>

        {/* Cliente */}
        <View style={styles.infoRow}>
            <View style={styles.rowLabelGroup}>
                <MaterialIcons name="person" size={18} color={TEXT_SECONDARY} />
                <Text style={styles.infoLabel}> Cliente</Text>
            </View>
            <Text style={styles.infoValue}>{order.clienteNombre}</Text>
        </View>

        {/* Tiempo estimado */}
        {order.tiempoEstimadoMin && (
            <View style={styles.infoRow}>
                <View style={styles.rowLabelGroup}>
                    <MaterialIcons name="timer" size={18} color={TEXT_SECONDARY} />
                    <Text style={styles.infoLabel}> Tiempo est.</Text>
                </View>
                <Text style={styles.infoValue}>{order.tiempoEstimadoMin} min</Text>
            </View>
        )}

        <View style={styles.separator} />

        {/* Items */}
        <Text style={styles.sectionTitle}>Productos</Text>
        {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.cantidad}x</Text>
                <Text style={styles.itemName}>{item.nombre}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.subtotal)}</Text>
            </View>
        ))}

        <View style={styles.separator} />

        {/* Totales */}
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subtotal</Text>
            <Text style={styles.infoValue}>{formatCurrency(order.subtotal)}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Envío</Text>
            <Text style={styles.infoValue}>{formatCurrency(order.costoEnvio)}</Text>
        </View>
        <View style={[styles.infoRow, styles.totalRow]}>
            <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
            <TouchableOpacity 
                style={styles.navButtonSmall}
                onPress={() => {
                    const lat = order.phase === 'to_business' ? order.negocioUbicacion.latitude : order.clienteUbicacion?.latitude
                    const lng = order.phase === 'to_business' ? order.negocioUbicacion.longitude : order.clienteUbicacion?.longitude
                    const label = order.phase === 'to_business' ? order.negocioNombre : order.clienteNombre
                    
                    const url = Platform.select({
                        ios: `maps://?daddr=${lat},${lng}&q=${label}`,
                        android: `google.navigation:q=${lat},${lng}`
                    })
                    if (url) Linking.openURL(url)
                }}
            >
                <MaterialIcons name="navigation" size={18} color="#fff" />
                <Text style={styles.navButtonText}>Iniciar GPS</Text>
            </TouchableOpacity>
        </View>
    </View>
)

const RouteMap = ({
    driverLocation,
    destination,
    destinationLabel,
    order,
}: {
    driverLocation: Coordinates | null
    destination: Coordinates | null
    destinationLabel: string
    order: ActiveOrder
}) => {
    const mapRef = useRef<MapView>(null)
    const [routeCoords, setRouteCoords] = React.useState<Coordinates[]>([])

    // Trazar ruta real por calles (Gratis usando OSRM)
    useEffect(() => {
        if (!driverLocation || !destination) return

        const fetchRoute = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${driverLocation.longitude},${driverLocation.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`
                const res = await fetch(url)
                const json = await res.json()
                
                if (json.routes && json.routes[0]) {
                    const coords = json.routes[0].geometry.coordinates.map((c: number[]) => ({
                        latitude: c[1],
                        longitude: c[0]
                    }))
                    setRouteCoords(coords)
                }
            } catch (e) {
                console.error('[RouteMap] Error trazando ruta real:', e)
                // Fallback a línea recta si falla la API
                setRouteCoords([driverLocation, destination])
            }
        }

        fetchRoute()
    }, [driverLocation?.latitude, driverLocation?.longitude, destination?.latitude, destination?.longitude])

    useEffect(() => {
        if (driverLocation && mapRef.current) {
            mapRef.current.animateCamera(
                { center: driverLocation, zoom: 15 },
                { duration: 800 }
            )
        }
    }, [driverLocation?.latitude, driverLocation?.longitude])

    const initialRegion = driverLocation ?? destination ?? order.negocioUbicacion

    return (
        <View style={styles.mapContainer}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{ ...initialRegion, ...DELTA }}
                showsUserLocation={false} 
                showsMyLocationButton={false}
            >

                {/* Marcador del repartidor */}
                {driverLocation && (
                    <Marker
                        coordinate={driverLocation}
                        title="Tu ubicación"
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.driverMarker}>
                            <MaterialCommunityIcons name="bike-fast" size={24} color={KIVO_GREEN} />
                        </View>
                    </Marker>
                )}

                {/* Marcador destino actual */}
                {destination && (
                    <Marker
                        coordinate={destination}
                        title={destinationLabel}
                        pinColor={order.phase === 'to_business' ? KIVO_GREEN : ORANGE}
                    />
                )}

                {/* Marcador negocio (siempre visible como referencia) */}
                {order.phase === 'to_customer' && (
                    <Marker
                        coordinate={order.negocioUbicacion}
                        title={order.negocioNombre}
                        opacity={0.5}
                    />
                )}

                {/* Línea repartidor → destino (Ruta Real) */}
                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeColor={order.phase === 'to_business' ? KIVO_GREEN : ORANGE}
                        strokeWidth={5}
                    />
                )}
            </MapView>
        </View>
    )
}

const ActionButton = ({
    order,
    isUpdating,
    onStartTrip,
    onPickup,
    onDelivered,
}: {
    order: ActiveOrder
    isUpdating: boolean
    onStartTrip: () => void
    onPickup: () => void
    onDelivered: () => void
}) => {
    // 1. Camino al negocio (pero no ha iniciado viaje)
    if (order.phase === 'to_business' && order.estado === 'confirmed') {
        return (
            <Pressable
                style={[styles.actionBtn, { backgroundColor: '#4285F4' }]} 
                onPress={onStartTrip}
                disabled={isUpdating}
            >
                {isUpdating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.btnRow}>
                        <MaterialIcons name="navigation" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}> Iniciar viaje al negocio</Text>
                    </View>
                )}
            </Pressable>
        )
    }

    // 2. En el negocio (alistando)
    if (order.phase === 'to_business' && (order.estado === 'preparing' || order.estado === 'on_the_way')) {
        // Si ya va en camino pero no está listo
        if (order.estado === 'on_the_way') {
             return (
                <View style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}>
                    <View style={styles.btnRow}>
                        <MaterialIcons name="store" size={22} color={TEXT_SECONDARY} />
                        <Text style={[styles.actionBtnText, { color: TEXT_SECONDARY }]}> Llegando al negocio...</Text>
                    </View>
                </View>
            )
        }
        return (
            <View style={[styles.actionBtn, { backgroundColor: '#F3F4F6' }]}>
                <View style={styles.btnRow}>
                    <MaterialIcons name="hourglass-empty" size={20} color={TEXT_SECONDARY} />
                    <Text style={[styles.actionBtnText, { color: TEXT_SECONDARY }]}> El negocio está preparando el pedido...</Text>
                </View>
            </View>
        )
    }

    // 3. Listo para recoger
    if (order.phase === 'to_business' && order.estado === 'ready') {
        return (
            <Pressable
                style={[styles.actionBtn, { backgroundColor: KIVO_GREEN }]}
                onPress={onPickup}
                disabled={isUpdating}
            >
                {isUpdating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.btnRow}>
                        <MaterialIcons name="check-circle" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}> Ya recogí el pedido</Text>
                    </View>
                )}
            </Pressable>
        )
    }

    // 4. Recogido (pero no ha iniciado viaje al cliente)
    if (order.phase === 'to_customer' && order.estado === 'picked_up') {
        return (
            <Pressable
                style={[styles.actionBtn, { backgroundColor: '#4285F4' }]} 
                onPress={onStartTrip}
                disabled={isUpdating}
            >
                {isUpdating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.btnRow}>
                        <MaterialIcons name="navigation" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}> Iniciar viaje al cliente</Text>
                    </View>
                )}
            </Pressable>
        )
    }

    // 5. En camino al cliente o entregando
    if (order.phase === 'to_customer') {
        return (
            <Pressable
                style={[styles.actionBtn, { backgroundColor: ORANGE }]}
                onPress={onDelivered}
                disabled={isUpdating}
            >
                {isUpdating ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <View style={styles.btnRow}>
                        <MaterialIcons name="inventory" size={22} color="#fff" />
                        <Text style={styles.actionBtnText}> Marcar como entregado</Text>
                    </View>
                )}
            </Pressable>
        )
    }

    return null
}

// ─── Screen principal ─────────────────────────────────────────────────────────
export const DriverRoutesScreen = () => {
    const navigation = useNavigation()
    // Ajusta cómo obtienes el repartidorId desde tu contexto de auth
    const { session } = useAuth()
    const repartidorId = session?.userId ?? null

    const {
        order,
        driverLocation,
        isLoading,
        isUpdating,
        error,
        destination,
        confirmPickup,
        confirmOnTheWay,
        confirmDelivered,
    } = useDriverRoute(repartidorId)

    const handleStartTrip = () => {
        confirmOnTheWay()
    }

    const handlePickup = () => {
        Alert.alert(
            'Confirmar recogida',
            '¿Ya recogiste el pedido del negocio?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, ya lo tengo', onPress: confirmPickup },
            ]
        )
    }

    const handleDelivered = () => {
        Alert.alert(
            'Confirmar entrega',
            '¿Entregaste el pedido al cliente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, entregado', onPress: confirmDelivered },
            ]
        )
    }

    // ── Loading ──
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={KIVO_GREEN} />
                <Text style={styles.loadingText}>Cargando pedido...</Text>
            </View>
        )
    }

    // ── Sin pedido activo ──
    if (!order) {
        return (
            <View style={styles.centered}>
                <View style={styles.backHeaderFloating}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnCircle}>
                        <MaterialIcons name="arrow-back" size={24} color={TEXT_PRIMARY} />
                    </TouchableOpacity>
                </View>
                <MaterialCommunityIcons name="bike-fast" size={64} color={BORDER} />
                <Text style={styles.emptyTitle}>Sin pedidos activos</Text>
                <Text style={styles.emptySubtitle}>
                    Cuando te asignen un pedido aparecerá aquí con la ruta
                </Text>
            </View>
        )
    }

    const destinationLabel =
        order.phase === 'to_business' ? order.negocioNombre : order.clienteNombre

    return (
        <View style={styles.root}>
            {/* Header / Back */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={TEXT_PRIMARY} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ruta Actual</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Header de fase */}
                <PhaseHeader order={order} />

                {/* Mapa */}
                <RouteMap
                    driverLocation={driverLocation}
                    destination={destination}
                    destinationLabel={destinationLabel}
                    order={order}
                />

                {/* Detalles del pedido */}
                <OrderDetails order={order} />

                {/* Error */}
                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Botón de acción pegado al fondo */}
            <View style={styles.actionContainer}>
                <ActionButton
                    order={order}
                    isUpdating={isUpdating}
                    onStartTrip={handleStartTrip}
                    onPickup={handlePickup}
                    onDelivered={handleDelivered}
                />
            </View>
        </View>
    )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scroll: {
        paddingBottom: 100,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 12,
        color: TEXT_SECONDARY,
        fontSize: 14,
    },
    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingTop: Platform.OS === 'ios' ? 44 : 12,
        paddingBottom: 12,
        backgroundColor: SURFACE,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backHeaderFloating: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 20,
    },
    backBtnCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: TEXT_PRIMARY,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Phase header
    phaseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    phaseEmoji: {
        fontSize: 32,
    },
    phaseTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    phaseSubtitle: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 14,
        marginTop: 4,
    },

    // Map
    mapContainer: {
        height: 260,
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
    map: {
        flex: 1,
    },
    driverMarker: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    driverMarkerText: {
        fontSize: 22,
    },

    // Card
    card: {
        backgroundColor: SURFACE,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
    badge: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgeText: {
        color: KIVO_GREEN,
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    separator: {
        height: 1,
        backgroundColor: BORDER,
        marginVertical: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: TEXT_SECONDARY,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    rowLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoLabel: {
        fontSize: 13,
        color: TEXT_SECONDARY,
    },
    infoValue: {
        fontSize: 13,
        color: TEXT_PRIMARY,
        fontWeight: '500',
        maxWidth: '60%',
        textAlign: 'right',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    itemQty: {
        fontSize: 13,
        color: KIVO_GREEN,
        fontWeight: '700',
        minWidth: 24,
    },
    itemName: {
        flex: 1,
        fontSize: 13,
        color: TEXT_PRIMARY,
    },
    itemPrice: {
        fontSize: 13,
        color: TEXT_SECONDARY,
    },
    totalRow: {
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: TEXT_PRIMARY,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: KIVO_GREEN,
    },
    navButtonSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4285F4', // Google Maps Blue
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    navButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    // Error
    errorBox: {
        marginHorizontal: 16,
        backgroundColor: '#FFEBEE',
        borderRadius: 10,
        padding: 12,
    },
    errorText: {
        color: '#C62828',
        fontSize: 13,
    },

    // Action button
    actionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        backgroundColor: SURFACE,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        elevation: 10,
    },
    actionBtn: {
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bottomPadding: {
        height: 20,
    },
})