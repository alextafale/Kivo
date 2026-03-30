import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Image, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useCart, CartRestaurant, CartItem } from '../../../application/context/CartContext';
import { useAuth } from '../../../application/context/AuthContext';
import { useProfile } from '../../../application/hooks/useProfile';
import { guardarPedido } from '../../../../services/geminiService';
import {
  generarTicketPDF, compartirTicketPDF, enviarResumenWhatsApp, TicketData,
} from '../../../../services/ticketService';

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
    <Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" />
  </Svg>
);
const TrashIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
);

// ─── CartItemRow ──────────────────────────────────────────────────────────────

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
          <View style={styles.quantityControls}>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => decreaseQuantity(sucursal_id, item.id)}>
              <Text style={styles.quantityBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item.cantidad}</Text>
            <TouchableOpacity style={styles.quantityBtn} onPress={() => increaseQuantity(sucursal_id, item.id)}>
              <Text style={styles.quantityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.itemPrice}>${(item.precio_unitario * item.cantidad).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

// ─── RestaurantCard ───────────────────────────────────────────────────────────

const RestaurantCard = ({ restaurant }: { restaurant: CartRestaurant }) => {
  const { clearRestaurant } = useCart();
  const subtotal = restaurant.items.reduce((t, i) => t + i.precio_unitario * i.cantidad, 0);
  return (
    <View style={styles.restaurantCard}>
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
        <TouchableOpacity onPress={() => clearRestaurant(restaurant.sucursal_id)}>
          <TrashIcon />
        </TouchableOpacity>
      </View>
      {restaurant.items.map(item => (
        <CartItemRow key={item.id} item={item} sucursal_id={restaurant.sucursal_id} />
      ))}
      <View style={styles.restaurantSubtotal}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>
        <Text style={styles.subtotalValue}>${subtotal.toFixed(2)}</Text>
      </View>
    </View>
  );
};

// ─── CartScreen ───────────────────────────────────────────────────────────────

export default function CartScreen({ navigation }: Props) {
  const { cart, clearCart, clearChatbotOrder, getSubtotal, getTotalItems, chatbotOrder } = useCart();
  const { session } = useAuth();
  const { profile } = useProfile();
  const [confirming, setConfirming] = useState(false);

  const subtotal  = getSubtotal();
  const costoEnvio = cart.length * 12;
  const total     = subtotal + costoEnvio;

  // ─── Confirmar pedido del chatbot ─────────────────────────────────────────

  const handleConfirmarChatbot = async () => {
    if (!chatbotOrder?.negocio) {
      Alert.alert('Error', 'No hay un pedido del chatbot para confirmar.');
      return;
    }
    // ✅ Validar que tenemos los IDs necesarios
    if (!chatbotOrder.sucursalId || !chatbotOrder.domicilioId) {
      Alert.alert(
        'Sin dirección',
        'No tienes una dirección predeterminada. Agrega una en tu perfil antes de confirmar.',
      );
      return;
    }
    if (!session?.userId) {
      Alert.alert('Error', 'Sesión no válida. Inicia sesión de nuevo.');
      return;
    }

    setConfirming(true);
    try {
      // 1. Guardar pedido en Supabase con la firma correcta
      const pedidoEnCurso = {
        negocio: chatbotOrder.negocio as any,
        items:   chatbotOrder.items,
        direccionEntrega: chatbotOrder.direccionEntrega,
        notas:   chatbotOrder.notas,
      };

      // ✅ Fix: nueva firma con sucursalId, domicilioId, userId
      const result = await guardarPedido(
        pedidoEnCurso,
        chatbotOrder.sucursalId,
        chatbotOrder.domicilioId,
        session.userId,
      );
      if (!result) throw new Error('No se pudo registrar el pedido.');

      // 2. Construir datos del ticket
      const ticketData: TicketData = {
        ordenId:          result.pedidoId,
        orderNumber:      result.order.orderNumber,
        negocioNombre:    chatbotOrder.negocio.nombre,
        negocioDireccion: chatbotOrder.negocio.direccion,
        usuarioNombre:    profile
          ? `${profile.nombre ?? ''} ${profile.apellido ?? ''}`.trim() || 'Cliente'
          : 'Cliente',
        usuarioEmail:     session?.email ?? '',
        usuarioTelefono:  profile?.telefono,
        direccionEntrega: chatbotOrder.direccionEntrega,
        notas:            chatbotOrder.notas,
        items:            chatbotOrder.items,
        subtotal:         result.order.subtotal ?? subtotal,
        costoEnvio:       12,
        total:            result.order.total,
        fecha:            new Date().toLocaleString('es-MX', {
          dateStyle: 'medium', timeStyle: 'short',
        }),
      };

      // 3. Generar PDF del ticket
      const pdfUri = await generarTicketPDF(ticketData);

      // 4. Compartir PDF (sheet nativo — el usuario elige WhatsApp u otra app)
      if (pdfUri) await compartirTicketPDF(pdfUri);

      // 5. Enviar resumen de texto por WhatsApp al teléfono registrado
      if (profile?.telefono) await enviarResumenWhatsApp(ticketData);

      // 6. Limpiar carrito
      clearChatbotOrder();
      clearCart();

      // 7. Navegar a confirmación
      navigation.navigate('OrderConfirmation', {
        orders: [{
          orderNumber:  result.order.orderNumber,
          negocioNombre: chatbotOrder.negocio.nombre,
          total:        result.order.total,
        }],
        totalGeneral: result.order.total,
      });
    } catch (e: any) {
      console.error('handleConfirmarChatbot error:', e);
      Alert.alert('Error al confirmar', e.message ?? 'Inténtalo de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  // ─── Checkout normal (sin chatbot) ────────────────────────────────────────

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (chatbotOrder) {
      handleConfirmarChatbot();
      return;
    }
    const restaurants = cart.map(r => ({
      sucursalId:   r.sucursal_id,
      negocioId:    r.negocio_id,
      negocioNombre: r.nombre,
      costoEnvio:   12,
      items:        r.items.map(i => ({
        name:     i.nombre,
        quantity: i.cantidad,
        price:    i.precio_unitario,
      })),
    }));
    navigation.navigate('OrderSummary', { restaurants });
  };

  // ─── Carrito vacío ────────────────────────────────────────────────────────

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
          <Text style={styles.emptyStateText}>Agrega items desde un restaurante o usa el chatbot</Text>
          <TouchableOpacity style={styles.emptyStateButton} onPress={() => navigation.navigate('HomeFeed')}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.emptyStateButtonGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={styles.emptyStateButtonText}>Explorar Restaurantes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const checkoutLabel = chatbotOrder
    ? `Confirmar Pedido · $${total.toFixed(2)}`
    : `Checkout · $${total.toFixed(2)}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito</Text>
        <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      {chatbotOrder && (
        <View style={styles.chatbotBanner}>
          <Text style={styles.chatbotBannerText}>
            🤖 Pedido del chatbot — confirma para generar tu ticket PDF
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {cart.map(restaurant => (
          <RestaurantCard key={restaurant.sucursal_id} restaurant={restaurant} />
        ))}

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

        {chatbotOrder && (
          <View style={styles.ticketNote}>
            <Text style={styles.ticketNoteText}>
              📄 Al confirmar se generará un PDF y se enviará un resumen por WhatsApp a tu número registrado.
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={[styles.checkoutButton, confirming && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={confirming}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.checkoutGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {confirming ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.checkoutButtonText}>Generando ticket...</Text>
              </View>
            ) : (
              <Text style={styles.checkoutButtonText}>{checkoutLabel}</Text>
            )}
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
  chatbotBanner:              { backgroundColor: '#F0FDF4', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#BBF7D0' },
  chatbotBannerText:          { fontSize: 13, color: '#15803d', fontWeight: '500' },
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
  summaryCard:                { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryTitle:               { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  summaryRow:                 { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel:               { fontSize: 14, color: '#6B7280' },
  summaryValue:               { fontSize: 14, color: '#000' },
  summaryDivider:             { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  summaryTotalLabel:          { fontSize: 16, fontWeight: 'bold', color: '#000' },
  summaryTotalValue:          { fontSize: 16, fontWeight: 'bold', color: '#22c55e' },
  ticketNote:                 { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  ticketNoteText:             { fontSize: 12, color: '#1D4ED8', lineHeight: 18 },
  checkoutContainer:          { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  checkoutButton:             { borderRadius: 16, overflow: 'hidden' },
  checkoutButtonDisabled:     { opacity: 0.7 },
  checkoutGradient:           { paddingVertical: 16, alignItems: 'center' },
  checkoutButtonText:         { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  emptyState:                 { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyStateIcon:             { fontSize: 64, marginBottom: 16 },
  emptyStateTitle:            { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyStateText:             { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  emptyStateButton:           { borderRadius: 30, overflow: 'hidden' },
  emptyStateButtonGradient:   { paddingHorizontal: 32, paddingVertical: 14 },
  emptyStateButtonText:       { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
});