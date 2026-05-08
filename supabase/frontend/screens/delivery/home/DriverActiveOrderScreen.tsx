import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Linking, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as ImagePicker from 'expo-image-picker'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { supabase } from '../../../config/supabaseConfig'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverActiveOrder'>
  route: RouteProp<RootStackParamList, 'DriverActiveOrder'>
}

type OrderItem = {
  nombre: string
  cantidad: number
  precio_unitario: number
  descripcion?: string
}

type PedidoDetalle = {
  id: string
  order_number: string
  estado: string
  total: number
  costo_envio: number
  direccion_entrega: string
  notas?: string
  negocio_nombre: string
  negocio_direccion: string
  negocio_telefono?: string
  negocio_lat?: number
  negocio_lng?: number
  cliente_nombre: string
  cliente_telefono?: string
  items: OrderItem[]
}

// ─── Estado labels ────────────────────────────────────────────────────────────

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  picked_up: { label: 'Recogido', color: '#16a34a', bg: '#DCFCE7' },
  on_the_way: { label: 'En camino', color: '#B45309', bg: '#FEF3C7' },
  delivered: { label: 'Entregado', color: '#6B7280', bg: '#F3F4F6' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverActiveOrderScreen({ navigation, route }: Props) {
  const { pedidoId, estadoPedido: estadoInicial } = route.params
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [estadoPedido, setEstadoPedido] = useState(estadoInicial)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [fotoEntrega, setFotoEntrega] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)

  // ─── Fetch detalle ─────────────────────────────────────────────────────────

  const fetchDetalle = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch(
        `${process.env.API_BASE_URL}/repartidores/pedidos/${pedidoId}/detalle`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setPedido(data)
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el detalle del pedido')
    } finally {
      setLoading(false)
    }
  }, [pedidoId])

  useEffect(() => { fetchDetalle() }, [fetchDetalle])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLlamar = (telefono?: string) => {
    if (!telefono) return Alert.alert('Sin teléfono', 'No hay número registrado')
    Linking.openURL(`tel:${telefono}`)
  }

  const handleWhatsApp = (telefono?: string) => {
    if (!telefono) return Alert.alert('Sin teléfono', 'No hay número registrado')
    Linking.openURL(`https://wa.me/${telefono.replace(/\D/g, '')}`)
  }

  const handleSeleccionarFoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') return Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara')
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false })
    if (!result.canceled && result.assets[0]) setFotoEntrega(result.assets[0].uri)
  }

  const handleAvanzarEstado = () => {
    const siguiente = estadoPedido === 'picked_up' ? 'on_the_way' : 'delivered'
    const mensaje = siguiente === 'on_the_way'
      ? '¿Confirmas que estás en camino al cliente?'
      : '¿Confirmas que entregaste el pedido?'

    Alert.alert('Actualizar estado', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            setActionLoading(true)
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) return
            const res = await fetch(
              `${process.env.API_BASE_URL}/repartidores/pedidos/${pedidoId}/estado`,
              {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                body: JSON.stringify({ estado: siguiente }),
              }
            )
            if (!res.ok) throw new Error((await res.json()).detail ?? 'Error')
            setEstadoPedido(siguiente)
            if (siguiente === 'delivered') {
              Alert.alert('¡Entrega completada!', '¡Buen trabajo!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ])
            }
          } catch (e: any) {
            Alert.alert('Error', e.message)
          } finally {
            setActionLoading(false)
          }
        }
      },
    ])
  }

  const handleMarcarEntregado = () => {
    Alert.alert('Confirmar entrega',
      fotoEntrega ? '¿Confirmas la entrega? Se enviará la foto.' : '¿Confirmas la entrega?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar', onPress: async () => {
            try {
              setSubiendoFoto(true)
              const { data: { session: s } } = await supabase.auth.getSession()
              if (!s?.access_token) return
              const formData = new FormData()
              if (fotoEntrega) {
                formData.append('foto', { uri: fotoEntrega, type: 'image/jpeg', name: 'entrega.jpg' } as any)
              }
              const res = await fetch(
                `${process.env.API_BASE_URL}/repartidores/pedidos/${pedidoId}/entregar`,
                { method: 'POST', headers: { Authorization: `Bearer ${s.access_token}` }, body: formData }
              )
              if (!res.ok) throw new Error((await res.json()).detail ?? 'Error')
              Alert.alert('¡Entrega registrada!', 'El cliente tiene 15 min para confirmar.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ])
            } catch (e: any) {
              Alert.alert('Error', e.message)
            } finally {
              setSubiendoFoto(false)
            }
          }
        },
      ]
    )
  }

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Cargando pedido...</Text>
      </SafeAreaView>
    )
  }

  if (!pedido) {
    return (
      <SafeAreaView style={styles.center}>
        <MaterialIcons name="error-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>No se pudo cargar el pedido</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const estadoConf = ESTADO_LABEL[estadoPedido] ?? ESTADO_LABEL['picked_up']
  const hasMap = pedido.negocio_lat && pedido.negocio_lng

  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#F0FDF4', '#fff']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#16a34a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pedido activo</Text>
          <Text style={styles.headerOrderNum}>#{pedido.order_number}</Text>
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estadoConf.bg }]}>
          <View style={[styles.estadoDot, { backgroundColor: estadoConf.color }]} />
          <Text style={[styles.estadoText, { color: estadoConf.color }]}>{estadoConf.label}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── MAPA ─────────────────────────────────────────────────────────── */}
        {hasMap ? (
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: pedido.negocio_lat!,
                longitude: pedido.negocio_lng!,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {/* Origen — Restaurante */}
              <Marker
                coordinate={{ latitude: pedido.negocio_lat!, longitude: pedido.negocio_lng! }}
                title={pedido.negocio_nombre}
                description={pedido.negocio_direccion}
                pinColor="#22c55e"
              />
            </MapView>
            {/* Overlay con direcciones encima del mapa */}
            <View style={styles.mapOverlay}>
              <View style={styles.mapOverlayRow}>
                <View style={[styles.mapOverlayDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.mapOverlayText} numberOfLines={1}>{pedido.negocio_direccion}</Text>
              </View>
              <View style={styles.mapOverlayDivider} />
              <View style={styles.mapOverlayRow}>
                <View style={[styles.mapOverlayDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.mapOverlayText} numberOfLines={1}>{pedido.direccion_entrega}</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Fallback si no hay coordenadas */
          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: '#22c55e' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>Recoger en</Text>
                <Text style={styles.addressText}>{pedido.negocio_nombre}</Text>
                <Text style={styles.addressSub}>{pedido.negocio_direccion}</Text>
              </View>
            </View>
            <View style={styles.addressLine} />
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: '#EF4444' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>Entregar en</Text>
                <Text style={styles.addressText}>{pedido.direccion_entrega}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── INFO CLIENTE ─────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          <View style={styles.clientRow}>
            <View style={styles.clientAvatar}>
              <MaterialIcons name="person" size={22} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{pedido.cliente_nombre || 'Cliente'}</Text>
              <Text style={styles.clientPhone}>{pedido.cliente_telefono || 'Sin teléfono'}</Text>
            </View>
            <View style={styles.contactBtns}>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#DCFCE7' }]}
                onPress={() => handleLlamar(pedido.cliente_telefono)}
              >
                <MaterialIcons name="phone" size={18} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#DCFCE7' }]}
                onPress={() => handleWhatsApp(pedido.cliente_telefono)}
              >
                <MaterialIcons name="chat" size={18} color="#16a34a" />
              </TouchableOpacity>
            </View>
          </View>
          {pedido.notas ? (
            <View style={styles.notasWrap}>
              <MaterialIcons name="notes" size={14} color="#F59E0B" />
              <Text style={styles.notasText}>{pedido.notas}</Text>
            </View>
          ) : null}
        </View>

        {/* ── RESTAURANTE ──────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Restaurante</Text>
          <View style={styles.clientRow}>
            <View style={[styles.clientAvatar, { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons name="storefront" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{pedido.negocio_nombre}</Text>
              <Text style={styles.clientPhone} numberOfLines={1}>{pedido.negocio_direccion}</Text>
            </View>
            {pedido.negocio_telefono ? (
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: '#FEF3C7' }]}
                onPress={() => handleLlamar(pedido.negocio_telefono)}
              >
                <MaterialIcons name="phone" size={18} color="#D97706" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ── ARTÍCULOS ────────────────────────────────────────────────────── */}
        {pedido.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Artículos ({pedido.items.length})</Text>
            {pedido.items.map((item, idx) => (
              <View key={idx} style={[styles.itemRow, idx < pedido.items.length - 1 && styles.itemRowBorder]}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQty}>{item.cantidad}x</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.nombre}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total del pedido</Text>
              <Text style={styles.totalValue}>${pedido.total.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* ── FOTO DE EVIDENCIA (solo on_the_way) ─────────────────────────── */}
        {estadoPedido === 'on_the_way' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Foto de evidencia</Text>
            {fotoEntrega ? (
              <View>
                <Image
                  source={{ uri: fotoEntrega }}
                  style={styles.fotoPreview}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.quitarFotoBtn} onPress={() => setFotoEntrega(null)}>
                  <MaterialIcons name="close" size={14} color="#EF4444" />
                  <Text style={styles.quitarFotoText}>Quitar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.fotoPlaceholder} onPress={handleSeleccionarFoto}>
                <MaterialIcons name="add-a-photo" size={30} color="#9CA3AF" />
                <Text style={styles.fotoPlaceholderText}>Tomar foto de evidencia</Text>
                <Text style={styles.fotoPlaceholderSub}>No es obligatoria</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── BOTÓN DE ACCIÓN ──────────────────────────────────────────────────── */}
      {estadoPedido !== 'delivered' && (
        <View style={styles.actionBar}>
          {estadoPedido === 'picked_up' && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleAvanzarEstado} disabled={actionLoading}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {actionLoading
                  ? <ActivityIndicator color="#fff" />
                  : <>
                    <MaterialIcons name="moped" size={20} color="#fff" />
                    <Text style={styles.actionText}>Ya voy en camino</Text>
                  </>
                }
              </LinearGradient>
            </TouchableOpacity>
          )}
          {estadoPedido === 'on_the_way' && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleMarcarEntregado} disabled={subiendoFoto}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {subiendoFoto
                  ? <ActivityIndicator color="#fff" />
                  : <>
                    <MaterialIcons name="check-circle" size={20} color="#fff" />
                    <Text style={styles.actionText}>{fotoEntrega ? 'Entregar con foto' : 'Marcar como entregado'}</Text>
                  </>
                }
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  errorText: { fontSize: 15, color: '#EF4444', fontWeight: '700', marginTop: 12 },
  backBtn: { marginTop: 20, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: '#22c55e', borderRadius: 20 },
  backBtnText: { color: '#fff', fontWeight: '700' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  backArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 11, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerOrderNum: { fontSize: 17, fontWeight: '800', color: '#111827' },
  estadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  estadoDot: { width: 7, height: 7, borderRadius: 4 },
  estadoText: { fontSize: 12, fontWeight: '700' },

  scroll: { paddingBottom: 120 },

  // Mapa
  mapContainer: { height: 220, marginHorizontal: 16, marginTop: 16, borderRadius: 18, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', padding: 12 },
  mapOverlayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapOverlayDot: { width: 10, height: 10, borderRadius: 5 },
  mapOverlayText: { flex: 1, fontSize: 12, color: '#374151', fontWeight: '500' },
  mapOverlayDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6, marginLeft: 18 },

  // Address fallback
  addressCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addressDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  addressLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  addressText: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
  addressSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  addressLine: { width: 2, height: 16, backgroundColor: '#E5E7EB', marginLeft: 5, marginVertical: 4 },

  // Card
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  // Cliente
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  clientName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  clientPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  contactBtns: { flexDirection: 'row', gap: 8 },
  contactBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notasWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#FFFBEB', padding: 10, borderRadius: 10 },
  notasText: { fontSize: 13, color: '#92400E', flex: 1 },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemQtyBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  itemQty: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  itemName: { fontSize: 14, fontWeight: '500', color: '#374151' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

  // Foto
  fotoPreview: { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#F3F4F6' },
  quitarFotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, alignSelf: 'flex-end' },
  quitarFotoText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  fotoPlaceholder: { borderWidth: 1.5, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 24, alignItems: 'center', backgroundColor: '#F9FAFB', gap: 6 },
  fotoPlaceholderText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  fotoPlaceholderSub: { fontSize: 11, color: '#D1D5DB' },

  // Action bar
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 10 },
  actionBtn: { borderRadius: 14, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  actionText: { fontSize: 16, fontWeight: '700', color: '#fff' },
})
