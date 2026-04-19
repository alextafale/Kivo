import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, 
  StatusBar, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { supabase } from '../../../config/supabaseConfig'
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

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

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

export default function OrderDetail({ route, navigation }: Props) {
  const { pedidoId } = route.params
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`${process.env.API_BASE_URL}/pedidos/${pedidoId}/items`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Pedido</Text>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.itemRow}>
                <View style={styles.infoCol}>
                  <Text style={styles.itemName}>{item.cantidad}x {item.nombre}</Text>
                  {item.notas && <Text style={styles.notas}>Nota: {item.notas}</Text>}
                </View>
                <Text style={styles.price}>${Number(item.subtotal).toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#22c55e' },
  notas: { fontSize: 12, color: '#92400E', marginTop: 4, fontStyle: 'italic' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})