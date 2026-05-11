import React, { useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Alert, Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Polyline } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useCart } from '../../../application/context/CartContext'
import { useTheme } from '../../../application/context/ThemeContext'
import { compartirOrdenesWhatsApp } from '../../../../services/ticketService'

type OrderConfirmationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>
type OrderConfirmationRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>

type Props = {
  navigation: OrderConfirmationNavigationProp
  route: OrderConfirmationRouteProp
}

const CheckIcon = ({ size = 32, color = '#22c55e' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
)

const OrdersIcon = ({ color = '#fff' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <Path d="M9 3h6v4H9z" />
    <Path d="M9 12h6M9 16h4" />
  </Svg>
)

const HomeIcon = ({ color = '#374151' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
)

const WhatsAppIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2" strokeLinecap="round">
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
)

const StoreIcon = ({ color = '#16a34a' }: { color?: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
)

export default function OrderConfirmation({ navigation, route }: Props) {
  const { colors, isDark } = useTheme()
  const { orders, totalGeneral } = route.params
  const { clearCart } = useCart()
  const whatsappPrompted = useRef(false)

  const scaleAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    clearCart()

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, damping: 14, stiffness: 160, useNativeDriver: true }),
    ]).start()

    Animated.timing(slideAnim, { toValue: 0, duration: 420, delay: 200, useNativeDriver: true }).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start()

    if (whatsappPrompted.current) return
    whatsappPrompted.current = true

    const fecha = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    setTimeout(() => {
      Alert.alert(
        'Recibir ticket por WhatsApp',
        'Te compartimos el resumen de tu pedido.',
        [
          { text: 'No, gracias', style: 'cancel' },
          { text: 'Enviar', onPress: () => compartirOrdenesWhatsApp(orders, totalGeneral, fecha) },
        ],
        { cancelable: true }
      )
    }, 800)
  }, [])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO SUCCESS ── */}
        <Animated.View style={[styles.heroWrap, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={isDark ? ['#0d1a0d', '#111f11', colors.pageBg] : ['#F0FDF4', '#DCFCE7', colors.pageBg]}
            style={styles.heroBg}
            locations={[0, 0.5, 1]}
          />

          {/* Pulse ring */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseRing,
              { borderColor: '#22c55e', transform: [{ scale: pulseAnim }], opacity: 0.25 },
            ]}
          />

          {/* Check circle */}
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.checkGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <CheckIcon size={36} color="#fff" />
            </LinearGradient>
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: slideAnim }], alignItems: 'center' }}>
            <Text style={[styles.heroTitle, { color: colors.titleText }]}>
              {orders.length === 1 ? '¡Pedido confirmado!' : '¡Pedidos confirmados!'}
            </Text>
            <Text style={[styles.heroSub, { color: colors.subtitleText }]}>
              {orders.length === 1
                ? 'Tu pedido está siendo preparado'
                : `${orders.length} pedidos están siendo preparados`}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* ── CARDS DE PEDIDOS ── */}
        <Animated.View style={[styles.cardsWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {orders.map((order, index) => (
            <View
              key={index}
              style={[styles.orderCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              {/* Header del card */}
              <View style={styles.cardHeader}>
                <View style={[styles.storeIconWrap, { backgroundColor: isDark ? '#15803d30' : '#F0FDF4' }]}>
                  <StoreIcon color={isDark ? '#4ade80' : '#16a34a'} />
                </View>
                <Text style={[styles.cardNegocio, { color: colors.titleText }]} numberOfLines={1}>
                  {order.negocioNombre}
                </Text>
                <View style={[styles.statusChip, { backgroundColor: isDark ? '#15803d20' : '#DCFCE7' }]}>
                  <View style={styles.statusDot} />
                  <Text style={[styles.statusText, { color: isDark ? '#4ade80' : '#166534' }]}>En proceso</Text>
                </View>
              </View>

              {/* Divisor */}
              <View style={[styles.cardDivider, { borderColor: colors.border }]} />

              {/* Número + total */}
              <View style={styles.cardBody}>
                <View>
                  <Text style={[styles.cardFieldLabel, { color: colors.subtitleText }]}>Número de pedido</Text>
                  <Text style={[styles.cardOrderNum, { color: isDark ? '#4ade80' : '#16a34a' }]}>
                    {order.orderNumber}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.cardFieldLabel, { color: colors.subtitleText }]}>Total</Text>
                  <Text style={[styles.cardTotal, { color: colors.titleText }]}>
                    ${order.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Total general si hay más de un pedido */}
          {orders.length > 1 && (
            <View style={[styles.totalCard, { backgroundColor: isDark ? '#0d1a0d' : '#111827' }]}>
              <Text style={styles.totalCardLabel}>Total general</Text>
              <Text style={styles.totalCardValue}>${totalGeneral.toFixed(2)}</Text>
            </View>
          )}

          {/* Mensaje */}
          <Text style={[styles.message, { color: colors.subtitleText }]}>
            Puedes seguir el estado de tu pedido en la sección de pedidos.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── BOTONES ── */}
      <Animated.View style={[styles.footer, { backgroundColor: colors.pageBg, borderTopColor: colors.border, opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.primaryBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <OrdersIcon />
            <Text style={styles.primaryBtnText}>Ver mis pedidos</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: isDark ? '#0d1a0d' : '#F0FDF4', borderColor: isDark ? '#15803d40' : '#BBF7D0' }]}
            onPress={() => {
              const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              compartirOrdenesWhatsApp(orders, totalGeneral, fecha)
            }}
            activeOpacity={0.8}
          >
            <WhatsAppIcon />
            <Text style={[styles.secondaryBtnText, { color: isDark ? '#4ade80' : '#16a34a' }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.cardBg, borderColor: colors.border, flex: 1.4 }]}
            onPress={() => navigation.navigate('HomeFeed')}
            activeOpacity={0.8}
          >
            <HomeIcon color={colors.titleText} />
            <Text style={[styles.secondaryBtnText, { color: colors.titleText }]}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 16 },

  // Hero
  heroWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  pulseRing: {
    position: 'absolute',
    width: 140, height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  checkCircle: {
    width: 90, height: 90,
    borderRadius: 45,
    marginBottom: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  checkGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Cards
  cardsWrap: {
    paddingHorizontal: 20,
    gap: 12,
  },
  orderCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  storeIconWrap: {
    width: 32, height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNegocio: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
  },
  statusDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    borderTopWidth: 1,
    marginHorizontal: 14,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    paddingTop: 12,
  },
  cardFieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardOrderNum: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTotal: {
    fontSize: 20,
    fontWeight: '800',
  },

  // Total general
  totalCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  totalCardValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#22c55e',
    letterSpacing: -0.5,
  },

  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },

  // Footer buttons
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  primaryBtn: { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
})
