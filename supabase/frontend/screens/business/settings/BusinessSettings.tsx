import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar,
  ActivityIndicator, Alert, Switch,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation'

import { useAuth } from '../../../application/context/AuthContext'
import { useAdminNegocio } from '../../../application/hooks/useAdminNegocio'
import { useAdminSucursal } from '../../../application/hooks/useAdminSucursal'
import type { HorarioDia } from '../../../domain/entities/Negocio'

// ─── Orden canónico de días ───────────────────────────────────────────────────
const DIAS: HorarioDia['dia'][] = [
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
]

// ─── Icons ────────────────────────────────────────────────────────────────────

const EditIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
)

const ClockIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
)

const SaveIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
)

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BusinessSettings({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Settings')

  // negocio_id y permisos vienen directamente del AuthContext — nada hardcodeado
  const { adminAccess } = useAuth()
  const negocioId    = adminAccess?.negocioId          ?? ''
  const puedeEditar  = adminAccess?.puedeEditarNegocio ?? false

  // TODO: cuando tengas sucursales múltiples, agrega un selector.
  // Por ahora usamos la primera sucursal que devuelva el hook.
  const sucursalId = ''   // ← reemplazar cuando implementes GET /sucursales del negocio

  // ── Negocio ───────────────────────────────────────────────────────────────
  const [editingNegocio, setEditingNegocio] = useState(false)
  const { negocio, isLoading: loadingNegocio, isSaving: savingNegocio,
          error: errorNegocio, updateNegocio } = useAdminNegocio(negocioId)

  const [nombreEdit,     setNombreEdit]     = useState('')
  const [descripcionEdit, setDescEdit]      = useState('')
  const [categoriaEdit,  setCategoriaEdit]  = useState('')

  function startEditNegocio() {
    setNombreEdit(negocio?.nombre ?? '')
    setDescEdit(negocio?.descripcion ?? '')
    setCategoriaEdit(negocio?.categoria ?? '')
    setEditingNegocio(true)
  }

  async function saveNegocio() {
    const ok = await updateNegocio({
      nombre: nombreEdit,
      descripcion: descripcionEdit,
      categoria: categoriaEdit,
    })
    if (ok) setEditingNegocio(false)
    else Alert.alert('Error', errorNegocio ?? 'No se pudo guardar')
  }

  // ── Sucursal / Horarios ───────────────────────────────────────────────────
  const [editingHorarios, setEditingHorarios] = useState(false)
  const [horariosEdit, setHorariosEdit]       = useState<HorarioDia[]>([])

  const { sucursal, isLoading: loadingHorarios, isSaving: savingHorarios,
          error: errorHorarios, updateHorarios } = useAdminSucursal(negocioId, sucursalId || undefined)

  function startEditHorarios() {
    const base: HorarioDia[] = DIAS.map(dia => {
      const existente = sucursal?.horarios.find(h => h.dia === dia)
      return existente ?? { dia, abre: '09:00', cierra: '22:00', cerrado: false }
    })
    setHorariosEdit(base)
    setEditingHorarios(true)
  }

  function toggleCerrado(dia: string) {
    setHorariosEdit(prev =>
      prev.map(h => h.dia === dia ? { ...h, cerrado: !h.cerrado, abre: null, cierra: null } : h)
    )
  }

  function setHora(dia: string, campo: 'abre' | 'cierra', valor: string) {
    setHorariosEdit(prev =>
      prev.map(h => h.dia === dia ? { ...h, [campo]: valor } : h)
    )
  }

  async function saveHorarios() {
    const ok = await updateHorarios(horariosEdit)
    if (ok) setEditingHorarios(false)
    else Alert.alert('Error', errorHorarios ?? 'No se pudo guardar los horarios')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingNegocio) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    )
  }

  // Usuario sin negocio asignado (no debería llegar aquí si la navegación está protegida)
  if (!negocioId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No tienes un negocio asignado.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Configuración</Text>
            <Text style={styles.headerSubtitle}>Gestiona tu negocio</Text>
          </View>
          <View style={styles.headerBadge}>
            <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.badgeGradient}>
              <Text style={styles.badgeText}>Admin</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── Datos del Negocio ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}><EditIcon /></View>
            <Text style={styles.sectionTitle}>Datos del Negocio</Text>
            {/* Solo mostrar botón Editar si tiene permiso */}
            {!editingNegocio && puedeEditar && (
              <TouchableOpacity style={styles.editBtn} onPress={startEditNegocio}>
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingNegocio ? (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={nombreEdit}
                onChangeText={setNombreEdit}
                placeholder="Nombre del negocio"
              />
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={descripcionEdit}
                onChangeText={setDescEdit}
                placeholder="Descripción"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={categoriaEdit}
                onChangeText={setCategoriaEdit}
                placeholder="ej: restaurante, cafetería..."
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingNegocio(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveNegocio} disabled={savingNegocio}>
                  <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveBtnGradient}>
                    {savingNegocio
                      ? <ActivityIndicator size="small" color="white" />
                      : <><SaveIcon /><Text style={styles.saveBtnText}>Guardar</Text></>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoGroup}>
              <InfoRow label="Nombre"      value={negocio?.nombre ?? '—'} />
              <InfoRow label="Categoría"   value={negocio?.categoria ?? '—'} />
              <InfoRow label="Descripción" value={negocio?.descripcion ?? '—'} />
              <InfoRow label="Slug"        value={negocio?.slug ?? '—'} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verificado</Text>
                <View style={[styles.pill, negocio?.verificado ? styles.pillGreen : styles.pillGray]}>
                  <Text style={[styles.pillText, negocio?.verificado ? styles.pillTextGreen : styles.pillTextGray]}>
                    {negocio?.verificado ? 'Sí' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Horarios ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}><ClockIcon /></View>
            <Text style={styles.sectionTitle}>Horarios</Text>
            {!editingHorarios && (
              <TouchableOpacity style={styles.editBtn} onPress={startEditHorarios}>
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingHorarios && <ActivityIndicator color="#22c55e" style={{ marginVertical: 12 }} />}

          {editingHorarios ? (
            <View>
              {horariosEdit.map(h => (
                <View key={h.dia} style={styles.horarioRow}>
                  <Text style={styles.horarioDia}>
                    {h.dia.charAt(0).toUpperCase() + h.dia.slice(1)}
                  </Text>
                  <Switch
                    value={!h.cerrado}
                    onValueChange={() => toggleCerrado(h.dia)}
                    trackColor={{ false: '#D1D5DB', true: '#22c55e' }}
                    thumbColor="#fff"
                  />
                  {!h.cerrado ? (
                    <View style={styles.horaInputsRow}>
                      <TextInput
                        style={styles.horaInput}
                        value={h.abre ?? ''}
                        onChangeText={v => setHora(h.dia, 'abre', v)}
                        placeholder="09:00"
                        maxLength={5}
                      />
                      <Text style={styles.horaSep}>–</Text>
                      <TextInput
                        style={styles.horaInput}
                        value={h.cierra ?? ''}
                        onChangeText={v => setHora(h.dia, 'cierra', v)}
                        placeholder="22:00"
                        maxLength={5}
                      />
                    </View>
                  ) : (
                    <Text style={styles.cerradoText}>Cerrado</Text>
                  )}
                </View>
              ))}

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingHorarios(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveHorarios} disabled={savingHorarios}>
                  <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveBtnGradient}>
                    {savingHorarios
                      ? <ActivityIndicator size="small" color="white" />
                      : <><SaveIcon /><Text style={styles.saveBtnText}>Guardar</Text></>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoGroup}>
              {(sucursal?.horarios ?? []).length === 0
                ? <Text style={styles.emptyText}>Sin horarios configurados</Text>
                : sucursal?.horarios.map(h => (
                    <View key={h.dia} style={styles.horarioReadRow}>
                      <Text style={styles.horarioReadDia}>
                        {h.dia.charAt(0).toUpperCase() + h.dia.slice(1)}
                      </Text>
                      {h.cerrado
                        ? <Text style={styles.cerradoText}>Cerrado</Text>
                        : <Text style={styles.horarioReadHora}>{h.abre} – {h.cierra}</Text>
                      }
                    </View>
                  ))
              }
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} navigation={navigation as any} />
    </SafeAreaView>
  )
}

// ─── Componente auxiliar ──────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F9FAFB' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#fff' },
  headerTitle:    { fontSize: 22, fontWeight: 'bold', color: '#000' },
  headerSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  headerBadge:    { borderRadius: 20, overflow: 'hidden' },
  badgeGradient:  { paddingHorizontal: 14, paddingVertical: 6 },
  badgeText:      { fontSize: 12, fontWeight: '700', color: '#fff' },

  section:        { backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  editBtn:        { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F0FDF4', borderRadius: 20 },
  editBtnText:    { fontSize: 13, fontWeight: '600', color: '#22c55e' },

  formGroup:      { gap: 8 },
  label:          { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 8 },
  input:          { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  inputMultiline: { height: 80, textAlignVertical: 'top' },

  infoGroup:      { gap: 0 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel:      { fontSize: 13, color: '#6B7280' },
  infoValue:      { fontSize: 13, fontWeight: '600', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  pill:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillGreen:      { backgroundColor: '#F0FDF4' },
  pillGray:       { backgroundColor: '#F3F4F6' },
  pillText:       { fontSize: 12, fontWeight: '600' },
  pillTextGreen:  { color: '#22c55e' },
  pillTextGray:   { color: '#9CA3AF' },

  horarioRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  horarioDia:     { width: 80, fontSize: 13, fontWeight: '600', color: '#374151' },
  horaInputsRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' },
  horaInput:      { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, width: 60, textAlign: 'center', backgroundColor: '#F9FAFB' },
  horaSep:        { fontSize: 13, color: '#9CA3AF' },
  cerradoText:    { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', flex: 1, textAlign: 'right' },

  horarioReadRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  horarioReadDia: { fontSize: 13, fontWeight: '600', color: '#374151' },
  horarioReadHora:{ fontSize: 13, color: '#22c55e', fontWeight: '500' },

  emptyText:      { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },

  actionRow:      { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn:      { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelBtnText:  { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  saveBtn:        { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveBtnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  saveBtnText:    { fontSize: 14, fontWeight: '600', color: '#fff' },
})