// screens/client/orders/OrderTracking.tsx
// Conectado a Supabase Realtime — el estado avanza solo cuando el negocio lo cambia

import React, { useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Animated, Dimensions,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useOrderRealtime } from '../../../application/hooks/useOrderRealTime'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useRepartidorUbicacion } from '../../../application/hooks/useRepartidorUbicacion'

const { width } = Dimensions.get('window')

type Props = NativeStackScreenProps<RootStackParamList, 'orderTracking'>

type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered'

interface Step {
  key: OrderStatus
  label: string
  sublabel: string
  emoji: string
}

const STEPS: Step[] = [
  { key: 'confirmed', label: 'Pedido confirmado', sublabel: 'El restaurante aceptó tu orden', emoji: '✅' },
  { key: 'preparing', label: 'Preparando', sublabel: 'El restaurante está cocinando', emoji: '👨‍🍳' },
  { key: 'ready', label: 'Listo para recoger', sublabel: 'Esperando al repartidor', emoji: '📦' },
  { key: 'on_the_way', label: 'En camino', sublabel: 'Tu repartidor va en camino', emoji: '🛵' },
  { key: 'delivered', label: '¡Entregado!', sublabel: '¡Que lo disfrutes!', emoji: '🎉' },
]

const STATUS_ORDER: OrderStatus[] = ['confirmed', 'preparing', 'ready', 'on_the_way', 'delivered']

// Mapeo de estados del backend a los pasos del timeline
const ESTADO_A_STEP: Record<string, OrderStatus> = {
  confirmed: 'confirmed',
  preparing: 'preparing',
  ready: 'ready',
  picked_up: 'on_the_way',
  on_the_way: 'on_the_way',
  delivered: 'delivered',
}

export default function OrderTrackingScreen({ route, navigation }: Props) {
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

  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rastreo de Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Número de pedido */}
        <View style={styles.orderNumberBanner}>
          <Text style={styles.orderNumberLabel}>Pedido</Text>
          <Text style={styles.orderNumberValue}>{order?.orderNumber ?? initialOrder.orderNumber}</Text>
        </View>

        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <View style={styles.etaLeft}>
            <Text style={styles.etaLabel}>Estado actual</Text>
            <Text style={styles.etaStep}>{STEPS[currentIndex]?.emoji} {STEPS[currentIndex]?.label}</Text>
            <Text style={styles.etaSub}>{STEPS[currentIndex]?.sublabel}</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaRight}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>En vivo</Text>
            </View>
          </View>
        </View>

        {/* Mapa en vivo */}
        {ubicacion ? (
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
                <Text style={styles.markerEmoji}>🛵</Text>
              </View>
            </Marker>
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapText}>
              {order?.status === 'on_the_way' || order?.status === 'picked_up'
                ? 'Esperando ubicación del repartidor...'
                : 'El mapa aparecerá cuando el repartidor esté en camino'}
            </Text>
          </View>
        )}

        {/* Timeline de estados */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Progreso del pedido</Text>

          <View style={styles.timeline}>
            <View style={styles.trackBg} />
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
                        <Text style={styles.stepEmoji}>{step.emoji}</Text>
                      </Animated.View>
                    ) : (
                      <View style={[styles.stepCircle, isDone && styles.stepCircleDone, isPending && styles.stepCirclePending]}>
                        <Text style={[styles.stepEmoji, isPending && { opacity: 0.4 }]}>
                          {isDone ? '✓' : step.emoji}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text style={[
                      styles.stepLabel,
                      isDone && styles.stepLabelDone,
                      isActive && styles.stepLabelActive,
                      isPending && styles.stepLabelPending,
                    ]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.stepSublabel, isPending && { opacity: 0.4 }]}>
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
          <View style={styles.addressCard}>
            <Text style={styles.sectionTitle}>Dirección de entrega</Text>
            <Text style={styles.addressText}>📍 {initialOrder.deliveryAddress}</Text>
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