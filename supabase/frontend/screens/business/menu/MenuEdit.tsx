import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';

import { useAuth } from '../../../application/context/AuthContext';
import { supabase } from '../../../config/supabaseConfig';



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

  return (
    <View style={[styles.itemCard, disabled && styles.itemCardDisabled]}>
      <View style={styles.imageWrapper}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={[styles.itemImage, disabled && styles.itemImageDisabled]} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        {item.soldOut && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, disabled && styles.itemNameDisabled]}>{item.name}</Text>
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

  const fetchMenu = useCallback(async () => {
    if (!sucursalId) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sucursales/${sucursalId}`);

      if (res.ok) {
        const data = await res.json();
        const menuItems = data.menu || [];
        
        const cats = new Set<string>();
        const grouped: Record<string, MenuItem[]> = {};
        
        menuItems.forEach((item: any) => {
          const c = item.categoria || 'Uncategorized';
          cats.add(c);
          if (!grouped[c]) grouped[c] = [];
          
          grouped[c].push({
            id: item.id,
            name: item.nombre,
            price: item.precio,
            enabled: item.disponible ?? true,
            imageUrl: item.imagen_url,
            category: c as any,
          });
        });
        
        const newSections = Array.from(cats).map(c => ({
          title: c.toUpperCase(),
          count: grouped[c].length,
          items: grouped[c]
        }));
        
        setSections(newSections);
        setCategories(['All Items', ...Array.from(cats)] as Category[]);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoading(false);
    }
  }, [sucursalId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

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
      setSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          items: sec.items.map((item) =>
            item.id === id ? { ...item, enabled: data.disponible } : item
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
      items: sec.items.filter((item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F7F2" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.headerTitle}>Menu Editor</Text>
          <Text style={styles.headerSubtitle}>Manage your shop inventory</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('MenuItemEditor', { itemId: 'new' })}
          >
            <PlusIcon />
            <Text style={styles.addButtonText}>Añadir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterIconButton}>
            <FilterIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes or categories..."
            placeholderTextColor="#9CA3AF"
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
            style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.75}
          >
            <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>
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
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{section.count} ITEMS</Text>
                </View>
              </View>
              <View style={styles.itemsContainer}>
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
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No dishes found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term.</Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

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
    paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
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
});