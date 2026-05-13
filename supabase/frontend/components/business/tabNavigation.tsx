import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';
import { useTheme } from '../../application/context/ThemeContext';

// ─── Icons ────────────────────────────────────────────────────────────────────

const DashboardIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="23" height="23" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <Rect x="3" y="3" width="7" height="7" rx="2" stroke={active ? '#22c55e' : color} />
    <Rect x="14" y="3" width="7" height="7" rx="2" stroke={active ? '#22c55e' : color} />
    <Rect x="14" y="14" width="7" height="7" rx="2" stroke={active ? '#22c55e' : color} />
    <Rect x="3" y="14" width="7" height="7" rx="2" stroke={active ? '#22c55e' : color} />
  </Svg>
);

const MenuIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="23" height="23" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 3v4M8 11v10" stroke={active ? '#22c55e' : color} strokeWidth="2" />
    <Path d="M6 3v3a2 2 0 0 0 4 0V3" stroke={active ? '#22c55e' : color} strokeWidth="2" />
    <Path d="M16 3c0 0 2 2 2 6s-2 4-2 4v8" stroke={active ? '#22c55e' : color} strokeWidth="2" />
  </Svg>
);

const ActiveOrdersIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round">
    <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <Rect x="9" y="3" width="6" height="4" rx="1" />
    <Path d="M9 12h6M9 16h4" />
  </Svg>
);

const CuponesIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <Circle cx="7" cy="7" r="1.5" fill={active ? '#22c55e' : color} />
  </Svg>
);

const SettingsIcon = ({ active, color }: { active?: boolean; color: string }) => (
  <Svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : color} strokeWidth="2">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabName = 'Dashboard' | 'Menu' | 'Orders' | 'Cupones' | 'Settings';

type BottomNavBarProps = {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  ordersBadge?: number;
};

// ─── Animated Tab Item ────────────────────────────────────────────────────────

function NavItem({
  label,
  active,
  onPress,
  children,
  badge,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  return (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.navIconWrap, { transform: [{ scale }] }]}>
        {/* Active pill background */}
        {active && (
          <View style={styles.activePill} />
        )}
        {children}
        {/* Badge */}
        {badge ? (
          <View style={badgeStyles.badge}>
            <Text style={badgeStyles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </Animated.View>
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {label}
      </Text>
      {/* Active dot indicator */}
      {active && <View style={styles.activeDot} />}
    </TouchableOpacity>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNavBar({
  activeTab,
  onTabChange,
  navigation,
  ordersBadge,
}: BottomNavBarProps) {
  const { colors, isDark } = useTheme();
  const centerScale = useRef(new Animated.Value(1)).current;

  const handlePress = (tab: TabName) => {
    onTabChange(tab);
    if (tab === 'Dashboard') navigation.navigate('BusinessDashboard');
    if (tab === 'Menu') navigation.navigate('MenuEditor');
    if (tab === 'Orders') navigation.navigate('ManageOrders');
    if (tab === 'Cupones') navigation.navigate('AdminCupones');
    if (tab === 'Settings') navigation.navigate('Settings');
  };

  const handleCenterPressIn = () => {
    Animated.spring(centerScale, { toValue: 0.88, useNativeDriver: true, speed: 40 }).start();
  };
  const handleCenterPressOut = () => {
    Animated.spring(centerScale, { toValue: 1, useNativeDriver: true, speed: 28 }).start();
  };

  const navBg = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)';
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const iconColor = isDark ? '#94a3b8' : '#9CA3AF';

  return (
    <View style={[styles.container, { borderTopColor: borderColor }]}>
      {/* Fondo con blur sutil */}
      <View style={[styles.navBackground, { backgroundColor: navBg }]} />

      <View style={styles.bottomNav}>
        {/* Dashboard */}
        <NavItem
          label="Inicio"
          active={activeTab === 'Dashboard'}
          onPress={() => handlePress('Dashboard')}
        >
          <DashboardIcon active={activeTab === 'Dashboard'} color={iconColor} />
        </NavItem>

        {/* Menú */}
        <NavItem
          label="Menú"
          active={activeTab === 'Menu'}
          onPress={() => handlePress('Menu')}
        >
          <MenuIcon active={activeTab === 'Menu'} color={iconColor} />
        </NavItem>

        {/* ── PEDIDOS — botón central elevado ── */}
        <View style={styles.navCenterWrap}>
          <TouchableOpacity
            onPress={() => handlePress('Orders')}
            onPressIn={handleCenterPressIn}
            onPressOut={handleCenterPressOut}
            activeOpacity={1}
          >
            <Animated.View style={{ transform: [{ scale: centerScale }] }}>
              <LinearGradient
                colors={
                  activeTab === 'Orders'
                    ? ['#16a34a', '#15803d']
                    : ['#22c55e', '#16a34a']
                }
                style={[
                  styles.navCenterBtn,
                  activeTab === 'Orders' && styles.navCenterBtnActive,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <ActiveOrdersIcon />
                {ordersBadge ? (
                  <View style={badgeStyles.centerBadge}>
                    <Text style={badgeStyles.badgeText}>
                      {ordersBadge > 9 ? '9+' : ordersBadge}
                    </Text>
                  </View>
                ) : null}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
          <Text style={[styles.navCenterText, activeTab === 'Orders' && styles.navCenterTextActive]}>
            Pedidos
          </Text>
          {activeTab === 'Orders' && <View style={styles.activeDot} />}
        </View>

        {/* Cupones */}
        <NavItem
          label="Cupones"
          active={activeTab === 'Cupones'}
          onPress={() => handlePress('Cupones')}
        >
          <CuponesIcon active={activeTab === 'Cupones'} color={iconColor} />
        </NavItem>

        {/* Ajustes */}
        <NavItem
          label="Ajustes"
          active={activeTab === 'Settings'}
          onPress={() => handlePress('Settings')}
        >
          <SettingsIcon active={activeTab === 'Settings'} color={iconColor} />
        </NavItem>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  navBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  navIconWrap: {
    width: 46,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    width: 46,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  navText: {
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.1,
  },
  navTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22c55e',
    marginTop: 3,
  },

  // Centro elevado
  navCenterWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -24,
    paddingBottom: 2,
  },
  navCenterBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  navCenterBtnActive: {
    shadowOpacity: 0.65,
    shadowRadius: 16,
    elevation: 14,
  },
  navCenterText: {
    fontSize: 10.5,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 0.1,
  },
  navCenterTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -2,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  centerBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
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
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});