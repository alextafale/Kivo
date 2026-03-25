import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'
import { API_URL } from '@env'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverDashboard'>
}

import { RepartidorRepositoryImpl } from '../../../infraestructure/repositories/RepartidorRepositoryImpl'
import type { DriverEstado, RepartidorInfo, PedidoDisponible } from '../../../domain/ports/repositories/lRepartidorRepository'

const repartidorRepo = new RepartidorRepositoryImpl()

// ─── Icons ────────────────────────────────────────────────────────────────────

const BikeIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 0 0 0-2h-3l-3 9" />
    <Path d="M9 15h6l1.5-6H7.5" />
  </Svg>
)

const StarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
)

const PackageIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
    <Path d="M16.5 9.4l-9-5.19" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <Path d="M12 22.08V12" />
  </Svg>
)

const LocationIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
)

const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Path d="M21 12H9" />
  </Svg>
)

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<DriverEstado, { label: string; color: string; bg: string; desc: string }> = {
  offline:   { label: 'Offline',    color: '#6B7280', bg: '#F3F4F6', desc: 'No recibirás pedidos' },
  available: { label: 'Disponible', color: '#16a34a', bg: '#DCFCE7', desc: 'Listo para recibir pedidos' },
  busy:      { label: 'Ocupado',    color: '#D97706', bg: '#FEF3C7', desc: 'Entrega en curso' },
}

const ESTADOS: DriverEstado[] = ['offline', 'available', 'busy']

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverDashboard({ navigation }: Props) {
  const { session, logout } = useAuth()

  const [repartidor,     setRepartidor]     = useState<RepartidorInfo | null>(null)
  const [pedidos,        setPedidos]        = useState<PedidoDisponible[]>([])
  const [loading,        setLoading]        = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const [fetchError,     setFetchError]     = useState<string | null>(null)

  // ── Fetch info del repartidor ─────────────────────────────────────────────
  const fetchRepartidor = useCallback(async () => {
    if (!session?.userId) {
      setFetchError('Sin sesión')
      return
    }

    try {
      const info = await repartidorRepo.getMyInfo(session.userId)
      setFetchError(null)
      setRepartidor(info)
    } catch (e: any) {
      console.log('[fetchRepartidor] catch:', e.message)
      setFetchError(e.message)
      navigation.navigate('LoginDriver')
    }
  }, [session?.userId])

  // ── Fetch pedidos disponibles ─────────────────────────────────────────────
  const fetchPedidos = useCallback(async () => {
    try {
      const data = await repartidorRepo.getPedidosDisponibles()
      setPedidos(data)
    } catch (e: any) {
      console.log('[fetchPedidos] error:', e.message)
    }
  }, [])

  const loadAll = useCallback(async () => {
    await Promise.all([fetchRepartidor(), fetchPedidos()])
  }, [fetchRepartidor, fetchPedidos])

  useEffect(() => {
    console.log('[DriverDashboard] session:', JSON.stringify(session))
    loadAll().finally(() => setLoading(false))
  }, [loadAll])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  // ── Cambiar estado ────────────────────────────────────────────────────────
  const handleEstado = async (nuevoEstado: DriverEstado) => {
    if (!session?.userId || !repartidor) {
      Alert.alert('Error', 'No se cargó el perfil del repartidor. Jala para recargar.')
      return
    }
    if (repartidor.estado === nuevoEstado) return

    setUpdatingEstado(true)
    try {
      const estadoActualizado = await repartidorRepo.updateEstado(session.userId, nuevoEstado)
      setRepartidor(prev => prev ? { ...prev, estado: estadoActualizado } : prev)

      if (nuevoEstado === 'available') await fetchPedidos()
      else if (nuevoEstado === 'offline') setPedidos([])
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setUpdatingEstado(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive', onPress: async () => {
          await logout()
          navigation.replace('LoginDriver')
        },
      },
    ])
  }
      // Agrega junto a los otros handlers
    const handleTomarPedido = async (pedidoId: string) => {
      Alert.alert(
        'Tomar pedido',
        '¿Confirmas que vas a recoger este pedido?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              try {
                await repartidorRepo.tomarPedido(pedidoId)
                // Actualizar estado local sin re-fetch
                setRepartidor(prev => prev ? { ...prev, estado: 'busy' } : prev)
                setPedidos([])
              } catch (e: any) {
                Alert.alert('Error', e.message)
              }
            },
          },
        ]
      )
    }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </SafeAreaView>
    )
  }

  // ── Error de carga ────────────────────────────────────────────────────────
  if (fetchError && !repartidor) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>⚠️</Text>
        <Text style={[styles.loadingText, { color: '#EF4444', fontWeight: '700' }]}>
          {fetchError}
        </Text>
        <TouchableOpacity
          onPress={() => { setLoading(true); loadAll().finally(() => setLoading(false)) }}
          style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#22c55e', borderRadius: 20 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const estado     = repartidor?.estado ?? 'offline'
  const estadoConf = ESTADO_CONFIG[estado]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <BikeIcon color="#16a34a" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Mi Dashboard</Text>
              <View style={[styles.estadoPill, { backgroundColor: estadoConf.bg }]}>
                <View style={[styles.estadoDot, { backgroundColor: estadoConf.color }]} />
                <Text style={[styles.estadoPillText, { color: estadoConf.color }]}>
                  {estadoConf.label}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogoutIcon />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >

        {/* ── Estadísticas ─────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{repartidor?.total_entregas ?? 0}</Text>
            <Text style={styles.statLabel}>Entregas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <View style={styles.statRatingRow}>
              <Text style={styles.statValue}>
                {repartidor?.calificacion?.toFixed(1) ?? '—'}
              </Text>
              <StarIcon />
            </View>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {repartidor?.vehiculo
                ? repartidor.vehiculo.charAt(0).toUpperCase() + repartidor.vehiculo.slice(1)
                : '—'}
            </Text>
            <Text style={styles.statLabel}>Vehículo</Text>
          </View>
        </View>

        {/* ── Switch de estado ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi estado</Text>
          <Text style={styles.sectionSubtitle}>{estadoConf.desc}</Text>
          <View style={styles.estadoSelector}>
            {ESTADOS.map((e) => {
              const conf   = ESTADO_CONFIG[e]
              const activo = estado === e
              return (
                <TouchableOpacity
                  key={e}
                  style={[styles.estadoBtn, activo && { backgroundColor: conf.bg, borderColor: conf.color }]}
                  onPress={() => handleEstado(e)}
                  disabled={updatingEstado}
                >
                  {updatingEstado && activo
                    ? <ActivityIndicator size="small" color={conf.color} />
                    : <>
                        <View style={[styles.estadoBtnDot, { backgroundColor: activo ? conf.color : '#D1D5DB' }]} />
                        <Text style={[styles.estadoBtnText, activo && { color: conf.color, fontWeight: '700' }]}>
                          {conf.label}
                        </Text>
                      </>
                  }
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* ── Pedido activo ────────────────────────────────────────────── */}
        {estado === 'busy' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entrega en curso</Text>
            <View style={styles.activoCard}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.activoGradient}>
                <PackageIcon />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activoTitle}>Tienes un pedido activo</Text>
                  <Text style={styles.activoSubtitle}>Cambia a "Offline" cuando termines</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* ── Pedidos disponibles ───────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos disponibles</Text>
            {pedidos.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{pedidos.length}</Text>
              </View>
            )}
          </View>

          {estado === 'offline' ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>😴</Text>
              <Text style={styles.emptyTitle}>Estás offline</Text>
              <Text style={styles.emptyText}>Cambia tu estado a "Disponible" para ver pedidos.</Text>
            </View>
          ) : pedidos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Sin pedidos por ahora</Text>
              <Text style={styles.emptyText}>Jala hacia abajo para actualizar.</Text>
            </View>
          ) : (
            pedidos.map((pedido) => (
              <View key={pedido.id} style={styles.pedidoCard}>
                <View style={styles.pedidoHeader}>
                  <Text style={styles.pedidoNumero}>{pedido.order_number}</Text>
                  <Text style={styles.pedidoTotal}>${pedido.total.toFixed(2)}</Text>
                </View>
                <Text style={styles.pedidoNegocio}>{pedido.negocio_nombre}</Text>
                <View style={styles.pedidoDireccionRow}>
                  <LocationIcon />
                  <Text style={styles.pedidoDireccion} numberOfLines={1}>
                    {pedido.direccion_entrega}
                  </Text>
                </View>
                <View style={styles.pedidoFooter}>
                  <Text style={styles.pedidoEnvio}>Envío: ${pedido.costo_envio.toFixed(2)}</Text>
                  <TouchableOpacity style={styles.aceptarBtn} onPress={() => handleTomarPedido(pedido.id)}>
                    <LinearGradient
                      colors={['#22c55e', '#16a34a']}
                      style={styles.aceptarGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.aceptarText}>Aceptar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText:        { marginTop: 12, fontSize: 14, color: '#6B7280' },
  scroll:             { paddingBottom: 40 },

  // Header
  header:             { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap:         { width: 48, height: 48, borderRadius: 14, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  headerTitle:        { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  estadoPill:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  estadoDot:          { width: 7, height: 7, borderRadius: 4 },
  estadoPillText:     { fontSize: 12, fontWeight: '600' },
  logoutBtn:          { padding: 8 },

  // Stats
  statsRow:           { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  statCard:           { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  statCardMiddle:     { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  statValue:          { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statRatingRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel:          { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  // Sections
  section:            { marginHorizontal: 16, marginTop: 20 },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle:       { fontSize: 16, fontWeight: '800', color: '#111827' },
  sectionSubtitle:    { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  countBadge:         { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText:     { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Estado selector
  estadoSelector:     { flexDirection: 'row', gap: 8, marginTop: 12 },
  estadoBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  estadoBtnDot:       { width: 8, height: 8, borderRadius: 4 },
  estadoBtnText:      { fontSize: 13, fontWeight: '500', color: '#6B7280' },

  // Pedido activo
  activoCard:         { borderRadius: 16, overflow: 'hidden' },
  activoGradient:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  activoTitle:        { fontSize: 15, fontWeight: '700', color: '#fff' },
  activoSubtitle:     { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Empty
  emptyCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  emptyEmoji:         { fontSize: 36, marginBottom: 10 },
  emptyTitle:         { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText:          { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  // Pedido card
  pedidoCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  pedidoHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  pedidoNumero:       { fontSize: 13, fontWeight: '700', color: '#22c55e' },
  pedidoTotal:        { fontSize: 16, fontWeight: '800', color: '#111827' },
  pedidoNegocio:      { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 6 },
  pedidoDireccionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  pedidoDireccion:    { fontSize: 13, color: '#9CA3AF', flex: 1 },
  pedidoFooter:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoEnvio:        { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  aceptarBtn:         { borderRadius: 20, overflow: 'hidden' },
  aceptarGradient:    { paddingHorizontal: 20, paddingVertical: 10 },
  aceptarText:        { fontSize: 14, fontWeight: '700', color: '#fff' },
})