import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, Image, Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'

import { RepartidorRepositoryImpl } from '../../../infraestructure/repositories/RepartidorRepositoryImpl'
import type { DriverEstado, RepartidorInfo, PedidoDisponible } from '../../../domain/ports/repositories/lRepartidorRepository'
import { useDriverLocation } from '../../../application/hooks/useDriverLocation'
import { supabase } from '../../../config/supabaseConfig'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverDashboard'>
}

const repartidorRepo = new RepartidorRepositoryImpl()
// ─── Icons ────────────────────────────────────────────────────────────────────

const BikeIcon = ({ color = '#22c55e', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 0 0 0-2h-3l-3 9" />
    <Path d="M9 15h6l1.5-6H7.5" />
  </Svg>
)

const StarIcon = ({ size = 14 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
)

const PackageIcon = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M16.5 9.4l-9-5.19" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <Path d="M12 22.08V12" />
  </Svg>
)

const LocationIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
)

const ChevronIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
)

const MoneyIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Path d="M2 10h20" />
  </Svg>
)

// ─── Estado config ────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<DriverEstado, { label: string; color: string; bg: string; dot: string; desc: string }> = {
  offline: { label: 'Offline', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF', desc: 'No recibirás pedidos' },
  available: { label: 'Disponible', color: '#16a34a', bg: '#DCFCE7', dot: '#22c55e', desc: 'Listo para recibir pedidos' },
  busy: { label: 'Ocupado', color: '#B45309', bg: '#FEF3C7', dot: '#F59E0B', desc: 'Entrega en curso' },
}

const ESTADOS: DriverEstado[] = ['offline', 'available', 'busy']

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverDashboard({ navigation }: Props) {
  console.log("Estas en DriverDashboard")
  const { session, logout } = useAuth()

  const [repartidor, setRepartidor] = useState<RepartidorInfo | null>(null)
  const [fotoUri, setFotoUri] = useState<string | null>(null)
  const [pedidos, setPedidos] = useState<PedidoDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingEstado, setUpdatingEstado] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [pedidoActivoId, setPedidoActivoId] = useState<string | null>(null)
  const [estadoPedido, setEstadoPedido] = useState<string | null>(null)
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const slideAnim = React.useRef(new Animated.Value(16)).current

  const fetchRepartidor = useCallback(async () => {
    if (!session?.userId) { setFetchError('Sin sesión'); return }
    try {
      const info = await repartidorRepo.getMyInfo(session.userId)
      setFetchError(null)
      setRepartidor(info)
      setFotoUri(info.foto_url ?? null)   // ← sincroniza foto
    } catch (e: any) {
      setFetchError(e.message)
      navigation.navigate('LoginDriver')
    }
  }, [session?.userId])

  const fetchPedidos = useCallback(async () => {
    try {
      const data = await repartidorRepo.getPedidosDisponibles()
      setPedidos(data)
    } catch { }
  }, [])

  const loadAll = useCallback(async () => {
    await Promise.all([fetchRepartidor(), fetchPedidos()])
  }, [fetchRepartidor, fetchPedidos])

  useEffect(() => {
    loadAll().finally(() => {
      setLoading(false)
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]).start()
    })
  }, [loadAll])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAll()
    setRefreshing(false)
  }

  const handleEstado = async (nuevoEstado: DriverEstado) => {
    if (!session?.userId || !repartidor) {
      Alert.alert('Error', 'Jala para recargar.')
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

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive', onPress: async () => {
          await logout(); navigation.replace('LoginDriver')
        }
      },
    ])
  }

  const handleTomarPedido = (pedidoId: string) => {
    Alert.alert('Tomar pedido', '¿Confirmas que vas a recoger este pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            await repartidorRepo.tomarPedido(pedidoId)
            setRepartidor(prev => prev ? { ...prev, estado: 'busy' } : prev)
            setPedidoActivoId(pedidoId) // ← guardar el pedido activo
            setEstadoPedido('picked_up')
            setPedidos([])
          } catch (e: any) { Alert.alert('Error', e.message) }
        }
      },
    ])
  }

  const handleAvanzarEstado = async () => {
    if (!pedidoActivoId || !estadoPedido) return

    const siguienteEstado = estadoPedido === 'picked_up' ? 'on_the_way' : 'delivered'
    const mensaje = siguienteEstado === 'on_the_way'
      ? '¿Confirmas que estás en camino?'
      : '¿Confirmas que entregaste el pedido?'

    Alert.alert('Actualizar estado', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) return

            const API_URL = process.env.EXPO_PUBLIC_API_URL

            const res = await fetch(
              `${API_URL}/repartidores/pedidos/${pedidoActivoId}/estado`,
              {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ estado: siguienteEstado }),
              }
            )

            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.detail ?? 'Error al actualizar estado')
            }

            setEstadoPedido(siguienteEstado)

            if (siguienteEstado === 'delivered') {
              // Pedido entregado — limpiar estado y volver a available
              setRepartidor(prev => prev ? { ...prev, estado: 'available' } : prev)
              setPedidoActivoId(null)
              setEstadoPedido(null)
              Alert.alert('¡Entrega completada!', '¡Buen trabajo! Ya puedes tomar otro pedido.')
              await fetchPedidos()
            }
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        }
      },
    ])
  }

  // Activa el GPS solo cuando el repartidor está en estado busy
  useDriverLocation({
    isActive: repartidor?.estado === 'busy',
    accessToken: session?.accessToken ?? null,
    pedidoId: pedidoActivoId,
  })
  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </SafeAreaView>
    )
  }

  if (fetchError && !repartidor) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity
          onPress={() => { setLoading(true); loadAll().finally(() => setLoading(false)) }}
          style={styles.retryBtn}
        >
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const estado = repartidor?.estado ?? 'offline'
  const estadoConf = ESTADO_CONFIG[estado]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#F0FDF4', '#fff']} style={styles.header}>
        <View style={styles.headerTop}>

          {/* Avatar → navega a DriverProfile */}
          <TouchableOpacity
            style={styles.avatarBtn}
            activeOpacity={0.85}
            onPress={() => repartidor && navigation.navigate('DriverProfile', { repartidor })}
          >
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {session?.email?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </LinearGradient>
            )}
            {/* Dot de estado sobre el avatar */}
            <View style={[styles.avatarStatusDot, { backgroundColor: estadoConf.dot }]} />
          </TouchableOpacity>

          {/* Título + estado */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerGreeting}>Hola 👋</Text>
            <Text style={styles.headerTitle}>Mi Dashboard</Text>
          </View>

          {/* Pill de estado */}
          <View style={[styles.estadoPill, { backgroundColor: estadoConf.bg }]}>
            <View style={[styles.estadoDot, { backgroundColor: estadoConf.dot }]} />
            <Text style={[styles.estadoPillText, { color: estadoConf.color }]}>
              {estadoConf.label}
            </Text>
          </View>
        </View>

        {/* Acceso rápido a perfil */}
        <TouchableOpacity
          style={styles.profileBanner}
          activeOpacity={0.8}
          onPress={() => repartidor && navigation.navigate('DriverProfile', { repartidor })}
        >
          <View style={styles.profileBannerLeft}>
            <View style={styles.profileBannerIcon}>
              <BikeIcon color="#16a34a" size={16} />
            </View>
            <View>
              <Text style={styles.profileBannerTitle}>Ver mi perfil</Text>
              <Text style={styles.profileBannerSub}>Foto, información y estadísticas</Text>
            </View>
          </View>
          <ChevronIcon />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── STATS ─────────────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <PackageIcon color="#22c55e" size={18} />
              <Text style={styles.statValue}>{repartidor?.total_entregas ?? 0}</Text>
              <Text style={styles.statLabel}>Entregas</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMiddle]}>
              <StarIcon size={18} />
              <Text style={styles.statValue}>
                {repartidor?.calificacion != null
                  ? repartidor.calificacion.toFixed(1)
                  : '—'}
              </Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
            <View style={styles.statCard}>
              <BikeIcon color="#6B7280" size={18} />
              <Text style={styles.statValue}>
                {repartidor?.vehiculo
                  ? repartidor.vehiculo.charAt(0).toUpperCase() + repartidor.vehiculo.slice(1)
                  : '—'}
              </Text>
              <Text style={styles.statLabel}>Vehículo</Text>
            </View>
          </View>

          {/* ── SELECTOR DE ESTADO ────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi estado</Text>
            <Text style={styles.sectionSubtitle}>{estadoConf.desc}</Text>
            <View style={styles.estadoSelector}>
              {ESTADOS.map((e) => {
                const conf = ESTADO_CONFIG[e]
                const activo = estado === e
                return (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.estadoBtn,
                      activo && { backgroundColor: conf.bg, borderColor: conf.dot },
                    ]}
                    onPress={() => handleEstado(e)}
                    disabled={updatingEstado}
                    activeOpacity={0.75}
                  >
                    {updatingEstado && activo
                      ? <ActivityIndicator size="small" color={conf.color} />
                      : <>
                        <View style={[styles.estadoBtnDot, { backgroundColor: activo ? conf.dot : '#D1D5DB' }]} />
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

          {/* ── PEDIDO ACTIVO ─────────────────────────────────────────────── */}
          {estado === 'busy' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entrega en curso</Text>
              <LinearGradient colors={['#22c55e', '#15803d']} style={styles.activoCard}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.activoIconWrap}>
                  <PackageIcon color="#22c55e" size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activoTitle}>
                    {estadoPedido === 'picked_up' ? 'Pedido recogido 📦' : 'En camino 🛵'}
                  </Text>
                  <Text style={styles.activoSubtitle}>
                    {estadoPedido === 'picked_up'
                      ? 'Confirma cuando estés en camino'
                      : 'Confirma cuando hayas entregado'}
                  </Text>
                </View>
              </LinearGradient>

              {/* Botón para avanzar estado */}
              <TouchableOpacity
                style={[
                  styles.avanzarBtn,
                  estadoPedido === 'delivered' && styles.avanzarBtnDisabled
                ]}
                onPress={handleAvanzarEstado}
                disabled={estadoPedido === 'delivered'}
              >
                <LinearGradient
                  colors={estadoPedido === 'on_the_way' ? ['#F59E0B', '#D97706'] : ['#22c55e', '#16a34a']}
                  style={styles.avanzarBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.avanzarBtnText}>
                    {estadoPedido === 'picked_up' ? '🛵 Ya voy en camino' : '✅ Pedido entregado'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── PEDIDOS DISPONIBLES ───────────────────────────────────────── */}
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
                  {/* Número y total */}
                  <View style={styles.pedidoHeader}>
                    <View style={styles.pedidoNumeroWrap}>
                      <Text style={styles.pedidoNumero}>{pedido.order_number}</Text>
                    </View>
                    <Text style={styles.pedidoTotal}>${pedido.total != null ? pedido.total.toFixed(2) : '0.00'}</Text>
                  </View>

                  <Text style={styles.pedidoNegocio}>{pedido.negocio_nombre}</Text>

                  <View style={styles.pedidoDireccionRow}>
                    <LocationIcon />
                    <Text style={styles.pedidoDireccion} numberOfLines={1}>
                      {pedido.direccion_entrega}
                    </Text>
                  </View>

                  {/* Footer */}
                  <View style={styles.pedidoFooter}>
                    <View style={styles.pedidoEnvioWrap}>
                      <MoneyIcon />
                      <Text style={styles.pedidoEnvio}>+${pedido.costo_envio != null ? pedido.costo_envio.toFixed(2) : '0.00'} envío envío</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.aceptarBtn}
                      onPress={() => handleTomarPedido(pedido.id)}
                      activeOpacity={0.85}
                    >
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

          {/* ── LOGOUT ───────────────────────────────────────────────────────── */}
          <View style={[styles.section, { marginTop: 8 }]}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <Text style={styles.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>Pidelo Delivery  •  v1.0.0</Text>
          <View style={{ height: 32 }} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorEmoji: { fontSize: 36, marginBottom: 12 },
  errorText: { fontSize: 14, color: '#EF4444', fontWeight: '700', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: '#22c55e', borderRadius: 20 },
  retryBtnText: { color: '#fff', fontWeight: '700' },
  scroll: { paddingBottom: 40 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  headerCenter: { flex: 1 },
  headerGreeting: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },

  // Avatar
  avatarBtn: { width: 50, height: 50, borderRadius: 16, overflow: 'hidden', borderWidth: 2.5, borderColor: '#22c55e', position: 'relative' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 20, fontWeight: '800', color: '#fff' },
  avatarStatusDot: { position: 'absolute', bottom: 2, right: 2, width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: '#F0FDF4' },

  // Estado pill
  estadoPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  estadoDot: { width: 7, height: 7, borderRadius: 4 },
  estadoPillText: { fontSize: 12, fontWeight: '700' },

  // Profile banner
  profileBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  profileBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileBannerIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  profileBannerTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  profileBannerSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },

  // Stats
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statCardMiddle: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Sections
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 12, marginTop: 2 },
  countBadge: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Estado selector
  estadoSelector: { flexDirection: 'row', gap: 8 },
  estadoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  estadoBtnDot: { width: 8, height: 8, borderRadius: 4 },
  estadoBtnText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },

  // Pedido activo
  activoCard: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  activoIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  activoTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  activoSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // Empty
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  emptyEmoji: { fontSize: 34, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

  // Pedido card
  pedidoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  pedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pedidoNumeroWrap: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pedidoNumero: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  pedidoTotal: { fontSize: 18, fontWeight: '800', color: '#111827' },
  pedidoNegocio: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 6 },
  pedidoDireccionRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  pedidoDireccion: { fontSize: 13, color: '#9CA3AF', flex: 1 },
  pedidoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoEnvioWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pedidoEnvio: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  aceptarBtn: { borderRadius: 20, overflow: 'hidden' },
  aceptarGradient: { paddingHorizontal: 22, paddingVertical: 10 },
  aceptarText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  avanzarBtn: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  avanzarBtnDisabled: { opacity: 0.5 },
  avanzarBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  avanzarBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Logout
  logoutBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FEE2E2' },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

  versionText: { textAlign: 'center', marginTop: 20, fontSize: 11, color: '#D1D5DB', letterSpacing: 0.4 },
})