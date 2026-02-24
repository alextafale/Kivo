import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

// ─── Icons ────────────────────────────────────────────────────────────────────

const PedidosIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563EB' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="5" y="2" width="14" height="20" rx="2" />
    <Path d="M9 7h6M9 11h6M9 15h4" />
  </Svg>
);

const CartaIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563EB' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
);

const VentasIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563EB' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 3v18h18" />
    <Path d="m19 9-5 5-4-4-3 3" />
  </Svg>
);

const AjustesIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#2563EB' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrdersTabName = 'Pedidos' | 'Carta' | 'Ventas' | 'Ajustes';

type OrdersBottomNavBarProps = {
  activeTab: OrdersTabName;
  onTabChange: (tab: OrdersTabName) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersBottomNavBar({ activeTab, onTabChange, navigation }: OrdersBottomNavBarProps) {
  const tabs: { name: OrdersTabName; Icon: React.FC<{ active?: boolean }> }[] = [
    { name: 'Pedidos', Icon: PedidosIcon },
    { name: 'Carta',   Icon: CartaIcon   },
    { name: 'Ventas',  Icon: VentasIcon  },
    { name: 'Ajustes', Icon: AjustesIcon },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map(({ name, Icon }) => (
        <TouchableOpacity
          key={name}
          style={styles.navItem}
          onPress={() => onTabChange(name)}
          activeOpacity={0.7}
        >
          <Icon active={activeTab === name} />
          <Text style={[styles.navText, activeTab === name && styles.navTextActive]}>
            {name.toUpperCase()}
          </Text>
          {activeTab === name && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  navText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: '#2563EB',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});