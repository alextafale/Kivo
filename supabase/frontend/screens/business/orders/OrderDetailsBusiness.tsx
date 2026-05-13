import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { supabase } from '../../../config/supabaseConfig'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../application/context/ThemeContext';

type OrderDetailBusinessNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetailsBusiness'>;
type OrderDetailBusinessrRouteProp = RouteProp<RootStackParamList, 'OrderDetailsBusiness'>;

type Props = {
  navigation: OrderDetailBusinessNavigationProp;
  route: OrderDetailBusinessrRouteProp;
};

interface OrderItem {
  id: string
  nombre: string
  precio_unitario: string
  cantidad: number
  subtotal: string
  notas: string | null
}

const BackIcon = ({ color = '#000' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

export default function OrderDetail({ route, navigation }: Props) {
  const { pedidoId } = route.params
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { colors, isDark } = useTheme()

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pedido_items')
        .select('id, nombre, precio_unitario, cantidad, subtotal, notas')
        .eq('pedido_id', pedidoId)

      if (error) throw error
      setItems(data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [pedidoId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.pageBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon color={colors.titleText} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.titleText }]}>Detalles de pedido</Text>

        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>

              {/* TOP */}
              <View style={styles.rowTop}>
                <View style={[styles.badge, { backgroundColor: isDark ? '#15803d40' : '#DCFCE7' }]}>
                  <Text style={[styles.badgeText, { color: isDark ? '#4ade80' : '#166534' }]}>{item.cantidad}</Text>
                </View>

                <Text style={[styles.itemName, { color: colors.titleText }]}>{item.nombre}</Text>
              </View>

              {/* NOTAS */}
              {item.notas && (
                <View style={[styles.noteBox, { backgroundColor: isDark ? '#FEF3C715' : '#FEF3C7' }]}>
                  <Text style={[styles.noteText, { color: isDark ? '#F59E0B' : '#92400E' }]}>{item.notas}</Text>
                </View>
              )}

              {/* FOOTER */}
              <View style={styles.footer}>
                <Text style={[styles.unitPrice, { color: colors.subtitleText }]}>
                  ${Number(item.precio_unitario).toFixed(2)} c/u
                </Text>

                <Text style={[styles.price, { color: isDark ? '#4ade80' : '#16a34a' }]}>
                  ${Number(item.subtotal).toFixed(2)}
                </Text>
              </View>

            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>

  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },

    elevation: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 10,
  },
  badgeText: {
    color: '#166534',
    fontWeight: '700',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  noteBox: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: '#92400E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitPrice: {
    fontSize: 13,
    color: '#6B7280',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})