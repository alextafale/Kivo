import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import type { OrderItem } from '../../../types/order';

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
  deliveryFee: number;
  description: string;
  address: string;
  openingHours: { weekdays: string; weekends: string };
  menu: MenuItem[];
}

type BusinessDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BusinessDetail'>
type BusinessDetailRouteProp = RouteProp<RootStackParamList, 'BusinessDetail'>

type Props = {
  navigation: BusinessDetailNavigationProp;
  route: BusinessDetailRouteProp;
}

// ─── Mock para pruebas ────────────────────────────────────────────────────────

const MOCK_BUSINESS: BusinessData = {
  id: 'negocio-uuid-aqui',
  name: 'El Pastorcito Real',
  category: 'Authentic Mexican',
  logo: 'https://via.placeholder.com/80x80/1a5c3a/ffffff?text=EPR',
  coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  rating: 4.9,
  deliveryTime: '15-20',
  deliveryFee: 0,
  description: 'Sabores auténticos desde el corazón de México.',
  address: '123 Avenida de la Reforma, CDMX',
  openingHours: { weekdays: 'Lun-Sáb: 11:00 AM–11:00 PM', weekends: 'Dom: 12:00 PM–9:00 PM' },
  menu: [
    { id: 'm1', name: 'Al Pastor Tacos', price: 45, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400', description: 'Tacos con piña, cilantro y cebolla', category: 'Tacos' },
    { id: 'm2', name: 'Gringas Especial', price: 65, image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', description: 'Quesadilla de harina con al pastor y queso', category: 'Especialidades' },
    { id: 'm3', name: 'Quesabirria', price: 75, image: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=400', description: 'Quesadilla de birria con consomé', category: 'Especialidades' },
    { id: 'm4', name: 'Agua de Jamaica', price: 25, image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400', description: 'Agua fresca de jamaica', category: 'Bebidas' },
  ],
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BusinessDetailScreen({ navigation, route }: Props) {
  const { sucursal_id } = route.params;
  const [business, setBusiness] = React.useState<BusinessData | null>(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await fetch(
          `http://192.168.100.7:8000/api/v1/sucursales/${sucursal_id}`
        )

        const data = await res.json()

        setBusiness({
          id: data.id,
          name: data.nombre,
          category: data.categoria,
          logo: data.logo_url,
          coverImage: data.banner_url,
          rating: data.calificacion,
          deliveryTime: data.tiempo_entrega,
          deliveryFee: data.costo_envio === "Gratis" ? 0 : Number(data.costo_envio),
          description: data.descripcion,
          address: data.direccion,
          openingHours: {
            weekdays: data.horarios.entre_semana,
            weekends: data.horarios.fin_semana
          },
          menu: data.menu.map((item: any) => ({
            id: item.id,
            name: item.nombre,
            price: item.precio,
            image: item.imagen_url,
            description: item.descripcion,
            category: item.categoria
          }))
        })

      } catch (error) {
        console.error(error)
      }
    }

    fetchBusiness()
  }, [sucursal_id])

  const [cart, setCart] = React.useState<Record<string, number>>({})
  const [activeCategory, setActiveCategory] = React.useState('All')

  if (!business) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando negocio...</Text>
      </SafeAreaView>
    )
  }

  const categories = ['All', ...Array.from(new Set(business.menu.map(m => m.category)))]

  const filteredMenu =
    activeCategory === 'All'
      ? business.menu
      : business.menu.filter(m => m.category === activeCategory)

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)

  const totalPrecio = Object.entries(cart).reduce((acc, [id, qty]) => {
    const item = business.menu.find(m => m.id === id)
    return acc + (item?.price ?? 0) * qty
  }, 0)

  const handleAdd = (item: MenuItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: (prev[item.id] ?? 0) + 1
    }))
  }

  const handleRemove = (item: MenuItem) => {
    setCart(prev => {
      const qty = (prev[item.id] ?? 0) - 1
      if (qty <= 0) {
        const next = { ...prev }
        delete next[item.id]
        return next
      }
      return { ...prev, [item.id]: qty }
    })
  }

  const handleIrAResumen = () => {
    const items: OrderItem[] = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const menuItem = business.menu.find(m => m.id === id)!
        return {
          name: menuItem.name,
          quantity: qty,
          price: menuItem.price
        }
      })

    navigation.navigate('OrderSummary', {
      items,
      negocioId: business.id,
      negocioNombre: business.name,
      direccionEntrega: business.address,
      costoEnvio: business.deliveryFee,
    })
  }
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.stickyHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
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

        <View style={styles.coverWrapper}>
          <Image source={{ uri: business.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
        </View>

        <View style={styles.identityRow}>
          <Image source={{ uri: business.logo }} style={styles.logo} />

          <View style={styles.identityText}>
            <Text style={styles.restaurantName}>{business.name}</Text>
            <Text style={styles.restaurantCategory}>{business.category}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>

          <View style={styles.statBadge}>
            <Ionicons name="star" size={16} color="#FF6B00" />
            <Text style={styles.statValue}>{business.rating}</Text>
            <Text style={styles.statLabel}>RATING</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBadge}>
            <Ionicons name="time-outline" size={16} color="#555" />
            <Text style={styles.statValue}>{business.deliveryTime}</Text>
            <Text style={styles.statLabel}>MINS</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBadge}>
            <MaterialIcons name="delivery-dining" size={18} color="#555" />
            <Text style={styles.statValue}>
              {business.deliveryFee === 0 ? 'Gratis' : `$${business.deliveryFee}`}
            </Text>
            <Text style={styles.statLabel}>ENVÍO</Text>
          </View>

        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menú</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredMenu.map(item => {
            const qty = cart[item.id] ?? 0

            return (
              <View key={item.id} style={styles.menuCard}>

                <Image source={{ uri: item.image }} style={styles.menuCardImage} />

                <View style={styles.menuCardInfo}>

                  <Text style={styles.menuCardName}>{item.name}</Text>

                  {item.description && (
                    <Text style={styles.menuCardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <View style={styles.menuCardFooter}>

                    <Text style={styles.menuCardPrice}>
                      ${item.price.toFixed(2)}
                    </Text>

                    {qty === 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAdd(item)}
                      >
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyControl}>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleRemove(item)}
                        >
                          <Ionicons name="remove" size={16} color="#FF6B00" />
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>{qty}</Text>

                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleAdd(item)}
                        >
                          <Ionicons name="add" size={16} color="#FF6B00" />
                        </TouchableOpacity>

                      </View>
                    )}

                  </View>
                </View>
              </View>
            )
          })}

        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.aboutText}>{business.description}</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {totalItems > 0 && (
        <View style={styles.ctaContainer}>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleIrAResumen}
            activeOpacity={0.85}
          >

            <View style={styles.ctaBadge}>
              <Text style={styles.ctaBadgeText}>{totalItems}</Text>
            </View>

            <Text style={styles.ctaButtonText}>
              Ver resumen del pedido
            </Text>

            <Text style={styles.ctaTotal}>
              ${totalPrecio.toFixed(2)}
            </Text>

          </TouchableOpacity>

        </View>
      )}

    </SafeAreaView>
  )
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const ORANGE = '#FF6B00'

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#fff' },

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

  headerActions: { flexDirection: 'row', gap: 8 },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverWrapper: { width: '100%', height: 220 },

  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)'
  },

  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#1a5c3a'
  },

  identityText: { marginLeft: 12 },

  restaurantName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3
  },

  restaurantCategory: {
    fontSize: 14,
    color: ORANGE,
    fontWeight: '500',
    marginTop: 2
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12
  },

  statBadge: { flex: 1, alignItems: 'center', gap: 4 },

  statValue: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },

  statLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5
  },

  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e8e8e8'
  },

  divider: { height: 8, backgroundColor: '#f5f5f5' },

  section: { padding: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12
  },

  categoryTabsContainer: { paddingBottom: 12, gap: 8 },

  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0'
  },

  categoryTabActive: { backgroundColor: ORANGE },

  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666'
  },

  categoryTabTextActive: { color: '#fff' },

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
    borderColor: '#f0f0f0'
  },

  menuCardImage: { width: 110, height: 110, resizeMode: 'cover' },

  menuCardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between'
  },

  menuCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a'
  },

  menuCardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 17
  },

  menuCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },

  menuCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: ORANGE
  },

  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center'
  },

  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },

  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center'
  },

  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    minWidth: 18,
    textAlign: 'center'
  },

  aboutText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginTop: 8
  },

  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16
  },

  ctaButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },

  ctaBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },

  ctaBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22c55e'
  },

  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center'
  },

  ctaTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff'
  },

})