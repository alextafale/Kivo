import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';

import { useAuth } from '../../../application/context/AuthContext';
import { supabase } from '../../../config/supabaseConfig';
import { useTheme } from '../../../application/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';



type MenuEditorNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MenuEditor'>;
type Props = { navigation: MenuEditorNavigationProp };

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="M21 21l-4.35-4.35" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19" />
    <Line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

const FilterIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
    <Path d="M4 6h16M7 12h10M10 18h4" />
  </Svg>
);

const EditIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

// ─── Types & Data ─────────────────────────────────────────────────────────────

type Category = 'All Items' | 'Main Course' | 'Sides' | 'Drinks';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  enabled: boolean;
  imageUrl?: string;
  soldOut?: boolean;
  category: 'main' | 'sides' | 'drinks';
}

interface MenuSection {
  id?: string;
  title: string;
  count: number;
  items: MenuItem[];
}

// No initial hardcoded sections

// ─── Sub-components ───────────────────────────────────────────────────────────

const MenuItemCard = ({
  item,
  onToggle,
  onEdit,
}: {
  item: MenuItem;
  onToggle: (id: string, val: boolean) => void;
  onEdit: (item: MenuItem) => void;
}) => {
  const disabled = !item.enabled;
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.itemCard, { borderBottomColor: isDark ? colors.border : '#F3F4F6' }, disabled && styles.itemCardDisabled]}>
      <View style={styles.imageWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={[styles.itemImage, disabled && styles.itemImageDisabled]} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]} />
        )}
        {item.soldOut && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.titleText }, disabled && styles.itemNameDisabled]}>{item.name}</Text>
        <Text style={[styles.itemPrice, disabled && styles.itemPriceDisabled]}>
          ${item.price.toFixed(2)}
        </Text>
      </View>

      <View style={styles.itemControls}>
        <Switch
          value={item.enabled}
          onValueChange={(val) => onToggle(item.id, val)}
          trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
          style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
        />
        <TouchableOpacity onPress={() => onEdit(item)} style={styles.editButton}>
          <EditIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuEditor({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab]     = useState<TabName>('Menu');
  const [activeCategory, setCategory] = useState<Category>('All Items');
  const [searchText, setSearchText]   = useState('');
  const [sections, setSections]       = useState<MenuSection[]>([]);
  const [categories, setCategories]   = useState<Category[]>(['All Items']);
  const [isLoading, setIsLoading]     = useState(true);

  const { adminAccess, session } = useAuth();
  const sucursalId = adminAccess?.sucursalId;
  const negocioId  = adminAccess?.negocioId;
  console.log("Aqui es menu edit");

  const [modalCategorias, setModalCategorias] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [loadingCategoria, setLoadingCategoria] = useState(false)
  const [categoriaIdsMap, setCategoriaIdsMap] = useState<Record<string, string>>({});

  const fetchMenu = useCallback(async () => {
    if (!sucursalId || !session?.accessToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sucursales/${sucursalId}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        const menuItems = data.menu || [];
        
        const cats = new Set<string>();
        const grouped: Record<string, MenuItem[]> = {};
        const categoriaIds: Record<string, string> = {};

        // 1. Poblamos todas las categorías del backend (incluyendo vacías)
        const serverCategorias = data.categorias || [];
        serverCategorias.forEach((cat: any) => {
          cats.add(cat.nombre);
          categoriaIds[cat.nombre] = cat.id;
          grouped[cat.nombre] = [];
        });

        // 2. Luego insertamos los items
        menuItems.forEach((item: any) => {
          const c = item.categoria || 'Uncategorized';
          cats.add(c);
          categoriaIds[c] = item.categoria_id;
          if (!grouped[c]) grouped[c] = [];
          
          // Debugging log para ver qué escupe el backend
          console.log(`[MenuEdit] Item: ${item.nombre} | disponible: ${item.disponible} | type: ${typeof item.disponible}`);

          let isEnabled = true; // Por defecto activo
          if (item.disponible === false || item.disponible === 'false' || item.disponible === 0) {
            isEnabled = false;
          }

          grouped[c].push({
            id: item.id,
            name: item.nombre,
            price: item.precio,
            enabled: isEnabled,
            imageUrl: item.imagen_url,
            category: c as any,
          });
        });
        
        const newSections = Array.from(cats).map(c => ({
          title: c.toUpperCase(),
          count: grouped[c].length,
          items: grouped[c],
          id: categoriaIds[c] 
        }));
        
        setSections(newSections);
        setCategories(['All Items', ...Array.from(cats)] as Category[]);
        setCategoriaIdsMap(categoriaIds);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId, session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      fetchMenu();
    }, [fetchMenu])
  );

 const handleToggle = async (id: string, val: boolean) => {
  // Optimistic UI update
  setSections((prev) =>
    prev.map((sec) => ({
      ...sec,
      items: sec.items.map((item) =>
        item.id === id ? { ...item, enabled: val } : item
      ),
    }))
  );

  try {
    const { data: { session: freshSession } } = await supabase.auth.getSession();
    const token = freshSession?.access_token ?? session?.accessToken;

    const url = `${process.env.EXPO_PUBLIC_API_URL}/sucursales/negocios/${negocioId}/sucursales/${sucursalId}/menu/${id}/disponibilidad`;
    console.log('Toggle URL:', url);

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      // Sincronizar con el valor REAL que devuelve el backend
      const data = await res.json();
      let realEnabled = true;
      if (data.disponible === false || data.disponible === 'false' || data.disponible === 0) {
        realEnabled = false;
      }

      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          items: sec.items.map((item) =>
            item.id === id ? { ...item, enabled: realEnabled } : item
          ),
        }))
      );
    } else {
      const body = await res.text();
      console.warn('Toggle error:', res.status, body);
      // Revertir optimistic update si falla
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          items: sec.items.map((item) =>
            item.id === id ? { ...item, enabled: !val } : item
          ),
        }))
      );
    }
  } catch (e) {
    console.warn('Error toggling disponibilidad:', e);
    // Revertir
    setSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        items: sec.items.map((item) =>
          item.id === id ? { ...item, enabled: !val } : item
        ),
      }))
    );
  }
}

  const handleEdit = (item: MenuItem) => {
    navigation.navigate('MenuItemEditor', { itemId: item.id });
  };

  const filteredSections = sections
    .map((sec) => ({
      ...sec,
      items: searchText
        ? sec.items.filter((item) =>
            item.name.toLowerCase().includes(searchText.toLowerCase())
          )
        : sec.items,
    }))
    .filter((sec) => {
      // Filtrar por categoría activa (píldora seleccionada)
      if (activeCategory !== 'All Items' && sec.title !== activeCategory.toUpperCase()) {
        return false;
      }
      // Si hay búsqueda activa, solo mostrar secciones con resultados
      if (searchText) return sec.items.length > 0;
      // Sin búsqueda: mostrar todas las secciones (incluso vacías)
      return true;
    });

  const handleMoverCategoria = async (index: number, direction: 'up' | 'down') => {
    const editableCats = categories.filter(c => c !== 'All Items');
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === editableCats.length - 1) return;

    const newEditable = [...editableCats];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newEditable[index], newEditable[swapIndex]] = [newEditable[swapIndex], newEditable[index]];

    setCategories(['All Items', ...(newEditable as Category[])]);

    try {
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const token = freshSession?.access_token ?? session?.accessToken;

      const payload = {
        categorias: newEditable.map((cat, i) => ({
          id: categoriaIdsMap[cat],
          orden: i
        }))
      };

      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sucursales/negocios/${negocioId}/sucursales/${sucursalId}/menu/categorias/orden`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn("Fallo al reordenar");
      }
    } catch (e) {
      console.error(e);
    }
  };


    const handleCrearCategoria = async () => {
  if (!nuevaCategoria.trim()) return
  setLoadingCategoria(true)
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const negocioId = adminAccess?.negocioId

    const formData = new FormData()
    formData.append('nombre', nuevaCategoria.trim())

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/sucursales/negocios/${negocioId}/sucursales/${sucursalId}/menu/categorias`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      }
    )
    if (!res.ok) throw new Error('Error al crear categoría')
    setNuevaCategoria('')
    await fetchMenu()
  } catch (e) {
    Alert.alert('Error', 'No se pudo crear la categoría')
  } finally {
    setLoadingCategoria(false)
  }
}

const handleEliminarCategoria = async (nombre: string) => {
  Alert.alert(
    'Eliminar categoría',
    `¿Estás seguro que quieres eliminar "${nombre}"?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            const negocioId = adminAccess?.negocioId

            // Buscar el id de la categoría
            const categoria = sections.find(s => s.title === nombre.toUpperCase())
            if (!categoria) return

            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/sucursales/negocios/${negocioId}/sucursales/${sucursalId}/menu/categorias/${categoria.id}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session?.access_token}` },
              }
            )
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.detail ?? 'Error al eliminar')
            }
            await fetchMenu()
          } catch (e: any) {
            Alert.alert('Error', e.message)
          }
        }
      }
    ]
  )
}

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[styles.headerTitle, { color: colors.titleText }]}>Menu Editor</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subtitleText }]}>Manage your shop inventory</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('MenuItemEditor', { itemId: 'new' })}
          >
            <PlusIcon />
            <Text style={styles.addButtonText}>Añadir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterIconButton, { backgroundColor: isDark ? colors.cardBg : '#fff', borderColor: isDark ? colors.border : '#E5E7EB' }]} 
            onPress={() => setModalCategorias(true)}>
            <FilterIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? colors.cardBg : '#FFFFFF' }]}>
          <SearchIcon />
          <TextInput
            style={[styles.searchInput, { color: colors.titleText }]}
            placeholder="Search dishes or categories..."
            placeholderTextColor={colors.subtitleText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryPill, { backgroundColor: isDark ? colors.border : '#FFFFFF', borderColor: isDark ? colors.border : '#E5E7EB' }, activeCategory === cat && styles.categoryPillActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.75}
          >
            <Text style={[styles.categoryPillText, { color: colors.titleText }, activeCategory === cat && styles.categoryPillTextActive, activeCategory === cat && isDark && { color: '#fff' }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sections */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>{section.title}</Text>
                <View style={[styles.sectionBadge, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
                  <Text style={[styles.sectionBadgeText, { color: isDark ? colors.subtitleText : '#6B7280' }]}>{section.count} ITEMS</Text>
                </View>
              </View>
              <View style={[styles.itemsContainer, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
                {section.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                  />
                ))}
              </View>
            </View>
          ))}

          {filteredSections.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="restaurant-menu" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, { color: colors.titleText }]}>No dishes found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.subtitleText }]}>Try a different search term.</Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
      
      <Modal
  visible={modalCategorias}
  animationType="slide"
  transparent
  onRequestClose={() => setModalCategorias(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: colors.titleText }]}>Categorías</Text>
        <TouchableOpacity onPress={() => setModalCategorias(false)}>
          <MaterialIcons name="close" size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {/* Lista de categorías existentes */}
      <View style={{ flexShrink: 1, maxHeight: 300, marginVertical: 10, width: '100%' }}>
        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 10, flexGrow: 1 }}
        >
          {categories.filter(c => c !== 'All Items').map((cat, index, arr) => (
            <View key={cat} style={[styles.categoriaRow, { borderBottomColor: isDark ? colors.border : '#F3F4F6' }]}>
              <Text style={[styles.categoriaRowText, { color: colors.titleText }]} numberOfLines={1}>{cat}</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {index > 0 && (
                  <TouchableOpacity onPress={() => handleMoverCategoria(index, 'up')} style={{ padding: 5 }}>
                    <MaterialIcons name="arrow-upward" size={18} color={colors.titleText} />
                  </TouchableOpacity>
                )}
                {index < arr.length - 1 && (
                  <TouchableOpacity onPress={() => handleMoverCategoria(index, 'down')} style={{ padding: 5 }}>
                    <MaterialIcons name="arrow-downward" size={18} color={colors.titleText} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleEliminarCategoria(cat)} style={{ padding: 5, marginLeft: 8 }}>
                  <MaterialIcons name="delete" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Crear nueva categoría */}
      <View style={styles.nuevaCategoriaRow}>
        <TextInput
          style={[styles.nuevaCategoriaInput, { backgroundColor: isDark ? colors.border : '#F9FAFB', borderColor: isDark ? colors.border : '#E5E7EB', color: colors.titleText }]}
          placeholder="Nueva categoría..."
          placeholderTextColor={colors.subtitleText}
          value={nuevaCategoria}
          onChangeText={setNuevaCategoria}
        />
        <TouchableOpacity
          style={styles.nuevaCategoriaBtn}
          onPress={handleCrearCategoria}
          disabled={loadingCategoria}
        >
          {loadingCategoria
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.nuevaCategoriaBtnText}>+</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F7F2' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    gap: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#374151' },
  categoryScroll: { flexGrow: 0, paddingBottom: 4 },
  categoryContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  categoryPill: {
    paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    height: 40, justifyContent: 'center', alignItems: 'center'
  },
  categoryPillActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  categoryPillText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  categoryPillTextActive: { color: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1.2 },
  sectionBadge: { backgroundColor: '#E5E7EB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sectionBadgeText: { fontSize: 10, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  itemsContainer: {
    gap: 2, backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 14,
  },
  itemCardDisabled: { opacity: 0.6 },
  imageWrapper: { position: 'relative', width: 72, height: 72, borderRadius: 12, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemImageDisabled: { opacity: 0.5 },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#E5E7EB' },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  soldOutText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  itemNameDisabled: { color: '#9CA3AF' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
  itemPriceDisabled: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  itemControls: { alignItems: 'center', gap: 8 },
  editButton: { padding: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 20, color: '#9CA3AF', fontWeight: 'bold' },
  categoriaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  categoriaRowText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  categoriaDeleteBtn: { fontSize: 16 },
  nuevaCategoriaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  nuevaCategoriaInput: { flex: 1, height: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#374151', backgroundColor: '#F9FAFB' },
  nuevaCategoriaBtn: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  nuevaCategoriaBtnText: { color: '#fff', fontSize: 24, fontWeight: '500', lineHeight: 28 },
});