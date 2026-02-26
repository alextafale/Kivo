import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

// ─── Icons ────────────────────────────────────────────────────────────────────

const DashboardIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#22c55e' : 'none'} stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2">
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="14" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
  </Svg>
);

const MenuIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2">
    <Path d="M3 12h18M3 6h18M3 18h18" />
  </Svg>
);

const AnalyticsIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2">
    <Path d="M3 3v18h18" />
    <Path d="m19 9-5 5-4-4-3 3" />
  </Svg>
);

const SettingsIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#22c55e' : '#9CA3AF'} strokeWidth="2">
    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <Circle cx="12" cy="12" r="3" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type TabName = 'Dashboard' | 'Menu' | 'Analytics' | 'Settings';

type BottomNavBarProps = {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BottomNavBar({ activeTab, onTabChange, navigation }: BottomNavBarProps) {
  const handlePress = (tab: TabName) => {
    onTabChange(tab);
    if (tab === 'Dashboard') navigation.navigate('BusinessDashboard');
    if (tab === 'Menu') navigation.navigate('MenuEditor');
    if (tab === 'Settings') navigation.navigate('Settings');
  };

  const tabs: { name: TabName; Icon: React.FC<{ active?: boolean }> }[] = [
    { name: 'Dashboard', Icon: DashboardIcon },
    { name: 'Menu',      Icon: MenuIcon      },
    { name: 'Analytics', Icon: AnalyticsIcon },
    { name: 'Settings',  Icon: SettingsIcon  },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map(({ name, Icon }) => (
        <TouchableOpacity
          key={name}
          style={styles.navItem}
          onPress={() => handlePress(name)}
        >
          <Icon active={activeTab === name} />
          <Text style={[styles.navText, activeTab === name && styles.navTextActive]}>
            {name}
          </Text>
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
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#22c55e',
  },
});