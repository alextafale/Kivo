// screens/business/orders/ManageOrders.tsx

import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { supabase } from '../../../config/supabaseConfig'
import { useAuth } from '../../../application/context/AuthContext'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ManageOrders'>
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PedidoEstado =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'picked_up' | 'on_the_way'
  | 'delivered' | 'cancelled'

interface PedidoNegocio {
  id: string
  orderNumber: string
  status: PedidoEstado
  total: number
  subtotal: number
  costoEnvio: number
  notas: string | null
  deliveryAddress: string
  date: string
  clienteNombre: string | null
  clienteTelefono: string | null
}

// ─── Configuración visual por estado ─────────────────────────────────────────

const ESTADO_CONFIG: Record<PedidoEstado, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  confirmed: { label: 'Confirmado', color: '#8B5CF6', bg: '#EDE9FE' },
  preparing: { label: 'Preparando', color: '#F97316', bg: '#FFF7ED' },
  ready: { label: 'Listo', color: '#06B6D4', bg: '#ECFEFF' },
  picked_up: { label: 'Recogido', color: '#3B82F6', bg: '#EFF6FF' },
  on_the_way: { label: 'En camino', color: '#3B82F6', bg: '#EFF6FF' },
  delivered: { label: 'Entregado', color: '#22c55e', bg: '#F0FDF4' },
  cancelled: { label: 'Cancelado', color: '#EF4444', bg: '#FEF2F2' },
}

// Botones de acción según estado actual
const ACCIONES: Record<PedidoEstado, { label: string; next: PedidoEstado; color: string }[]> = {
  pending: [{ label: '✅ Aceptar', next: 'confirmed', color: '#22c55e' },
  { label: '❌ Cancelar', next: 'cancelled', color: '#EF4444' }],
  confirmed: [{ label: '👨‍🍳 Preparando', next: 'preparing', color: '#F97316' },
  { label: '❌ Cancelar', next: 'cancelled', color: '#EF4444' }],
  preparing: [{ label: '📦 Listo', next: 'ready', color: '#06B6D4' }],
  ready: [{ label: '🛵 Recogido', next: 'picked_up', color: '#3B82F6' }],
  picked_up: [{ label: '🗺️ En camino', next: 'on_the_way', color: '#3B82F6' }],
  on_the_way: [],
  delivered: [],
  cancelled: [],
}

// ─── Iconos ───────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
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
  const [pedidos, setPedidos] = useState<PedidoNegocio[]>([])
  const [isLoading, setIsLoading] = useState(!negocioId)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  // Obtener el negocio del usuario autenticado


  const fetchPedidos = useCallback(async () => {
    if (!negocioId) {
      setIsLoading(false)
      setRefreshing(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setIsLoading(false)
        setRefreshing(false)
        return
      }

      const response = await fetch(`${process.env.API_BASE_URL}/negocios/${negocioId}/pedidos`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPedidos(data)
      }
    } catch (e) {
      console.warn(e)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [negocioId])



  useEffect(() => {
    if (negocioId) fetchPedidos()
  }, [negocioId, fetchPedidos])

  // Suscripción Realtime — escuchar nuevos pedidos del negocio
  useEffect(() => {
    if (!negocioId) return

    const channel = supabase
      .channel(`negocios:${negocioId}:pedidos`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `negocio_id=eq.${negocioId}`,
        },
        () => {
          // Nuevo pedido → recargar lista
          fetchPedidos()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [negocioId, fetchPedidos])

  const cambiarEstado = async (pedidoId: string, nuevoEstado: PedidoEstado) => {
    setUpdatingId(pedidoId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        Alert.alert('Error', 'Sesión expirada. Vuelve a iniciar sesión.')
        return
      }

      const response = await fetch(`${process.env.API_BASE_URL}/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!response.ok) {
        let detail = `Error ${response.status}`
        try {
          const err = await response.json()
          detail = err.detail ?? err.message ?? detail
        } catch (_) { }
        Alert.alert('Error al actualizar', detail)
        return
      }

      // Actualizar estado local sin re-fetch
      setPedidos((prev) =>
        prev
          .map((p) => p.id === pedidoId ? { ...p, status: nuevoEstado } : p)
          .filter((p) => !['delivered', 'cancelled'].includes(p.status))
      )
    } catch (e: any) {
      Alert.alert('Error de conexión', e?.message ?? 'No se pudo conectar con el servidor')
    } finally {
      setUpdatingId(null)
    }
  }

  const renderPedido = (pedido: PedidoNegocio) => {
    const estadoInfo = ESTADO_CONFIG[pedido.status]
    const acciones = ACCIONES[pedido.status] ?? []
    const isUpdating = updatingId === pedido.id

    return (
      <TouchableOpacity
        key={pedido.id}
        style={styles.card}
        onPress={() => navigation.navigate('OrderDetailsBusiness', { pedidoId: pedido.id })}
      >

        {/* Header del pedido */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>{pedido.orderNumber}</Text>
            <Text style={styles.clienteNombre}>{pedido.clienteNombre ?? 'Cliente'}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoInfo.bg }]}>
            <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
              {estadoInfo.label}
            </Text>
          </View>
        </View>

        {/* Dirección */}
        <Text style={styles.direccion} numberOfLines={2}>
          📍 {pedido.deliveryAddress}
        </Text>

        {/* Notas */}
        {pedido.notas && (
          <Text style={styles.notas}>📝 {pedido.notas}</Text>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${Number(pedido.total).toFixed(2)}</Text>
        </View>

        {/* Botones de acción */}
        {acciones.length > 0 && (
          <View style={styles.accionesRow}>
            {isUpdating ? (
              <ActivityIndicator color="#22c55e" style={{ marginTop: 8 }} />
            ) : (
              acciones.map((accion) => (
                <TouchableOpacity
                  key={accion.next}
                  style={[styles.accionBtn, { backgroundColor: accion.color }]}
                  onPress={() => cambiarEstado(pedido.id, accion.next)}
                >
                  <Text style={styles.accionBtnText}>{accion.label}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos Activos</Text>
        <TouchableOpacity onPress={fetchPedidos} style={styles.backBtn}>
          <RefreshIcon />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
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
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Sin pedidos activos</Text>
              <Text style={styles.emptyText}>Los nuevos pedidos aparecerán aquí automáticamente</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  clienteNombre: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  estadoText: { fontSize: 13, fontWeight: '600' },

  direccion: { fontSize: 13, color: '#6B7280', marginBottom: 6, lineHeight: 18 },
  notas: { fontSize: 13, color: '#92400E', backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, marginBottom: 8 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 6,
  },
  totalLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#000' },

  accionesRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  accionBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  accionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { color: '#6B7280', marginTop: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
})