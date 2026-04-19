import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useCiudadUsuario } from '../../../application/hooks/useCiudadUsuario';
import { useNegociosPorCiudad } from '../../../application/hooks/useNegocioPorCiudad';
import { useCart } from '../../../application/context/CartContext';
import * as Location from 'expo-location';
import { useTheme } from '../../../application/context/ThemeContext';
import { useProfile } from '../../../application/hooks/useProfile';
import { semanticSearch } from '../../../../services/geminiService';

const { width } = Dimensions.get('window');

type location = {
  latitude: number;
  longitude: number;
}

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

const SearchIcon = ({ color = "#9CA3AF" }: { color?: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="2">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const PinIcon = () => (
  <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const HomeIcon = ({ active, color = "#9CA3AF" }: { active?: boolean, color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#22c55e' : 'none'} stroke={active ? '#22c55e' : color} strokeWidth="2">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const OrdersIcon = ({ active, color = "#9CA3AF" }: { active?: boolean, color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2">
    <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <Rect x="9" y="3" width="6" height="4" rx="1" />
    <Path d="M9 12h6M9 16h4" />
  </Svg>
);

const CartIcon = ({ active, color = "#9CA3AF" }: { active?: boolean, color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2">
    <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const ProfileIcon = ({ active, color = "#9CA3AF" }: { active?: boolean, color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const BotIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
    <Rect x="3" y="8" width="18" height="13" rx="3" />
    <Path d="M9 11v3M15 11v3M8 8V5a4 4 0 0 1 8 0v3" />
    <Circle cx="9" cy="13" r="1" fill="#FFF" />
    <Circle cx="15" cy="13" r="1" fill="#FFF" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const DeliveryIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Polyline points="1 21 1 14 9 14 9 21 1 21" />
    <Path d="M10 2H7L4 14" />
    <Path d="M12 2h3l4 12H3" />
    <Path d="M9 21h6" />
  </Svg>
);

// ─── Categorías ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Todos', emoji: '🍽️' },
  { label: 'Tacos', emoji: '🌮' },
  { label: 'Coffee', emoji: '☕' },
  { label: 'Healthy', emoji: '🥗' },
  { label: 'Fast Food', emoji: '🍔' },
  { label: 'Asian', emoji: '🍜' },
  { label: 'Pizza', emoji: '🍕' },
];

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function HomeFeed() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [usarCercanos, setUsarCercanos] = useState(false);
  const { ciudad, isLoading: loadingCiudad } = useCiudadUsuario();
  const [page, setPage] = useState(1);
  const { negocios = [], isLoading: loadingNegocios, error, hasMore } = useNegociosPorCiudad(ciudad, selectedCategory, page, 4);
  const hasMoreFinal = usarCercanos ? true : hasMore;
  const { getTotalItems } = useCart();
  const [location, setLocation] = useState<location | null>(null);
  const isLoading = loadingCiudad || loadingNegocios;
  const cartCount = getTotalItems();
  const { isDark, colors } = useTheme();
  const { profile } = useProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [semanticResultIds, setSemanticResultIds] = useState<string[] | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const [sucursalesCercanas, setSucursalesCercanas] = useState([]);
  const [loadingCercanas, setLoadingCercanas] = useState(false);

  const data = usarCercanos ? sucursalesCercanas : negocios;

  const loadingFinal = usarCercanos
    ? loadingCercanas
    : loadingCiudad || loadingNegocios;

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      setSemanticResultIds(null);
      return;
    }
    setIsAIThinking(true);
    setSemanticResultIds(null);
    const resultIds = await semanticSearch(searchQuery, data);
    setSemanticResultIds(resultIds);
    setIsAIThinking(false);
  };

  const filteredData = (data || []).filter((n: any) => {
    if (semanticResultIds) {
      return semanticResultIds.includes(n.id);
    }
    if (searchQuery.trim() === '') return true;

    return (
      n.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.descripcion ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });



  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setUsarCercanos(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setUsarCercanos(true);

      } catch (error) {
        console.log("Error obteniendo ubicación:", error);
        setUsarCercanos(false);
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    if (!usarCercanos) return;

    const fetchCercanas = async () => {
      try {
        setLoadingCercanas(true);
        if (!location) return;

        const uri = `cercanas?latitud=${location.latitude}&longitud=${location.longitude}&radio_metros=100000&page=${page}&limit=4&categoria=${selectedCategory}`;

        const res = await fetch(
          `${process.env.API_BASE_URL}/sucursales/${uri}`
        );

        const resData = await res.json();

        setSucursalesCercanas(resData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCercanas(false);
      }
    };

    fetchCercanas();
  }, [usarCercanos, location, page, selectedCategory]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

        {/* ── HEADER ── */}
        <View style={[styles.header, { backgroundColor: colors.cardBg }]}>
          <View>
            <Text style={[styles.logoText, { color: colors.titleText }]}>Kivo</Text>
            <View style={styles.locationRow}>
              <PinIcon />
              <Text style={[styles.locationText, { color: colors.labelText }]} numberOfLines={1}>
                {loadingCiudad ? 'Buscando...' : ciudad ?? 'Sin domicilio'}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarWrap}>
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile?.nombre ?? 'Cliente') + '&background=22c55e&color=fff' }
              }
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        {/* ── SEARCH BAR — toca para abrir chatbot ── */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.85}
        >
          <SearchIcon color={colors.labelText} />
          <Text style={[styles.searchPlaceholder, { color: colors.labelText }]}>
            {searchQuery || 'Pregunta al asistente o busca...'}
          </Text>
          <LinearGradient
            colors={['#22c55e', '#15803d']}
            style={styles.searchChatBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <BotIcon />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── SEARCH INPUT cuando escribe ── */}
        <View style={[styles.realSearchWrap, { backgroundColor: colors.searchBg }]}>
          <SearchIcon color={colors.labelText} />
          <TextInput
            style={[styles.realSearchInput, { color: colors.titleText }]}
            placeholder="Comida rápida, antojos..."
            placeholderTextColor={colors.labelText}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim() === '') setSemanticResultIds(null);
            }}
            returnKeyType="search"
            onSubmitEditing={handleSemanticSearch}
          />
          <TouchableOpacity 
            style={[styles.aiButton, isAIThinking && styles.aiButtonDisabled]} 
            onPress={handleSemanticSearch}
            disabled={isAIThinking}
          >
            {isAIThinking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.aiButtonText}>IA ✨</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

          {/* ── BANNER CHATBOT ── */}
          <TouchableOpacity
            style={styles.chatbotBanner}
            onPress={() => navigation.navigate('Chatbot')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#16a34a', '#15803d']}
              style={styles.chatbotBannerGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <View style={styles.chatbotBannerLeft}>
                <Text style={styles.chatbotBannerTitle}>🤖 Asistente IA</Text>
                <Text style={styles.chatbotBannerSub}>
                  Dime qué se te antoja y hago tu pedido
                </Text>
              </View>
              <View style={styles.chatbotBannerRight}>
                <Text style={styles.chatbotBannerEmoji}>🛵</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── CATEGORÍAS ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.label}
                style={[
                  styles.categoryChip,
                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                  selectedCategory === cat.label && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.label)}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryText,
                  { color: colors.titleText },
                  selectedCategory === cat.label && styles.categoryTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── SECCIÓN HEADER ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.titleText }]}>
              {semanticResultIds !== null 
                ? `IA: Resultados para "${searchQuery}" ✨` 
                : searchQuery
                  ? `Resultados para "${searchQuery}"`
                  : usarCercanos
                    ? 'Cerca de ti'
                    : `En ${ciudad ?? 'tu zona'}`}
            </Text>
            {!loadingFinal && (
              <Text style={[styles.sectionCount, { color: colors.labelText }]}>{filteredData.length} lugares</Text>
            )}
          </View>

          {/* ── ESTADOS ── */}
          {loadingFinal && (
            <View style={styles.centerMessage}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={[styles.loadingText, { color: colors.labelText }]}>{usarCercanos
                ? 'Buscando lugares cercanos...'
                : `Buscando en ${ciudad ?? '...'}`}</Text>
            </View>
          )}
          {!loadingFinal && error && (
            <View style={styles.centerMessage}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {!loadingFinal && !error && !ciudad && (
            <View style={styles.centerMessage}>
              <Text style={{ fontSize: 40 }}>📍</Text>
              <Text style={[styles.emptyText, { color: colors.labelText }]}>
                Agrega un domicilio para ver los negocios disponibles.
              </Text>
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() => navigation.navigate('DeliveryAddresses')}
              >
                <Text style={styles.addAddressBtnText}>+ Agregar domicilio</Text>
              </TouchableOpacity>
            </View>
          )}
          {!loadingFinal && !error && ciudad && filteredData.length === 0 && (
            <View style={styles.centerMessage}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={[styles.emptyText, { color: colors.labelText }]}>
                {searchQuery ? `Sin resultados para "${searchQuery}"` : `Sin negocios en ${ciudad} para esta categoría`}
              </Text>
            </View>
          )}

          {/* ── CARDS DE NEGOCIOS ── */}
          {!loadingFinal && filteredData.length > 0 && (
            <View style={styles.cardsContainer}>
              {filteredData.map(negocio => (
                <TouchableOpacity
                  key={negocio.id}
                  style={[styles.card, { backgroundColor: colors.cardBg }]}
                  activeOpacity={0.92}
                  onPress={() => navigation.navigate('BusinessDetail', { sucursal_id: negocio.sucursal_id })}
                >
                  {/* Imagen */}
                  <View style={styles.cardImageWrap}>
                    {negocio.banner_url ? (
                      <Image source={{ uri: negocio.banner_url }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: colors.border }]}>
                        <Text style={{ fontSize: 40 }}>🍽️</Text>
                      </View>
                    )}
                    {negocio.calificacion != null && (
                      <View style={[styles.ratingBadge, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }]}>
                        <StarIcon />
                        <Text style={[styles.ratingText, { color: colors.titleText }]}>{negocio.calificacion}</Text>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardName, { color: colors.titleText }]} numberOfLines={1}>{negocio.nombre}</Text>
                    <Text style={[styles.cardDesc, { color: colors.labelText }]} numberOfLines={2}>{negocio.descripcion ?? ''}</Text>

                    <View style={styles.cardMeta}>
                      <View style={styles.cardMetaItem}>
                        <ClockIcon />
                        <Text style={[styles.cardMetaText, { color: colors.labelText }]}>25-35 min</Text>
                      </View>
                      <View style={styles.cardMetaDot} />
                      <View style={styles.cardMetaItem}>
                        <DeliveryIcon />
                        <Text style={[styles.cardMetaText, { color: colors.labelText }]}>$12 envío</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── PAGINACIÓN ── */}
          {filteredData.length > 0 && hasMoreFinal && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setPage(prev => prev + 1)}
                disabled={loadingFinal}
              >
                {loadingNegocios ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loadMoreText}>Cargar más negocios</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!hasMoreFinal && filteredData.length > 0 && (
            <Text style={[styles.endMessage, { color: colors.labelText }]}>Has llegado al final de la lista</Text>
          )}
        </ScrollView>

        {/* ── BOTTOM NAV ── */}
        <View style={[styles.bottomNav, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
          {/* Home */}
          <TouchableOpacity style={styles.navItem}>
            <HomeIcon active />
            <Text style={[styles.navText, { color: colors.labelText }, styles.navTextActive]}>Inicio</Text>
          </TouchableOpacity>

          {/* Orders */}
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Orders')}>
            <OrdersIcon color={colors.labelText} />
            <Text style={[styles.navText, { color: colors.labelText }]}>Pedidos</Text>
          </TouchableOpacity>

          {/* CHATBOT — botón central elevado */}
          <View style={styles.navChatbotWrap}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Chatbot')}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#22c55e', '#15803d']}
                style={styles.navChatbotBtn}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <BotIcon />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.navChatbotText}>Asistente</Text>
          </View>

          {/* Carrito con badge */}
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
            <View style={styles.navCartWrap}>
              <CartIcon color={colors.labelText} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.navText, { color: colors.labelText }]}>Carrito</Text>
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <ProfileIcon color={colors.labelText} />
            <Text style={[styles.navText, { color: colors.labelText }]}>Perfil</Text>
          </TouchableOpacity>
        </View>


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, backgroundColor: '#FFF',
  },
  logoText: { fontSize: 26, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locationText: { fontSize: 12, color: '#374151', fontWeight: '500', maxWidth: 180 },
  avatarWrap: { borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: '#22c55e' },
  avatar: { width: 40, height: 40, borderRadius: 20 },

  paginationContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadMoreBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    minWidth: 180,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  endMessage: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 13,
    paddingVertical: 20,
    fontStyle: 'italic',
  },

  // Search bar (toca → chatbot)
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, padding: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    gap: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#9CA3AF' },
  searchChatBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Real search input (filtro por texto)
  realSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F3F4F6', marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  realSearchInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 2 },
  aiButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  aiButtonDisabled: {
    backgroundColor: '#15803d',
    opacity: 0.8,
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Chatbot banner
  chatbotBanner: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  chatbotBannerGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  chatbotBannerLeft: { flex: 1 },
  chatbotBannerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  chatbotBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 17 },
  chatbotBannerRight: {},
  chatbotBannerEmoji: { fontSize: 36 },

  // Categorías
  categoriesScroll: { marginTop: 16 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#FFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  categoryChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  categoryEmoji: { fontSize: 14 },
  categoryText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  categoryTextActive: { color: '#FFF' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  sectionCount: { fontSize: 13, color: '#6B7280' },

  // States
  centerMessage: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingVertical: 48, gap: 12,
  },
  loadingText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },
  addAddressBtn: {
    backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 4,
  },
  addAddressBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Cards
  cardsContainer: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    backgroundColor: '#FFF', borderRadius: 18, marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  cardImageWrap: { height: 170, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  ratingBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  cardContent: { padding: 14 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 3 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: 12, color: '#6B7280' },
  cardMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF', paddingBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  navItem: { flex: 1, alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  navText: { fontSize: 11, color: '#9CA3AF', marginTop: 3 },
  navTextActive: { color: '#22c55e', fontWeight: '600' },

  // Chatbot central button
  navChatbotWrap: {
    flex: 1, alignItems: 'center',
    marginTop: -20, paddingBottom: 2,
  },
  navChatbotBtn: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  navChatbotText: { fontSize: 11, color: '#22c55e', fontWeight: '700', marginTop: 4 },

  // Cart badge
  navCartWrap: { position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -4, right: -6,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#FFF',
  },
  cartBadgeText: { fontSize: 10, color: '#FFF', fontWeight: '700' },
});