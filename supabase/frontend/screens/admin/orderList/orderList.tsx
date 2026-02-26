import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

//  Componente de navegación reutilizable
import OrdersBottomNavBar, { OrdersTabName } from '../../../components/business/OrdersbottomNavBar';

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;

type Props = {
  navigation: OrdersScreenNavigationProp;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

const BellIcon = ({ hasNotification }: { hasNotification?: boolean }) => (
  <View style={{ position: 'relative' }}>
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
    {hasNotification && (
      <View style={styles.notificationDot} />
    )}
  </View>
);

const MessageIcon = ({ urgent }: { urgent?: boolean }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={urgent ? '#EF4444' : '#6B7280'} strokeWidth="2" strokeLinecap="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    {urgent && <Path d="M12 8v4M12 16h.01" stroke="#EF4444" strokeWidth="2.5" />}
  </Svg>
);

const CheckIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
    <Path d="m20 6-11 11-5-5" />
  </Svg>
);

const UtensilsIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
    <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <Path d="M7 2v20" />
    <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

// ─── Types & Data ─────────────────────────────────────────────────────────────

type OrderStatus = 'nuevo' | 'cocinando' | 'urgente' | 'listo';
type FilterTab = 'Pendientes' | 'En Proceso' | 'Listos';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  timeAgo: string;
  status: OrderStatus;
  note?: string;
  items: OrderItem[];
  total: number;
}

const allOrders: Record<FilterTab, Order[]> = {
  Pendientes: [
    {
      id: '1',
      orderNumber: '#ORD-8291',
      customerName: 'Ricardo Arjona',
      timeAgo: 'HACE 4 MINUTOS',
      status: 'nuevo',
      note: '"Por favor, sin cebolla en la hamburgues..."',
      items: [
        { name: 'Doble Cheeseburger', quantity: 1, price: 12.50 },
        { name: 'Papas Fritas Grandes', quantity: 1, price: 4.00 },
        { name: 'Coca Cola Zero', quantity: 1, price: 2.50 },
      ],
      total: 19.00,
    },
    {
      id: '3',
      orderNumber: '#ORD-8295',
      customerName: 'Juan Carlos Pérez',
      timeAgo: 'HACE 1 MINUTO',
      status: 'urgente',
      note: '"Es para llevar, llego en 5 minutos!!!"',
      items: [
        { name: 'Ensalada César Pollo', quantity: 1, price: 9.00 },
      ],
      total: 9.00,
    },
  ],
  'En Proceso': [
    {
      id: '2',
      orderNumber: '#ORD-8288',
      customerName: 'María G. Fernández',
      timeAgo: 'HACE 12 MINUTOS',
      status: 'cocinando',
      note: undefined,
      items: [
        { name: 'Pizza Pepperoni Mediana', quantity: 2, price: 24.00 },
        { name: 'Garlic Bread', quantity: 1, price: 5.50 },
      ],
      total: 29.50,
    },
  ],
  Listos: [],
};

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string; textColor: string }> = {
  nuevo:     { label: 'NUEVO',     color: '#D97706', bg: '#FEF3C7', textColor: '#92400E' },
  cocinando: { label: 'COCINANDO', color: '#6B7280', bg: '#F3F4F6', textColor: '#374151' },
  urgente:   { label: 'URGENTE',   color: '#EF4444', bg: '#FEE2E2', textColor: '#991B1B' },
  listo:     { label: 'LISTO',     color: '#22c55e', bg: '#F0FDF4', textColor: '#166534' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const OrderCard = ({ order }: { order: Order }) => {
  const isUrgent = order.status === 'urgente';
  const isNew = order.status === 'nuevo';
  const isCooking = order.status === 'cocinando';
  const statusInfo = statusConfig[order.status];

  const noteBarColor = isUrgent ? '#EF4444' : '#2563EB';
  const noteBg = isUrgent ? '#FEF2F2' : '#EFF6FF';

  return (
    <View style={[styles.orderCard, isUrgent && styles.orderCardUrgent]}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.orderMeta}>{order.timeAgo} • {order.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Note / Message */}
      {order.note ? (
        <View style={[styles.noteContainer, { backgroundColor: noteBg, borderLeftColor: noteBarColor }]}>
          <MessageIcon urgent={isUrgent} />
          <Text style={[styles.noteText, { color: isUrgent ? '#EF4444' : '#1D4ED8' }]}>
            {order.note}
          </Text>
        </View>
      ) : (
        <View style={styles.noNoteContainer}>
          <MessageIcon />
          <Text style={styles.noNoteText}>Sin mensajes adicionales</Text>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Items */}
      <View style={styles.itemsList}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.quantity}x {item.name}
            </Text>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
      </View>

      {/* Action Button */}
      {(isNew || isUrgent) ? (
        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={styles.acceptButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <CheckIcon />
            <Text style={styles.acceptButtonText}>Aceptar Pedido</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : isCooking ? (
        <TouchableOpacity style={styles.readyButton} activeOpacity={0.8}>
          <UtensilsIcon />
          <Text style={styles.readyButtonText}>Marcar como Preparado</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrdersScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Pendientes');
  const [activeTab, setActiveTab] = useState<OrdersTabName>('Pedidos');

  const currentOrders = allOrders[activeFilter];
  const filterTabs: FilterTab[] = ['Pendientes', 'En Proceso', 'Listos'];

  const pendingCount = allOrders['Pendientes'].length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <SearchIcon />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <BellIcon hasNotification={pendingCount > 0} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterTabs.map((tab) => {
          const count =
            tab === 'Pendientes' ? allOrders.Pendientes.length :
            tab === 'En Proceso' ? allOrders['En Proceso'].length :
            allOrders.Listos.length;

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, activeFilter === tab && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, activeFilter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
              {count > 0 && activeFilter !== tab && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentOrders.length > 0 ? (
          currentOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🍽️</Text>
            <Text style={styles.emptyStateTitle}>Sin pedidos</Text>
            <Text style={styles.emptyStateSubtitle}>
              No hay pedidos en esta categoría por el momento.
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <PlusIcon />
        </LinearGradient>
      </TouchableOpacity>

      {/* 👇 Barra de navegación como componente reutilizable */}
      <OrdersBottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  orderCardUrgent: {
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOpacity: 0.12,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 3,
  },
  orderMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderLeftWidth: 3,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
  noNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  noNoteText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
  },

  // Items
  itemsList: {
    gap: 8,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '400',
  },
  itemPrice: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },

  // Total
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563EB',
  },

  // Buttons
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  readyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 78,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});