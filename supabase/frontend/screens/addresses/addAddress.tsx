import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path, Circle, Line, Rect, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddAddress'>;
type Props = { navigation: Nav };

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.42;

// ─── ICONS ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const SearchIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

const TargetIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </Svg>
);

const HomeIcon = ({ active }: { active: boolean }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#22c55e'} strokeWidth="2">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <Path d="M9 21V12h6v9" />
  </Svg>
);

const WorkIcon = ({ active }: { active: boolean }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2">
    <Rect x="2" y="7" width="20" height="15" rx="2" />
    <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </Svg>
);

const PinIcon = ({ active }: { active: boolean }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#64748b'} strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

// ─── TYPES ───────────────────────────────────────────────────────────────────

type AddressType = 'home' | 'work' | 'other';

interface Address {
  id: string;
  type: AddressType;
  label: string;
  street: string;
  interior?: string;
  instructions?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

const TYPE_CONFIG: Record<AddressType, { label: string; icon: (active: boolean) => React.ReactNode }> = {
  home:  { label: 'Casa',    icon: (a) => <HomeIcon active={a} /> },
  work:  { label: 'Trabajo', icon: (a) => <WorkIcon active={a} /> },
  other: { label: 'Otro',    icon: (a) => <PinIcon  active={a} /> },
};

const DEFAULT_REGION = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// ─── CUSTOM MAP PIN ───────────────────────────────────────────────────────────

const MapPin = () => (
  <View style={styles.mapPinContainer}>
    <View style={styles.mapPinBubble}>
      <Text style={styles.mapPinText}>Tu entrega aquí</Text>
    </View>
    <View style={styles.mapPinDot} />
    <View style={styles.mapPinShadow} />
  </View>
);

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function AddAddress({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [markerCoord, setMarkerCoord] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [street, setStreet]           = useState('');
  const [interior, setInterior]       = useState('');
  const [instructions, setInstructions] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [saving, setSaving]           = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(formAnim,  { toValue: 1, duration: 350, delay: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Get current location ──────────────────────────────────────────────────
  const handleCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para esta función.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(newRegion);
      setMarkerCoord({ latitude, longitude });
      mapRef.current?.animateToRegion(newRegion, 600);

      // Reverse geocode
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const parts = [geo.street, geo.streetNumber, geo.district].filter(Boolean);
        setStreet(parts.join(' ').trim());
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLoadingLocation(false);
    }
  };

  // ── Map drag → update marker ──────────────────────────────────────────────
  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });

    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const parts = [geo.street, geo.streetNumber, geo.district].filter(Boolean);
        setStreet(parts.join(' ').trim());
      }
    } catch {}
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!street.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa o selecciona una dirección en el mapa.');
      return;
    }
    setSaving(true);
    try {
      const stored = await AsyncStorage.getItem('deliveryAddresses');
      const existing: Address[] = stored ? JSON.parse(stored) : [];

      const newAddress: Address = {
        id: Date.now().toString(),
        type: addressType,
        label: TYPE_CONFIG[addressType].label,
        street: street.trim(),
        interior: interior.trim() || undefined,
        instructions: instructions.trim() || undefined,
        latitude: markerCoord.latitude,
        longitude: markerCoord.longitude,
        isDefault: existing.length === 0,
      };

      await AsyncStorage.setItem('deliveryAddresses', JSON.stringify([...existing, newAddress]));
      Alert.alert('✓ Guardado', 'Tu dirección fue guardada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la dirección.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── HEADER ────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.header, {
            opacity: slideAnim,
            transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Añadir Dirección</Text>
          <View style={{ width: 42 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* ── MAP ───────────────────────────────────────────────── */}
          <Animated.View
            style={[styles.mapWrapper, {
              opacity: slideAnim,
              transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
            }]}
          >
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              customMapStyle={mapStyle}
            >
              <Marker coordinate={markerCoord} anchor={{ x: 0.5, y: 1 }}>
                <MapPin />
              </Marker>
            </MapView>

            {/* Current location button */}
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleCurrentLocation}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.locationBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <TargetIcon />
                <Text style={styles.locationBtnText}>
                  {loadingLocation ? 'Obteniendo...' : 'Ubicación actual'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── FORM ──────────────────────────────────────────────── */}
          <Animated.View
            style={[styles.formContainer, {
              opacity: formAnim,
              transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            }]}
          >
            {/* Dirección */}
            <Text style={styles.fieldLabel}>Dirección</Text>
            <View style={styles.searchInputWrap}>
              <View style={styles.searchIcon}>
                <SearchIcon />
              </View>
              <TextInput
                style={styles.searchInput}
                value={street}
                onChangeText={setStreet}
                placeholder="Buscar calle y número..."
                placeholderTextColor="#94a3b8"
                returnKeyType="done"
              />
            </View>

            {/* Interior */}
            <Text style={styles.fieldLabel}>Número Interior / Depto <Text style={styles.optional}>(Opcional)</Text></Text>
            <TextInput
              style={styles.input}
              value={interior}
              onChangeText={setInterior}
              placeholder="Ej: Apt 402, Int B"
              placeholderTextColor="#94a3b8"
              returnKeyType="done"
            />

            {/* Instrucciones */}
            <Text style={styles.fieldLabel}>Instrucciones de entrega</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Ej: Portón blanco, tocar timbre fuerte..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
            />

            {/* Guardar como */}
            <Text style={styles.fieldLabel}>Guardar como:</Text>
            <View style={styles.typeRow}>
              {(Object.keys(TYPE_CONFIG) as AddressType[]).map((t) => {
                const active = addressType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setAddressType(t)}
                    activeOpacity={0.8}
                  >
                    {active ? (
                      <LinearGradient
                        colors={['#22c55e', '#16a34a']}
                        style={styles.typeChipGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {TYPE_CONFIG[t].icon(true)}
                        <Text style={[styles.typeChipText, styles.typeChipTextActive]}>
                          {TYPE_CONFIG[t].label}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.typeChipInner}>
                        {TYPE_CONFIG[t].icon(false)}
                        <Text style={styles.typeChipText}>{TYPE_CONFIG[t].label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.88}
              disabled={saving}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.saveBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <SaveIcon />
                <Text style={styles.saveBtnText}>
                  {saving ? 'Guardando...' : 'Guardar Dirección'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.1,
  },

  // Map
  mapWrapper: {
    width: '100%',
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Map custom pin
  mapPinContainer: {
    alignItems: 'center',
  },
  mapPinBubble: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  mapPinText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  mapPinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  mapPinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: 2,
  },

  // Location button
  locationBtn: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  locationBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  locationBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Form
  formContainer: {
    paddingHorizontal: 22,
    paddingTop: 26,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
    marginTop: 20,
  },
  optional: {
    fontSize: 13,
    fontWeight: '400',
    color: '#94a3b8',
  },

  // Search input
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 15,
    fontWeight: '500',
  },

  // Regular input
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    fontWeight: '500',
  },
  inputMulti: {
    minHeight: 88,
    paddingTop: 14,
  },

  // Type chips
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeChipActive: {
    borderColor: 'transparent',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  typeChipGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  typeChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#fff',
  },

  // Save button
  saveBtn: {
    marginTop: 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

// ─── CUSTOM MAP STYLE (clean, minimal) ───────────────────────────────────────

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d8f0d8' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#e0e0e0' }] },
];