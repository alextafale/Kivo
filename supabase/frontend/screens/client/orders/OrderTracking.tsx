import React, { useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useOrderRealtime } from '../../../application/hooks/useOrderRealTime'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useRepartidorUbicacion } from '../../../application/hooks/useRepartidorUbicacion'
import { useTheme } from '../../../application/context/ThemeContext'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'

const { width } = Dimensions.get('window')

type Props = NativeStackScreenProps<RootStackParamList, 'orderTracking'>

type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'on_the_way' | 'pending_confirmation' | 'delivered'

interface Step {
  key: OrderStatus
  label: string
  sublabel: string
  icon: string
  iconLib: 'material' | 'community'
}

const STEPS: Step[] = [
  { key: 'confirmed', label: 'Pedido confirmado', sublabel: 'El restaurante aceptó tu orden', icon: 'check-circle', iconLib: 'community' },
  { key: 'preparing', label: 'Preparando', sublabel: 'El restaurante está cocinando', icon: 'chef-hat', iconLib: 'community' },
  { key: 'ready', label: 'Listo para recoger', sublabel: 'Esperando al repartidor', icon: 'package-variant', iconLib: 'community' },
  { key: 'picked_up', label: 'Recogido', sublabel: 'El repartidor tiene tu pedido', icon: 'shopping', iconLib: 'community' },
  { key: 'on_the_way', label: 'En camino', sublabel: 'Tu repartidor va en camino', icon: 'moped', iconLib: 'material' },
  { key: 'pending_confirmation', label: 'Pendiente de confirmación', sublabel: 'Confirma que recibiste tu pedido', icon: 'alert-circle', iconLib: 'community' },
  { key: 'delivered', label: '¡Entregado!', sublabel: '¡Que lo disfrutes!', icon: 'celebration', iconLib: 'material' },
]

const STATUS_ORDER: OrderStatus[] = ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way', 'pending_confirmation', 'delivered']

// Mapeo de estados del backend a los pasos del timeline
const ESTADO_A_STEP: Record<string, OrderStatus> = {
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  picked_up: 'picked_up',
  on_the_way: 'on_the_way',
  pending_confirmation: 'pending_confirmation',
  delivered: 'delivered',
}

export default function OrderTrackingScreen({ route, navigation }: Props) {
  console.log("Estas en order taracking screen");
  const { colors, isDark } = useTheme();
  const { order: initialOrder } = route.params

  // Suscripción Realtime — actualiza cuando el negocio cambia el estado
  const { order } = useOrderRealtime(initialOrder.id, initialOrder)
  const { ubicacion } = useRepartidorUbicacion(order?.status === 'on_the_way' || order?.status === 'picked_up' ? initialOrder.id : null)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  // Mapear el estado del backend al step del timeline
  const currentStatus: OrderStatus =
    ESTADO_A_STEP[order?.status ?? 'confirmed'] ?? 'confirmed'
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)

  // Animación de pulso en el step activo
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Animar la barra de progreso cuando avanza el estado
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentIndex / (STEPS.length - 1),
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [currentIndex])

  const prevStatusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!order?.status) return

    console.log('Estado del pedido:', prevStatusRef.current, '->', order.status)

    if (order.status === 'pending_confirmation' && prevStatusRef.current !== 'pending_confirmation') {
      console.log('Navegando a OrderDelivered...')
      // Un pequeño retraso para permitir que la barra llegue al final
      setTimeout(() => {
        navigation.replace('OrderDelivered', {
          id: initialOrder.id ?? '',
          orderNumber: initialOrder.orderNumber ?? '',
          restaurantName: initialOrder.restaurantName ?? '',
          total: initialOrder.total ?? 0,
          deliveryAddress: initialOrder.deliveryAddress ?? '',
          statusOrder: order.status
        })
      }, 500)
    }

    prevStatusRef.current = order.status
  }, [order?.status, initialOrder, navigation])
  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  useEffect(() => {
    console.log("Ubicación recibida en pantalla:", ubicacion);
  }, [ubicacion]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.pageBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.pageBg }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.backBtnBg }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backArrow, { color: colors.titleText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.titleText }]}>Rastreo de Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Número de pedido */}
        <View style={styles.orderNumberBanner}>
          <Text style={[styles.orderNumberLabel, { color: colors.subtitleText }]}>Pedido</Text>
          <Text style={[styles.orderNumberValue, { color: colors.titleText }]}>{order?.orderNumber ?? initialOrder.orderNumber}</Text>
        </View>

        {/* ETA Banner */}
        <View style={[styles.etaBanner, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
          <View style={styles.etaLeft}>
            <Text style={[styles.etaLabel, { color: colors.subtitleText }]}>Estado actual</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {STEPS[currentIndex]?.iconLib === 'material'
                ? <MaterialIcons name={STEPS[currentIndex]?.icon as any} size={22} color={isDark ? '#4ade80' : '#22c55e'} />
                : <MaterialCommunityIcons name={STEPS[currentIndex]?.icon as any} size={22} color={isDark ? '#4ade80' : '#22c55e'} />}
              <Text style={[styles.etaStep, { color: colors.titleText }]}>{STEPS[currentIndex]?.label}</Text>
            </View>
            <Text style={[styles.etaSub, { color: colors.subtitleText }]}>{STEPS[currentIndex]?.sublabel}</Text>
          </View>
          <View style={[styles.etaDivider, { backgroundColor: colors.border }]} />
          <View style={styles.etaRight}>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? '#22c55e30' : '#E8FFF0' }]}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusBadgeText, isDark && { color: '#4ade80' }]}>En vivo</Text>
            </View>
          </View>
        </View>

        {/* Mapa en vivo */}
        {order?.status === 'pending_confirmation' ? (
          <View style={styles.mapPlaceholder}>
            <Text>Tu pedido ha sido entregado</Text>
          </View>
        ) : ubicacion ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={{
            latitude: ubicacion.lat,
            longitude: ubicacion.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker
            coordinate={{ latitude: ubicacion.lat, longitude: ubicacion.lng }}
            title="Tu repartidor"
            description={ubicacion.velocidad_kmh ? `${ubicacion.velocidad_kmh.toFixed(0)} km/h` : ''}
          >
            <View style={styles.markerContainer}>
              <MaterialIcons name="moped" size={32} color="#22c55e" />
            </View>
          </Marker>
        </MapView>
        ) : (
        <View style={[styles.mapPlaceholder, { backgroundColor: isDark ? colors.cardBg : '#E4EDE0' }]}>
          <MaterialCommunityIcons name="map-marker-path" size={40} color={isDark ? '#4ade80' : '#3A5C30'} />
          <Text style={[styles.mapText, isDark && { color: '#4ade80' }]}>
            {order?.status === 'on_the_way' || order?.status === 'picked_up'
              ? 'Esperando ubicación del repartidor...'
              : 'El mapa aparecerá cuando el repartidor esté en camino'}
          </Text>
        </View>
        )}

        {/* Timeline de estados */}
        <View style={styles.timelineSection}>
          <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Progreso del pedido</Text>

          <View style={styles.timeline}>
            <View style={[styles.trackBg, { backgroundColor: colors.border }]} />
            <Animated.View style={[styles.trackFill, { height: progressHeight }]} />

            {STEPS.map((step, index) => {
              const isDone = index < currentIndex
              const isActive = index === currentIndex
              const isPending = index > currentIndex

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    {isActive ? (
                      <Animated.View style={[styles.stepCircle, styles.stepCircleActive, { transform: [{ scale: pulseAnim }] }]}>
                        {step.iconLib === 'material'
                          ? <MaterialIcons name={step.icon as any} size={18} color="#fff" />
                          : <MaterialCommunityIcons name={step.icon as any} size={18} color="#fff" />}
                      </Animated.View>
                    ) : (
                      <View style={[
                        styles.stepCircle,
                        { backgroundColor: isDark ? colors.border : '#F0F0F0', borderColor: colors.border },
                        isDone && [styles.stepCircleDone, { backgroundColor: isDark ? '#22c55e30' : '#E8FFF0' }],
                        isPending && [styles.stepCirclePending, { backgroundColor: colors.pageBg, borderColor: colors.border }]
                      ]}>
                        {isDone
                          ? <MaterialIcons name="check" size={18} color={isDark ? '#4ade80' : '#22c55e'} />
                          : step.iconLib === 'material'
                            ? <MaterialIcons name={step.icon as any} size={18} color={isPending ? '#9CA3AF' : '#374151'} />
                            : <MaterialCommunityIcons name={step.icon as any} size={18} color={isPending ? '#9CA3AF' : '#374151'} />}
                      </View>
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text style={[
                      styles.stepLabel,
                      { color: colors.titleText },
                      isDone && styles.stepLabelDone,
                      isActive && [styles.stepLabelActive, isDark && { color: '#4ade80' }],
                      isPending && [styles.stepLabelPending, { color: colors.subtitleText }],
                    ]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.stepSublabel, { color: colors.subtitleText }, isPending && { opacity: 0.4 }]}>
                      {step.sublabel}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>

        {/* Dirección de entrega */}
        {initialOrder.deliveryAddress && (
          <View style={[styles.addressCard, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Dirección de entrega</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialIcons name="location-on" size={16} color="#22c55e" />
              <Text style={[styles.addressText, { color: colors.subtitleText, flex: 1 }]}>{initialOrder.deliveryAddress}</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F0' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F4F6F0' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAECE5', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#222', lineHeight: 24 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  orderNumberBanner: { alignItems: 'center', paddingVertical: 12 },
  orderNumberLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  orderNumberValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1 },

  etaBanner: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  etaLeft: { flex: 1 },
  etaLabel: { fontSize: 12, color: '#888', fontWeight: '500', marginBottom: 4 },
  etaStep: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  etaSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  etaDivider: { width: 1, height: 60, backgroundColor: '#EBEBEB', marginHorizontal: 20 },
  etaRight: { alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E8FFF0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC40' },
  statusBadgeText: { fontSize: 12, fontWeight: '700', color: '#1A8C2A' },

  mapPlaceholder: { backgroundColor: '#E4EDE0', borderRadius: 18, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mapEmoji: { fontSize: 32, marginBottom: 4 },
  mapText: { fontSize: 14, fontWeight: '700', color: '#3A5C30' },
  mapSub: { fontSize: 11, color: '#6A8C60', marginTop: 2, textAlign: 'center', paddingHorizontal: 16 },

  map: { height: 220, borderRadius: 18, marginBottom: 20, overflow: 'hidden' },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerEmoji: { fontSize: 28 },

  timelineSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 18 },

  timeline: { position: 'relative' },
  trackBg: { position: 'absolute', left: 19, top: 20, bottom: 20, width: 3, backgroundColor: '#E0E0E0', borderRadius: 2 },
  trackFill: { position: 'absolute', left: 19, top: 20, width: 3, backgroundColor: '#2ECC40', borderRadius: 2 },

  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepIndicatorCol: { width: 40, alignItems: 'center' },
  stepCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: '#E0E0E0' },
  stepCircleActive: { backgroundColor: '#2ECC40', borderColor: '#2ECC40', shadowColor: '#2ECC40', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 5 },
  stepCircleDone: { backgroundColor: '#E8FFF0', borderColor: '#2ECC40' },
  stepCirclePending: { backgroundColor: '#F8F8F8', borderColor: '#E0E0E0' },
  stepEmoji: { fontSize: 18 },
  stepContent: { flex: 1, marginLeft: 14 },
  stepLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  stepLabelActive: { color: '#1A8C2A', fontSize: 15 },
  stepLabelDone: { color: '#2ECC40' },
  stepLabelPending: { color: '#AAAAAA' },
  stepSublabel: { fontSize: 12, color: '#888', marginTop: 2 },

  addressCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  addressText: { fontSize: 14, color: '#374151', lineHeight: 20 },
})