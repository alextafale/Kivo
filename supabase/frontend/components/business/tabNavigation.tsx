import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';
import { useTheme } from '../../application/context/ThemeContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

const DashboardIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : color} />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : color} />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : color} />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : color} />
  </Svg>
);

const MenuIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 3v4M8 11v10" stroke={active ? '#22c55e' : color} strokeWidth="2" />
    <Path d="M6 3v3a2 2 0 0 0 4 0V3" stroke={active ? '#22c55e' : color} strokeWidth="2" />
    <Path d="M16 3c0 0 2 2 2 6s-2 4-2 4v8" stroke={active ? '#22c55e' : color} strokeWidth="2" />
  </Svg>
);

const OrdersBellIcon = ({ active, color, badge }: { active?: boolean; color: string; badge?: number }) => (
  <View style={{ position: 'relative' }}>
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2" strokeLinecap="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
    {badge ? (
      <View style={badgeStyles.badge}>
        <Text style={badgeStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
      </View>
    ) : null}
  </View>
);

const SettingsIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

// Icono especial central — "Pedidos activos" con gradiente
const ActiveOrdersIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round">
    <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <Rect x="9" y="3" width="6" height="4" rx="1" />
    <Path d="M9 12h6M9 16h4" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabName = 'Dashboard' | 'Menu' | 'Orders' | 'Settings';

type BottomNavBarProps = {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  ordersBadge?: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNavBar({ activeTab, onTabChange, navigation, ordersBadge }: BottomNavBarProps) {
  const { colors, isDark } = useTheme();

  const handlePress = (tab: TabName) => {
    onTabChange(tab);
    if (tab === 'Dashboard') navigation.navigate('BusinessDashboard');
    if (tab === 'Menu') navigation.navigate('MenuEditor');
    if (tab === 'Orders') navigation.navigate('ManageOrders');
    if (tab === 'Settings') navigation.navigate('Settings');
  };

  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>

      {/* Dashboard */}
      <TouchableOpacity style={styles.navItem} onPress={() => handlePress('Dashboard')} activeOpacity={0.7}>
        <DashboardIcon active={activeTab === 'Dashboard'} color={colors.labelText} />
        <Text style={[styles.navText, { color: colors.labelText }, activeTab === 'Dashboard' && styles.navTextActive]}>
          Inicio
        </Text>
      </TouchableOpacity>

      {/* Menu */}
      <TouchableOpacity style={styles.navItem} onPress={() => handlePress('Menu')} activeOpacity={0.7}>
        <MenuIcon active={activeTab === 'Menu'} color={colors.labelText} />
        <Text style={[styles.navText, { color: colors.labelText }, activeTab === 'Menu' && styles.navTextActive]}>
          Menú
        </Text>
      </TouchableOpacity>

      {/* ── PEDIDOS — botón central elevado ── */}
      <View style={styles.navCenterWrap}>
        <TouchableOpacity
          onPress={() => handlePress('Orders')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#22c55e', '#15803d']}
            style={[
              styles.navCenterBtn,
              activeTab === 'Orders' && styles.navCenterBtnActive,
            ]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <ActiveOrdersIcon />
            {ordersBadge ? (
              <View style={badgeStyles.centerBadge}>
                <Text style={badgeStyles.badgeText}>{ordersBadge > 9 ? '9+' : ordersBadge}</Text>
              </View>
            ) : null}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.navCenterText}>Pedidos</Text>
      </View>

      {/* Orders (notificaciones) — renombrado ahora es una campana en el flujo alternativo
          Podemos omitirlo o reemplazarlo con Analytics, aquí lo dejamos limpio */}
      {/* Settings */}
      <TouchableOpacity style={styles.navItem} onPress={() => handlePress('Settings')} activeOpacity={0.7}>
        <SettingsIcon active={activeTab === 'Settings'} color={colors.labelText} />
        <Text style={[styles.navText, { color: colors.labelText }, activeTab === 'Settings' && styles.navTextActive]}>
          Ajustes
        </Text>
      </TouchableOpacity>

      {/* Placeholder para balance visual */}
      <View style={styles.navItem} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 2,
  },
  navText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },

  // Centro elevado
  navCenterWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
    paddingBottom: 2,
  },
  navCenterBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  navCenterBtnActive: {
    shadowOpacity: 0.6,
  },
  navCenterText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '700',
    marginTop: 4,
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  centerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});