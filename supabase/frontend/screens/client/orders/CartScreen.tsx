import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useCart, CartRestaurant, CartItem } from '../../../application/context/CartContext';

/**
 * CartScreen — Pantalla del carrito
 *
 * ¿Qué hace?
 * Muestra todos los items que el usuario agregó, agrupados por restaurante.
 * Permite aumentar/disminuir cantidades y navegar al resumen del pedido.
 *
 * ¿Cómo funciona?
 * Lee el estado global del carrito desde CartContext con useCart().
 * Cada cambio de cantidad actualiza el context y React re-renderiza automáticamente.
 */

type CartNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>;
type Props = { navigation: CartNavigationProp };

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const ClockIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
);

// ─── CartItemRow ──────────────────────────────────────────────────────────────
// Componente para cada item individual del carrito
// Muestra imagen, nombre, precio y controles de cantidad (- / +)
const CartItemRow = ({ item, sucursal_id }: { item: CartItem; sucursal_id: string }) => {
  const { increaseQuantity, decreaseQuantity } = useCart();

  return (
    <View style={styles.itemRow}>
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
          <Text style={{ fontSize: 20 }}>🍽️</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.nombre}</Text>
        {item.notas && <Text style={styles.itemNotes}>{item.notas}</Text>}
        <View style={styles.itemFooter}>
          {/* Los botones - y + llaman a las funciones del CartContext */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => decreaseQuantity(sucursal_id, item.id)}
            >
              <Text style={styles.quantityBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.cantidad}</Text>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => increaseQuantity(sucursal_id, item.id)}
            >
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.itemPrice}>
            ${(item.precio_unitario * item.cantidad).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ─── RestaurantCard ───────────────────────────────────────────────────────────
// Agrupa los items de un restaurante en una tarjeta
// Muestra el logo, nombre, tiempo de entrega y subtotal del restaurante
const RestaurantCard = ({ restaurant }: { restaurant: CartRestaurant }) => {
  const { clearRestaurant } = useCart();

  const subtotal = restaurant.items.reduce(
    (total, item) => total + item.precio_unitario * item.cantidad,
    0
  );

  return (
    <View style={styles.restaurantCard}>
      {/* Header con info del restaurante y botón de eliminar */}
      <View style={styles.restaurantHeader}>
        {restaurant.logo ? (
          <Image source={{ uri: restaurant.logo }} style={styles.restaurantLogo} />
        ) : (
          <View style={[styles.restaurantLogo, styles.restaurantLogoPlaceholder]}>
            <Text style={{ fontSize: 18 }}>🍽️</Text>
          </View>
        )}
        <View style={styles.restaurantInfo}>
          <Text style={styles.restaurantName}>{restaurant.nombre}</Text>
          <View style={styles.restaurantMeta}>
            <ClockIcon />
            <Text style={styles.restaurantTime}>{restaurant.tiempo_entrega} min</Text>
          </View>
        </View>
        {/* Eliminar todos los items de este restaurante */}
        <TouchableOpacity onPress={() => clearRestaurant(restaurant.sucursal_id)}>
          <TrashIcon />
        </TouchableOpacity>
      </View>

      {/* Items del restaurante */}
      {restaurant.items.map(item => (
        <CartItemRow key={item.id} item={item} sucursal_id={restaurant.sucursal_id} />
      ))}

      {/* Subtotal por restaurante */}
      <View style={styles.restaurantSubtotal}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>
        <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
      </View>
    </View>
  );
};

// ─── CartScreen ───────────────────────────────────────────────────────────────
export default function CartScreen({ navigation }: Props) {
  const { cart, clearCart, getSubtotal, getTotalItems } = useCart();

  const subtotal = getSubtotal();
  const costoEnvio = cart.length * 12; // $12 por restaurante — provisional hasta semana 5
  const total = subtotal + costoEnvio;

  // Construye los params que necesita OrderSummary
  
  const handleCheckout = () => {
  if (cart.length === 0) return;

  const restaurants = cart.map(restaurant => ({
    sucursalId: restaurant.sucursal_id,
    negocioId: restaurant.negocio_id,
    negocioNombre: restaurant.nombre,
    costoEnvio: 12,
    items: restaurant.items.map(i => ({
      name: i.nombre,
      quantity: i.cantidad,
      price: i.precio_unitario,
    })),
  }));

  navigation.navigate('OrderSummary', { restaurants });
};

  // Carrito vacío
  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Carrito</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🛒</Text>
          <Text style={styles.emptyStateTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptyStateText}>Agrega items desde un restaurante</Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('HomeFeed')}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.emptyStateButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.emptyStateButtonText}>Explorar Restaurantes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Una tarjeta por restaurante */}
        {cart.map(restaurant => (
          <RestaurantCard key={restaurant.sucursal_id} restaurant={restaurant} />
        ))}

        {/* Resumen de totales globales */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({getTotalItems()} items)</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Costo de envío</Text>
            <Text style={styles.summaryValue}>${costoEnvio.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón de checkout fijo al fondo */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.checkoutGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.checkoutButtonText}>Checkout · ${total.toFixed(2)}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:                  { flex: 1, backgroundColor: '#F9FAFB' },
  header:                     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton:                 { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:                { fontSize: 18, fontWeight: 'bold', color: '#000' },
  clearButton:                { paddingHorizontal: 8 },
  clearButtonText:            { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  content:                    { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  restaurantCard:             { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  restaurantHeader:           { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  restaurantLogo:             { width: 44, height: 44, borderRadius: 10, marginRight: 10 },
  restaurantLogoPlaceholder:  { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  restaurantInfo:             { flex: 1 },
  restaurantName:             { fontSize: 15, fontWeight: 'bold', color: '#000' },
  restaurantMeta:             { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  restaurantTime:             { fontSize: 12, color: '#22c55e', fontWeight: '500' },
  restaurantSubtotal:         { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  subtotalLabel:              { fontSize: 14, color: '#6B7280' },
  subtotalValue:              { fontSize: 14, fontWeight: '600', color: '#000' },
  itemRow:                    { flexDirection: 'row', marginBottom: 12 },
  itemImage:                  { width: 64, height: 64, borderRadius: 10, marginRight: 12 },
  itemImagePlaceholder:       { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  itemInfo:                   { flex: 1 },
  itemName:                   { fontSize: 14, fontWeight: '600', color: '#000' },
  itemNotes:                  { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemFooter:                 { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice:                  { fontSize: 15, fontWeight: 'bold', color: '#000' },
  quantityControls:           { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  quantityBtn:                { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  quantityBtnText:            { fontSize: 18, color: '#22c55e', fontWeight: 'bold' },
  quantityText:               { fontSize: 15, fontWeight: 'bold', color: '#000', minWidth: 20, textAlign: 'center' },
  summaryCard:                { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryTitle:               { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  summaryRow:                 { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel:               { fontSize: 14, color: '#6B7280' },
  summaryValue:               { fontSize: 14, color: '#000' },
  summaryDivider:             { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  summaryTotalLabel:          { fontSize: 16, fontWeight: 'bold', color: '#000' },
  summaryTotalValue:          { fontSize: 16, fontWeight: 'bold', color: '#22c55e' },
  checkoutContainer:          { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  checkoutButton:             { borderRadius: 16, overflow: 'hidden' },
  checkoutGradient:           { paddingVertical: 16, alignItems: 'center' },
  checkoutButtonText:         { fontSize: 16, fontWeight: 'bold', color: '#000' },
  emptyState:                 { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyStateIcon:             { fontSize: 64, marginBottom: 16 },
  emptyStateTitle:            { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyStateText:             { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyStateButton:           { borderRadius: 30, overflow: 'hidden' },
  emptyStateButtonGradient:   { paddingHorizontal: 32, paddingVertical: 14 },
  emptyStateButtonText:       { fontSize: 16, fontWeight: 'bold', color: '#000' },
});