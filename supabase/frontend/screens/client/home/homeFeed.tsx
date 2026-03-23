import React, { useState } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useCiudadUsuario } from '../../../application/hooks/useCiudadUsuario';
import { useNegociosPorCiudad } from '../../../application/hooks/useNegocioPorCiudad';

const { width } = Dimensions.get('window');

// ─── Iconos SVG ─────────────────────────────────────────

const SearchIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

const MicIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="2">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const MessageIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const PinIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const HomeIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#22c55e" : "none"} stroke={active ? "#22c55e" : "#9CA3AF"} strokeWidth="2">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const OrdersIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#22c55e" : "#9CA3AF"} strokeWidth="2">
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#22c55e" : "#9CA3AF"} strokeWidth="2">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// ─── Categorías ─────────────────────────────────────────

const categories = ['All', 'Tacos', 'Coffee', 'Healthy', 'Fast Food', 'Asian'];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────

export default function HomeFeed() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Obtiene la ciudad del domicilio predeterminado del usuario autenticado
  const { ciudad, isLoading: loadingCiudad } = useCiudadUsuario();

  // Obtiene los negocios de esa ciudad y categoría seleccionada
  const { negocios, isLoading: loadingNegocios, error } = useNegociosPorCiudad(ciudad, selectedCategory);

  const isLoading = loadingCiudad || loadingNegocios;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Kivo</Text>
            <Text style={styles.tagline}>AI-Powered Food Ordering</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* SEARCH */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Ask Pidelo: 'Best tacos near me?'"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.micButton}>
                <MicIcon />
              </TouchableOpacity>
            </View>
          </View>

          {/* CIUDAD ACTIVA */}
          <View style={styles.ciudadRow}>
            <PinIcon />
            <Text style={styles.ciudadText}>
              {loadingCiudad
                ? 'Buscando tu ubicación...'
                : ciudad
                  ? ciudad
                  : 'Sin domicilio registrado'}
            </Text>
          </View>

          {/* CATEGORIAS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ESTADO DE CARGA / ERROR / VACÍO */}
          {isLoading && (
            <View style={styles.centerMessage}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Buscando negocios en {ciudad ?? '...'}...</Text>
            </View>
          )}

          {!isLoading && error && (
            <View style={styles.centerMessage}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!isLoading && !error && !ciudad && (
            <View style={styles.centerMessage}>
              <Text style={styles.emptyText}>
                Agrega un domicilio para ver los negocios disponibles en tu ciudad.
              </Text>
            </View>
          )}

          {!isLoading && !error && ciudad && negocios.length === 0 && (
            <View style={styles.centerMessage}>
              <Text style={styles.emptyText}>
                No hay negocios disponibles en {ciudad} para esta categoría.
              </Text>
            </View>
          )}

          {/* LISTA DE NEGOCIOS */}
          {!isLoading && negocios.length > 0 && (
            <View style={styles.cardsContainer}>
              {negocios.map((negocio) => (
                <View key={negocio.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('BusinessDetail', {
                        sucursal_id: negocio.sucursal_id,
                      })
                    }
                  >
                    <View style={styles.cardImageContainer}>
                      <Image
                        source={{ uri: negocio.banner_url ?? undefined }}
                        style={styles.cardImage}
                      />
                      {negocio.calificacion != null && (
                        <View style={styles.ratingBadge}>
                          <StarIcon />
                          <Text style={styles.ratingText}>{negocio.calificacion}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.restaurantName}>{negocio.nombre}</Text>
                      <Text style={styles.restaurantDescription}>
                        {negocio.descripcion ?? ''}
                      </Text>
                      <TouchableOpacity style={styles.orderButton}>
                        <MessageIcon />
                        <Text style={styles.orderButtonText}>Chat & Order</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <HomeIcon active />
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Orders')}>
            <OrdersIcon />
            <Text style={styles.navText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <ProfileIcon />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  logoText: { fontSize: 24, fontWeight: 'bold' },
  tagline: { fontSize: 12, color: '#22c55e' },
  avatar: { width: 40, height: 40, borderRadius: 20 },

  searchContainer: { padding: 16 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },

  searchInput: { flex: 1, marginLeft: 8 },
  micButton: { padding: 4 },

  // Ciudad activa
  ciudadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 4,
  },
  ciudadText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 4,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginLeft: 16,
  },
  categoryChipActive: { backgroundColor: '#22c55e' },
  categoryText: { color: '#6B7280' },
  categoryTextActive: { color: '#fff' },

  cardsContainer: { padding: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
  },

  cardImageContainer: { height: 180 },
  cardImage: { width: '100%', height: '100%' },

  ratingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: { marginLeft: 4, fontWeight: 'bold' },

  cardContent: { padding: 16 },
  restaurantName: { fontSize: 18, fontWeight: 'bold' },
  restaurantDescription: { color: '#6B7280', marginBottom: 12 },

  orderButton: {
    backgroundColor: '#22c55e',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: { color: '#fff', marginLeft: 6, fontWeight: 'bold' },

  // Estados vacío/error/carga
  centerMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: { color: '#6B7280', fontSize: 14, textAlign: 'center' },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center' },

  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  navItem: { flex: 1, alignItems: 'center', padding: 10 },
  navText: { fontSize: 12, color: '#9CA3AF' },
  navTextActive: { color: '#22c55e' },
});