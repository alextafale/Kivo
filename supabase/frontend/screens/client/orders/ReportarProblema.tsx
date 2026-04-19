// screens/client/orders/ReportarProblema.tsx
// Pantalla de reporte de queja con resolución automática vía LLM

import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, AlertTriangle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'

type Nav  = NativeStackNavigationProp<RootStackParamList, 'ReportarProblema'>
type Ruta = RouteProp<RootStackParamList, 'ReportarProblema'>

type Props = { navigation: Nav; route: Ruta }

// ─── Iconos ──────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

const WarnIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Path d="M12 9v4M12 17h.01" />
  </Svg>
)

const CheckIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
)

const GiftIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
    <Path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </Svg>
)

const RefundIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5M12 7v5l4 2" />
  </Svg>
)

const HeartIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="#F43F5E" stroke="#F43F5E" strokeWidth="2">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
)

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface QuejaContexto {
  pedido_id: string
  order_number: string | null
  estado: string
  total: number
  tiempo_entrega_real_min: number | null
  tiempo_estimado_min: number | null
  items: { nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]
  historial_quejas_30d: { pedido_id: string; accion: string; monto: number | null; created_at: string }[]
  negocio_nombre: string | null
  sucursal_nombre: string | null
}

interface Resolucion {
  queja_id: string
  pedido_id: string
  accion: 'reembolso_parcial' | 'cupon' | 'disculpa'
  monto: number | null
  razon_interna: string
  mensaje_usuario: string
}

// ─── Pasos del flujo ──────────────────────────────────────────────────────────

type Paso = 'confirmar' | 'cargando_contexto' | 'contexto' | 'procesando' | 'resultado' | 'error'

// ─── Pantalla ─────────────────────────────────────────────────────────────────

export default function ReportarProblema({ navigation, route }: Props) {
  const { orderId, orderNumber, total } = route.params
  const { session } = useAuth()

  const [paso, setPaso] = useState<Paso>('confirmar')
  const [contexto, setContexto] = useState<QuejaContexto | null>(null)
  const [resolucion, setResolucion] = useState<Resolucion | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const apiBase = process.env.API_BASE_URL ?? 'https://kivo-v1.onrender.com/api/v1'
  const headers = {
    Authorization: `Bearer ${session?.accessToken}`,
    'Content-Type': 'application/json',
  }

  // ── Paso 1: obtener contexto ──────────────────────────────────────────────
  const cargarContexto = async () => {
    setPaso('cargando_contexto')
    try {
      const res = await fetch(`${apiBase}/orders/${orderId}/queja`, {
        method: 'POST',
        headers,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail ?? `Error ${res.status}`)
      }
      const data: QuejaContexto = await res.json()
      setContexto(data)
      setPaso('contexto')
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al obtener el contexto')
      setPaso('error')
    }
  }

  // ── Paso 2: solicitar resolución al LLM ───────────────────────────────────
  const solicitarResolucion = async () => {
    setPaso('procesando')
    try {
      const res = await fetch(`${apiBase}/orders/${orderId}/resolucion`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}), // sin override → el LLM decide
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail ?? `Error ${res.status}`)
      }
      const data: Resolucion = await res.json()
      setResolucion(data)
      setPaso('resultado')
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al procesar la queja')
      setPaso('error')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportar Problema</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── PASO 0: Confirmar ────────────────────────────────────────── */}
        {paso === 'confirmar' && (
          <>
            <View style={styles.warnCard}>
              <View style={styles.warnIconWrap}><WarnIcon /></View>
              <Text style={styles.warnTitle}>¿Tuviste un problema?</Text>
              <Text style={styles.warnSub}>
                Te ayudaremos a resolverlo automáticamente. Revisaremos los detalles
                de tu pedido y tomaremos la mejor decisión.
              </Text>
            </View>

            {/* Resumen del pedido */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionLabel}>Tu pedido</Text>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Número</Text>
                <Text style={[styles.summaryVal, { color: '#22c55e' }]}>{orderNumber}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Total</Text>
                <Text style={[styles.summaryVal, { fontWeight: 'bold' }]}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                🤖 Nuestro asistente de IA analizará tu caso y decidirá si aplica
                un <Text style={{ fontWeight: 'bold' }}>reembolso parcial</Text>,
                un <Text style={{ fontWeight: 'bold' }}>cupón de descuento</Text> o
                una <Text style={{ fontWeight: 'bold' }}>disculpa</Text>.
              </Text>
            </View>
          </>
        )}

        {/* ── PASO 1: Cargando contexto ────────────────────────────────── */}
        {paso === 'cargando_contexto' && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={styles.loadingTitle}>Obteniendo datos del pedido…</Text>
            <Text style={styles.loadingSubtitle}>Revisando historial, tiempos y artículos</Text>
          </View>
        )}

        {/* ── PASO 2: Contexto cargado — mostrar info ──────────────────── */}
        {paso === 'contexto' && contexto && (
          <>
            <View style={styles.contextCard}>
              <Text style={styles.sectionLabel}>Resumen para análisis</Text>

              {/* Tiempos */}
              {contexto.tiempo_estimado_min != null && (
                <View style={styles.timeRow}>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeNum}>{contexto.tiempo_estimado_min} min</Text>
                    <Text style={styles.timeLabel}>Estimado</Text>
                  </View>
                  <View style={styles.timeSep} />
                  <View style={styles.timeBox}>
                    <Text style={[
                      styles.timeNum,
                      contexto.tiempo_entrega_real_min != null &&
                      contexto.tiempo_entrega_real_min > contexto.tiempo_estimado_min + 10
                        ? { color: '#EF4444' } : { color: '#22c55e' }
                    ]}>
                      {contexto.tiempo_entrega_real_min != null
                        ? `${contexto.tiempo_entrega_real_min} min` : '—'}
                    </Text>
                    <Text style={styles.timeLabel}>Real</Text>
                  </View>
                </View>
              )}

              {/* Items */}
              <Text style={styles.itemsLabel}>Artículos del pedido</Text>
              {contexto.items.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.cantidad}× {item.nombre}</Text>
                  <Text style={styles.itemPrice}>${item.subtotal.toFixed(2)}</Text>
                </View>
              ))}

              {/* Historial */}
              {contexto.historial_quejas_30d.length > 0 && (
                <View style={styles.historialBox}>
                  <Text style={styles.historialTitle}>
                    ⚠️ {contexto.historial_quejas_30d.length} queja(s) en los últimos 30 días
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.nota}>
              Al continuar, el asistente de IA analizará esta información y tomará una decisión.
            </Text>
          </>
        )}

        {/* ── PASO 3: Procesando ───────────────────────────────────────── */}
        {paso === 'procesando' && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingTitle}>El asistente está analizando tu caso…</Text>
            <Text style={styles.loadingSubtitle}>Esto puede tardar unos segundos</Text>
          </View>
        )}

        {/* ── PASO 4: Resultado ────────────────────────────────────────── */}
        {paso === 'resultado' && resolucion && (
          <>
            <View style={styles.resultCard}>
              <View style={styles.resultIcon}>
                {resolucion.accion === 'reembolso_parcial' && <RefundIcon />}
                {resolucion.accion === 'cupon' && <GiftIcon />}
                {resolucion.accion === 'disculpa' && <HeartIcon />}
              </View>

              <Text style={styles.resultTitle}>
                {resolucion.accion === 'reembolso_parcial' && 'Reembolso Parcial'}
                {resolucion.accion === 'cupon' && 'Cupón de Descuento'}
                {resolucion.accion === 'disculpa' && 'Lo sentimos mucho'}
              </Text>

              {resolucion.monto != null && (
                <Text style={styles.resultMonto}>${resolucion.monto.toFixed(2)} MXN</Text>
              )}

              <Text style={styles.resultMsg}>{resolucion.mensaje_usuario}</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                🎫 ID de caso: <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {resolucion.queja_id.slice(0, 8).toUpperCase()}
                </Text>
              </Text>
            </View>
          </>
        )}

        {/* ── ERROR ────────────────────────────────────────────────────── */}
        {paso === 'error' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Algo salió mal</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setPaso('confirmar')}>
              <Text style={styles.retryText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Botones de acción ─────────────────────────────────────────────── */}
      <View style={styles.footer}>

        {paso === 'confirmar' && (
          <TouchableOpacity onPress={cargarContexto} style={styles.btnPrimary}>
            <LinearGradient colors={['#F97316', '#ea580c']} style={styles.gradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnPrimaryText}>Continuar →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {paso === 'contexto' && (
          <>
            <TouchableOpacity onPress={solicitarResolucion} style={styles.btnPrimary}>
              <LinearGradient colors={['#8B5CF6', '#7c3aed']} style={styles.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnPrimaryText}>Solicitar resolución automática 🤖</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.goBack()}>
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {paso === 'resultado' && (
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Orders')}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.gradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnPrimaryText}>Ver mis pedidos</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  )
}

// ─── Estilos ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F9FAFB' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:        { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:    { fontSize: 18, fontWeight: 'bold', color: '#000' },
  body:           { padding: 20, paddingBottom: 40 },
  footer:         { padding: 20, gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },

  // Warn card
  warnCard:       { backgroundColor: '#FFF7ED', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FED7AA' },
  warnIconWrap:   { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  warnTitle:      { fontSize: 20, fontWeight: 'bold', color: '#C2410C', marginBottom: 8, textAlign: 'center' },
  warnSub:        { fontSize: 14, color: '#9A3412', textAlign: 'center', lineHeight: 22 },

  // Summary
  summaryCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionLabel:   { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryKey:     { fontSize: 14, color: '#6B7280' },
  summaryVal:     { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider:        { height: 1, backgroundColor: '#F3F4F6' },

  // Info box
  infoBox:        { backgroundColor: '#F0F9FF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  infoText:       { fontSize: 14, color: '#0369A1', lineHeight: 22 },

  // Loading
  loadingWrap:    { alignItems: 'center', paddingVertical: 60 },
  loadingTitle:   { fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 20, textAlign: 'center' },
  loadingSubtitle:{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' },

  // Context card
  contextCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  timeRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timeBox:        { flex: 1, alignItems: 'center' },
  timeNum:        { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  timeLabel:      { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  timeSep:        { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  itemsLabel:     { fontSize: 13, fontWeight: '700', color: '#9CA3AF', marginBottom: 12, textTransform: 'uppercase' },
  itemRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName:       { fontSize: 14, color: '#374151' },
  itemPrice:      { fontSize: 14, fontWeight: '600', color: '#111827' },
  historialBox:   { marginTop: 12, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A' },
  historialTitle: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  nota:           { fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 8, lineHeight: 20 },

  // Result
  resultCard:     { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resultIcon:     { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultTitle:    { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  resultMonto:    { fontSize: 36, fontWeight: 'bold', color: '#22c55e', marginBottom: 12 },
  resultMsg:      { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 24 },

  // Error
  errorCard:      { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  errorTitle:     { fontSize: 18, fontWeight: 'bold', color: '#B91C1C', marginBottom: 8 },
  errorMsg:       { fontSize: 14, color: '#7F1D1D', textAlign: 'center', marginBottom: 20 },
  retryBtn:       { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444' },
  retryText:      { fontSize: 15, fontWeight: 'bold', color: '#fff' },

  // Buttons
  btnPrimary:     { borderRadius: 16, overflow: 'hidden' },
  gradient:       { paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  btnSecondary:   { paddingVertical: 14, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center' },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: '#374151' },
})
