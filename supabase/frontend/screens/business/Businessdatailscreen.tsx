import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category: string;
}

export interface BusinessData {
  id: string;
  name: string;
  category: string;
  logo: string;
  coverImage: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  description: string;
  address: string;
  openingHours: {
    weekdays: string;
    weekends: string;
  };
  menu: MenuItem[];
}

// ─── Mock Data (replace with real data / route params) ────────────────────────
const MOCK_BUSINESS: BusinessData = {
  id: '1',
  name: 'El Pastorcito Real',
  category: 'Authentic Mexican',
  logo: 'https://via.placeholder.com/80x80/1a5c3a/ffffff?text=EPR',
  coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  rating: 4.9,
  deliveryTime: '15-20',
  deliveryFee: 'Free',
  description:
    'Authentic flavors from the heart of Mexico City to your doorstep. We specialize in traditional Al Pastor carved straight from the trompo, using a family recipe passed down through three generations.',
  address: '123 Avenida de la Reforma, Mexico City',
  openingHours: {
    weekdays: 'Mon-Sat: 11:00 AM–11:00 PM',
    weekends: 'Sun: 12:00 PM–9:00 PM',
  },
  menu: [
    {
      id: 'm1',
      name: 'Al Pastor Tacos',
      price: 12.0,
      image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
      description: 'Traditional al pastor tacos with pineapple, cilantro and onion',
      category: 'Tacos',
    },
    {
      id: 'm2',
      name: 'Gringas Especial',
      price: 15.5,
      image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
      description: 'Flour tortilla quesadilla filled with al pastor and cheese',
      category: 'Specialties',
    },
    {
      id: 'm3',
      name: 'Quesabirria',
      price: 18.0,
      image: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400',
      description: 'Birria-filled quesadilla with consomé dipping broth',
      category: 'Specialties',
    },
    {
      id: 'm4',
      name: 'Agua de Jamaica',
      price: 4.5,
      image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400',
      description: 'Refreshing hibiscus flower water',
      category: 'Drinks',
    },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatBadge = ({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) => (
  <View style={styles.statBadge}>
    {icon}
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuCard = ({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
}) => (
  <View style={styles.menuCard}>
    <Image source={{ uri: item.image }} style={styles.menuCardImage} />
    <View style={styles.menuCardInfo}>
      <Text style={styles.menuCardName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.menuCardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.menuCardFooter}>
        <Text style={styles.menuCardPrice}>${item.price.toFixed(2)}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => onAdd(item)}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
interface Props {
  business?: BusinessData;
  onBack?: () => void;
  onChatOrder?: () => void;
}

export default function BusinessDetailScreen({
  business = MOCK_BUSINESS,
  onBack,
  onChatOrder,
}: Props) {
  const [cart, setCart] = React.useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = React.useState('All');

  const categories = ['All', ...Array.from(new Set(business.menu.map((m) => m.category)))];
  const filteredMenu =
    activeCategory === 'All'
      ? business.menu
      : business.menu.filter((m) => m.category === activeCategory);

  const handleAdd = (item: MenuItem) => {
    setCart((prev) => [...prev, item]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* ── Header (sticky) ── */}
        <View style={styles.stickyHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="share-2" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cover Image ── */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: business.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
        </View>

        {/* ── Restaurant Identity ── */}
        <View style={styles.identityRow}>
          <Image source={{ uri: business.logo }} style={styles.logo} />
          <View style={styles.identityText}>
            <Text style={styles.restaurantName}>{business.name}</Text>
            <Text style={styles.restaurantCategory}>{business.category}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <StatBadge
            icon={<Ionicons name="star" size={16} color="#FF6B00" />}
            value={String(business.rating)}
            label="RATING"
          />
          <View style={styles.statDivider} />
          <StatBadge
            icon={<Ionicons name="time-outline" size={16} color="#555" />}
            value={business.deliveryTime}
            label="MINS"
          />
          <View style={styles.statDivider} />
          <StatBadge
            icon={<MaterialIcons name="delivery-dining" size={18} color="#555" />}
            value={business.deliveryFee}
            label="DELIVERY"
          />
        </View>

        <View style={styles.divider} />

        {/* ── Menu Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            <TouchableOpacity>
              <Text style={styles.viewAll}>View Menu</Text>
            </TouchableOpacity>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabsContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeCategory === cat && styles.categoryTabTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Menu Cards */}
          {filteredMenu.map((item) => (
            <MenuCard key={item.id} item={item} onAdd={handleAdd} />
          ))}
        </View>

        <View style={styles.divider} />

        {/* ── About Us ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.aboutText}>{business.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Info Cards ── */}
        <View style={styles.section}>
          {/* Opening Hours */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="time-outline" size={20} color="#FF6B00" />
            </View>
            <View>
              <Text style={styles.infoCardTitle}>Opening Hours</Text>
              <Text style={styles.infoCardText}>{business.openingHours.weekdays}</Text>
              <Text style={styles.infoCardText}>{business.openingHours.weekends}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="location-outline" size={20} color="#FF6B00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoCardTitle}>Location</Text>
              <Text style={styles.infoCardText}>{business.address}</Text>
            </View>
          </View>

          {/* Map placeholder */}
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={32} color="#ccc" />
            <Text style={styles.mapPlaceholderText}>Map View</Text>
          </View>
        </View>

        {/* Bottom padding for CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        {[
          { icon: 'home-outline', label: 'Home' },
          { icon: 'storefront-outline', label: 'Profile', active: true },
          { icon: 'receipt-outline', label: 'Orders' },
          { icon: 'person-outline', label: 'Account' },
        ].map((tab) => (
          <TouchableOpacity key={tab.label} style={styles.navTab}>
            <Ionicons
              name={tab.icon as any}
              size={22}
              color={tab.active ? '#FF6B00' : '#999'}
            />
            <Text style={[styles.navLabel, tab.active && { color: '#FF6B00' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chat & Order CTA ── */}
      <TouchableOpacity style={styles.ctaButton} onPress={onChatOrder}>
        <Ionicons name="chatbubble-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.ctaButtonText}>Chat &amp; Order with AI</Text>
        {cart.length > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ORANGE = '#FF6B00';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Cover
  coverWrapper: {
    width: '100%',
    height: 220,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Identity
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#1a5c3a',
  },
  identityText: {
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  restaurantCategory: {
    fontSize: 14,
    color: ORANGE,
    fontWeight: '500',
    marginTop: 2,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e8e8e8',
  },

  // Section
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  viewAll: {
    fontSize: 14,
    color: ORANGE,
    fontWeight: '600',
  },

  // Category Tabs
  categoryTabsContainer: {
    paddingBottom: 12,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryTabActive: {
    backgroundColor: ORANGE,
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#fff',
  },

  // Menu Card
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuCardImage: {
    width: 110,
    height: 110,
    resizeMode: 'cover',
  },
  menuCardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  menuCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  menuCardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 17,
  },
  menuCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  menuCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: ORANGE,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // About
  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginTop: 8,
  },

  // Info Cards
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff3ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  mapPlaceholder: {
    height: 140,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: '#bbb',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 3,
  },
  navLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },

  // CTA
  ctaButton: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    right: 16,
    backgroundColor: ORANGE,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cartBadge: {
    position: 'absolute',
    right: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: ORANGE,
  },
});