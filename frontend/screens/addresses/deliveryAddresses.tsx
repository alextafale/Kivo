import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DeliveryAddresses'>;
type Props = { navigation: Nav };

const { width } = Dimensions.get('window');

// ─── ICONS ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const PlusIcon = ({ color = '#fff' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const HomeIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <Path d="M9 21V12h6v9" />
  </Svg>
);

const OfficeIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="2" y="3" width="20" height="18" rx="2" />
    <Path d="M8 7h8M8 11h8M8 15h5" />
  </Svg>
);

const PinIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const EmptyIcon = () => (
  <Svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#d1fae5" strokeWidth="1.2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

// ─── TYPES ───────────────────────────────────────────────────────────────────

type AddressType = 'home' | 'office' | 'other';

interface Address {
  id: string;
  type: AddressType;
  label: string;
  street: string;
  city: string;
  reference?: string;
  isDefault: boolean;
}

const TYPE_LABELS: Record<AddressType, string> = {
  home: 'Casa',
  office: 'Oficina',
  other: 'Otro',
};

const TYPE_ICONS: Record<AddressType, React.ReactNode> = {
  home: <HomeIcon />,
  office: <OfficeIcon />,
  other: <PinIcon />,
};

const INITIAL_ADDRESSES: Address[] = [
  {
    id: '1',
    type: 'home',
    label: 'Casa',
    street: 'Calle Principal #123, Col. Centro',
    city: 'Ciudad de México, CDMX',
    reference: 'Portón azul, segundo piso',
    isDefault: true,
  },
  {
    id: '2',
    type: 'office',
    label: 'Oficina',
    street: 'Av. Insurgentes Sur #1602',
    city: 'Ciudad de México, CDMX',
    reference: 'Torre B, piso 8',
    isDefault: false,
  },
];

// ─── ADDRESS CARD ─────────────────────────────────────────────────────────────

const AddressCard = ({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  delay = 0,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  delay?: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <View style={[styles.card, address.isDefault && styles.cardDefault]}>
        {/* Badge default */}
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <CheckIcon />
            <Text style={styles.defaultBadgeText}>Predeterminada</Text>
          </View>
        )}

        <View style={styles.cardTop}>
          {/* Icon */}
          <View style={[styles.typeIconWrap, address.isDefault && styles.typeIconWrapActive]}>
            {TYPE_ICONS[address.type]}
          </View>

          {/* Text */}
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardLabel}>{address.label || TYPE_LABELS[address.type]}</Text>
            <Text style={styles.cardStreet}>{address.street}</Text>
            <Text style={styles.cardCity}>{address.city}</Text>
            {address.reference ? (
              <Text style={styles.cardReference}>📍 {address.reference}</Text>
            ) : null}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {!address.isDefault && (
            <TouchableOpacity style={styles.actionSetDefault} onPress={onSetDefault}>
              <Text style={styles.actionSetDefaultText}>Usar como predeterminada</Text>
            </TouchableOpacity>
          )}
          <View style={styles.cardActionBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
              <EditIcon />
              <Text style={styles.iconBtnText}>Editar</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDelete]} onPress={onDelete}>
              <TrashIcon />
              <Text style={styles.iconBtnTextDelete}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function DeliveryAddresses({ navigation }: Props) {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [formType, setFormType] = useState<AddressType>('home');
  const [formLabel, setFormLabel] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formDefault, setFormDefault] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1, duration: 450, useNativeDriver: true,
    }).start();
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem('deliveryAddresses');
      if (stored) setAddresses(JSON.parse(stored));
    } catch {}
  };

  const saveAddresses = async (list: Address[]) => {
    try {
      await AsyncStorage.setItem('deliveryAddresses', JSON.stringify(list));
    } catch {}
  };

  const openAddModal = () => {
    setEditingAddress(null);
    setFormType('home');
    setFormLabel('');
    setFormStreet('');
    setFormCity('');
    setFormRef('');
    setFormDefault(addresses.length === 0);
    setModalVisible(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setFormType(addr.type);
    setFormLabel(addr.label);
    setFormStreet(addr.street);
    setFormCity(addr.city);
    setFormRef(addr.reference || '');
    setFormDefault(addr.isDefault);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formStreet.trim() || !formCity.trim()) {
      Alert.alert('Campos requeridos', 'Por favor ingresa la calle y la ciudad.');
      return;
    }

    let updated: Address[];

    if (editingAddress) {
      updated = addresses.map(a =>
        a.id === editingAddress.id
          ? { ...a, type: formType, label: formLabel || TYPE_LABELS[formType], street: formStreet, city: formCity, reference: formRef, isDefault: formDefault || a.isDefault }
          : formDefault ? { ...a, isDefault: false } : a
      );
    } else {
      const newAddr: Address = {
        id: Date.now().toString(),
        type: formType,
        label: formLabel || TYPE_LABELS[formType],
        street: formStreet,
        city: formCity,
        reference: formRef,
        isDefault: formDefault,
      };
      updated = formDefault
        ? [...addresses.map(a => ({ ...a, isDefault: false })), newAddr]
        : [...addresses, newAddr];
    }

    setAddresses(updated);
    saveAddresses(updated);
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar dirección', '¿Deseas eliminar esta dirección?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated = addresses.filter(a => a.id !== id);
          // if we deleted the default, assign to first remaining
          if (updated.length > 0 && !updated.some(a => a.isDefault)) {
            updated[0].isDefault = true;
          }
          setAddresses(updated);
          saveAddresses(updated);
        },
      },
    ]);
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    saveAddresses(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
        }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Direcciones</Text>
          <Text style={styles.headerSub}>{addresses.length} {addresses.length === 1 ? 'dirección guardada' : 'direcciones guardadas'}</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={openAddModal}>
          <PlusIcon color="#22c55e" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── LIST ────────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <EmptyIcon />
            <Text style={styles.emptyTitle}>Sin direcciones</Text>
            <Text style={styles.emptySub}>Agrega tu primera dirección de entrega</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.emptyBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <PlusIcon />
                <Text style={styles.emptyBtnText}>Agregar dirección</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Sort: default first */}
            {[...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map((addr, i) => (
              <AddressCard
                key={addr.id}
                address={addr}
                delay={i * 80}
                onEdit={() => openEditModal(addr)}
                onDelete={() => handleDelete(addr.id)}
                onSetDefault={() => handleSetDefault(addr.id)}
              />
            ))}

            {/* Add more */}
            <TouchableOpacity style={styles.addMoreBtn} onPress={openAddModal} activeOpacity={0.8}>
              <View style={styles.addMoreIcon}>
                <PlusIcon color="#22c55e" />
              </View>
              <Text style={styles.addMoreText}>Agregar nueva dirección</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── FAB ─────────────────────────────────────────────────── */}
      {addresses.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={openAddModal} activeOpacity={0.85}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <PlusIcon />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── MODAL ───────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Type selector */}
              <Text style={styles.formLabel}>Tipo de dirección</Text>
              <View style={styles.typeSelector}>
                {(['home', 'office', 'other'] as AddressType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, formType === t && styles.typeChipActive]}
                    onPress={() => setFormType(t)}
                  >
                    <View style={styles.typeChipIcon}>
                      {t === 'home' ? <HomeIcon color={formType === t ? '#fff' : '#22c55e'} /> :
                       t === 'office' ? <OfficeIcon color={formType === t ? '#fff' : '#22c55e'} /> :
                       <PinIcon color={formType === t ? '#fff' : '#22c55e'} />}
                    </View>
                    <Text style={[styles.typeChipText, formType === t && styles.typeChipTextActive]}>
                      {TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Label */}
              <Text style={styles.formLabel}>Nombre (opcional)</Text>
              <TextInput
                style={styles.input}
                value={formLabel}
                onChangeText={setFormLabel}
                placeholder={`Ej: ${TYPE_LABELS[formType]}`}
                placeholderTextColor="#94a3b8"
              />

              {/* Street */}
              <Text style={styles.formLabel}>Calle y número *</Text>
              <TextInput
                style={styles.input}
                value={formStreet}
                onChangeText={setFormStreet}
                placeholder="Av. Insurgentes Sur #1234"
                placeholderTextColor="#94a3b8"
              />

              {/* City */}
              <Text style={styles.formLabel}>Ciudad / Alcaldía *</Text>
              <TextInput
                style={styles.input}
                value={formCity}
                onChangeText={setFormCity}
                placeholder="Ciudad de México, CDMX"
                placeholderTextColor="#94a3b8"
              />

              {/* Reference */}
              <Text style={styles.formLabel}>Referencia (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={formRef}
                onChangeText={setFormRef}
                placeholder="Entre calles, color de fachada, piso..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />

              {/* Default toggle */}
              <View style={styles.defaultToggleRow}>
                <View>
                  <Text style={styles.defaultToggleTitle}>Establecer como predeterminada</Text>
                  <Text style={styles.defaultToggleSub}>Se usará automáticamente al ordenar</Text>
                </View>
                <Switch
                  value={formDefault}
                  onValueChange={setFormDefault}
                  trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                  thumbColor={formDefault ? '#22c55e' : '#fff'}
                />
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.saveBtnGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.saveBtnText}>
                    {editingAddress ? 'Guardar cambios' : 'Agregar dirección'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#f0fdf4',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.1,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 1,
  },
  addHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Address card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardDefault: {
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.15,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#22c55e',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 14,
  },
  typeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeIconWrapActive: {
    backgroundColor: '#dcfce7',
  },
  cardTextBlock: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  cardStreet: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 1,
  },
  cardCity: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  cardReference: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardActions: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionSetDefault: {
    flex: 1,
  },
  actionSetDefaultText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  cardActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  iconBtnDelete: {
    backgroundColor: '#fff5f5',
  },
  iconBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  iconBtnTextDelete: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  actionDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 2,
  },

  // Add more button
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#dcfce7',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  addMoreIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 18,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  fabGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Form
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 14,
    textTransform: 'uppercase',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  typeChipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  typeChipIcon: {
    // wrapper for conditional icon color
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22c55e',
  },
  typeChipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    fontWeight: '500',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  defaultToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  defaultToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  defaultToggleSub: {
    fontSize: 12,
    color: '#94a3b8',
  },

  // Modal footer
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});