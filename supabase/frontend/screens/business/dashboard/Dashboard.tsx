import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';
import { useAuth } from '../../../application/context/AuthContext';
import { useAdminNegocio } from '../../../application/hooks/useAdminNegocio';
import { supabase } from '../../../config/supabaseConfig';
import { useTheme } from '../../../application/context/ThemeContext';


type BusinessDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BusinessDashboard'>;

type Props = {
  navigation: BusinessDashboardNavigationProp;
};

type Sucursal = {
  calificacion: number;
  total_reviews: number;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const ShoppingBagIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Path d="M3 6h18" />
  </Svg>
);

const StarIcon = ({ size = 20, filled = true }: { size?: number; filled?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#22c55e' : 'none'} stroke="#22c55e" strokeWidth="2">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const TrendUpIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="m23 6-9.5 9.5-5-5L1 18" />
    <Path d="M17 6h6v6" />
  </Svg>
);

const PizzaIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M15 11h.01M9 16h.01M9 11h.01M13 16h.01M6 5c7.18-2.58 12.82-2.58 20 0-2.58 7.18-2.58 12.82 0 20-7.18-2.58-12.82-2.58-20 0 2.58-7.18 2.58-12.82 0-20Z" />
  </Svg>
);

const BurgerIcon = () => (
  <Svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
    <Path d="M2 17h20M2 12h20M3.5 8h17c.7 0 1.2-.6 1-1.3-.2-.6-.6-1.1-1.1-1.4C18.5 4.2 15.4 3 12 3s-6.5 1.2-8.4 2.3c-.5.3-.9.8-1.1 1.4-.2.7.3 1.3 1 1.3Z" />
    <Circle cx="6" cy="15" r="1" fill="#F59E0B" />
    <Circle cx="12" cy="15" r="1" fill="#F59E0B" />
    <Circle cx="18" cy="15" r="1" fill="#F59E0B" />
  </Svg>
);

const CheckCircleIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pendiente',   color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmado',  color: '#8B5CF6', bg: '#EDE9FE' },
  preparing:  { label: 'Preparando', color: '#F97316', bg: '#FFF7ED' },
  ready:      { label: 'Listo',       color: '#06B6D4', bg: '#ECFEFF' },
  picked_up:  { label: 'Recogido',    color: '#3B82F6', bg: '#EFF6FF' },
  on_the_way: { label: 'En camino',   color: '#3B82F6', bg: '#EFF6FF' },
  delivered:  { label: 'Entregado',   color: '#22c55e', bg: '#F0FDF4' },
  cancelled:  { label: 'Cancelado',   color: '#EF4444', bg: '#FEF2F2' },
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BusinessDashboard({ navigation }: Props) {
  const [storeOpen, setStoreOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>('Dashboard');
  const [deliveryScore, setDeliveryScore] = useState(0);
  const [deliveryReviews, setDeliveryReviews] = useState(0);

  const { colors, isDark } = useTheme();

  // ✅ Tomamos session directamente del contexto — sin getSession() inline
  const { adminAccess, session } = useAuth();
  const negocioId = adminAccess?.negocioId;
  const { negocio } = useAdminNegocio(negocioId ?? '');

  const [pedidos, setPedidos] = useState<any[]>([]);

  // ✅ fetchPedidos usa el token del contexto, sin round-trip a supabase.auth.getSession()
  const fetchPedidos = useCallback(async () => {
    if (!negocioId || !session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/negocios/${negocioId}/pedidos`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
      }
    } catch (e) {
      console.warn('fetchPedidos error:', e);
    }
  }, [negocioId, session?.accessToken]); // ✅ depende del token, no llama getSession

  const fetchSucursalesInfo = async () => {
    if (!negocioId || !session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/negocios/${negocioId}/sucursales`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.ok) {
        const data: Sucursal[] = await res.json();
        if (data.length > 0) {
        const totalReviews = data.reduce(
          (acc, s) => acc + (s.total_reviews || 0),
          0
        );

        const avgScore =
          data.reduce((acc, s) => acc + (s.calificacion || 0), 0) /
          data.length;

        setDeliveryScore(avgScore);
        setDeliveryReviews(totalReviews);
      }
      }
    } catch (e) {
      console.warn('fetchPedidos error:', e);
    }
  }

  // ✅ Solo corre cuando negocioId Y session están listos
  useEffect(() => {
    fetchPedidos();
    fetchSucursalesInfo();
  }, [fetchPedidos]);

  // ✅ Realtime channel — también espera a que haya negocioId
  useEffect(() => {
    if (!negocioId) return;
    const channel = supabase
      .channel(`dashboard:${negocioId}:pedidos`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos', filter: `negocio_id=eq.${negocioId}` },
        () => fetchPedidos(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [negocioId, fetchPedidos]);

  const activeOrdersCount = pedidos.filter(p => !['delivered', 'cancelled'].includes(p.status)).length;

  const hoy = new Date().toISOString().split('T')[0];
  const deliveredToday = pedidos.filter(p => p.status === 'delivered' && p.date?.includes(hoy));
  const dailySales = deliveredToday.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const formattedSales = dailySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const progressPct = Math.min((dailySales / 2000) * 100, 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.pageBg }]}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoText}>
                  {(negocio?.nombre ?? 'N')
                    .split(' ')
                    .slice(0, 2)
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </LinearGradient>
            </View>
            <View>
              <Text style={[styles.businessName, { color: colors.titleText }]}>{negocio?.nombre || 'Cargando...'}</Text>
              <Text style={[styles.businessAddress, { color: colors.subtitleText }]}>{negocio?.slug ? `Kivu.app/${negocio.slug}` : 'Kivu.app/...'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.storeStatusLabel, storeOpen && styles.storeStatusLabelActive]}>
              {storeOpen ? 'ABIERTO' : 'CERRADO'}
            </Text>
            <Switch
              value={storeOpen}
              onValueChange={setStoreOpen}
              trackColor={{ false: '#D1D5DB', true: '#22c55e' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
            />
          </View>
        </View>

        {/* Ventas del día */}
        <View style={[styles.salesSection, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.sectionLabel, { color: colors.subtitleText }]}>Ventas de hoy</Text>
          <View style={styles.salesHeader}>
            <Text style={[styles.salesAmount, { color: colors.titleText }]}>${formattedSales}</Text>
            <Text style={[styles.salesCurrency, { color: colors.subtitleText }]}>MXN</Text>
          </View>
          {deliveredToday.length > 0 && (
            <View style={styles.salesChange}>
              <TrendUpIcon />
              <Text style={styles.salesChangeText}>{deliveredToday.length} pedidos entregados</Text>
            </View>
          )}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={[styles.progressFill, { width: `${progressPct}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>Meta: $2,000.00 hoy</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ManageOrders')}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.activeOrdersCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.activeOrdersIcon}>
                <ShoppingBagIcon />
              </View>
              <Text style={styles.activeOrdersNumber}>{activeOrdersCount}</Text>
              <Text style={styles.activeOrdersLabel}>Pedidos activos</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <View style={[styles.reviewsCard, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}>
              <View style={[styles.reviewsStarContainer, { backgroundColor: isDark ? '#15803d40' : '#F0FDF4' }]}>
                <StarIcon size={24} />
              </View>
              <View style={styles.reviewsContent}>
                <Text style={[styles.reviewsRating, { color: colors.titleText }]}>
                  {deliveryScore > 0 ? deliveryScore.toFixed(1) : '—'}
                </Text>
                <View style={styles.reviewsStars}>
                  <StarIcon size={16} />
                </View>
              </View>
              <Text style={[styles.reviewsCount, { color: colors.subtitleText }]}>
                {deliveryReviews} {deliveryReviews === 1 ? 'reseña' : 'reseñas'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pedidos recientes */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.titleText }]}>Pedidos recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ManageOrders')}>
              <Text style={styles.viewAllText}>Ver todos →</Text>
            </TouchableOpacity>
          </View>

          {pedidos.length === 0 ? (
            <View style={[styles.emptyOrders, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.emptyOrdersText, { color: colors.subtitleText }]}>Sin pedidos por ahora</Text>
            </View>
          ) : (
            <View style={styles.ordersList}>
              {pedidos.slice(0, 5).map((order) => {
                const statusInfo = ESTADO_CONFIG[order.status] || { label: order.status, color: '#000', bg: '#EEE' };
                const OrderIcon = order.status === 'delivered' ? CheckCircleIcon : BurgerIcon;

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={[styles.orderItem, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000' }]}
                    onPress={() => navigation.navigate('ManageOrders')}
                  >
                    <View style={[
                      styles.orderIconContainer,
                      { backgroundColor: isDark ? colors.border : '#F9FAFB' },
                      order.status === 'delivered' && [styles.orderIconDelivered, { backgroundColor: isDark ? '#15803d40' : '#F3F4F6' }]
                    ]}>
                      <OrderIcon />
                    </View>
                    <View style={styles.orderContent}>
                      <Text style={[styles.orderNumber, { color: colors.titleText }]}>{order.orderNumber}</Text>
                      <Text style={[styles.orderItems, { color: colors.titleText }]}>
                        {order.notas ? 'Con notas especiales' : 'Pedido de cliente'}
                      </Text>
                      <Text style={[styles.orderMeta, { color: colors.subtitleText }]}>
                        {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.clienteNombre || 'Cliente'}
                      </Text>
                    </View>
                    <View style={[styles.orderStatusBadge, { backgroundColor: statusInfo.bg }]}>
                      <Text style={[styles.orderStatusText, { color: statusInfo.color }]}>
                        {statusInfo.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Banner promocional */}
        <View style={styles.adsBanner}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.adsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.adsContent}>
              <Text style={styles.adsTitle}>Impulsa tus ventas</Text>
              <Text style={styles.adsTitle}>con Kivo Ads</Text>
              <Text style={styles.adsSubtitle}>Llega a clientes en tu zona de reparto</Text>
              <TouchableOpacity style={styles.adsButton}>
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.adsButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.adsButtonText}>PROMOCIONAR</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <LinearGradient
          colors={['#22c55e', '#16a34a']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <PlusIcon />
        </LinearGradient>
      </TouchableOpacity>

      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation}
        ordersBadge={activeOrdersCount > 0 ? activeOrdersCount : undefined}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  businessAddress: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  storeStatusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  storeStatusLabelActive: {
    color: '#22c55e',
  },
  salesSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  salesHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  salesAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  salesCurrency: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  salesChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  salesChangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
  },
  activeOrdersCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activeOrdersIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  activeOrdersNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeOrdersLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  reviewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewsStarContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reviewsContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  reviewsRating: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
  },
  reviewsStars: {
    marginTop: 8,
  },
  reviewsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  ordersSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  ordersSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  ordersList: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderIconDelivered: {
    backgroundColor: '#F3F4F6',
  },
  orderContent: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adsBanner: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  adsGradient: {
    padding: 24,
  },
  adsContent: {
    flex: 1,
  },
  adsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  adsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    marginBottom: 20,
  },
  adsButton: {
    alignSelf: 'flex-start',
    borderRadius: 30,
    overflow: 'hidden',
  },
  adsButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  adsButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 0.5,
  },
  emptyOrders: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center' as const,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyOrdersText: {
    fontSize: 14,
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});