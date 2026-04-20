// screens/client/orders/ReportarProblema.tsx
// Pantalla de reporte de queja con resolución automática vía LLM
// v2: visualización de desglose de tiempos granulares (negocio vs repartidor)

import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'
import { useTheme } from '../../../application/context/ThemeContext'

type Nav = NativeStackNavigationProp<RootStackParamList, 'ReportarProblema'>
type Ruta = RouteProp<RootStackParamList, 'ReportarProblema'>
type Props = { navigation: Nav; route: Ruta }

// ─── Iconos ──────────────────────────────────────────────────────────────────

const BackIcon = ({ color = '#000' }: { color?: string }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)
const WarnIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <Path d="M12 9v4M12 17h.01" />
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

// ─── Tipos (v2 — incluye campos de tiempos granulares) ────────────────────────

interface QuejaContexto {
  pedido_id: string
  order_number: string | null
  estado: string
  total: number
  negocio_nombre: string | null
  sucursal_nombre: string | null

  // Tiempo estimado vs real
  tiempo_estimado_min: number | null
  tiempo_entrega_real_min: number | null

  // Desglose por responsable (v2)
  tiempo_negocio_min: number | null
  tiempo_repartidor_min: number | null
  tiempo_espera_repartidor_min: number | null

  // Promedios históricos del negocio (v2)
  avg_tiempo_negocio_min: number | null
  avg_tiempo_repartidor_min: number | null
  avg_tiempo_total_min: number | null
  total_pedidos_historico: number

  items: { nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[]
  historial_quejas_30d: { pedido_id: string; accion: string; monto: number | null; created_at: string }[]
}

interface Resolucion {
  queja_id: string
  pedido_id: string
  accion: 'reembolso_parcial' | 'cupon' | 'disculpa'
  monto: number | null
  razon_interna: string
  mensaje_usuario: string
}

type Paso = 'confirmar' | 'cargando_contexto' | 'contexto' | 'procesando' | 'resultado' | 'error'

// ─── Helpers de visualización ─────────────────────────────────────────────────

// Determina si un tiempo supera el promedio histórico en más de un 30%
function excedePromedio(valor: number | null, promedio: number | null): boolean {
  if (valor == null || promedio == null || promedio === 0) return false
  return valor > promedio * 1.3
}

// ─── Subcomponente: fila de desglose de tiempo ────────────────────────────────

function FilaTiempo({
  emoji,
  label,
  valor,
  promedio,
  colors,
  isDark,
}: {
  emoji: string
  label: string
  valor: number | null
  promedio: number | null
  colors: any
  isDark: boolean
}) {
  if (valor == null) return null
  const excede = excedePromedio(valor, promedio)

  return (
    <View style={ft.fila}>
      <Text style={ft.emoji}>{emoji}</Text>
      <View style={ft.info}>
        <Text style={[ft.label, { color: colors.subtitleText }]}>{label}</Text>
        {promedio != null && (
          <Text style={[ft.promedio, { color: colors.subtitleText }]}>
            promedio del negocio: {promedio} min
          </Text>
        )}
      </View>
      <View style={ft.derecha}>
        <Text style={[ft.valor, excede ? ft.valorAlto : { color: isDark ? '#4ade80' : '#22c55e' }]}>
          {valor} min
        </Text>
        {excede && <Text style={ft.badge}>⬆️ Alto</Text>}
      </View>
    </View>
  )
}

const ft = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  emoji: { fontSize: 20, marginRight: 12, marginTop: 2 },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  promedio: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  derecha: { alignItems: 'flex-end' },
  valor: { fontSize: 16, fontWeight: '700' },
  valorAlto: { color: '#EF4444' },
  badge: { fontSize: 11, color: '#EF4444', marginTop: 2 },
})

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ReportarProblema({ navigation, route }: Props) {
  const { orderId, orderNumber, total } = route.params
  const { session } = useAuth()
  const { colors, isDark } = useTheme()

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
      setContexto(await res.json())
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
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail ?? `Error ${res.status}`)
      }
      setResolucion(await res.json())
      setPaso('resultado')
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error al procesar la queja')
      setPaso('error')
    }
  }

  // ── Cálculo de retraso ────────────────────────────────────────────────────
  const retrasoMin =
    contexto?.tiempo_entrega_real_min != null && contexto?.tiempo_estimado_min != null
      ? contexto.tiempo_entrega_real_min - contexto.tiempo_estimado_min
      : null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.pageBg, borderBottomColor: colors.rowDivider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <BackIcon color={colors.titleText} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.titleText }]}>Reportar Problema</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* ── PASO 0: Confirmar ──────────────────────────────────────── */}
        {paso === 'confirmar' && (
          <>
            <View style={[s.warnCard, { backgroundColor: isDark ? '#FFF7ED15' : '#FFF7ED', borderColor: isDark ? '#FED7AA30' : '#FED7AA' }]}>
              <View style={[s.warnIconWrap, { backgroundColor: isDark ? '#FFEDD520' : '#FFEDD5' }]}>
                <WarnIcon />
              </View>
              <Text style={[s.warnTitle, { color: isDark ? '#EA580C' : '#C2410C' }]}>¿Tuviste un problema?</Text>
              <Text style={[s.warnSub, { color: isDark ? '#FDBA74' : '#9A3412' }]}>
                Revisaremos los tiempos reales de tu pedido y decidiremos la compensación más justa.
              </Text>
            </View>

            <View style={[s.summaryCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[s.sectionLabel, { color: colors.subtitleText }]}>Tu pedido</Text>
              <View style={[s.divider, { backgroundColor: colors.rowDivider }]} />
              <View style={s.summaryRow}>
                <Text style={[s.summaryKey, { color: colors.subtitleText }]}>Número</Text>
                <Text style={[s.summaryVal, { color: isDark ? '#4ade80' : '#22c55e' }]}>{orderNumber}</Text>
              </View>
              <View style={[s.divider, { backgroundColor: colors.rowDivider }]} />
              <View style={s.summaryRow}>
                <Text style={[s.summaryKey, { color: colors.subtitleText }]}>Total</Text>
                <Text style={[s.summaryVal, { fontWeight: 'bold', color: colors.titleText }]}>${total.toFixed(2)}</Text>
              </View>
            </View>

            <View style={[s.infoBox, { backgroundColor: isDark ? '#082f49' : '#F0F9FF', borderColor: isDark ? '#0c4a6e' : '#BAE6FD' }]}>
              <Text style={[s.infoText, { color: isDark ? '#38bdf8' : '#0369A1' }]}>
                🤖 Nuestro mediador IA analizará quién fue responsable del retraso y decidirá si aplica un{' '}
                <Text style={{ fontWeight: 'bold' }}>reembolso parcial</Text>,{' '}
                <Text style={{ fontWeight: 'bold' }}>cupón</Text> o{' '}
                <Text style={{ fontWeight: 'bold' }}>disculpa</Text>.
              </Text>
            </View>
          </>
        )}

        {/* ── PASO 1: Cargando contexto ──────────────────────────────── */}
        {paso === 'cargando_contexto' && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#F97316" />
            <Text style={[s.loadingTitle, { color: colors.titleText }]}>Obteniendo datos del pedido…</Text>
            <Text style={[s.loadingSubtitle, { color: colors.subtitleText }]}>Revisando tiempos reales y historial</Text>
          </View>
        )}

        {/* ── PASO 2: Contexto cargado ───────────────────────────────── */}
        {paso === 'contexto' && contexto && (
          <>
            {/* Resumen de tiempo total */}
            <View style={[s.timeCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[s.sectionLabel, { color: colors.subtitleText }]}>Tiempo de entrega</Text>
              <View style={s.timeRow}>
                <View style={s.timeBox}>
                  <Text style={[s.timeNum, { color: colors.titleText }]}>
                    {contexto.tiempo_estimado_min != null ? `${contexto.tiempo_estimado_min} min` : '—'}
                  </Text>
                  <Text style={[s.timeLabel, { color: colors.subtitleText }]}>Estimado</Text>
                </View>
                <View style={[s.timeSep, { backgroundColor: colors.border }]} />
                <View style={s.timeBox}>
                  <Text style={[
                    s.timeNum,
                    retrasoMin != null && retrasoMin > 10
                      ? { color: isDark ? '#f87171' : '#EF4444' }
                      : { color: isDark ? '#4ade80' : '#22c55e' },
                  ]}>
                    {contexto.tiempo_entrega_real_min != null ? `${contexto.tiempo_entrega_real_min} min` : '—'}
                  </Text>
                  <Text style={[s.timeLabel, { color: colors.subtitleText }]}>Real</Text>
                </View>
              </View>

              {/* Badge de retraso */}
              {retrasoMin != null && retrasoMin > 0 && (
                <View style={[s.retraso, { backgroundColor: isDark ? '#7f1d1d30' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' }]}>
                  <Text style={[s.retrasoTxt, { color: isDark ? '#f87171' : '#B91C1C' }]}>
                    ⚠️ Tu pedido llegó {retrasoMin} min tarde
                  </Text>
                </View>
              )}
            </View>

            {/* Desglose por responsable — el diferenciador vs Uber */}
            {(contexto.tiempo_negocio_min != null ||
              contexto.tiempo_repartidor_min != null ||
              contexto.tiempo_espera_repartidor_min != null) && (
                <View style={[s.contextCard, { backgroundColor: colors.cardBg }]}>
                  <Text style={[s.sectionLabel, { color: colors.subtitleText }]}>¿Dónde ocurrió el retraso?</Text>
                  <Text style={[s.desgloseSubtitle, { color: colors.subtitleText }]}>
                    Comparado con el historial de {contexto.total_pedidos_historico} pedidos recientes del negocio
                  </Text>

                  <FilaTiempo
                    emoji="🍳"
                    label="Preparación del negocio"
                    valor={contexto.tiempo_negocio_min}
                    promedio={contexto.avg_tiempo_negocio_min}
                    colors={colors}
                    isDark={isDark}
                  />
                  <FilaTiempo
                    emoji="⏳"
                    label="Espera del repartidor en el negocio"
                    valor={contexto.tiempo_espera_repartidor_min}
                    promedio={null}
                    colors={colors}
                    isDark={isDark}
                  />
                  <FilaTiempo
                    emoji="🛵"
                    label="Trayecto del repartidor"
                    valor={contexto.tiempo_repartidor_min}
                    promedio={contexto.avg_tiempo_repartidor_min}
                    colors={colors}
                    isDark={isDark}
                  />
                </View>
              )}

            {/* Items del pedido */}
            <View style={[s.contextCard, { backgroundColor: colors.cardBg }]}>
              <Text style={[s.sectionLabel, { color: colors.subtitleText }]}>Artículos</Text>
              {contexto.items.map((item, i) => (
                <View key={i} style={s.itemRow}>
                  <Text style={[s.itemName, { color: colors.titleText }]}>{item.cantidad}× {item.nombre}</Text>
                  <Text style={[s.itemPrice, { color: colors.titleText }]}>${item.subtotal.toFixed(2)}</Text>
                </View>
              ))}
            </View>

            {/* Historial de quejas — solo si hay */}
            {contexto.historial_quejas_30d.length > 0 && (
              <View style={[s.historialBox, { backgroundColor: isDark ? '#FEF3C710' : '#FEF3C7', borderColor: isDark ? '#FDE68A30' : '#FDE68A' }]}>
                <Text style={[s.historialTitle, { color: isDark ? '#F59E0B' : '#92400E' }]}>
                  ⚠️ Tienes {contexto.historial_quejas_30d.length} queja(s) en los últimos 30 días
                </Text>
                <Text style={[s.historialSub, { color: isDark ? '#FCD34D' : '#78350F' }]}>
                  El mediador tomará esto en cuenta al decidir.
                </Text>
              </View>
            )}

            <Text style={[s.nota, { color: colors.subtitleText }]}>
              Al continuar, el mediador IA analizará esta información y tomará la decisión más justa.
            </Text>
          </>
        )}

        {/* ── PASO 3: Procesando ────────────────────────────────────── */}
        {paso === 'procesando' && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={[s.loadingTitle, { color: colors.titleText }]}>El mediador IA está analizando tu caso…</Text>
            <Text style={[s.loadingSubtitle, { color: colors.subtitleText }]}>Esto puede tardar unos segundos</Text>
          </View>
        )}

        {/* ── PASO 4: Resultado ─────────────────────────────────────── */}
        {paso === 'resultado' && resolucion && (
          <>
            <View style={[s.resultCard, { backgroundColor: colors.cardBg }]}>
              <View style={[s.resultIcon, { backgroundColor: colors.pageBg }]}>
                {resolucion.accion === 'reembolso_parcial' && <RefundIcon />}
                {resolucion.accion === 'cupon' && <GiftIcon />}
                {resolucion.accion === 'disculpa' && <HeartIcon />}
              </View>

              <Text style={[s.resultTitle, { color: colors.titleText }]}>
                {resolucion.accion === 'reembolso_parcial' && 'Reembolso Parcial'}
                {resolucion.accion === 'cupon' && 'Cupón de Descuento'}
                {resolucion.accion === 'disculpa' && 'Lo sentimos mucho'}
              </Text>

              {resolucion.monto != null && (
                <Text style={[s.resultMonto, { color: isDark ? '#4ade80' : '#22c55e' }]}>
                  ${resolucion.monto.toFixed(2)} MXN
                </Text>
              )}

              <Text style={[s.resultMsg, { color: colors.titleText }]}>{resolucion.mensaje_usuario}</Text>
            </View>

            <View style={[s.infoBox, { backgroundColor: isDark ? '#082f49' : '#F0F9FF', borderColor: isDark ? '#0c4a6e' : '#BAE6FD' }]}>
              <Text style={[s.infoText, { color: isDark ? '#38bdf8' : '#0369A1' }]}>
                🎫 ID de caso:{' '}
                <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {resolucion.queja_id.slice(0, 8).toUpperCase()}
                </Text>
              </Text>
            </View>
          </>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────── */}
        {paso === 'error' && (
          <View style={[s.errorCard, { backgroundColor: isDark ? '#450a0a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' }]}>
            <Text style={[s.errorTitle, { color: isDark ? '#f87171' : '#B91C1C' }]}>Algo salió mal</Text>
            <Text style={[s.errorMsg, { color: isDark ? '#fca5a5' : '#7F1D1D' }]}>{errorMsg}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => setPaso('confirmar')}>
              <Text style={s.retryText}>Intentar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Botones de acción ─────────────────────────────────────────── */}
      <View style={[s.footer, { backgroundColor: colors.pageBg, borderTopColor: colors.rowDivider }]}>
        {paso === 'confirmar' && (
          <TouchableOpacity onPress={cargarContexto} style={s.btnPrimary}>
            <LinearGradient colors={['#F97316', '#ea580c']} style={s.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.btnPrimaryText}>Continuar →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {paso === 'contexto' && (
          <>
            <TouchableOpacity onPress={solicitarResolucion} style={s.btnPrimary}>
              <LinearGradient colors={['#8B5CF6', '#7c3aed']} style={s.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.btnPrimaryText}>Solicitar resolución automática 🤖</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnSecondary, { backgroundColor: colors.border }]} onPress={() => navigation.goBack()}>
              <Text style={[s.btnSecondaryText, { color: colors.titleText }]}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        {paso === 'resultado' && (
          <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Orders')}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={s.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={s.btnPrimaryText}>Ver mis pedidos</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  body: { padding: 20, paddingBottom: 40 },
  footer: { padding: 20, gap: 10, borderTopWidth: 1 },

  // Warn card
  warnCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1 },
  warnIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  warnTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  warnSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Summary card
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  summaryKey: { fontSize: 14 },
  summaryVal: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1 },

  // Info box
  infoBox: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  infoText: { fontSize: 14, lineHeight: 22 },

  // Loading
  loadingWrap: { alignItems: 'center', paddingVertical: 60 },
  loadingTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  loadingSubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },

  // Time card
  timeCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timeBox: { flex: 1, alignItems: 'center' },
  timeNum: { fontSize: 28, fontWeight: 'bold' },
  timeLabel: { fontSize: 12, marginTop: 4 },
  timeSep: { width: 1, height: 44 },
  retraso: { borderRadius: 10, padding: 10, borderWidth: 1, alignItems: 'center' },
  retrasoTxt: { fontSize: 14, fontWeight: '600' },

  // Desglose
  contextCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  desgloseSubtitle: { fontSize: 12, marginBottom: 12, lineHeight: 18 },

  // Items
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { fontSize: 14 },
  itemPrice: { fontSize: 14, fontWeight: '600' },

  // Historial
  historialBox: { borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1 },
  historialTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  historialSub: { fontSize: 12 },

  nota: { fontSize: 13, textAlign: 'center', marginBottom: 8, lineHeight: 20 },

  // Result
  resultCard: { borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  resultIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  resultTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  resultMonto: { fontSize: 36, fontWeight: 'bold', marginBottom: 12 },
  resultMsg: { fontSize: 15, textAlign: 'center', lineHeight: 24 },

  // Error
  errorCard: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  errorMsg: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#EF4444' },
  retryText: { fontSize: 15, fontWeight: 'bold', color: '#fff' },

  // Buttons
  btnPrimary: { borderRadius: 16, overflow: 'hidden' },
  gradient: { paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  btnSecondary: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnSecondaryText: { fontSize: 16, fontWeight: '600' },
})