// screens/client/orders/Order.tsx
// Igual que el original pero con useOrderRealtime para actualizar estados en tiempo real

import { usePedidos } from '../../../application/hooks/usePedidos';
import { useOrderRealtime } from '../../../application/hooks/useOrderRealTime';
import { ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, TextInput, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { Order } from '../../../types/order';

type OrdersNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Orders'>;
type Props = { navigation: OrdersNavigationProp };

// ─── Iconos (sin cambios) ────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
const SearchIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Circle cx="11" cy="11" r="8" /><Path d="m21 21-4.35-4.35" />
  </Svg>
);
const CalendarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);
const ClockIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" />
  </Svg>
);
const CheckCircleIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" /><Path d="m9 12 2 2 4-4" />
  </Svg>
);
const TruckIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
    <Rect x="1" y="3" width="15" height="13" rx="2" ry="2" />
    <Path d="M16 8h5l3 3v5h-2" />
    <Circle cx="5.5" cy="18.5" r="2.5" /><Circle cx="18.5" cy="18.5" r="2.5" />
  </Svg>
);
const XCircleIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" /><Path d="m15 9-6 6M9 9l6 6" />
  </Svg>
);
const CloseIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

// ─── Configuración de estado ──────────────────────────────────────────────────

const statusConfig = {
  pending:    { label: 'Pendiente',   color: '#F59E0B', icon: ClockIcon },
  confirmed:  { label: 'Confirmado',  color: '#8B5CF6', icon: ClockIcon },
  preparing:  { label: 'Preparando', color: '#F97316', icon: ClockIcon },
  ready:      { label: 'Listo',       color: '#06B6D4', icon: CheckCircleIcon },
  picked_up:  { label: 'Recogido',    color: '#3B82F6', icon: TruckIcon },
  on_the_way: { label: 'En Camino',   color: '#3B82F6', icon: TruckIcon },
  delivered:  { label: 'Entregado',   color: '#22c55e', icon: CheckCircleIcon },
  cancelled:  { label: 'Cancelado',   color: '#EF4444', icon: XCircleIcon },
  refunded:   { label: 'Reembolsado', color: '#6B7280', icon: XCircleIcon },
};

const filterTabs = ['Todos', 'En Progreso', 'Completados', 'Cancelados'];

// ─── Componente de tarjeta individual con Realtime ────────────────────────────

/**
 * Cada tarjeta se suscribe individualmente a su pedido via Realtime.
 * Así cuando el negocio cambia el estado, se refleja aquí sin reload.
 */
function OrderCard({
  order: initialOrder,
  navigation,
  formatDate,
  formatTime,
}: {
  order: Order
  navigation: OrdersNavigationProp
  formatDate: (d: string) => string
  formatTime: (d: string) => string
}) {
  // Suscripción realtime por pedido
  const { order } = useOrderRealtime(initialOrder.id, initialOrder)
  if (!order) return null

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo?.icon ?? ClockIcon

  return (
    <TouchableOpacity style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Image source={{ uri: order.restaurantImage }} style={styles.restaurantImage} />
        <View style={styles.orderHeaderInfo}>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View style={styles.orderDateTime}>
            <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
            <Text style={styles.orderTimeSeparator}>•</Text>
            <Text style={styles.orderTime}>{formatTime(order.date)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderItems}>
        {(order.items ?? []).map((item, index) => (
          <Text key={index} style={styles.orderItemText}>
            {item.quantity}x {item.name}
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={[styles.statusBadge, { backgroundColor: (statusInfo?.color ?? '#999') + '20' }]}>
          <StatusIcon />
          <Text style={[styles.statusText, { color: statusInfo?.color ?? '#999' }]}>
            {statusInfo?.label ?? order.status}
          </Text>
        </View>
        <Text style={styles.orderTotal}>${order.total}</Text>
      </View>

      {(order.status === 'on_the_way' || order.status === 'picked_up') && (
        <TouchableOpacity
          onPress={() => navigation.navigate('orderTracking', { order })}
          style={styles.trackButton}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.trackButtonGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <TruckIcon />
            <Text style={styles.trackButtonText}>Rastrear Pedido</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {order.status === 'delivered' && (
        <TouchableOpacity style={styles.reorderButton}>
          <Text style={styles.reorderButtonText}>Volver a Pedir</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function Orders({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { pedidos, isLoading } = usePedidos();

  const filterOrders = () => {
    let filtered = [...(pedidos ?? [])];

    if (searchQuery.trim()) {
      filtered = filtered.filter(o =>
        o.restaurantName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'Todos') {
      const statusMap: Record<string, Order['status']> = {
        'En Progreso': 'on_the_way',
        'Completados': 'delivered',
        'Cancelados':  'cancelled',
      };
      const status = statusMap[selectedFilter];
      if (status) filtered = filtered.filter(o => o.status === status);
    }

    if (selectedDate) {
      filtered = filtered.filter(o => {
        const d = new Date(o.date);
        return (
          d.getDate()     === selectedDate.getDate()  &&
          d.getMonth()    === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      });
    }

    return filtered;
  };

  const formatDate = (date: string) => {
    if (!date) return '—';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const formatTime = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const clearDateFilter = () => { setSelectedDate(null); setDateFilterVisible(false); };
  const filteredOrders = filterOrders();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Pedidos</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por restaurante..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.dateFilterButton, selectedDate && styles.dateFilterButtonActive]}
            onPress={() => setDateFilterVisible(true)}
          >
            <CalendarIcon />
          </TouchableOpacity>
        </View>

        {selectedDate && (
          <View style={styles.activeDateFilter}>
            <Text style={styles.activeDateFilterText}>
              Filtrado: {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={clearDateFilter}>
              <Text style={styles.clearFilterText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabsContainer} contentContainerStyle={styles.filterTabsContent}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, selectedFilter === tab && styles.filterTabActive]}
              onPress={() => setSelectedFilter(tab)}
            >
              <Text style={[styles.filterTabText, selectedFilter === tab && styles.filterTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                navigation={navigation}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                  <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
                </Svg>
              </View>
              <Text style={styles.emptyStateTitle}>No hay pedidos</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedDate
                  ? 'No se encontraron pedidos con los filtros seleccionados'
                  : 'Aún no has realizado ningún pedido'}
              </Text>
              {!searchQuery && !selectedDate && (
                <TouchableOpacity style={styles.emptyStateButton} onPress={() => navigation.navigate('HomeFeed')}>
                  <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.emptyStateButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.emptyStateButtonText}>Explorar Restaurantes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Filter Modal — sin cambios */}
      <Modal visible={dateFilterVisible} animationType="slide" transparent onRequestClose={() => setDateFilterVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrar por Fecha</Text>
              <TouchableOpacity onPress={() => setDateFilterVisible(false)}><CloseIcon /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Selecciona un rango de fechas</Text>
              <View style={styles.quickFilters}>
                {[
                  { label: 'Hoy',           offset: 0 },
                  { label: 'Ayer',          offset: 1 },
                  { label: 'Última Semana', offset: 7 },
                ].map(({ label, offset }) => (
                  <TouchableOpacity key={label} style={styles.quickFilterButton} onPress={() => {
                    const d = new Date(); d.setDate(d.getDate() - offset);
                    setSelectedDate(d); setDateFilterVisible(false);
                  }}>
                    <Text style={styles.quickFilterText}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.dateOptions}>
                {[...Array(7)].map((_, index) => {
                  const date = new Date(); date.setDate(date.getDate() - index);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity key={index} style={[styles.dateOption, isSelected && styles.dateOptionSelected]}
                      onPress={() => { setSelectedDate(date); setDateFilterVisible(false); }}>
                      <Text style={[styles.dateOptionDay,   isSelected && styles.dateOptionTextSelected]}>{date.toLocaleDateString('es-MX', { weekday: 'short' })}</Text>
                      <Text style={[styles.dateOptionDate,  isSelected && styles.dateOptionTextSelected]}>{date.getDate()}</Text>
                      <Text style={[styles.dateOptionMonth, isSelected && styles.dateOptionTextSelected]}>{date.toLocaleDateString('es-MX', { month: 'short' })}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalClearButton} onPress={clearDateFilter}>
                <Text style={styles.modalClearText}>Limpiar Filtro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos (sin cambios respecto al original) ───────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF' },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },
  dateFilterButton: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  dateFilterButtonActive: { backgroundColor: '#F0FDF4' },
  activeDateFilter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F0FDF4', borderBottomWidth: 1, borderBottomColor: '#BBF7D0' },
  activeDateFilterText: { fontSize: 14, color: '#15803d', fontWeight: '500' },
  clearFilterText: { fontSize: 14, color: '#22c55e', fontWeight: '600' },
  filterTabsContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filterTabsContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9FAFB' },
  filterTabActive: { backgroundColor: '#22c55e' },
  filterTabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#000' },
  ordersList: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orderHeader: { flexDirection: 'row', alignItems: 'center' },
  restaurantImage: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  orderHeaderInfo: { flex: 1 },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 2 },
  orderNumber: { fontSize: 13, color: '#9CA3AF', marginBottom: 4 },
  orderDateTime: { flexDirection: 'row', alignItems: 'center' },
  orderDate: { fontSize: 13, color: '#6B7280' },
  orderTimeSeparator: { fontSize: 13, color: '#D1D5DB', marginHorizontal: 6 },
  orderTime: { fontSize: 13, color: '#6B7280' },
  orderDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  orderItems: { marginBottom: 12 },
  orderItemText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  orderTotal: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  trackButton: { marginTop: 12, borderRadius: 12, overflow: 'hidden' },
  trackButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  trackButtonText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  reorderButton: { marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  reorderButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyStateIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  emptyStateText: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyStateButton: { borderRadius: 30, overflow: 'hidden' },
  emptyStateButtonGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  emptyStateButtonText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  modalBody: { padding: 20 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  quickFilters: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  quickFilterButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  quickFilterText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  dateOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  dateOption: { width: '13%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  dateOptionSelected: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  dateOptionDay: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
  dateOptionDate: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  dateOptionMonth: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  dateOptionTextSelected: { color: '#000' },
  modalFooter: { paddingHorizontal: 20 },
  modalClearButton: { paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  modalClearText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
});