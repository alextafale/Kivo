import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useAuth } from '../../../application/context/AuthContext';
import * as ImagePicker from "expo-image-picker";
import { supabase } from '../../../config/supabaseConfig';
import { useTheme } from '../../../application/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

type MenuItemEditorNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MenuItemEditor'>;
type MenuItemEditorRouteProp = RouteProp<RootStackParamList, 'MenuItemEditor'>;

type Props = {
  navigation: MenuItemEditorNavigationProp;
  route: MenuItemEditorRouteProp;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = ({ color = '#111827' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 5l-7 7 7 7" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const DollarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
    <Line x1="12" y1="1" x2="12" y2="23" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

const TAG_OPTIONS = ['Vegetarian', 'Vegan', 'Spicy', 'Gluten-Free', 'Bestseller', 'New', 'Featured'];

const TagPill = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => {
  const { colors, isDark } = useTheme();
  return (
  <TouchableOpacity
    style={[styles.tagPill, { backgroundColor: isDark ? colors.border : '#fff', borderColor: isDark ? colors.border : '#E5E7EB' }, selected && styles.tagPillActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {selected && (
      <View style={styles.tagCheck}>
        <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <Path d="M20 6L9 17l-5-5" />
        </Svg>
      </View>
    )}
    <Text style={[styles.tagPillText, { color: colors.titleText }, selected && styles.tagPillTextActive, selected && isDark && { color: '#4ade80' }]}>{label}</Text>
  </TouchableOpacity>
  );
};

// ─── Field Label ──────────────────────────────────────────────────────────────

const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => {
  const { colors } = useTheme();
  return (
  <View style={styles.fieldLabelRow}>
    <Text style={[styles.fieldLabel, { color: colors.titleText }]}>{label}</Text>
    {required && <Text style={styles.fieldRequired}>*</Text>}
  </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuItemEditor({ navigation, route }: Props) {
  const { itemId } = route.params;
  console.log("Aqui es menu item editor");

  // ✅ session viene del contexto — sin supabase.auth.getSession() inline
  const { adminAccess, session } = useAuth();
  const { colors, isDark } = useTheme();
  const sucursalId = adminAccess?.sucursalId;
  const negocioId  = adminAccess?.negocioId;

  const [isLoading, setIsLoading] = useState(true);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [category, setCategory] = useState('Main Course');
  const [prepTime, setPrepTime] = useState('15');
  const [calories, setCalories] = useState('500');
  const [enabled, setEnabled] = useState(true);
  const [soldOut, setSoldOut] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  //  Espera a que sucursalId Y session estén disponibles antes de hacer fetch
  React.useEffect(() => {
    const fetchData = async () => {
      if (!sucursalId || !session?.accessToken) return;

      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/sucursales/${sucursalId}`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } },
        );

        if (res.ok) {
          const data = await res.json();
          let categoriasServidor = data.categorias?.map((c: any) => c.nombre) || [];
          
          if (categoriasServidor.length === 0) {
              // Fallback for older backend without 'categorias' field
              const uniqueCats = new Set<string>();
              (data.menu || []).forEach((item: any) => {
                  if (item.categoria) uniqueCats.add(item.categoria);
              });
              categoriasServidor = Array.from(uniqueCats);
              if (categoriasServidor.length === 0) {
                  categoriasServidor = ['Main Course', 'Sides', 'Drinks', 'Desserts', 'Appetizers'];
              }
          }
          
          setAvailableCategories(categoriasServidor);

          if (itemId !== 'new') {
            const item = data.menu?.find((m: { id: string }) => m.id === itemId);
            if (item) {
              setName(item.nombre || '');
              setDescription(item.descripcion || '');
              setPrice(item.precio?.toString() || '0');
              setCategory(item.categoria || categoriasServidor[0]);
              setEnabled(item.disponible ?? true);
              setImageUrl(item.imagen_url);
            }
          } else {
             if (categoriasServidor.length > 0) {
               setCategory(categoriasServidor[0]);
             }
          }
        }
      } catch (e) {
        console.warn('fetchData error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sucursalId, itemId, session?.accessToken]); // ✅ se re-ejecuta si el token cambia

  const mark = () => setHasChanges(true);

  // ✨ Botón Magia — llama al backend y rellena descripción, tags y tiempo
  const handleMagic = async () => {
    if (!name.trim()) {
      Alert.alert('Primero escribe el nombre del platillo', 'Escribe el nombre antes de usar la magia ✨');
      return;
    }
    setIsMagicLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
      const res = await fetch(`${apiUrl}/api/v1/chatbot/menu-magic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dish_name: name, category, price }),
      });
      if (!res.ok) throw new Error('Error en el servidor');
      const data = await res.json();

      if (data.descripcion) {
        setDescription(data.descripcion);
        mark();
      }
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        // Filtrar solo tags válidos de nuestra lista
        const validTags = ['Vegetarian', 'Vegan', 'Spicy', 'Gluten-Free', 'Bestseller', 'New', 'Featured'];
        const filteredTags = data.tags.filter((t: string) => validTags.includes(t));
        if (filteredTags.length > 0) setTags(filteredTags);
        mark();
      }
      if (data.prep_time) {
        const num = parseInt(data.prep_time, 10);
        if (!isNaN(num)) { setPrepTime(String(num)); mark(); }
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con la IA. Inténtalo de nuevo.');
    } finally {
      setIsMagicLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    mark();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("nombre", name);
    formData.append("descripcion", description);
    formData.append("precio", price);
    formData.append("disponible", enabled.toString());
    formData.append("categoria", category);

    if (imageUri) {
      formData.append("imagen", {
        uri: imageUri,
        name: "producto.jpg",
        type: "image/jpeg",
      } as any | null);
    }

    return formData;
  };

  const createMenuItem = async () => {
    const formData = buildFormData();
    // Obtener token fresco
    const { data: { session: s } } = await supabase.auth.getSession();
    const token = s?.access_token ?? session?.accessToken;

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/sucursales/${sucursalId}/menu`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.warn('createMenuItem error:', res.status, body);
      throw new Error("Error creando");
    }
  };

  const updateMenuItem = async () => {
    // El backend usa Form(...) en todos los campos → siempre FormData
    const { data: { session: s } } = await supabase.auth.getSession();
    const token = s?.access_token ?? session?.accessToken;
    const baseUrl = `${process.env.EXPO_PUBLIC_API_URL}/sucursales/negocios/${negocioId}/sucursales/${sucursalId}/menu/${itemId}`;

    const formData = buildFormData();
    const res = await fetch(baseUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn('updateMenuItem error:', res.status, body);
      throw new Error("Error actualizando");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    if (!name.trim()) {
      Alert.alert('Requerido', 'Ingresa un nombre.');
      return;
    }

    try {
      if (itemId === "new") {
        await createMenuItem();
        Alert.alert("Éxito", "Producto creado");
      } else {
        await updateMenuItem();
        Alert.alert("Éxito", "Producto actualizado");
      }

      navigation.goBack();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "No se pudo guardar");
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
  Alert.alert(
    'Delete item',
    `Are you sure you want to delete "${name}" from the menu?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data: { session: s } } = await supabase.auth.getSession();
            const token = s?.access_token ?? session?.accessToken;
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/sucursales/negocios/${negocioId}/sucursales/${sucursalId}/menu/${itemId}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!res.ok) {
              const body = await res.text();
              console.warn('handleDelete error:', res.status, body);
              throw new Error('There was an error');
            }
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Could not delete item');
          }
        }
      },
    ],
  );
};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.pageBg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? colors.border : '#fff' }]} onPress={() => navigation.goBack()}>
          <BackIcon color={colors.titleText} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.titleText }]}>{itemId === 'new' ? 'Nuevo Platillo' : 'Editar Platillo'}</Text>
          {hasChanges && <View style={styles.unsavedDot} />}
        </View>
        {itemId !== 'new' ? (
          <TouchableOpacity style={[styles.deleteButton, { backgroundColor: isDark ? '#7f1d1d' : '#FEF2F2' }]} onPress={handleDelete}>
            <TrashIcon />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 42 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Image Upload ── */}
            <View style={styles.imageSection}>
              <TouchableOpacity
                style={styles.imageWrapper}
                activeOpacity={0.85}
                onPress={pickImage}
              >
                {imageUri || imageUrl ? (
                  <Image
                    source={{ uri: (imageUri || imageUrl) as string}}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
                    <CameraIcon />
                    <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                  </View>
                )}

                {/* 🔹 Badge para editar SIEMPRE visible */}
                <View style={styles.imageEditBadge}>
                  <CameraIcon />
                </View>
              </TouchableOpacity>
            </View>

            {/* ── Availability Toggles ── */}
            <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.titleText }]}>Item Available</Text>
                  <Text style={[styles.toggleSubtext, { color: colors.subtitleText }]}>Show this item to customers</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={(v) => { setEnabled(v); mark(); }}
                  trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
              <View style={[styles.cardDivider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.titleText }, soldOut && styles.toggleLabelWarn]}>Sold Out</Text>
                  <Text style={[styles.toggleSubtext, { color: colors.subtitleText }]}>Temporarily unavailable</Text>
                </View>
                <Switch
                  value={soldOut}
                  onValueChange={(v) => { setSoldOut(v); mark(); }}
                  trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                  thumbColor="#fff"
                  ios_backgroundColor="#E5E7EB"
                />
              </View>
            </View>

            {/* ── Basic Info ── */}
            <View style={styles.sectionBlock}>
              <View style={styles.basicInfoHeader}>
                <Text style={[styles.blockTitle, { color: colors.subtitleText }]}>Basic Info</Text>
                <TouchableOpacity
                  style={[styles.magicBtn, isMagicLoading && styles.magicBtnLoading]}
                  onPress={handleMagic}
                  activeOpacity={0.8}
                  disabled={isMagicLoading}
                >
                  {isMagicLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="auto-awesome" size={14} color="#fff" />
                      <Text style={styles.magicBtnText}>Magia IA</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
                <FieldLabel label="Item Name" required />
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.border : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB', color: colors.titleText }]}
                  value={name}
                  onChangeText={(v) => { setName(v); mark(); }}
                  placeholder="e.g. Classic Margherita"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                />
                <View style={styles.fieldGap} />
                <View style={styles.descriptionLabelRow}>
                  <FieldLabel label="Description" />
                  {description.length > 0 && (
                    <View style={styles.aiGeneratedBadge}>
                      <MaterialIcons name="auto-awesome" size={10} color={MAGIC_PURPLE} />
                    </View>
                  )}
                </View>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: isDark ? colors.border : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB', color: colors.titleText }]}
                  value={description}
                  onChangeText={(v) => { setDescription(v); mark(); }}
                  placeholder="Describe the dish, ingredients, flavours..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* ── Pricing ── */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.blockTitle, { color: colors.subtitleText }]}>Pricing</Text>
              <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
                <FieldLabel label="Price" required />
                <View style={styles.inputWithPrefix}>
                  <View style={styles.inputPrefix}>
                    <DollarIcon />
                  </View>
                  <TextInput
                    style={[styles.input, styles.inputPrefixed, { backgroundColor: isDark ? colors.border : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB', color: colors.titleText }]}
                    value={price}
                    onChangeText={(v) => { setPrice(v); mark(); }}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            {/* ── Category ── */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.blockTitle, { color: colors.subtitleText }]}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {availableCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, { backgroundColor: isDark ? colors.border : '#fff', borderColor: isDark ? colors.border : '#E5E7EB' }, category === cat && styles.categoryChipActive]}
                    onPress={() => { setCategory(cat); mark(); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.categoryChipText, { color: colors.titleText }, category === cat && styles.categoryChipTextActive, category === cat && isDark && { color: '#fff' }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── Details ── */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.blockTitle, { color: colors.subtitleText }]}>Details</Text>
              <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
                <View style={styles.detailsRow}>
                  <View style={styles.detailField}>
                    <FieldLabel label="Prep Time (min)" />
                    <TextInput
                      style={[styles.input, { backgroundColor: isDark ? colors.border : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB', color: colors.titleText }]}
                      value={prepTime}
                      onChangeText={(v) => { setPrepTime(v); mark(); }}
                      placeholder="15"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={[styles.detailDivider, { backgroundColor: isDark ? colors.border : '#F3F4F6' }]} />
                  <View style={styles.detailField}>
                    <FieldLabel label="Calories (kcal)" />
                    <TextInput
                      style={[styles.input, { backgroundColor: isDark ? colors.border : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB', color: colors.titleText }]}
                      value={calories}
                      onChangeText={(v) => { setCalories(v); mark(); }}
                      placeholder="500"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* ── Tags ── */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.blockTitle, { color: colors.subtitleText }]}>Tags</Text>
              <View style={styles.tagsWrapper}>
                {TAG_OPTIONS.map((tag) => (
                  <TagPill
                    key={tag}
                    label={tag}
                    selected={tags.includes(tag)}
                    onPress={() => toggleTag(tag)}
                  />
                ))}
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* ── Save Button ── */}
      <View style={[styles.saveBar, { backgroundColor: colors.pageBg, borderTopColor: colors.rowDivider }]}>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDim]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          <CheckIcon />
          <Text style={styles.saveButtonText}>
            {hasChanges ? (isLoading ? 'Saving...' : 'Save Changes') : 'No Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN = '#22c55e';
const LIGHT_GREEN = '#F0FDF4';
const MAGIC_PURPLE = '#7C3AED';
const MAGIC_BLUE = '#2563EB';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: 160,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  toggleLabelWarn: {
    color: '#D97706',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  basicInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    paddingLeft: 2,
  },
  magicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: MAGIC_PURPLE,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: MAGIC_PURPLE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  magicBtnLoading: {
    opacity: 0.75,
  },
  magicBtnIcon: {
    fontSize: 13,
  },
  magicBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  descriptionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiGeneratedBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiGeneratedText: {
    fontSize: 10,
    fontWeight: '700',
    color: MAGIC_PURPLE,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 3,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  fieldRequired: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  fieldGap: {
    height: 14,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  textArea: {
    height: 96,
    paddingTop: 12,
  },
  inputWithPrefix: {
    position: 'relative',
  },
  inputPrefix: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  inputPrefixed: {
    paddingLeft: 38,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailField: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 5,
  },
  tagPillActive: {
    backgroundColor: LIGHT_GREEN,
    borderColor: GREEN,
  },
  tagCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tagPillTextActive: {
    color: '#166534',
  },
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: '#F2F7F2',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDim: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});