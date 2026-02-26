import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

// ✅ Misma barra que Dashboard y MenuEditor
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
type Props = { navigation: SettingsScreenNavigationProp };

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const BoltIcon = () => (
  <Svg width="13" height="13" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </Svg>
);

const RobotIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="10" rx="2" />
    <Circle cx="12" cy="5" r="2" />
    <Path d="M12 7v4" />
    <Path d="M8 15h.01M16 15h.01" />
    <Path d="M9 19h6" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Path d="M21 12H9" />
  </Svg>
);

// ─── Types & Data ─────────────────────────────────────────────────────────────

type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

interface DaySchedule {
  day: DayKey;
  open: string;
  close: string;
  enabled: boolean;
  note?: string;
}

const initialSchedule: DaySchedule[] = [
  { day: 'MON', open: '09:00', close: '22:00', enabled: true },
  { day: 'TUE', open: '09:00', close: '22:00', enabled: true },
  { day: 'WED', open: '09:00', close: '22:00', enabled: true },
  { day: 'THU', open: '09:00', close: '22:00', enabled: true },
  { day: 'FRI', open: '09:00', close: '23:00', enabled: true },
  { day: 'SAT', open: '10:00', close: '23:00', enabled: true },
  { day: 'SUN', open: '', close: '', enabled: false, note: 'Closed for maintenance' },
];

// ─── Delivery Slider ──────────────────────────────────────────────────────────

const DeliverySlider = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const MIN = 1; const MAX = 15;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;
  const steps = [1, 5, 10, 15];

  return (
    <View>
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` }]} />
        <View style={[sliderStyles.thumb, { left: `${pct}%` }]} />
      </View>
      <View style={sliderStyles.tapRow}>
        {steps.map((s) => (
          <TouchableOpacity key={s} onPress={() => onChange(s)} style={sliderStyles.tapZone}>
            <Text style={[sliderStyles.stepLabel, value === s && sliderStyles.stepLabelActive]}>
              {s} KM
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  track: {
    height: 6, backgroundColor: '#E5E7EB', borderRadius: 3,
    marginHorizontal: 8, marginTop: 16, marginBottom: 4,
    position: 'relative', justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  thumb: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#FFFFFF',
    marginLeft: -11, top: -8,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  tapRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  tapZone: { alignItems: 'center', padding: 4 },
  stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  stepLabelActive: { color: '#22c55e', fontWeight: '700' },
});

// ─── Map Placeholder ──────────────────────────────────────────────────────────

const MapPlaceholder = ({ radius }: { radius: number }) => (
  <View style={mapStyles.container}>
    <View style={mapStyles.map}>
      <View style={[mapStyles.road, { top: '45%', left: 0, right: 0, height: 3 }]} />
      <View style={[mapStyles.road, { top: '25%', left: 0, right: 0, height: 2 }]} />
      <View style={[mapStyles.road, { top: 0, bottom: 0, left: '38%', width: 3 }]} />
      <View style={[mapStyles.road, { top: 0, bottom: 0, left: '65%', width: 2 }]} />
      <View style={mapStyles.park} />
      <View style={[mapStyles.radiusCircle, {
        width: 80 + radius * 6, height: 80 + radius * 6,
        borderRadius: (80 + radius * 6) / 2,
        marginLeft: -(40 + radius * 3), marginTop: -(40 + radius * 3),
      }]} />
      <View style={mapStyles.pin}>
        <View style={mapStyles.pinDot} />
      </View>
    </View>
  </View>
);

const mapStyles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', height: 160, marginBottom: 8 },
  map: { flex: 1, backgroundColor: '#D1E8D1', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  road: { position: 'absolute', backgroundColor: '#F5F0E8' },
  park: { position: 'absolute', top: '30%', left: '40%', width: 60, height: 45, backgroundColor: '#A8D5A8', borderRadius: 8 },
  radiusCircle: {
    position: 'absolute', backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 2, borderColor: 'rgba(34,197,94,0.5)', borderStyle: 'dashed',
  },
  pin: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
  },
  pinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  // ✅ TabName en lugar de OrdersTabName, y 'Settings' como tab activo
  const [activeTab, setActiveTab]       = useState<TabName>('Settings');
  const [schedule, setSchedule]         = useState<DaySchedule[]>(initialSchedule);
  const [radius, setRadius]             = useState(8.5);
  const [businessName, setBusinessName] = useState("Mama's Pizzeria");
  const [supportEmail, setSupportEmail] = useState('hello@mamaspizza.it');
  const [minOrder, setMinOrder]         = useState('15.00');

  const toggleDay = (idx: number, val: boolean) => {
    setSchedule((prev) => prev.map((d, i) => i === idx ? { ...d, enabled: val } : d));
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userToken', 'userData', 'accountType', 'userEmail']);
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          },
        },
      ]
    );
  };

  const displayRadius = Math.round(radius * 2) / 2;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Profile</Text>
          <TouchableOpacity>
            <Text style={styles.previewLink}>Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.avatarGradient}>
                <Text style={styles.avatarEmoji}>🍕</Text>
              </LinearGradient>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.cameraGradient}>
                <CameraIcon />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.businessName}>{businessName}</Text>
          <Text style={styles.businessMeta}>Downtown District • Italian Food</Text>
        </View>

        {/* AI Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Performance</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE UPDATES</Text>
            </View>
          </View>
          <View style={styles.aiCard}>
            <View style={styles.aiTopRow}>
              <View>
                <Text style={styles.aiLabel}>BOT SUCCESS RATE</Text>
                <Text style={styles.aiRate}>94.2%</Text>
              </View>
              <View style={styles.robotIconContainer}>
                <RobotIcon />
              </View>
            </View>
            <View style={styles.aiStatsRow}>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>Automated Orders</Text>
                <Text style={styles.aiStatValue}>1,284</Text>
              </View>
              <View style={styles.aiStatDivider} />
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>Manual Pickups</Text>
                <Text style={styles.aiStatValue}>42</Text>
              </View>
            </View>
            <View style={styles.aiInfoBar}>
              <BoltIcon />
              <Text style={styles.aiInfoText}>AI handled 96% of customer queries today</Text>
            </View>
          </View>
        </View>

        {/* Delivery Radius */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Radius</Text>
            <Text style={styles.radiusValue}>{displayRadius} KM</Text>
          </View>
          <View style={styles.whiteCard}>
            <MapPlaceholder radius={displayRadius} />
            <DeliverySlider value={displayRadius} onChange={setRadius} />
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          <View style={styles.whiteCard}>
            {schedule.map((day, idx) => (
              <View key={day.day}>
                <View style={styles.scheduleRow}>
                  <Text style={[styles.dayLabel, !day.enabled && styles.dayLabelDisabled]}>{day.day}</Text>
                  {day.enabled ? (
                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>{day.open}</Text>
                      <Text style={styles.timeDash}>–</Text>
                      <Text style={styles.timeText}>{day.close}</Text>
                    </View>
                  ) : (
                    <Text style={styles.closedNote}>{day.note || 'Closed'}</Text>
                  )}
                  <Switch
                    value={day.enabled}
                    onValueChange={(val) => toggleDay(idx, val)}
                    trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E5E7EB"
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
                {idx < schedule.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Business Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.whiteCard}>
            <Text style={styles.fieldLabel}>BUSINESS NAME</Text>
            <TextInput style={styles.fieldInput} value={businessName} onChangeText={setBusinessName} />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>SUPPORT EMAIL</Text>
            <TextInput style={styles.fieldInput} value={supportEmail} onChangeText={setSupportEmail} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.fieldDivider} />
            <Text style={styles.fieldLabel}>MINIMUM ORDER (€)</Text>
            <TextInput style={styles.fieldInput} value={minOrder} onChangeText={setMinOrder} keyboardType="decimal-pad" />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.75}>
            <LogoutIcon />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity activeOpacity={0.85} style={styles.saveWrapper}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <SaveIcon />
            <Text style={styles.saveButtonText}>Save All Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ✅ BottomNavBar unificado */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F7F2' },
  scrollContent: { paddingBottom: 160 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  previewLink: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
  avatarSection: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, overflow: 'hidden',
    borderWidth: 3, borderColor: '#DCFCE7',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 38 },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF' },
  cameraGradient: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  businessName: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  businessMeta: { fontSize: 13, color: '#9CA3AF' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#16a34a', letterSpacing: 0.5 },
  aiCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#DCFCE7', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  aiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  aiLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 4 },
  aiRate: { fontSize: 38, fontWeight: '800', color: '#111827', letterSpacing: -1 },
  robotIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  aiStatsRow: { flexDirection: 'row', marginBottom: 14 },
  aiStat: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  aiStatDivider: { width: 8 },
  aiStatLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  aiStatValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  aiInfoBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  aiInfoText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
  radiusValue: { fontSize: 16, fontWeight: '800', color: '#22c55e', marginBottom: 12 },
  whiteCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dayLabel: { width: 38, fontSize: 13, fontWeight: '800', color: '#22c55e', letterSpacing: 0.3 },
  dayLabelDisabled: { color: '#9CA3AF' },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  timeDash: { fontSize: 14, color: '#9CA3AF' },
  closedNote: { flex: 1, fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  rowDivider: { height: 1, backgroundColor: '#F3F4F6' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 },
  fieldInput: { fontSize: 15, color: '#111827', paddingVertical: 0 },
  fieldDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  saveContainer: { position: 'absolute', bottom: 80, left: 20, right: 20, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  saveWrapper: { borderRadius: 30, overflow: 'hidden' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 16, paddingVertical: 16 },
  logoutButtonText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
});