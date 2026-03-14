import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'
import { RepartidorRepositoryImpl } from '../../../infraestructure/repositories/RepartidorRepositoryImpl'

const repartidorRepo = new RepartidorRepositoryImpl()

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverOnboarding'>
  route:      RouteProp<RootStackParamList, 'DriverOnboarding'>
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const BikeIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 0 0 0-2h-3l-3 9" />
    <Path d="M9 15h6l1.5-6H7.5" />
  </Svg>
)

const CheckCircleIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9 12l2 2 4-4" />
  </Svg>
)

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
)

const ArrowIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
)

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={stepStyles.stepRow}>
          <View style={[
            stepStyles.dot,
            i < current && stepStyles.dotDone,
            i === current && stepStyles.dotActive,
          ]}>
            {i < current && <CheckIcon />}
            {i === current && <Text style={stepStyles.dotNumber}>{i + 1}</Text>}
            {i > current && <Text style={stepStyles.dotNumberInactive}>{i + 1}</Text>}
          </View>
          {i < total - 1 && (
            <View style={[stepStyles.line, i < current && stepStyles.lineDone]} />
          )}
        </View>
      ))}
    </View>
  )
}

const stepStyles = StyleSheet.create({
  container:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  stepRow:           { flexDirection: 'row', alignItems: 'center' },
  dot:               { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  dotActive:         { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dotDone:           { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  dotNumber:         { fontSize: 14, fontWeight: '700', color: 'white' },
  dotNumberInactive: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  line:              { width: 40, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  lineDone:          { backgroundColor: '#22c55e' },
})

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, hint, keyboardType = 'default', autoCapitalize = 'sentences' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
  keyboardType?: any; autoCapitalize?: any
}) {
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  hint:  { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
})

// ─── Tipo vehículo ────────────────────────────────────────────────────────────

const VEHICULOS = ['moto', 'bici', 'auto'] as const
type Vehiculo = typeof VEHICULOS[number]

const VEHICULO_LABEL: Record<Vehiculo, string> = {
  moto: '🏍  Moto',
  bici: '🚲  Bici',
  auto: '🚗  Auto',
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DriverOnboarding({ navigation, route }: Props) {
  const { session } = useAuth()
  const [step, setStep]               = useState(0)
  const [saving, setSaving]           = useState(false)
  // Si viene del registro, los datos ya están capturados — auto-registrar sin mostrar el form
  const fromRegister                  = route.params?.fromRegister === true
  const [autoSubmitting, setAutoSubmitting] = useState(fromRegister)
  const hasAutoSubmitted              = useRef(false)

  const [vehiculo, setVehiculo] = useState<Vehiculo>(
    (route.params?.vehiculo as Vehiculo) ?? 'moto'
  )
  const [placa, setPlaca] = useState(route.params?.placa ?? '')

  // ── Auto-submit al montar si viene del flujo de registro ──────────────────
  useEffect(() => {
    if (!fromRegister || hasAutoSubmitted.current) return
    hasAutoSubmitted.current = true
    submitVehiculo().finally(() => setAutoSubmitting(false))
  }, [])

  // ── Paso 0: confirmar vehículo y registrar repartidor ────────────────────
  async function submitVehiculo() {
    if (!session?.userId) {
      Alert.alert('Error', 'No hay sesión activa')
      return
    }

    setSaving(true)
    try {
      await repartidorRepo.register(
        session.userId,
        'platform',
        vehiculo,
        placa.trim() || null
      )
      setStep(1)
    } catch (e: any) {
      if (e.message?.includes('duplicate key') || e.message?.includes('ya existe')) {
        // Ya registrado — pasar directo a confirmación
        setStep(1)
      } else {
        Alert.alert('Error', e.message ?? 'Error al registrar repartidor')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Paso 1: ir al dashboard ───────────────────────────────────────────────
  function goToDashboard() {
    navigation.replace('DriverDashboard')
  }

  const STEPS = [
    { icon: <BikeIcon />,        title: 'Tu Vehículo',  subtitle: 'Con qué harás las entregas' },
    { icon: <CheckCircleIcon />, title: '¡Todo listo!', subtitle: 'Ya puedes comenzar a repartir' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Configura tu perfil</Text>
          <Text style={styles.headerSubtitle}>Un paso rápido ⚡</Text>
          <StepIndicator current={step} total={2} />
        </LinearGradient>

        {/* Step title */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>{STEPS[step].icon}</View>
          <View>
            <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[step].subtitle}</Text>
          </View>
        </View>

        {/* ── Paso 0A: auto-registrando (viene del registro) ───────────── */}
        {step === 0 && autoSubmitting && (
          <View style={styles.form}>
            <View style={styles.autoSubmitCard}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.autoSubmitText}>Configurando tu perfil...</Text>
            </View>
          </View>
        )}

        {/* ── Paso 0B: selector manual (entrada directa al onboarding) ─── */}
        {step === 0 && !autoSubmitting && (
          <View style={styles.form}>
            <Text style={fieldStyles.label}>Tipo de vehículo *</Text>
            <View style={styles.vehiculoRow}>
              {VEHICULOS.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.vehiculoChip, vehiculo === v && styles.vehiculoChipActive]}
                  onPress={() => setVehiculo(v)}
                >
                  <Text style={[styles.vehiculoChipText, vehiculo === v && styles.vehiculoChipTextActive]}>
                    {VEHICULO_LABEL[v]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 16 }} />

            <Field
              label="Placa"
              value={placa}
              onChange={setPlaca}
              placeholder="ABC-123"
              hint="Opcional. Puedes agregarlo después."
              autoCapitalize="characters"
            />
          </View>
        )}

        {/* ── Paso 1: Confirmación ─────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.form}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>¡Registro completado!</Text>
              <Text style={styles.successText}>
                Tu perfil de repartidor ha sido creado exitosamente. Ya puedes ver pedidos disponibles y comenzar a ganar.
              </Text>

              {/* Resumen */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Vehículo</Text>
                  <Text style={styles.summaryValue}>{VEHICULO_LABEL[vehiculo]}</Text>
                </View>
                {placa.trim() !== '' && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryKey}>Placa</Text>
                    <Text style={styles.summaryValue}>{placa.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Estado inicial</Text>
                  <View style={[styles.estadoPill, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.estadoPillText, { color: '#16a34a' }]}>Disponible</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.successHint}>
                Tu estado inicial es "Disponible". Comenzarás a recibir pedidos en tu zona inmediatamente.
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer — ocultar mientras se auto-registra */}
      {!autoSubmitting && (
        <View style={styles.footer}>
          {step > 0 && step < 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
              <Text style={styles.backBtnText}>← Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, { flex: 1 }]}
            onPress={step === 0 ? submitVehiculo : goToDashboard}
            disabled={saving}
          >
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.nextBtnGradient}>
              {saving
                ? <ActivityIndicator color="white" />
                : <>
                    <Text style={styles.nextBtnText}>
                      {step === 1 ? '¡Ir al Dashboard!' : 'Continuar'}
                    </Text>
                    {step < 1 && <ArrowIcon />}
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:                 { paddingBottom: 100 },
  headerGradient:         { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headerTitle:            { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  headerSubtitle:         { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  stepHeader:             { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, marginBottom: 24 },
  stepIconWrap:           { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  stepTitle:              { fontSize: 20, fontWeight: '800', color: '#111827' },
  stepSubtitle:           { fontSize: 13, color: '#6B7280', marginTop: 2 },
  form:                   { paddingHorizontal: 24 },
  // Auto-submit loader
  autoSubmitCard:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  autoSubmitText:         { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  // Vehículo
  vehiculoRow:            { flexDirection: 'row', gap: 10 },
  vehiculoChip:           { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', alignItems: 'center' },
  vehiculoChipActive:     { borderColor: '#22c55e', backgroundColor: '#F0FDF4' },
  vehiculoChipText:       { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  vehiculoChipTextActive: { color: '#16a34a' },
  // Confirmación
  successCard:            { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' },
  successEmoji:           { fontSize: 48, marginBottom: 12 },
  successTitle:           { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center' },
  successText:            { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  summaryBox:             { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12, marginBottom: 16 },
  summaryRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey:             { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  summaryValue:           { fontSize: 14, color: '#111827', fontWeight: '700' },
  estadoPill:             { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  estadoPillText:         { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  successHint:            { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  // Footer
  footer:                 { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  backBtn:                { flex: 0.4, paddingVertical: 16, borderRadius: 30, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backBtnText:            { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn:                { flex: 0.6, borderRadius: 30, overflow: 'hidden' },
  nextBtnGradient:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  nextBtnText:            { fontSize: 15, fontWeight: '700', color: 'white' },
})