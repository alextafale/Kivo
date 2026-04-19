import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useDomicilios } from '../../../application/context/DomiciliosContext'
import { useAuth } from '../../../application/context/AuthContext'
import type { Domicilio } from '../../../domain/entities/Domicilio'

import { useCart } from '../../../application/context/CartContext'
import { supabase } from '../../../config/supabaseConfig'
import { useTheme } from '../../../application/context/ThemeContext'

type OrderSummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderSummary'>
type OrderSummaryRouteProp = RouteProp<RootStackParamList, 'OrderSummary'>

type Props = {
  navigation: OrderSummaryNavigationProp
  route: OrderSummaryRouteProp
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = ({ color = '#000' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

const LocationIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
)

const NoteIcon = ({ color = '#6B7280' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </Svg>
)

const CheckIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="m20 6-11 11-5-5" />
  </Svg>
)

const ChevronIcon = ({ color = '#9CA3AF' }: { color?: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
)

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OrderSummary({ navigation, route }: Props) {
  console.log("Estas en orderSummary");
  const { colors, isDark } = useTheme();
  const { restaurants } = route.params
  const { clearCart } = useCart()

  const [notas, setNotas] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDomicilio, setSelectedDomicilio] = useState<Domicilio | null>(null)
  const [showDomicilios, setShowDomicilios] = useState(false)

  const { domicilios, fetchDomicilios, defaultDomicilio, isLoading: loadingDomicilios } = useDomicilios()
  const { session } = useAuth()

  useEffect(() => {
    fetchDomicilios()
  }, [])

  useEffect(() => {
    if (defaultDomicilio && !selectedDomicilio) {
      setSelectedDomicilio(defaultDomicilio)
    }
  }, [defaultDomicilio])

  // Calcula totales globales sumando todos los restaurantes
  const subtotalGeneral = restaurants.reduce(
    (acc, r) => acc + r.items.reduce((a, i) => a + i.price * i.quantity, 0), 0
  )
  const costoEnvioGeneral = restaurants.reduce((acc, r) => acc + r.costoEnvio, 0)
  const totalGeneral = subtotalGeneral + costoEnvioGeneral

  const getDireccion = (d: Domicilio) =>
    `${d.calle} ${d.numeroExt ?? ''}${d.numeroInt ? ' Int. ' + d.numeroInt : ''}, ${d.colonia ?? ''}, ${d.ciudad ?? ''}`

  /**
   * handleConfirmar — hace un POST /pedidos por cada restaurante en paralelo
   * usando Promise.all para esperar a que todos terminen antes de navegar.
   * Si alguno falla, muestra el error y no navega.
   */
  const handleConfirmar = async () => {
    if (!selectedDomicilio) {
      alert('Selecciona una dirección de entrega')
      return
    }
    if (!session?.accessToken) {
      alert('Sesión expirada, vuelve a iniciar sesión')
      return
    }

    setIsSubmitting(true)

    try {
      // Hacer un POST por cada restaurante en paralelo
      const results = await Promise.all(
        restaurants.map(async (restaurant) => {
          const body = {
            sucursal_id: restaurant.sucursalId,
            domicilio_id: selectedDomicilio.id,
            notas: notas.trim() || null,
            propina: 0,
            items: restaurant.items.map(item => ({
              nombre: item.name,
              precio_unitario: item.price,
              cantidad: item.quantity,
            })),
          }

          const res = await fetch(`${process.env.API_BASE_URL}/pedidos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify(body),
          })

          const rawText = await res.text()

          if (!res.ok) {
            let detail = 'Error al crear pedido'
            try {
              const error = JSON.parse(rawText)
              detail = error.detail ?? detail
            } catch {
              detail = rawText || `HTTP ${res.status}`
            }
            throw new Error(`${restaurant.negocioNombre}: ${detail}`)
          }

          let pedido: any
          try {
            pedido = JSON.parse(rawText)
          } catch {
            throw new Error(`${restaurant.negocioNombre}: Respuesta inválida del servidor: "${rawText.slice(0, 100)}"`)
          }

          return {
            orderNumber: pedido.order_number,
            negocioNombre: restaurant.negocioNombre,
            total: restaurant.items.reduce((acc, i) => acc + i.price * i.quantity, 0) + restaurant.costoEnvio,
          }
        })
      )

      clearCart()

      navigation.navigate('OrderConfirmation', {
        orders: results,
        totalGeneral,
      })

    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al confirmar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.pageBg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon color={colors.titleText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.titleText }]}>Resumen del Pedido</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Selector de domicilio */}
          <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
            <View style={styles.sectionHeader}>
              <LocationIcon color={colors.titleText} />
              <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Dirección de entrega</Text>
            </View>

            {loadingDomicilios ? (
              <ActivityIndicator size="small" color="#22c55e" />
            ) : domicilios.length === 0 ? (
              <TouchableOpacity
                style={[styles.addDomicilioButton, { backgroundColor: isDark ? '#15803d40' : '#F0FDF4', borderColor: isDark ? '#22c55e' : '#BBF7D0' }]}
                onPress={() => navigation.navigate('AddAddress')}
              >
                <Text style={styles.addDomicilioText}>+ Agregar dirección</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.domicilioSelected, { backgroundColor: colors.pageBg, borderColor: colors.border }]}
                  onPress={() => setShowDomicilios(!showDomicilios)}
                >
                  <View style={styles.domicilioSelectedInfo}>
                    <Text style={[styles.domicilioEtiqueta, { color: colors.titleText }]}>
                      {selectedDomicilio?.alias ?? 'Selecciona una dirección'}
                    </Text>
                    {selectedDomicilio && (
                      <Text style={[styles.domicilioDireccion, { color: colors.subtitleText }]} numberOfLines={1}>
                        {getDireccion(selectedDomicilio)}
                      </Text>
                    )}
                  </View>
                  <ChevronIcon />
                </TouchableOpacity>

                {showDomicilios && domicilios.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.domicilioOption,
                      { backgroundColor: colors.pageBg, borderColor: colors.border },
                      selectedDomicilio?.id === d.id && { borderColor: '#22c55e', backgroundColor: isDark ? '#15803d40' : '#F0FDF4' }
                    ]}
                    onPress={() => {
                      setSelectedDomicilio(d)
                      setShowDomicilios(false)
                    }}
                  >
                    <View style={styles.domicilioOptionInfo}>
                      <Text style={[styles.domicilioEtiqueta, { color: colors.titleText }]}>{d.alias}</Text>
                      <Text style={[styles.domicilioDireccion, { color: colors.subtitleText }]} numberOfLines={1}>
                        {getDireccion(d)}
                      </Text>
                    </View>
                    {selectedDomicilio?.id === d.id && <CheckIcon />}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>

          {/* Items agrupados por restaurante */}
          {restaurants.map((restaurant, rIndex) => {
            const subtotal = restaurant.items.reduce(
              (acc, i) => acc + i.price * i.quantity, 0
            )
            return (
              <View key={rIndex} style={[styles.card, { backgroundColor: colors.cardBg }]}>
                <Text style={[styles.cardTitle, { color: colors.titleText }]}>{restaurant.negocioNombre}</Text>
                {restaurant.items.map((item, index) => (
                  <View key={index} style={[styles.itemRow, { borderBottomColor: colors.rowDivider }]}>
                    <View style={[styles.itemQtyBadge, { backgroundColor: isDark ? '#15803d40' : '#F0FDF4' }]}>
                      <Text style={styles.itemQtyText}>{item.quantity}</Text>
                    </View>
                    <Text style={[styles.itemName, { color: colors.titleText }]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, { color: colors.titleText }]}>${(item.price * item.quantity).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={[styles.restaurantSubtotal, { borderTopColor: colors.rowDivider }]}>
                  <Text style={[styles.subtotalLabel, { color: colors.subtitleText }]}>Subtotal</Text>
                  <Text style={[styles.subtotalValue, { color: colors.titleText }]}>${subtotal.toFixed(2)}</Text>
                </View>
              </View>
            )
          })}

          {/* Notas */}
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.sectionHeader}>
              <NoteIcon color={colors.titleText} />
              <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Notas (opcional)</Text>
            </View>
            <TextInput
              style={[styles.notasInput, { backgroundColor: colors.pageBg, borderColor: colors.border, color: colors.titleText }]}
              placeholder="Ej: Sin cebolla, extra salsa..."
              placeholderTextColor={colors.placeholderText}
              value={notas}
              onChangeText={setNotas}
              multiline
              maxLength={200}
            />
          </View>

          {/* Desglose de totales */}
          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Desglose</Text>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.subtitleText }]}>Subtotal</Text>
              <Text style={[styles.totalValue, { color: colors.titleText }]}>${subtotalGeneral.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.subtitleText }]}>Costo de envío</Text>
              <Text style={[styles.totalValue, { color: colors.titleText }]}>
                {costoEnvioGeneral === 0 ? 'Gratis' : `$${costoEnvioGeneral.toFixed(2)}`}
              </Text>
            </View>
            <View style={[styles.totalDivider, { backgroundColor: colors.rowDivider }]} />
            <View style={styles.totalRow}>
              <Text style={[styles.totalFinalLabel, { color: colors.titleText }]}>Total</Text>
              <Text style={[styles.totalFinalValue, { color: colors.titleText }]}>${totalGeneral.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Botón confirmar */}
        <View style={[styles.footer, { backgroundColor: colors.pageBg, borderTopColor: colors.rowDivider }]}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmar}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.confirmButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
                  <Text style={styles.confirmButtonTotal}>${totalGeneral.toFixed(2)}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  addDomicilioButton: { paddingVertical: 12, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  addDomicilioText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  domicilioSelected: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  domicilioSelectedInfo: { flex: 1 },
  domicilioOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 8 },
  domicilioOptionSelected: { borderColor: '#22c55e', backgroundColor: '#F0FDF4' },
  domicilioOptionInfo: { flex: 1 },
  domicilioEtiqueta: { fontSize: 14, fontWeight: '700', color: '#000' },
  domicilioDireccion: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemQtyBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  itemName: { flex: 1, fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#000' },
  restaurantSubtotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  subtotalLabel: { fontSize: 14, color: '#6B7280' },
  subtotalValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  notasInput: { backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#374151', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 72, textAlignVertical: 'top' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  totalDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  totalFinalLabel: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  totalFinalValue: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  footer: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  confirmButton: { borderRadius: 16, overflow: 'hidden' },
  confirmButtonGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  confirmButtonTotal: { fontSize: 18, fontWeight: 'bold', color: '#000' },
})