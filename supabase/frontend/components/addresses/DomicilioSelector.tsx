// components/addresses/DomicilioSelector.tsx
// Selector de domicilio en el flujo de pedido (checkout)
// Muestra el predeterminado + opción de cambiar o agregar

import { useEffect, useState } from 'react'
import {
  View, Text, Pressable, Modal, FlatList,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../navigation/StacNavigation'
import { useDomicilios } from '../../application/context/DomiciliosContext'
import type { Domicilio } from '../../domain/entities/Domicilio'

type Nav = NativeStackNavigationProp<RootStackParamList>

type Props = {
  // Domicilio seleccionado actualmente
  selected:   Domicilio | null
  // Callback cuando el usuario elige uno
  onSelect:   (domicilio: Domicilio) => void
}

// ─── Fila en el modal ─────────────────────────────────────────────────────────

const DomicilioRow = ({
  item, isSelected, onPress,
}: {
  item: Domicilio; isSelected: boolean; onPress: () => void
}) => {
  const icono =
    item.alias === 'Casa'    ? '🏠'
    : item.alias === 'Trabajo' ? '💼'
    : item.alias === 'Gym'     ? '🏋️'
    : '📍'

  const linea = [item.calle, item.numeroExt, item.colonia, item.ciudad]
    .filter(Boolean).join(', ')

  return (
    <Pressable style={[styles.row, isSelected && styles.rowSelected]} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icono}</Text>
        <View>
          <Text style={styles.rowEtiqueta}>{item.alias}</Text>
          <Text style={styles.rowDireccion} numberOfLines={2}>{linea}</Text>
        </View>
      </View>
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const DomicilioSelector = ({ selected, onSelect }: Props) => {
  const nav = useNavigation<Nav>()
  const { domicilios, isLoading, fetchDomicilios } = useDomicilios()
  const [modalVisible, setModalVisible] = useState(false)

  // Cargar domicilios al montar
  useEffect(() => { fetchDomicilios() }, [fetchDomicilios])

  // Auto-seleccionar el predeterminado si no hay selección
  useEffect(() => {
    if (!selected && domicilios.length > 0) {
      const def = domicilios.find(d => d.esPredeterminado) ?? domicilios[0]
      onSelect(def)
    }
  }, [domicilios, selected])

  const handleSelect = (d: Domicilio) => {
    onSelect(d)
    setModalVisible(false)
  }

  const icono =
    selected?.alias === 'Casa'    ? '🏠'
    : selected?.alias === 'Trabajo' ? '💼'
    : selected?.alias === 'Gym'     ? '🏋️'
    : '📍'

  const direccionCorta = selected
    ? [selected.calle, selected.numeroExt, selected.colonia, selected.ciudad]
        .filter(Boolean).join(', ')
    : null

  return (
    <>
      {/* ── Pill de dirección seleccionada ────────────────────────────── */}
      <Pressable style={styles.pill} onPress={() => setModalVisible(true)}>
        {isLoading && !selected ? (
          <ActivityIndicator size="small" color="#FF6B35" />
        ) : selected ? (
          <>
            <Text style={styles.pillIcon}>{icono}</Text>
            <View style={styles.pillTexts}>
              <Text style={styles.pillLabel}>{selected.alias}</Text>
              <Text style={styles.pillDireccion} numberOfLines={1}>
                {direccionCorta}
              </Text>
            </View>
            <Text style={styles.pillChevron}>›</Text>
          </>
        ) : (
          <>
            <Text style={styles.pillIcon}>📍</Text>
            <Text style={styles.pillEmpty}>Selecciona una dirección</Text>
            <Text style={styles.pillChevron}>›</Text>
          </>
        )}
      </Pressable>

      {/* ── Modal de selección ────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />

        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>¿A dónde enviamos tu pedido?</Text>

          {isLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color="#FF6B35" />
          ) : domicilios.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No tienes domicilios guardados.</Text>
            </View>
          ) : (
            <FlatList
              data={domicilios}
              keyExtractor={d => d.id}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => (
                <DomicilioRow
                  item={item}
                  isSelected={selected?.id === item.id}
                  onPress={() => handleSelect(item)}
                />
              )}
            />
          )}

          {/* Agregar nueva dirección */}
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              setModalVisible(false)
              nav.navigate('AddAddress', {})
            }}
          >
            <Text style={styles.addBtnText}>+ Agregar dirección nueva</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Pill
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  pillIcon:      { fontSize: 20 },
  pillTexts:     { flex: 1 },
  pillLabel:     { fontSize: 12, fontWeight: '700', color: '#FF6B35' },
  pillDireccion: { fontSize: 13, color: '#374151', marginTop: 1 },
  pillEmpty:     { flex: 1, fontSize: 14, color: '#9CA3AF' },
  pillChevron:   { fontSize: 20, color: '#9CA3AF' },

  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingBottom: 32, maxHeight: '75%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#E5E7EB',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },

  // Filas
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowSelected:   { backgroundColor: '#FFF8F5' },
  rowLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon:       { fontSize: 22 },
  rowEtiqueta:   { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  rowDireccion:  { fontSize: 12, color: '#6B7280', maxWidth: 240, marginTop: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  radioSelected: { borderColor: '#FF6B35' },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },

  // Empty
  emptyWrap: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },

  // Botón agregar
  addBtn: {
    marginTop: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#FF6B35',
    padding: 14, alignItems: 'center',
  },
  addBtnText: { color: '#FF6B35', fontSize: 15, fontWeight: '700' },
})