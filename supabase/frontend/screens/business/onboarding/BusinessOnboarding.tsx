import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, StatusBar,
  ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Switch, Modal, FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location';
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { MapPicker } from '../../../components/addresses/MapPicker'
import { useAuth } from '../../../application/context/AuthContext'
import { AdminRepositoryImpl } from '../../../infraestructure/repositories/AdminRepositoryImpl'
import { supabase } from '../../../config/supabaseConfig'
import type { HorarioDia } from '../../../domain/entities/Negocio'
import { NOMBRES_ESTADOS, getCiudadesByEstado } from '../../../domain/data/mexicoLocations'

const adminRepo = new AdminRepositoryImpl()

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BusinessOnboarding'>
}

// ─── Días ─────────────────────────────────────────────────────────────────────
const DIAS: HorarioDia['dia'][] = [
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
]
const DIA_LABEL: Record<string, string> = {
  lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
  jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const StoreIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
    <Path d="M3 9a2 2 0 0 1 .709-1.528l2.472-2.059A2 2 0 0 1 7.456 5h9.088a2 2 0 0 1 1.275.472l2.472 2.059A2 2 0 0 1 21 9" />
  </Svg>
)

const LocationIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
)

const ClockIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
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
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dotDone: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  dotNumber: { fontSize: 14, fontWeight: '700', color: 'white' },
  dotNumberInactive: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  line: { width: 40, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  lineDone: { backgroundColor: '#22c55e' },
})

// ─── Input Component ──────────────────────────────────────────────────────────

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
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
})

// ─── SelectField Component ────────────────────────────────────────────────────

function SelectField({
  label, value, placeholder, options, onChange, disabled = false,
}: {
  label: string
  value: string
  placeholder: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  function select(option: string) {
    onChange(option)
    setVisible(false)
    setSearch('')
  }

  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TouchableOpacity
        style={[selectStyles.trigger, disabled && selectStyles.triggerDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[selectStyles.triggerText, !value && selectStyles.triggerPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={selectStyles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={selectStyles.overlay} activeOpacity={1} onPress={() => setVisible(false)} />
        <View style={selectStyles.sheet}>
          {/* Handle */}
          <View style={selectStyles.handle} />
          <Text style={selectStyles.sheetTitle}>{label}</Text>

          {/* Búsqueda */}
          <View style={selectStyles.searchWrap}>
            <Text style={selectStyles.searchIcon}>🔍</Text>
            <TextInput
              style={selectStyles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={selectStyles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[selectStyles.option, item === value && selectStyles.optionSelected]}
                onPress={() => select(item)}
              >
                <Text style={[selectStyles.optionText, item === value && selectStyles.optionTextSelected]}>
                  {item}
                </Text>
                {item === value && <Text style={selectStyles.optionCheck}>✓</Text>}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={selectStyles.separator} />}
            style={{ maxHeight: 350 }}
          />
        </View>
      </Modal>
    </View>
  )
}

const selectStyles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#F9FAFB' },
  triggerDisabled: { opacity: 0.45 },
  triggerText: { fontSize: 15, color: '#111827', flex: 1 },
  triggerPlaceholder: { color: '#9CA3AF' },
  chevron: { fontSize: 16, color: '#6B7280', marginLeft: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 14, textAlign: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearBtn: { fontSize: 14, color: '#9CA3AF', marginLeft: 8 },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 4 },
  optionSelected: { backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10 },
  optionText: { fontSize: 15, color: '#374151', flex: 1 },
  optionTextSelected: { color: '#16a34a', fontWeight: '700' },
  optionCheck: { fontSize: 15, color: '#22c55e', fontWeight: '700' },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
})

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BusinessOnboarding({ navigation }: Props) {
  const { session, refreshAdminAccess } = useAuth()
  const [coordenadas, setCoordenadas] = useState<{ latitud: number; longitud: number } | null>(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Paso 1 — Negocio
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Paso 2 — Sucursal
  const [sucNombre, setSucNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [estado, setEstado] = useState('')
  const [telefono, setTelefono] = useState('')

  useEffect(() => {
  const traducirCoordenadas = async () => {
    if (coordenadas) {
      try {
        const [resultado] = await Location.reverseGeocodeAsync({
          latitude: coordenadas.latitud,
          longitude: coordenadas.longitud
        });

        if (resultado) {
          const { formattedAddress } = resultado;
          setDireccion(formattedAddress || "");
        }
      } catch (error) {
        console.warn('No se pudo obtener la dirección de este punto en el mapa', error);
      }
    }
  };

  traducirCoordenadas();
}, [coordenadas]);

  // Paso 3 — Horarios
  const [horarios, setHorarios] = useState<HorarioDia[]>(
    DIAS.map(dia => ({ dia, abre: '09:00', cierra: '22:00', cerrado: false }))
  )

  // IDs creados en los pasos anteriores
  const [negocioId, setNegocioId] = useState('')
  const [sucursalId, setSucursalId] = useState('')

  // ── Auto-slug desde el nombre ──
  function handleNombre(v: string) {
    setNombre(v)
    setSlug(v.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  function toggleDia(dia: string) {
    setHorarios(prev =>
      prev.map(h => h.dia === dia ? { ...h, cerrado: !h.cerrado, abre: null, cierra: null } : h)
    )
  }

  function setHora(dia: string, campo: 'abre' | 'cierra', valor: string) {
    setHorarios(prev => prev.map(h => h.dia === dia ? { ...h, [campo]: valor } : h))
  }

  // ── Paso 1: crear negocio ──
  async function submitNegocio() {
    if (!nombre.trim() || !slug.trim() || !categoria.trim()) {
      Alert.alert('Completa los campos', 'Nombre, slug y categoría son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error("No hay usuario autenticado. Por favor, inicia sesión de nuevo.")

      // 1. Insertar el negocio directamente en Supabase
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .insert({
          nombre,
          slug,
          categoria,
          descripcion,
          tags: [],
          pais: 'MX'
        })
        .select()
        .single()

      if (negocioError) {
        throw new Error(negocioError.message ?? 'Error al crear el negocio')
      }

      // 2. Asignarse como Administrador del Negocio
      const { error: adminError } = await supabase
        .from('negocio_admins')
        .insert({
          negocio_id: negocio.id,
          user_id: user.id,
          puede_editar_menu: true,
          puede_ver_pedidos: true,
          puede_editar_negocio: true
        })

      if (adminError) {
        // Log, pero no bloquea el flujo si la DB no dejó por RLS pero ya se asignó internamente en un trigger (opcional)
        console.warn('Error al asignar admin:', adminError.message)
        throw new Error(adminError.message ?? 'Error al asignarte como administrador')
      }

      setNegocioId(negocio.id)
      setStep(1)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Paso 2: crear sucursal ──
  async function submitSucursal() {
    if (!sucNombre.trim() || !direccion.trim()) {
      Alert.alert('Completa los campos', 'Nombre de sucursal y dirección son obligatorios.')
      return
    }
    setSaving(true)
    try {
      const sucursalData = {
        negocio_id: negocioId,
        nombre: sucNombre,
        direccion,
        ciudad,
        estado,
        telefono,
        pais: 'MX',
        horarios: [],
        radio_entrega_km: 5,
        tiempo_entrega_min: 30,
        acepta_efectivo: true,
        acepta_tarjeta: false,
        activo: true,
        whatsapp: '',
        codigo_postal: '',
      }

      const { data: sucursal, error: sucursalError } = await supabase
        .from('sucursales')
        .insert(sucursalData)
        .select()
        .single()

      if (sucursalError) {
        throw new Error(sucursalError.message ?? 'Error al crear la sucursal')
      }

      if (coordenadas) {
        await supabase.rpc('set_sucursal_ubicacion', {
          p_id: sucursal.id,
          p_lat: coordenadas.latitud,
          p_lng: coordenadas.longitud,
        })
      }

      setSucursalId(sucursal.id)
      setStep(2)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Paso 3: guardar horarios y terminar ──
  async function submitHorarios() {
    setSaving(true)
    try {
      const { error: horariosError } = await supabase
        .from('sucursales')
        .update({ horarios: horarios })
        .eq('id', sucursalId)

      if (horariosError) {
        throw new Error(horariosError.message ?? 'Error al guardar los horarios')
      }

      // Recargar adminAccess en el contexto para que Settings funcione de inmediato
      await refreshAdminAccess()
      navigation.replace('BusinessDashboard')
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setSaving(false)
    }
  }

  const STEPS = [
    { icon: <StoreIcon />, title: 'Tu Negocio', subtitle: 'Cuéntanos sobre tu negocio' },
    { icon: <LocationIcon />, title: 'Tu Sucursal', subtitle: 'Dónde están ubicados' },
    { icon: <ClockIcon />, title: 'Horarios', subtitle: 'Cuándo atienden a clientes' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={styles.headerGradient}>
          <Text style={styles.headerTitle}>Configura tu negocio</Text>
          <Text style={styles.headerSubtitle}>Solo toma 2 minutos ⚡</Text>
          <StepIndicator current={step} total={3} />
        </LinearGradient>

        {/* Step title */}
        <View style={styles.stepHeader}>
          <View style={styles.stepIconWrap}>{STEPS[step].icon}</View>
          <View>
            <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[step].subtitle}</Text>
          </View>
        </View>

        {/* ── Paso 0: Negocio ─────────────────────────────────────────── */}
        {step === 0 && (
          <View style={styles.form}>
            <Field label="Nombre del negocio *" value={nombre} onChange={handleNombre} placeholder="Ej: Tacos El Compa" />
            <Field
              label="Slug (URL) *" value={slug} onChange={setSlug}
              placeholder="tacos-el-compa" autoCapitalize="none"
              hint="Solo letras minúsculas, números y guiones. Se genera automáticamente."
            />
            <Field label="Categoría *" value={categoria} onChange={setCategoria} placeholder="Ej: restaurante, cafetería, pizzería" />
            <Field label="Descripción" value={descripcion} onChange={setDescripcion} placeholder="Breve descripción de tu negocio" />
          </View>
        )}

        {/* ── Paso 1: Sucursal ─────────────────────────────────────────── */}
        {step === 1 && (
          <View style={styles.form}>
            <MapPicker
              coordenadas={coordenadas}   // null si es nueva sucursal
              onPinDrop={(coords) => setCoordenadas(coords)}
              height={280}
            />
            <Field label="Nombre de la sucursal *" value={sucNombre} onChange={setSucNombre} placeholder="Ej: Sucursal Centro" />
            <Field label="Dirección *" value={direccion} onChange={setDireccion} placeholder="Calle, número, colonia" />
            <SelectField
              label="Estado"
              value={estado}
              placeholder="Selecciona un estado"
              options={NOMBRES_ESTADOS}
              onChange={v => { setEstado(v); setCiudad('') }}
            />
            <SelectField
              label="Ciudad"
              value={ciudad}
              placeholder={estado ? 'Selecciona una ciudad' : 'Primero selecciona un estado'}
              options={getCiudadesByEstado(estado)}
              onChange={setCiudad}
              disabled={!estado}
            />
            <Field label="Teléfono" value={telefono} onChange={setTelefono} placeholder="10 dígitos" keyboardType="phone-pad" />
          </View>
        )}

        {/* ── Paso 2: Horarios ─────────────────────────────────────────── */}
        {step === 2 && (
          <View style={styles.form}>
            <Text style={styles.horariosHint}>Activa los días que atienden y define el horario.</Text>
            {horarios.map((h, idx) => (
              <View key={h.dia}>
                <View style={styles.horarioRow}>
                  <Text style={[styles.horarioDia, h.cerrado && styles.horarioDiaCerrado]}>
                    {DIA_LABEL[h.dia]}
                  </Text>
                  <Switch
                    value={!h.cerrado}
                    onValueChange={() => toggleDia(h.dia)}
                    trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
                    thumbColor="#fff"
                  />
                  {!h.cerrado ? (
                    <View style={styles.horaRow}>
                      <TextInput
                        style={styles.horaInput}
                        value={h.abre ?? ''}
                        onChangeText={v => setHora(h.dia, 'abre', v)}
                        placeholder="09:00"
                        placeholderTextColor="#9CA3AF"
                        maxLength={5}
                      />
                      <Text style={styles.horaSep}>–</Text>
                      <TextInput
                        style={styles.horaInput}
                        value={h.cierra ?? ''}
                        onChangeText={v => setHora(h.dia, 'cierra', v)}
                        placeholder="22:00"
                        placeholderTextColor="#9CA3AF"
                        maxLength={5}
                      />
                    </View>
                  ) : (
                    <Text style={styles.cerradoText}>Cerrado</Text>
                  )}
                </View>
                {idx < horarios.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botón de acción */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>← Atrás</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === 0 && { flex: 1 }]}
          onPress={step === 0 ? submitNegocio : step === 1 ? submitSucursal : submitHorarios}
          disabled={saving}
        >
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.nextBtnGradient}>
            {saving
              ? <ActivityIndicator color="white" />
              : <>
                <Text style={styles.nextBtnText}>
                  {step === 2 ? '¡Listo! Ir al Dashboard' : 'Continuar'}
                </Text>
                {step < 2 && <ArrowIcon />}
              </>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 100 },
  headerGradient: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, marginBottom: 24 },
  stepIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  stepSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  form: { paddingHorizontal: 24 },
  horariosHint: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  horarioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  horarioDia: { width: 90, fontSize: 14, fontWeight: '600', color: '#374151' },
  horarioDiaCerrado: { color: '#9CA3AF' },
  horaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  horaInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, width: 62, textAlign: 'center', backgroundColor: '#F9FAFB', color: '#111827' },
  horaSep: { fontSize: 13, color: '#9CA3AF' },
  cerradoText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  backBtn: { flex: 0.4, paddingVertical: 16, borderRadius: 30, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn: { flex: 0.6, borderRadius: 30, overflow: 'hidden' },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
})