import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, TextInput, ActivityIndicator,
  Modal, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAdminCupones } from '../../../application/hooks/useAdminCupones'
import { useAuth } from '../../../application/context/AuthContext'
import type { Cupon, CuponCreate, TipoCupon } from '../../../domain/entities/Cupon'

type AdminCuponesNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminCupones'>

type Props = { navigation: AdminCuponesNavigationProp }

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)
const PlusIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
)
const TagIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <Circle cx="7" cy="7" r="1.5" fill="#22c55e" stroke="none" />
  </Svg>
)
const EditIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
)
const TrashIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
)
const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)
const CalendarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
)

// ─── Tipo del formulario ──────────────────────────────────────────────────────

type FormState = {
  codigo: string
  descripcion: string
  tipo: TipoCupon
  valor: string
  minimoCompra: string
  maximoDescuento: string
  fechaInicio: string
  fechaFin: string
  usoMaximoTotal: string
  usoMaximoPorUsuario: string
  activo: boolean
}

const formInicial: FormState = {
  codigo: '',
  descripcion: '',
  tipo: 'porcentaje',
  valor: '',
  minimoCompra: '',
  maximoDescuento: '',
  fechaInicio: new Date().toISOString().split('T')[0],
  fechaFin: '',
  usoMaximoTotal: '',
  usoMaximoPorUsuario: '1',
  activo: true,
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminCupones({ navigation }: Props) {
  const { adminAccess } = useAuth()
  const negocioId = adminAccess?.negocioId ?? ''

  const {
    cupones, isLoading, isSaving, error,
    createCupon, updateCupon, deleteCupon, toggleActivo,
  } = useAdminCupones(negocioId)

  const [modalVisible, setModalVisible] = useState(false)
  const [editando, setEditando] = useState<Cupon | null>(null)
  const [form, setForm] = useState<FormState>(formInicial)

  // ── Helpers de formulario ──────────────────────────────────────────────────

  const abrirCrear = () => {
    setEditando(null)
    setForm(formInicial)
    setModalVisible(true)
  }

  const abrirEditar = (cupon: Cupon) => {
    setEditando(cupon)
    setForm({
      codigo: cupon.codigo,
      descripcion: cupon.descripcion ?? '',
      tipo: cupon.tipo,
      valor: String(cupon.valor),
      minimoCompra: cupon.minimoCompra != null ? String(cupon.minimoCompra) : '',
      maximoDescuento: cupon.maximoDescuento != null ? String(cupon.maximoDescuento) : '',
      fechaInicio: cupon.fechaInicio.split('T')[0],
      fechaFin: cupon.fechaFin.split('T')[0],
      usoMaximoTotal: cupon.usoMaximoTotal != null ? String(cupon.usoMaximoTotal) : '',
      usoMaximoPorUsuario: String(cupon.usoMaximoPorUsuario),
      activo: cupon.activo,
    })
    setModalVisible(true)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setEditando(null)
    setForm(formInicial)
  }

  const setField = (field: keyof FormState, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleGuardar = async () => {
    // Validaciones básicas
    if (!form.codigo.trim()) return Alert.alert('Error', 'El código es requerido')
    if (!form.valor.trim() || isNaN(Number(form.valor))) return Alert.alert('Error', 'El valor debe ser un número válido')
    if (!form.fechaFin.trim()) return Alert.alert('Error', 'La fecha de fin es requerida')

    if (editando) {
      const ok = await updateCupon(editando.id, {
        descripcion: form.descripcion || null,
        valor: Number(form.valor),
        minimoCompra: form.minimoCompra ? Number(form.minimoCompra) : null,
        maximoDescuento: form.maximoDescuento ? Number(form.maximoDescuento) : null,
        fechaFin: new Date(form.fechaFin).toISOString(),
        usoMaximoTotal: form.usoMaximoTotal ? Number(form.usoMaximoTotal) : null,
        usoMaximoPorUsuario: Number(form.usoMaximoPorUsuario),
        activo: form.activo,
      })
      if (ok) cerrarModal()
    } else {
      const data: CuponCreate = {
        negocioId,
        codigo: form.codigo.trim().toUpperCase(),
        descripcion: form.descripcion || null,
        tipo: form.tipo,
        valor: Number(form.valor),
        minimoCompra: form.minimoCompra ? Number(form.minimoCompra) : null,
        maximoDescuento: form.maximoDescuento ? Number(form.maximoDescuento) : null,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
        usoMaximoTotal: form.usoMaximoTotal ? Number(form.usoMaximoTotal) : null,
        usoMaximoPorUsuario: Number(form.usoMaximoPorUsuario),
        activo: form.activo,
      }
      const ok = await createCupon(data)
      if (ok) cerrarModal()
    }
  }

  const handleEliminar = (cupon: Cupon) => {
    Alert.alert(
      'Eliminar cupón',
      `¿Estás seguro de eliminar el cupón "${cupon.codigo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteCupon(cupon.id) },
      ]
    )
  }

  // ── Helpers de display ─────────────────────────────────────────────────────

  const formatearValor = (cupon: Cupon) => {
    if (cupon.tipo === 'porcentaje') return `${cupon.valor}%`
    if (cupon.tipo === 'envio_gratis') return 'Envío gratis'
    return `$${cupon.valor}`
  }

  const formatearFecha = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isVencido = (cupon: Cupon) => new Date(cupon.fechaFin) < new Date()

  const tipoLabel = { porcentaje: 'Porcentaje', monto_fijo: 'Monto fijo', envio_gratis: 'Envío gratis' }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cupones</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={abrirCrear}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.addButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <PlusIcon />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Error global */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Lista */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {cupones.length === 0 && (
            <View style={styles.emptyState}>
              <TagIcon />
              <Text style={styles.emptyTitle}>Sin cupones</Text>
              <Text style={styles.emptySubtitle}>Crea tu primer cupón de descuento</Text>
              <TouchableOpacity style={styles.emptyButton} onPress={abrirCrear}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.emptyButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.emptyButtonText}>Crear cupón</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {cupones.map(cupon => {
            const vencido = isVencido(cupon)
            return (
              <View key={cupon.id} style={[styles.cuponCard, !cupon.activo && styles.cuponCardInactive]}>
                {/* Cabecera de la card */}
                <View style={styles.cuponCardHeader}>
                  <View style={styles.cuponCodigoContainer}>
                    <TagIcon />
                    <Text style={styles.cuponCodigo}>{cupon.codigo}</Text>
                  </View>
                  <View style={styles.cuponCardActions}>
                    <Switch
                      value={cupon.activo}
                      onValueChange={(v) => { toggleActivo(cupon.id, v); }}
                      trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                      thumbColor={cupon.activo ? '#22c55e' : '#9CA3AF'}
                      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                    />
                    <TouchableOpacity onPress={() => abrirEditar(cupon)} style={styles.iconButton}>
                      <EditIcon />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEliminar(cupon)} style={styles.iconButton}>
                      <TrashIcon />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Descripción */}
                {cupon.descripcion && (
                  <Text style={styles.cuponDescripcion}>{cupon.descripcion}</Text>
                )}

                {/* Chips de info */}
                <View style={styles.cuponChips}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{tipoLabel[cupon.tipo]}</Text>
                  </View>
                  <View style={[styles.chip, styles.chipGreen]}>
                    <Text style={[styles.chipText, styles.chipTextGreen]}>{formatearValor(cupon)}</Text>
                  </View>
                  {cupon.minimoCompra && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Mín. ${cupon.minimoCompra}</Text>
                    </View>
                  )}
                  {vencido && (
                    <View style={[styles.chip, styles.chipRed]}>
                      <Text style={[styles.chipText, styles.chipTextRed]}>Vencido</Text>
                    </View>
                  )}
                </View>

                {/* Usos y fechas */}
                <View style={styles.cuponMeta}>
                  <View style={styles.cuponMetaRow}>
                    <CalendarIcon />
                    <Text style={styles.cuponMetaText}>
                      Hasta {formatearFecha(cupon.fechaFin)}
                    </Text>
                  </View>
                  <Text style={styles.cuponMetaText}>
                    {cupon.usosActuales}{cupon.usoMaximoTotal ? `/${cupon.usoMaximoTotal}` : ''} usos
                  </Text>
                </View>
              </View>
            )
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── Modal crear/editar ─────────────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={cerrarModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header del modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editando ? 'Editar cupón' : 'Nuevo cupón'}</Text>
                <TouchableOpacity onPress={cerrarModal}><CloseIcon /></TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

                {/* Código */}
                <Text style={styles.fieldLabel}>Código *</Text>
                <TextInput
                  style={[styles.fieldInput, !!editando && styles.fieldInputDisabled]}
                  value={form.codigo}
                  onChangeText={v => setField('codigo', v.toUpperCase())}
                  placeholder="Ej: VERANO20"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  editable={!editando}
                />

                {/* Descripción */}
                <Text style={styles.fieldLabel}>Descripción (opcional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.descripcion}
                  onChangeText={v => setField('descripcion', v)}
                  placeholder="Ej: 20% de descuento en verano"
                  placeholderTextColor="#9CA3AF"
                />

                {/* Tipo */}
                <Text style={styles.fieldLabel}>Tipo de descuento *</Text>
                <View style={styles.tipoSelector}>
                  {(['porcentaje', 'monto_fijo', 'envio_gratis'] as TipoCupon[]).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.tipoOption, form.tipo === t && styles.tipoOptionActive, !!editando && styles.tipoOptionDisabled]}
                      onPress={() => !editando && setField('tipo', t)}
                    >
                      <Text style={[styles.tipoOptionText, form.tipo === t && styles.tipoOptionTextActive]}>
                        {tipoLabel[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Valor */}
                {form.tipo !== 'envio_gratis' && (
                  <>
                    <Text style={styles.fieldLabel}>
                      {form.tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Monto fijo (MXN)'} *
                    </Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.valor}
                      onChangeText={v => setField('valor', v)}
                      placeholder={form.tipo === 'porcentaje' ? 'Ej: 20' : 'Ej: 50'}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </>
                )}

                {/* Mínimo de compra */}
                <Text style={styles.fieldLabel}>Mínimo de compra (opcional)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.minimoCompra}
                  onChangeText={v => setField('minimoCompra', v)}
                  placeholder="Ej: 200"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />

                {/* Máximo de descuento */}
                {form.tipo === 'porcentaje' && (
                  <>
                    <Text style={styles.fieldLabel}>Máximo de descuento (opcional)</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.maximoDescuento}
                      onChangeText={v => setField('maximoDescuento', v)}
                      placeholder="Ej: 100"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </>
                )}

                {/* Fechas */}
                <View style={styles.fechasRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Fecha inicio *</Text>
                    <TextInput
                      style={[styles.fieldInput, !!editando && styles.fieldInputDisabled]}
                      value={form.fechaInicio}
                      onChangeText={v => setField('fechaInicio', v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      editable={!editando}
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Fecha fin *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.fechaFin}
                      onChangeText={v => setField('fechaFin', v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Usos */}
                <View style={styles.fechasRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Usos totales</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.usoMaximoTotal}
                      onChangeText={v => setField('usoMaximoTotal', v)}
                      placeholder="Ilimitado"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Usos por usuario</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.usoMaximoPorUsuario}
                      onChangeText={v => setField('usoMaximoPorUsuario', v)}
                      placeholder="1"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Activo */}
                <View style={styles.activoRow}>
                  <Text style={styles.fieldLabel}>Cupón activo</Text>
                  <Switch
                    value={form.activo}
                    onValueChange={v => setField('activo', v)}
                    trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                    thumbColor={form.activo ? '#22c55e' : '#9CA3AF'}
                  />
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Botón guardar */}
              <View style={styles.modalFooter}>
                {error && <Text style={styles.modalError}>{error}</Text>}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleGuardar}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.saveButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isSaving
                      ? <ActivityIndicator color="#000" />
                      : <Text style={styles.saveButtonText}>{editando ? 'Guardar cambios' : 'Crear cupón'}</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  addButton: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  errorBanner: { backgroundColor: '#FEF2F2', padding: 12, marginHorizontal: 20, marginTop: 8, borderRadius: 10 },
  errorBannerText: { fontSize: 13, color: '#DC2626', textAlign: 'center' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginTop: 12, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  emptyButton: { borderRadius: 12, overflow: 'hidden' },
  emptyButtonGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  emptyButtonText: { fontSize: 15, fontWeight: 'bold', color: '#000' },

  // Cards
  cuponCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cuponCardInactive: { opacity: 0.6 },
  cuponCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cuponCodigoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cuponCodigo: { fontSize: 17, fontWeight: 'bold', color: '#000', letterSpacing: 0.5 },
  cuponCardActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { padding: 6 },
  cuponDescripcion: { fontSize: 13, color: '#6B7280', marginBottom: 10 },

  // Chips
  cuponChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: '#F3F4F6' },
  chipGreen: { backgroundColor: '#F0FDF4' },
  chipRed: { backgroundColor: '#FEF2F2' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextGreen: { color: '#16a34a' },
  chipTextRed: { color: '#DC2626' },

  // Meta
  cuponMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cuponMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cuponMetaText: { fontSize: 12, color: '#9CA3AF' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  modalError: { fontSize: 13, color: '#DC2626', textAlign: 'center', marginBottom: 8 },

  // Campos
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  fieldInput: {
    backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#E5E7EB',
  },
  fieldInputDisabled: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
  fechasRow: { flexDirection: 'row', marginTop: 14 },
  activoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },

  // Tipo selector
  tipoSelector: { flexDirection: 'row', gap: 8 },
  tipoOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F9FAFB',
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
  },
  tipoOptionActive: { backgroundColor: '#F0FDF4', borderColor: '#22c55e' },
  tipoOptionDisabled: { opacity: 0.5 },
  tipoOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tipoOptionTextActive: { color: '#16a34a' },

  // Botón guardar
  saveButton: { borderRadius: 14, overflow: 'hidden' },
  saveButtonGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
})