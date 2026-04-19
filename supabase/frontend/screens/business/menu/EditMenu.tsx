import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MenuEditor'>;
type Props = { navigation: Nav; route: any };

const { width } = Dimensions.get('window');

// ─── ICONS ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const TrashIcon = ({ color = '#ef4444' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <Path d="m15 5 4 4" />
  </Svg>
);

const PlusIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const DollarIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

const ChevronDown = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
    <Path d="m6 9 6 6 6-6" />
  </Svg>
);

const GearIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

const XIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const ImageIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
    <Rect x="3" y="3" width="18" height="18" rx="3" />
    <Circle cx="8.5" cy="8.5" r="1.5" />
    <Path d="m21 15-5-5L5 21" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Addon {
  id: string;
  name: string;
  price: number;
  required: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
  imageUrl: string;
  addons: Addon[];
}

const CATEGORIES = ['Ensaladas', 'Bowls', 'Burgers', 'Tacos', 'Pizzas', 'Bebidas', 'Postres', 'Otros'];

const MOCK_ITEM: MenuItem = {
  id: '1',
  name: 'Superfood Quinoa Bowl',
  description: 'Organic quinoa, roasted kale, avocado, cherry tomatoes, and lemon-tahini dressing.',
  price: '14.50',
  category: 'Bowls',
  available: true,
  imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
  addons: [
    { id: '1', name: 'Extra Avocado', price: 2.50, required: false },
    { id: '2', name: 'Spiciness Level', price: 0, required: true  },
  ],
};

// ─── FOCUS INPUT ──────────────────────────────────────────────────────────────

const FocusInput = ({
  value, onChange, placeholder, multiline, keyboardType, prefix, style,
}: {
  value: string; onChange: (v: string) => void; placeholder: string;
  multiline?: boolean; keyboardType?: any; prefix?: React.ReactNode; style?: any;
}) => {
  const border = useRef(new Animated.Value(0)).current;
  const onFocus = () => Animated.timing(border, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  const onBlur  = () => Animated.timing(border, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  const borderColor = border.interpolate({ inputRange: [0, 1], outputRange: ['#e2e8f0', '#22c55e'] });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor }, style]}>
      {prefix && <View style={styles.inputPrefix}>{prefix}</View>}
      <TextInput
        style={[styles.inputText, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#b0bec5"
        multiline={multiline}
        keyboardType={keyboardType}
        onFocus={onFocus}
        onBlur={onBlur}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </Animated.View>
  );
};

// ─── ADDON ROW ────────────────────────────────────────────────────────────────

const AddonRow = ({
  addon, onSettings, delay,
}: {
  addon: Addon; onSettings: () => void; delay: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
    }}>
      <View style={styles.addonRow}>
        <View style={[styles.addonIcon, addon.required && styles.addonIconRequired]}>
          {addon.required
            ? <XIcon color="#ef4444" />
            : <PlusIcon color="#22c55e" />}
        </View>
        <View style={styles.addonText}>
          <Text style={styles.addonName}>{addon.name}</Text>
          <Text style={styles.addonSub}>
            {addon.required ? 'Selección requerida' : `+$${addon.price.toFixed(2)}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.gearBtn} onPress={onSettings}>
          <GearIcon />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── CATEGORY PICKER MODAL ────────────────────────────────────────────────────

const CategoryModal = ({
  visible, selected, onSelect, onClose,
}: {
  visible: boolean; selected: string; onSelect: (v: string) => void; onClose: () => void;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
        <View style={styles.modalHead}>
          <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <CloseIcon />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catOption, selected === cat && styles.catOptionSelected]}
              onPress={() => { onSelect(cat); onClose(); }}
            >
              <Text style={[styles.catOptionText, selected === cat && styles.catOptionTextSelected]}>
                {cat}
              </Text>
              {selected === cat && (
                <View style={styles.catCheck}>
                  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── ADDON MODAL ─────────────────────────────────────────────────────────────

const AddonModal = ({
  visible, addon, onSave, onClose,
}: {
  visible: boolean; addon: Addon | null; onSave: (a: Addon) => void; onClose: () => void;
}) => {
  const [name, setName]         = useState(addon?.name ?? '');
  const [price, setPrice]       = useState(addon?.price?.toString() ?? '');
  const [required, setRequired] = useState(addon?.required ?? false);

  useEffect(() => {
    if (addon) { setName(addon.name); setPrice(addon.price.toString()); setRequired(addon.required); }
    else { setName(''); setPrice(''); setRequired(false); }
  }, [addon]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Campo requerido', 'Ingresa el nombre del add-on.'); return; }
    onSave({
      id: addon?.id ?? Date.now().toString(),
      name: name.trim(),
      price: parseFloat(price) || 0,
      required,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{addon ? 'Editar Add-on' : 'Nuevo Add-on'}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}><CloseIcon /></TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <FocusInput value={name} onChange={setName} placeholder="Ej: Extra Aguacate" />
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Precio adicional ($)</Text>
            <FocusInput value={price} onChange={setPrice} placeholder="0.00" keyboardType="decimal-pad" prefix={<DollarIcon />} />
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleTitle}>Selección requerida</Text>
                <Text style={styles.toggleSub}>El cliente debe elegir una opción</Text>
              </View>
              <Switch
                value={required}
                onValueChange={setRequired}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={required ? '#22c55e' : '#f1f5f9'}
              />
            </View>
            <TouchableOpacity style={styles.saveBtnSm} onPress={handleSave}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveBtnSmGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.saveBtnSmText}>{addon ? 'Guardar cambios' : 'Agregar'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function EditMenuItem({ navigation, route }: Props) {
  const existingItem: MenuItem = route?.params?.item ?? MOCK_ITEM;

  const [name, setName]               = useState(existingItem.name);
  const [description, setDescription] = useState(existingItem.description);
  const [price, setPrice]             = useState(existingItem.price);
  const [category, setCategory]       = useState(existingItem.category);
  const [available, setAvailable]     = useState(existingItem.available);
  const [addons, setAddons]           = useState<Addon[]>(existingItem.addons);
  const [imageUrl]                    = useState(existingItem.imageUrl);

  const [categoryModal, setCategoryModal] = useState(false);
  const [addonModal, setAddonModal]       = useState(false);
  const [editingAddon, setEditingAddon]   = useState<Addon | null>(null);
  const [saving, setSaving]               = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const imageAnim  = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(imageAnim,  { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(formAnim,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(footerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDelete = () => {
    Alert.alert(
      'Eliminar platillo',
      `¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleSaveAddon = (addon: Addon) => {
    setAddons(prev =>
      editingAddon
        ? prev.map(a => a.id === addon.id ? addon : a)
        : [...prev, addon]
    );
  };

  const handleDeleteAddon = (id: string) => {
    Alert.alert('Eliminar add-on', '¿Deseas eliminar este add-on?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => setAddons(p => p.filter(a => a.id !== id)) },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Campo requerido', 'Ingresa el nombre del platillo.'); return; }
    if (!price || isNaN(parseFloat(price))) { Alert.alert('Precio inválido', 'Ingresa un precio válido.'); return; }

    setSaving(true);
    try {
      const item: MenuItem = {
        id: existingItem.id,
        name: name.trim(),
        description: description.trim(),
        price,
        category,
        available,
        imageUrl,
        addons,
      };
      const stored = await AsyncStorage.getItem('menuItems');
      const items: MenuItem[] = stored ? JSON.parse(stored) : [];
      const idx = items.findIndex(i => i.id === item.id);
      if (idx >= 0) items[idx] = item; else items.push(item);
      await AsyncStorage.setItem('menuItems', JSON.stringify(items));
      Alert.alert('✓ Guardado', 'Los cambios fueron guardados exitosamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el platillo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── HEADER ──────────────────────────────────────────── */}
        <Animated.View style={[styles.header, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Menu Item</Text>
          <TouchableOpacity style={styles.deleteHeaderBtn} onPress={handleDelete}>
            <TrashIcon />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── IMAGE ─────────────────────────────────────────── */}
          <Animated.View style={[styles.imageSection, {
            opacity: imageAnim,
            transform: [{ scale: imageAnim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          }]}>
            <View style={styles.imageCard}>
              <Image source={{ uri: imageUrl }} style={styles.dishImage} resizeMode="cover" />
              <TouchableOpacity style={styles.editImageBtn}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.editImageGrad}>
                  <EditIcon />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={{
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }}>
            {/* ── AVAILABLE TOGGLE ────────────────────────────── */}
            <View style={[styles.toggleCard, available ? styles.toggleCardOn : styles.toggleCardOff]}>
              <View>
                <Text style={styles.toggleCardTitle}>
                  {available ? 'Available' : 'Sold Out'}
                </Text>
                <Text style={styles.toggleCardSub}>Toggle to mark as sold out</Text>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: '#fca5a5', true: '#86efac' }}
                thumbColor={available ? '#22c55e' : '#ef4444'}
                ios_backgroundColor="#fca5a5"
              />
            </View>

            {/* ── DISH NAME ─────────────────────────────────── */}
            <Text style={styles.fieldLabel}>Dish Name</Text>
            <FocusInput value={name} onChange={setName} placeholder="Ej: Superfood Quinoa Bowl" />

            {/* ── DESCRIPTION ────────────────────────────────── */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Description</Text>
            <FocusInput
              value={description}
              onChange={setDescription}
              placeholder="Describe los ingredientes..."
              multiline
              style={{ minHeight: 90 }}
            />

            {/* ── PRICE + CATEGORY ───────────────────────────── */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Price ($)</Text>
                <FocusInput
                  value={price}
                  onChange={setPrice}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  prefix={<DollarIcon />}
                />
              </View>
              <View style={styles.colGap} />
              <View style={{ flex: 1.2 }}>
                <Text style={styles.fieldLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.categoryBtn}
                  onPress={() => setCategoryModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryBtnText}>{category}</Text>
                  <ChevronDown />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── ADD-ONS & MODIFIERS ─────────────────────────── */}
            <View style={styles.addonsHeader}>
              <Text style={styles.addonsTitle}>Add-ons & Modifiers</Text>
              <TouchableOpacity
                style={styles.addNewBtn}
                onPress={() => { setEditingAddon(null); setAddonModal(true); }}
              >
                <View style={styles.addNewIcon}><PlusIcon /></View>
                <Text style={styles.addNewText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {addons.length === 0 ? (
              <View style={styles.addonsEmpty}>
                <Text style={styles.addonsEmptyText}>Sin add-ons. Toca "Add New" para agregar.</Text>
              </View>
            ) : (
              addons.map((addon, i) => (
                <AddonRow
                  key={addon.id}
                  addon={addon}
                  delay={i * 60}
                  onSettings={() => { setEditingAddon(addon); setAddonModal(true); }}
                />
              ))
            )}

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>

        {/* ── FOOTER ──────────────────────────────────────────── */}
        <Animated.View style={[styles.footer, {
          opacity: footerAnim,
          transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
        }]}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.87} disabled={saving}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.saveBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <SaveIcon />
              <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : 'Save Changes'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* ── MODALS ──────────────────────────────────────────────── */}
      <CategoryModal
        visible={categoryModal}
        selected={category}
        onSelect={setCategory}
        onClose={() => setCategoryModal(false)}
      />
      <AddonModal
        visible={addonModal}
        addon={editingAddon}
        onSave={handleSaveAddon}
        onClose={() => setAddonModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: 0.1,
  },
  deleteHeaderBtn: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#fff5f5',
    alignItems: 'center', justifyContent: 'center',
  },

  scrollContent: { paddingBottom: 20 },

  // Image
  imageSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  imageCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  dishImage: {
    width: '100%',
    height: 220,
  },
  editImageBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  editImageGrad: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },

  // Available toggle card
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleCardOn: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  toggleCardOff: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  toggleCardTitle: {
    fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 2,
  },
  toggleCardSub: {
    fontSize: 12, color: '#94a3b8',
  },

  // Form
  fieldLabel: {
    fontSize: 14, fontWeight: '700', color: '#334155',
    marginBottom: 8, marginHorizontal: 20,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    marginHorizontal: 20,
  },
  inputPrefix: {
    paddingTop: 16,
    marginRight: 8,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 15,
    fontWeight: '500',
  },
  inputMulti: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  // Two column
  twoCol: {
    flexDirection: 'row',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  colGap: { width: 12 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  categoryBtnText: {
    fontSize: 15, fontWeight: '500', color: '#0f172a', flex: 1,
  },

  // Add-ons
  addonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  addonsTitle: {
    fontSize: 18, fontWeight: '800', color: '#0f172a',
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addNewIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center',
  },
  addNewText: {
    fontSize: 14, fontWeight: '700', color: '#22c55e',
  },
  addonsEmpty: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addonsEmptyText: {
    fontSize: 13, color: '#94a3b8', fontWeight: '500',
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  addonIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center',
  },
  addonIconRequired: {
    backgroundColor: '#fee2e2',
  },
  addonText: { flex: 1 },
  addonName: {
    fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2,
  },
  addonSub: {
    fontSize: 12, color: '#94a3b8',
  },
  gearBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 18,
    elevation: 10,
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  saveBtnText: {
    fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.2,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: '#0f172a',
  },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },

  // Category
  catOption: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  catOptionSelected: {},
  catOptionText: {
    fontSize: 16, fontWeight: '500', color: '#374151',
  },
  catOptionTextSelected: {
    fontWeight: '700', color: '#22c55e',
  },
  catCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },

  // Addon modal
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 16, padding: 16,
    marginTop: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  toggleTitle: {
    fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2,
  },
  toggleSub: {
    fontSize: 12, color: '#94a3b8',
  },
  saveBtnSm: {
    marginTop: 20,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 6,
  },
  saveBtnSmGrad: {
    paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnSmText: {
    fontSize: 15, fontWeight: '800', color: '#fff',
  },
});