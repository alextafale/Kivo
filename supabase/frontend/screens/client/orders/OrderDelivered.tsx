import React, { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'

type OrderDeliveredNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDelivered'>
type OrderDeliveredRouteProp = RouteProp<RootStackParamList, 'OrderDelivered'>

type Props = {
  navigation: OrderDeliveredNavigationProp
  route: OrderDeliveredRouteProp
}

const CheckIcon = () => (
  <Svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
)

/**
 * OrderDelivered — Pantalla de pedido entregado
 *
 * Se muestra cuando el estado del pedido cambia a 'delivered'
 * via Realtime. Muestra un resumen del pedido y opciones
 * para calificar o volver al inicio.
 */
export default function OrderDelivered({ navigation, route }: Props) {
  const { orderNumber, restaurantName, total, deliveryAddress } = route.params

  const scaleAnim  = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Animated.View style={[styles.content, { opacity: opacityAnim }]}>

        {/* Icono animado */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <CheckIcon />
          <Text style={styles.iconEmoji}>🎉</Text>
        </Animated.View>

        <Text style={styles.title}>¡Pedido Entregado!</Text>
        <Text style={styles.subtitle}>Esperamos que lo disfrutes</Text>

        {/* Resumen */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Restaurante</Text>
            <Text style={styles.summaryValue}>{restaurantName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Número de pedido</Text>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dirección</Text>
            <Text style={[styles.summaryValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {deliveryAddress}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total pagado</Text>
            <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

      </Animated.View>

      {/* Botones */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.ordersButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ordersButtonText}>Ver Mis Pedidos</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('HomeFeed')}
        >
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F9FAFB' },
  content:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconContainer:      { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  iconEmoji:          { position: 'absolute', bottom: -4, right: -4, fontSize: 32 },
  title:              { fontSize: 26, fontWeight: 'bold', color: '#000', marginBottom: 8, textAlign: 'center' },
  subtitle:           { fontSize: 16, color: '#6B7280', marginBottom: 32, textAlign: 'center' },
  summaryCard:        { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryLabel:       { fontSize: 14, color: '#6B7280' },
  summaryValue:       { fontSize: 14, fontWeight: '600', color: '#000' },
  summaryTotalLabel:  { fontSize: 16, fontWeight: 'bold', color: '#000' },
  summaryTotalValue:  { fontSize: 20, fontWeight: 'bold', color: '#000' },
  divider:            { height: 1, backgroundColor: '#F3F4F6' },
  footer:             { padding: 20, gap: 12 },
  ordersButton:       { borderRadius: 16, overflow: 'hidden' },
  ordersButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  ordersButtonText:   { fontSize: 16, fontWeight: 'bold', color: '#000' },
  homeButton:         { paddingVertical: 16, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center' },
  homeButtonText:     { fontSize: 16, fontWeight: '600', color: '#374151' },
})