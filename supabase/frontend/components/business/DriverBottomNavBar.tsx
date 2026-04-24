import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

const PackageIcon = ({ active }: { active?: boolean }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#22c55e' : '#9CA3AF'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <Path d="M12 22.08V12" />
  </Svg>
);


// ─── Icons ────────────────────────────────────────────────────────────────────

const HomeIcon = ({ active }: { active?: boolean }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24"
    fill={active ? '#22c55e' : 'none'}
    stroke={active ? '#22c55e' : '#9CA3AF'}
    strokeWidth="2">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const BikeIcon = ({ active }: { active?: boolean }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#22c55e' : '#9CA3AF'}
    strokeWidth="2">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 0 0 0-2h-3l-3 9" />
    <Path d="M9 15h6l1.5-6H7.5" />
  </Svg>
);

// Icono central — "Pedido activo / recibir"
const PackageCenterIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round">
    <Path d="M16.5 9.4l-9-5.19" />
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="M3.27 6.96L12 12.01l8.73-5.05" />
    <Path d="M12 22.08V12" />
  </Svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#22c55e' : '#9CA3AF'}
    strokeWidth="2">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const SupportIcon = ({ active }: { active?: boolean }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={active ? '#22c55e' : '#9CA3AF'}
    strokeWidth="2" strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v4M12 16h.01" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriverTabName = 'Home' | 'Entregas' | 'Pedidos' | 'Perfil' | 'Soporte';

type DriverBottomNavBarProps = {
  activeTab: DriverTabName;
  onTabChange: (tab: DriverTabName) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  repartidor?: any;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DriverBottomNavBar({
  activeTab,
  onTabChange,
  navigation,
  repartidor,
}: DriverBottomNavBarProps) {

  const handlePress = (tab: DriverTabName) => {
    onTabChange(tab);
    if (tab === 'Home') navigation.navigate('DriverDashboard');
    if (tab === 'Perfil' && repartidor) navigation.navigate('DriverProfile', { repartidor });
    if (tab === 'Soporte') navigation.navigate('DriverSupport');
    if (tab === 'Entregas') navigation.navigate('DriverRoutesScreen');
  };

  return (
    <View style={styles.bottomNav}>

      {/* Inicio */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Home')}
        activeOpacity={0.7}
      >
        <HomeIcon active={activeTab === 'Home'} />
        <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>
          Inicio
        </Text>
      </TouchableOpacity>

      {/* Entregas */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Entregas')}
        activeOpacity={0.7}
      >
        <BikeIcon active={activeTab === 'Entregas'} />
        <Text style={[styles.navText, activeTab === 'Entregas' && styles.navTextActive]}>
          Ruta
        </Text>
      </TouchableOpacity>

      {/* Pedidos */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Pedidos')}
        activeOpacity={0.7}
      >
        <PackageIcon active={activeTab === 'Pedidos'} />
        <Text style={[styles.navText, activeTab === 'Pedidos' && styles.navTextActive]}>
          Pedidos
        </Text>
      </TouchableOpacity>

      {/* ── PEDIDOS — botón central elevado ── */}
      <View style={styles.navCenterWrap}>
        <TouchableOpacity
          onPress={() => handlePress('Pedidos')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#22c55e', '#15803d']}
            style={styles.navCenterBtn}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <PackageCenterIcon />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.navCenterText}>Pedidos</Text>
      </View>

      {/* Perfil */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Perfil')}
        activeOpacity={0.7}
      >
        <ProfileIcon active={activeTab === 'Perfil'} />
        <Text style={[styles.navText, activeTab === 'Perfil' && styles.navTextActive]}>
          Perfil
        </Text>
      </TouchableOpacity>

      {/* Soporte */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => handlePress('Soporte')}
        activeOpacity={0.7}
      >
        <SupportIcon active={activeTab === 'Soporte'} />
        <Text style={[styles.navText, activeTab === 'Soporte' && styles.navTextActive]}>
          Soporte
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    color: '#9CA3AF',
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
  navCenterText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '700',
    marginTop: 4,
  },
});
