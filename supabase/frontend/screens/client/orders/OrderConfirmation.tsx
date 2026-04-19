import React, { useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useCart } from '../../../application/context/CartContext'
import { useTheme } from '../../../application/context/ThemeContext'

type OrderConfirmationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>
type OrderConfirmationRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>

type Props = {
  navigation: OrderConfirmationNavigationProp
  route: OrderConfirmationRouteProp
}

const CheckIcon = () => (
  <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
)

export default function OrderConfirmation({ navigation, route }: Props) {
   console.log("Estas en order confirmation");
  const { colors, isDark } = useTheme();
  const { orders, totalGeneral } = route.params
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Icono de éxito */}
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#15803d40' : '#F0FDF4' }]}>
          <CheckIcon />
        </View>

        <Text style={[styles.title, { color: colors.titleText }]}>¡Pedidos Confirmados!</Text>
        <Text style={[styles.subtitle, { color: colors.subtitleText }]}>
          {orders.length === 1 ? '1 pedido realizado' : `${orders.length} pedidos realizados`}
        </Text>

        {/* Un card por cada pedido */}
        {orders.map((order, index) => (
          <View key={index} style={[styles.orderCard, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
            <Text style={[styles.orderNegocio, { color: colors.titleText }]}>{order.negocioNombre}</Text>
            <View style={styles.orderRow}>
              <Text style={[styles.orderNumberLabel, { color: colors.subtitleText }]}>Número de pedido</Text>
              <Text style={[styles.orderNumber, isDark && { color: '#4ade80' }]}>{order.orderNumber}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={[styles.orderTotalLabel, { color: colors.subtitleText }]}>Total</Text>
              <Text style={[styles.orderTotal, { color: colors.titleText }]}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        ))}

        {/* Total general */}
        {orders.length > 1 && (
          <View style={[styles.totalCard, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
            <Text style={[styles.totalLabel, { color: colors.titleText }]}>Total general</Text>
            <Text style={[styles.totalValue, { color: colors.titleText }]}>${totalGeneral.toFixed(2)}</Text>
          </View>
        )}

        <Text style={[styles.message, { color: colors.subtitleText }]}>
          Tus pedidos han sido recibidos y están siendo preparados. Puedes rastrear el estado en "Mis Pedidos".
        </Text>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Botones */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.trackButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.trackButtonText}>Ver Mis Pedidos</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: colors.border }]}
          onPress={() => navigation.navigate('HomeFeed')}
        >
          <Text style={[styles.homeButtonText, { color: colors.titleText }]}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F9FAFB' },
  scroll:           { alignItems: 'center', paddingHorizontal: 24, paddingTop: 40 },
  iconContainer:    { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title:            { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 8, textAlign: 'center' },
  subtitle:         { fontSize: 16, color: '#6B7280', marginBottom: 24, textAlign: 'center' },
  orderCard:        { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: '100%', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderNegocio:     { fontSize: 15, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  orderRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  orderNumberLabel: { fontSize: 13, color: '#6B7280' },
  orderNumber:      { fontSize: 15, fontWeight: 'bold', color: '#22c55e', letterSpacing: 1 },
  orderTotalLabel:  { fontSize: 13, color: '#6B7280' },
  orderTotal:       { fontSize: 15, fontWeight: 'bold', color: '#000' },
  totalCard:        { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: '100%', marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  totalLabel:       { fontSize: 16, fontWeight: 'bold', color: '#000' },
  totalValue:       { fontSize: 20, fontWeight: 'bold', color: '#000' },
  message:          { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  footer:           { padding: 20, gap: 12 },
  trackButton:      { borderRadius: 16, overflow: 'hidden' },
  trackButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  trackButtonText:  { fontSize: 16, fontWeight: 'bold', color: '#000' },
  homeButton:       { paddingVertical: 16, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center' },
  homeButtonText:   { fontSize: 16, fontWeight: '600', color: '#374151' },
})