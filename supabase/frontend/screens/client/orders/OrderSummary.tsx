import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useCupon } from '../../../application/hooks/useCupon'
import type { OrderItem } from '../../../types/order'

type OrderSummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderSummary'>
type OrderSummaryRouteProp = RouteProp<RootStackParamList, 'OrderSummary'>

type Props = {
  navigation: OrderSummaryNavigationProp
  route: OrderSummaryRouteProp
}

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

const TagIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <Circle cx="7" cy="7" r="1.5" fill="#22c55e" stroke="none" />
  </Svg>
)

const CheckIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <Path d="m20 6-11 11-5-5" />
  </Svg>
)

const XIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

const CloseSmallIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

const LocationIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
)

const NoteIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </Svg>
)

// ─── Componente principal ─────────────────────────────────────────────────────

export default function OrderSummary({ navigation, route }: Props) {
  const { items, negocioId, negocioNombre, direccionEntrega, costoEnvio } = route.params

  const [notas, setNotas] = useState('')

  // Calcula subtotal a partir de los items
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  const {
    codigo,
    validacion,
    isValidating,
    descuentoAplicado,
    onCodigoChange,
    aplicarCupon,
    limpiarCupon,
  } = useCupon(negocioId, subtotal)

  const total = subtotal - descuentoAplicado + (costoEnvio ?? 0)

  const handleConfirmar = () => {
    // Navega a confirmación de pago pasando el cupón aplicado si existe
    navigation.navigate('ConfirmPayment', {
      items,
      negocioId,
      subtotal,
      descuento: descuentoAplicado,
      costoEnvio: costoEnvio ?? 0,
      total,
      codigoCupon: validacion?.valido ? codigo : undefined,
      cuponId: validacion?.cupon?.id,
      notas: notas.trim() || undefined,
      direccionEntrega,
    })
  }

  // Estado visual del campo de cupón
  const cuponEstado = (() => {
    if (isValidating) return 'validating'
    if (!validacion) return 'idle'
    return validacion.valido ? 'valid' : 'invalid'
  })()

  const cuponBorderColor = {
    idle: '#E5E7EB',
    validating: '#E5E7EB',
    valid: '#22c55e',
    invalid: '#EF4444',
  }[cuponEstado]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resumen del Pedido</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Negocio */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{negocioNombre}</Text>
            <View style={styles.row}>
              <LocationIcon />
              <Text style={styles.cardSubtitle}>{direccionEntrega}</Text>
            </View>
          </View>

          {/* Items del pedido */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tu pedido</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemQtyBadge}>
                  <Text style={styles.itemQtyText}>{item.quantity}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Notas */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <NoteIcon />
              <Text style={styles.sectionTitle}>Notas (opcional)</Text>
            </View>
            <TextInput
              style={styles.notasInput}
              placeholder="Ej: Sin cebolla, extra salsa..."
              placeholderTextColor="#9CA3AF"
              value={notas}
              onChangeText={setNotas}
              multiline
              maxLength={200}
            />
          </View>

          {/* Campo de cupón */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <TagIcon />
              <Text style={styles.sectionTitle}>Código de cupón</Text>
            </View>

            <View style={[styles.cuponInputContainer, { borderColor: cuponBorderColor }]}>
              <TextInput
                style={styles.cuponInput}
                placeholder="Ingresa tu código"
                placeholderTextColor="#9CA3AF"
                value={codigo}
                onChangeText={onCodigoChange}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              {/* Indicador de estado a la derecha del input */}
              <View style={styles.cuponInputRight}>
                {isValidating && (
                  <ActivityIndicator size="small" color="#22c55e" />
                )}
                {!isValidating && cuponEstado === 'valid' && <CheckIcon />}
                {!isValidating && cuponEstado === 'invalid' && <XIcon />}
                {!isValidating && cuponEstado === 'idle' && codigo.length > 0 && (
                  <TouchableOpacity onPress={limpiarCupon}>
                    <CloseSmallIcon />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Botón Aplicar — solo visible si no está validando ni ya aplicado */}
            {cuponEstado === 'idle' && codigo.length >= 3 && (
              <TouchableOpacity style={styles.aplicarButton} onPress={aplicarCupon}>
                <Text style={styles.aplicarButtonText}>Aplicar cupón</Text>
              </TouchableOpacity>
            )}

            {/* Feedback de validación */}
            {cuponEstado === 'valid' && validacion && (
              <View style={styles.cuponFeedbackValid}>
                <CheckIcon />
                <Text style={styles.cuponFeedbackValidText}>
                  {validacion.cupon?.descripcion ?? '¡Cupón aplicado!'} — Ahorras ${descuentoAplicado.toFixed(2)}
                </Text>
              </View>
            )}
            {cuponEstado === 'invalid' && validacion && (
              <View style={styles.cuponFeedbackInvalid}>
                <XIcon />
                <Text style={styles.cuponFeedbackInvalidText}>
                  {validacion.mensajeError ?? 'Cupón no válido'}
                </Text>
              </View>
            )}
          </View>

          {/* Desglose de totales */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Desglose</Text>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
            </View>

            {descuentoAplicado > 0 && (
              <View style={styles.totalRow}>
                <View style={styles.descuentoLabel}>
                  <TagIcon />
                  <Text style={styles.descuentoText}>Descuento ({codigo})</Text>
                </View>
                <Text style={styles.descuentoValue}>-${descuentoAplicado.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Costo de envío</Text>
              <Text style={styles.totalValue}>
                {costoEnvio === 0 ? 'Gratis' : `$${(costoEnvio ?? 0).toFixed(2)}`}
              </Text>
            </View>

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Botón confirmar fijo al fondo */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmar}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.confirmButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
              <Text style={styles.confirmButtonTotal}>${total.toFixed(2)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FFFFFF',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 6 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginLeft: 6, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  // Items
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemQtyBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  itemName: { flex: 1, fontSize: 14, color: '#374151' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#000' },

  // Notas
  notasInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#374151',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 72,
    textAlignVertical: 'top',
  },

  // Cupón
  cuponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  cuponInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
    paddingVertical: 10,
  },
  cuponInputRight: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aplicarButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  aplicarButtonText: { fontSize: 14, fontWeight: '700', color: '#16a34a' },
  cuponFeedbackValid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
  },
  cuponFeedbackValidText: { fontSize: 13, color: '#15803d', fontWeight: '500', flex: 1 },
  cuponFeedbackInvalid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
  },
  cuponFeedbackInvalidText: { fontSize: 13, color: '#DC2626', fontWeight: '500', flex: 1 },

  // Totales
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  descuentoLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  descuentoText: { fontSize: 14, color: '#16a34a', fontWeight: '500' },
  descuentoValue: { fontSize: 14, color: '#16a34a', fontWeight: '700' },
  totalDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },
  totalFinalLabel: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  totalFinalValue: { fontSize: 20, fontWeight: 'bold', color: '#000' },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  confirmButton: { borderRadius: 16, overflow: 'hidden' },
  confirmButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  confirmButtonTotal: { fontSize: 18, fontWeight: 'bold', color: '#000' },
})