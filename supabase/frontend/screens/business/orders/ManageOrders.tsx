// screens/business/orders/ManageOrders.tsx

import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { supabase } from '../../../config/supabaseConfig'
import { useAuth } from '../../../application/context/AuthContext'
import { useTheme } from '../../../application/context/ThemeContext'
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManageOrders'>
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PedidoEstado =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'picked_up' | 'on_the_way'
  | 'delivered' | 'cancelled'

interface PedidoItem {
  id: string
  nombre: string
  precio_unitario: number
  cantidad: number
  subtotal: number
  notas: string | null
}

interface PedidoNegocio {
  id: string
  orderNumber: string
  status: PedidoEstado
  total: number
  subtotal: number
  costoEnvio: number
  notas: string | null
  deliveryAddress: string | null
  date: string
  clienteNombre: string | null
  clienteApellido: string | null
  clienteTelefono: string | null
  items: PedidoItem[]
}

// ─── Configuración visual ─────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<PedidoEstado, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pendiente',  color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmado', color: '#8B5CF6', bg: '#EDE9FE' },
  preparing:  { label: 'Preparando', color: '#F97316', bg: '#FFF7ED' },
  ready:      { label: 'Listo',      color: '#06B6D4', bg: '#ECFEFF' },
  picked_up:  { label: 'Recogido',   color: '#3B82F6', bg: '#EFF6FF' },
  on_the_way: { label: 'En camino',  color: '#3B82F6', bg: '#EFF6FF' },
  delivered:  { label: 'Entregado',  color: '#22c55e', bg: '#F0FDF4' },
  cancelled:  { label: 'Cancelado',  color: '#EF4444', bg: '#FEF2F2' },
}

const ACCIONES: Record<PedidoEstado, { label: string; icon: string; iconLib: 'material' | 'community'; next: PedidoEstado; color: string }[]> = {
  pending:    [{ label: 'Aceptar',    icon: 'check-circle', iconLib: 'material',   next: 'confirmed',  color: '#22c55e' },
               { label: 'Cancelar',   icon: 'cancel',       iconLib: 'material',   next: 'cancelled',  color: '#EF4444' }],
  confirmed:  [{ label: 'Preparando', icon: 'chef-hat',     iconLib: 'community',  next: 'preparing',  color: '#F97316' },
               { label: 'Cancelar',   icon: 'cancel',       iconLib: 'material',   next: 'cancelled',  color: '#EF4444' }],
  preparing:  [{ label: 'Listo',      icon: 'inventory-2',  iconLib: 'material',   next: 'ready',      color: '#06B6D4' }],
  ready:      [{ label: 'Recogido',   icon: 'moped',        iconLib: 'material',   next: 'picked_up',  color: '#3B82F6' }],
  picked_up:  [{ label: 'En camino',  icon: 'near-me',      iconLib: 'material',   next: 'on_the_way', color: '#3B82F6' }],
  on_the_way: [],
  delivered:  [],
  cancelled:  [],
}

// ─── Iconos ───────────────────────────────────────────────────────────────────

const BackIcon = ({ color = '#000' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

const RefreshIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M1 4v6h6M23 20v-6h-6" />
    <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
  </Svg>
)

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ManageOrders({ navigation }: Props) {
  const { adminAccess } = useAuth()
  const negocioId = adminAccess?.negocioId ?? null
  const { colors, isDark } = useTheme()
  const [pedidos, setPedidos]       = useState<PedidoNegocio[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchPedidos = useCallback(async () => {
    if (!negocioId) { setIsLoading(false); setRefreshing(false); return }

    try {
      // Step 1: pedidos + client profile
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id, order_number, estado, total, subtotal, costo_envio,
          notas, direccion_entrega, creado_en,
          profiles(nombre, apellido, telefono)
        `)
        .eq('negocio_id', negocioId)
        .neq('estado', 'delivered')
        .neq('estado', 'cancelled')
        .neq('estado', 'refunded')
        .order('creado_en', { ascending: false })

      if (pedidosError) throw pedidosError

      const pedidoIds = (pedidosData ?? []).map((p: any) => p.id)

      // Step 2: items via SECURITY DEFINER RPC
      const itemsMap: Record<string, PedidoItem[]> = {}
      if (pedidoIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .rpc('get_pedido_items_for_negocio', { p_negocio_id: negocioId })

        for (const item of (itemsData ?? []) as any[]) {
          if (!itemsMap[item.pedido_id]) itemsMap[item.pedido_id] = []
          itemsMap[item.pedido_id].push({
            id:              item.id,
            nombre:          item.nombre,
            precio_unitario: Number(item.precio_unitario),
            cantidad:        item.cantidad,
            subtotal:        Number(item.subtotal),
            notas:           item.notas ?? null,
          })
        }
      }

      setPedidos((pedidosData ?? []).map((row: any) => ({
        id:              row.id,
        orderNumber:     row.order_number,
        status:          row.estado as PedidoEstado,
        total:           Number(row.total),
        subtotal:        Number(row.subtotal),
        costoEnvio:      Number(row.costo_envio),
        notas:           row.notas ?? null,
        deliveryAddress: row.direccion_entrega ?? null,
        date:            row.creado_en,
        clienteNombre:   (row.profiles as any)?.nombre  ?? null,
        clienteApellido: (row.profiles as any)?.apellido ?? null,
        clienteTelefono: (row.profiles as any)?.telefono ?? null,
        items:           itemsMap[row.id] ?? [],
      })))
    } catch (e) {
      console.warn('fetchPedidos error:', e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [negocioId])

  useEffect(() => { if (negocioId) fetchPedidos() }, [negocioId, fetchPedidos])

  // Realtime — nuevo pedido
  useEffect(() => {
    if (!negocioId) return
    const channel = supabase
      .channel(`negocios:${negocioId}:pedidos`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos', filter: `negocio_id=eq.${negocioId}` }, fetchPedidos)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [negocioId, fetchPedidos])

  const cambiarEstado = async (pedidoId: string, nuevoEstado: PedidoEstado) => {
    setUpdatingId(pedidoId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { Alert.alert('Error', 'Sesión expirada.'); return }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!response.ok) {
        let detail = `Error ${response.status}`
        try { const err = await response.json(); detail = err.detail ?? err.message ?? detail } catch (_) {}
        Alert.alert('Error al actualizar', detail)
        return
      }

      setPedidos(prev =>
        prev
          .map(p => p.id === pedidoId ? { ...p, status: nuevoEstado } : p)
          .filter(p => !['delivered', 'cancelled'].includes(p.status))
      )
    } catch (e: any) {
      Alert.alert('Error de conexión', e?.message ?? 'No se pudo conectar con el servidor')
    } finally {
      setUpdatingId(null)
    }
  }

  const renderPedido = (pedido: PedidoNegocio) => {
    const estadoInfo = ESTADO_CONFIG[pedido.status]
    const acciones   = ACCIONES[pedido.status] ?? []
    const isUpdating = updatingId === pedido.id
    const clienteNombreCompleto = [pedido.clienteNombre, pedido.clienteApellido].filter(Boolean).join(' ') || 'Cliente'
    const green = isDark ? '#4ade80' : '#16a34a'

    return (
      <View key={pedido.id} style={[styles.card, { backgroundColor: colors.cardBg }]}>

        {/* ── Header ── */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.orderNumber, { color: colors.titleText }]}>{pedido.orderNumber}</Text>
            <Text style={[styles.fecha, { color: colors.subtitleText }]}>
              {new Date(pedido.date).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
            <Text style={[styles.estadoText, { color: estadoInfo.color }]}>{estadoInfo.label}</Text>
          </View>
        </View>

        {/* ── Cliente ── */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={14} color={colors.subtitleText} />
            <Text style={[styles.infoText, { color: colors.titleText }]}>{clienteNombreCompleto}</Text>
          </View>
          {pedido.clienteTelefono ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={14} color={colors.subtitleText} />
              <Text style={[styles.infoText, { color: colors.subtitleText }]}>{pedido.clienteTelefono}</Text>
            </View>
          ) : null}
          {pedido.deliveryAddress ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={14} color={colors.subtitleText} />
              <Text style={[styles.infoText, { color: colors.subtitleText, flex: 1 }]} numberOfLines={2}>{pedido.deliveryAddress}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Notas ── */}
        {pedido.notas ? (
          <View style={[styles.noteBox, { backgroundColor: isDark ? '#FEF3C715' : '#FEF3C7' }]}>
            <MaterialIcons name="sticky-note-2" size={13} color={isDark ? '#F59E0B' : '#92400E'} />
            <Text style={[styles.noteText, { color: isDark ? '#F59E0B' : '#92400E' }]}>{pedido.notas}</Text>
          </View>
        ) : null}

        {/* ── Productos ── */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.subtitleText }]}>PRODUCTOS</Text>
          {pedido.items.length === 0 ? (
            <Text style={[styles.infoText, { color: colors.subtitleText, fontStyle: 'italic' }]}>Sin productos registrados</Text>
          ) : (
            pedido.items.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={[styles.badge, { backgroundColor: isDark ? '#15803d40' : '#DCFCE7' }]}>
                  <Text style={[styles.badgeText, { color: isDark ? '#4ade80' : '#166534' }]}>{item.cantidad}</Text>
                </View>
                <Text style={[styles.itemNombre, { color: colors.titleText }]}>{item.nombre}</Text>
                <Text style={[styles.itemPrecio, { color: green }]}>${item.subtotal.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Totales ── */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.subtitleText }]}>Subtotal</Text>
            <Text style={[styles.totalValue, { color: colors.titleText }]}>${pedido.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.subtitleText }]}>Envío</Text>
            <Text style={[styles.totalValue, { color: colors.titleText }]}>${pedido.costoEnvio.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabelBold, { color: colors.titleText }]}>Total</Text>
            <Text style={[styles.totalValueBold, { color: green }]}>${pedido.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── Acciones ── */}
        {acciones.length > 0 && (
          <View style={styles.accionesRow}>
            {isUpdating ? (
              <ActivityIndicator color="#22c55e" style={{ marginTop: 8 }} />
            ) : (
              acciones.map(accion => (
                <TouchableOpacity
                  key={accion.next}
                  style={[styles.accionBtn, { backgroundColor: accion.color }]}
                  onPress={() => cambiarEstado(pedido.id, accion.next)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {accion.iconLib === 'material'
                      ? <MaterialIcons name={accion.icon as any} size={14} color="#fff" />
                      : <MaterialCommunityIcons name={accion.icon as any} size={14} color="#fff" />}
                    <Text style={styles.accionBtnText}>{accion.label}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { backgroundColor: colors.pageBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon color={colors.titleText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.titleText }]}>Pedidos Activos</Text>
        <TouchableOpacity onPress={fetchPedidos} style={styles.backBtn}>
          <RefreshIcon />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={[styles.loadingText, { color: colors.subtitleText }]}>Cargando pedidos...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchPedidos() }}
              tintColor="#22c55e"
            />
          }
        >
          {pedidos.length === 0 ? (
            <View style={styles.center}>
              <MaterialIcons name="check-circle" size={56} color="#22c55e" />
              <Text style={[styles.emptyTitle, { color: colors.titleText }]}>Sin pedidos activos</Text>
              <Text style={[styles.emptyText, { color: colors.subtitleText }]}>Los nuevos pedidos aparecerán aquí automáticamente</Text>
            </View>
          ) : (
            pedidos.map(renderPedido)
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn:     { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  card: {
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  orderNumber: { fontSize: 15, fontWeight: 'bold' },
  fecha:       { fontSize: 12, marginTop: 2 },

  estadoBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  estadoText:  { fontSize: 13, fontWeight: '600' },

  section: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  infoText: { fontSize: 13, lineHeight: 18 },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 4,
    padding: 10,
    borderRadius: 10,
  },
  noteText: { fontSize: 13, flex: 1 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  badge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, minWidth: 28, alignItems: 'center' },
  badgeText: { fontWeight: '700', fontSize: 13 },
  itemNombre: { fontSize: 14, flex: 1 },
  itemPrecio: { fontSize: 14, fontWeight: '600' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel:     { fontSize: 13 },
  totalValue:     { fontSize: 13, fontWeight: '500' },
  totalLabelBold: { fontSize: 15, fontWeight: '700' },
  totalValueBold: { fontSize: 17, fontWeight: '800' },

  accionesRow: { flexDirection: 'row', gap: 10, padding: 16, paddingTop: 4 },
  accionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  accionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: 'bold', marginBottom: 8, marginTop: 16 },
  emptyText:   { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
})
