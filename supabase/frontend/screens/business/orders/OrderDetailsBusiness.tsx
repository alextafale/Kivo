import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { supabase } from '../../../config/supabaseConfig'
import { useTheme } from '../../../application/context/ThemeContext'
import { MaterialIcons } from '@expo/vector-icons'

type Nav  = NativeStackNavigationProp<RootStackParamList, 'OrderDetailsBusiness'>
type Route = RouteProp<RootStackParamList, 'OrderDetailsBusiness'>

type Props = { navigation: Nav; route: Route }

interface PedidoHeader {
  order_number: string
  estado: string
  direccion_entrega: string | null
  notas: string | null
  subtotal: string
  costo_envio: string
  total: string
  creado_en: string
}

interface OrderItem {
  id: string
  nombre: string
  precio_unitario: string
  cantidad: number
  subtotal: string
  notas: string | null
}

const ESTADO_LABEL: Record<string, string> = {
  pending:    'Pendiente',
  confirmed:  'Confirmado',
  preparing:  'Preparando',
  ready:      'Listo',
  picked_up:  'Recogido',
  on_the_way: 'En camino',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
}

const BackIcon = ({ color = '#000' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

export default function OrderDetailsBusiness({ route, navigation }: Props) {
  const { pedidoId } = route.params
  const { colors, isDark } = useTheme()

  const [header, setHeader]     = useState<PedidoHeader | null>(null)
  const [items, setItems]       = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [headerRes, itemsRes] = await Promise.all([
        supabase
          .from('pedidos')
          .select('order_number, estado, direccion_entrega, notas, subtotal, costo_envio, total, creado_en')
          .eq('id', pedidoId)
          .single(),
        supabase
          .from('pedido_items')
          .select('id, nombre, precio_unitario, cantidad, subtotal, notas')
          .eq('pedido_id', pedidoId),
      ])

      if (headerRes.error) throw headerRes.error
      setHeader(headerRes.data as PedidoHeader)
      setItems((itemsRes.data ?? []) as OrderItem[])
    } catch (e) {
      console.error('OrderDetailsBusiness fetch error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [pedidoId])

  useEffect(() => { fetchData() }, [fetchData])

  const green  = isDark ? '#4ade80' : '#16a34a'
  const cardBg = colors.cardBg

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER NAV */}
      <View style={[styles.navBar, { backgroundColor: colors.pageBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon color={colors.titleText} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.titleText }]}>Detalles del pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : !header ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.subtitleText }]}>No se pudo cargar el pedido.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* RESUMEN DEL PEDIDO */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.orderNumber, { color: colors.titleText }]}>{header.order_number}</Text>
              <View style={[styles.estadoBadge, { backgroundColor: isDark ? '#16a34a30' : '#DCFCE7' }]}>
                <Text style={[styles.estadoText, { color: green }]}>
                  {ESTADO_LABEL[header.estado] ?? header.estado}
                </Text>
              </View>
            </View>

            {header.direccion_entrega ? (
              <View style={styles.infoRow}>
                <MaterialIcons name="location-on" size={14} color={colors.subtitleText} />
                <Text style={[styles.infoText, { color: colors.subtitleText }]}>{header.direccion_entrega}</Text>
              </View>
            ) : null}

            {header.notas ? (
              <View style={[styles.noteBox, { backgroundColor: isDark ? '#FEF3C715' : '#FEF3C7' }]}>
                <MaterialIcons name="sticky-note-2" size={13} color={isDark ? '#F59E0B' : '#92400E'} />
                <Text style={[styles.noteText, { color: isDark ? '#F59E0B' : '#92400E' }]}>{header.notas}</Text>
              </View>
            ) : null}

            <View style={[styles.divider, { borderTopColor: colors.border }]} />

            <View style={styles.totalsBlock}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.subtitleText }]}>Subtotal</Text>
                <Text style={[styles.totalValue, { color: colors.titleText }]}>${Number(header.subtotal).toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.subtitleText }]}>Envío</Text>
                <Text style={[styles.totalValue, { color: colors.titleText }]}>${Number(header.costo_envio).toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabelBold, { color: colors.titleText }]}>Total</Text>
                <Text style={[styles.totalValueBold, { color: green }]}>${Number(header.total).toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* ITEMS */}
          <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Productos</Text>

          {items.length === 0 ? (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.emptyText, { color: colors.subtitleText }]}>Sin productos registrados para este pedido.</Text>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: cardBg }]}>
                <View style={styles.itemTop}>
                  <View style={[styles.badge, { backgroundColor: isDark ? '#15803d40' : '#DCFCE7' }]}>
                    <Text style={[styles.badgeText, { color: isDark ? '#4ade80' : '#166534' }]}>{item.cantidad}</Text>
                  </View>
                  <Text style={[styles.itemName, { color: colors.titleText }]}>{item.nombre}</Text>
                </View>

                {item.notas ? (
                  <View style={[styles.noteBox, { backgroundColor: isDark ? '#FEF3C715' : '#FEF3C7' }]}>
                    <Text style={[styles.noteText, { color: isDark ? '#F59E0B' : '#92400E' }]}>{item.notas}</Text>
                  </View>
                ) : null}

                <View style={styles.itemFooter}>
                  <Text style={[styles.unitPrice, { color: colors.subtitleText }]}>
                    ${Number(item.precio_unitario).toFixed(2)} c/u
                  </Text>
                  <Text style={[styles.itemSubtotal, { color: green }]}>
                    ${Number(item.subtotal).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navTitle:  { fontSize: 18, fontWeight: '700' },
  backBtn:   { width: 40, height: 40, justifyContent: 'center' },

  scroll: { padding: 16 },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber:  { fontSize: 16, fontWeight: '700' },
  estadoBadge:  { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  estadoText:   { fontSize: 13, fontWeight: '600' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteText: { fontSize: 13, flex: 1 },

  divider: { borderTopWidth: 1, marginVertical: 12 },

  totalsBlock: { gap: 6 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel:     { fontSize: 14, fontWeight: '400' },
  totalValue:     { fontSize: 14, fontWeight: '500' },
  totalLabelBold: { fontSize: 15, fontWeight: '700' },
  totalValueBold: { fontSize: 18, fontWeight: '800' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },

  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 10,
  },
  badgeText: { fontWeight: '700' },
  itemName:  { fontSize: 15, fontWeight: '600', flex: 1 },

  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitPrice:    { fontSize: 13 },
  itemSubtotal: { fontSize: 17, fontWeight: '700' },

  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
})
