import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

// ─── Icons ────────────────────────────────────────────────────────────────────

const DashboardIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : '#9CA3AF'} />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : '#9CA3AF'} />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : '#9CA3AF'} />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={active ? '#22c55e' : '#9CA3AF'} />
  </Svg>
);

const MenuIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Fork */}
    <Path d="M8 3v4M8 11v10" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2" />
    <Path d="M6 3v3a2 2 0 0 0 4 0V3" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2" />
    {/* Knife */}
    <Path d="M16 3c0 0 2 2 2 6s-2 4-2 4v8" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2" />
  </Svg>
);

const OrdersIcon = ({ active, badge }: { active?: boolean; badge?: number }) => (
  <View style={{ position: 'relative' }}>
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
  </View>
);

const AccountIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type MenuTabName = 'Dashboard' | 'Menu' | 'Orders' | 'Account';

type MenuBottomNavBarProps = {
  activeTab: MenuTabName;
  onTabChange: (tab: MenuTabName) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  ordersBadge?: number;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MenuBottomNavBar({
  activeTab,
  onTabChange,
  navigation,
  ordersBadge,
}: MenuBottomNavBarProps) {
  return (
    <View style={styles.bottomNav}>
      {/* Dashboard */}
      <TouchableOpacity style={styles.navItem} onPress={() => { onTabChange('Dashboard'); navigation.navigate('BusinessDashboard'); }} activeOpacity={0.7}>
        <DashboardIcon active={activeTab === 'Dashboard'} />
        <Text style={[styles.navText, activeTab === 'Dashboard' && styles.navTextActive]}>Dashboard</Text>
      </TouchableOpacity>

      {/* Menu */}
      <TouchableOpacity style={styles.navItem} onPress={() => onTabChange('Menu')} activeOpacity={0.7}>
        <MenuIcon active={activeTab === 'Menu'} />
        <Text style={[styles.navText, activeTab === 'Menu' && styles.navTextActive]}>Menu</Text>
      </TouchableOpacity>

      {/* Orders */}
      <TouchableOpacity style={styles.navItem} onPress={() => { onTabChange('Orders'); }} activeOpacity={0.7}>
        <OrdersIcon active={activeTab === 'Orders'} badge={ordersBadge} />
        <Text style={[styles.navText, activeTab === 'Orders' && styles.navTextActive]}>Orders</Text>
      </TouchableOpacity>

      {/* Account */}
      <TouchableOpacity style={styles.navItem} onPress={() => onTabChange('Account')} activeOpacity={0.7}>
        <AccountIcon active={activeTab === 'Account'} />
        <Text style={[styles.navText, activeTab === 'Account' && styles.navTextActive]}>Account</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
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
    borderColor: '#F0FDF4',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});