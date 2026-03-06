import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  StatusBar, ScrollView, TextInput, Alert, Animated, Dimensions,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/StacNavigation';
import { useDomicilioForm } from '../../application/hooks/useDomicilioForm';
import { ETIQUETAS } from '../../domain/entities/Domicilio';
import type { Domicilio, Coordenadas } from '../../domain/entities/Domicilio';

// ⚠️  Agrega esto en RootStackParamList de StacNavigation.tsx:
//   AddAddress: { domicilio?: Domicilio } | undefined;

type Nav   = NativeStackNavigationProp<RootStackParamList, 'AddAddress'>;
type Route = RouteProp<{ AddAddress: { domicilio?: Domicilio } }, 'AddAddress'>;
type Props = { navigation: Nav; route: Route };

const { height } = Dimensions.get('window');
const MAP_HEIGHT  = height * 0.42;

const DEFAULT_REGION = {
  latitude: 19.9894, longitude: -102.2838,   // Zamora de Hidalgo
  latitudeDelta: 0.08, longitudeDelta: 0.08,
};

// ─── ICONS (idénticos a los tuyos) ───────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
const TargetIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="3" />
    <Path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
  </Svg>
);
const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

// ─── CUSTOM MAP PIN (idéntico al tuyo) ───────────────────────────────────────

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

export default function AddAddress({ navigation, route }: Props) {
  const domicilioExistente = route.params?.domicilio;
  const esEdicion          = !!domicilioExistente;

  const {
    form, errors, isLoading,
    setField, onMapPinDrop, submit,
  } = useDomicilioForm(domicilioExistente);

  const mapRef = useRef<MapView>(null);
  const [markerCoord, setMarkerCoord] = useState({
    latitude:  domicilioExistente?.coordenadas?.latitud  ?? DEFAULT_REGION.latitude,
    longitude: domicilioExistente?.coordenadas?.longitud ?? DEFAULT_REGION.longitude,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(formAnim,  { toValue: 1, duration: 350, delay: 80, useNativeDriver: true }),
    ]).start();

    // Modo edición: centrar mapa en coords existentes
    if (domicilioExistente?.coordenadas) {
      const { latitud, longitud } = domicilioExistente.coordenadas;
      setTimeout(() => {
        mapRef.current?.animateToRegion({
          latitude: latitud, longitude: longitud,
          latitudeDelta: 0.01, longitudeDelta: 0.01,
        }, 600);
      }, 500);
    }
  }, []);

  // ── Soltar pin en el mapa ─────────────────────────────────────────────────

  const handleMapPress = useCallback(async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkerCoord({ latitude, longitude });
    onMapPinDrop({ latitud: latitude, longitud: longitude });

    // Geocoding inverso para rellenar la calle automáticamente
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const parts = [geo.street, geo.streetNumber].filter(Boolean);
        if (parts.length > 0) setField('calle', parts.join(' ').trim());
        if (geo.district || geo.subregion) setField('colonia', (geo.district ?? geo.subregion)!);
        if (geo.city)    setField('ciudad', geo.city);
        if (geo.region)  setField('estado', geo.region);
        if (geo.postalCode) setField('codigoPostal', geo.postalCode);
      }
    } catch {}
  }, [onMapPinDrop, setField]);

  // ── Usar ubicación actual ─────────────────────────────────────────────────

  const handleCurrentLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      const coords: Coordenadas = { latitud: latitude, longitud: longitude };
      setMarkerCoord({ latitude, longitude });
      onMapPinDrop(coords);
      mapRef.current?.animateToRegion({
        latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 600);

      // Geocoding inverso
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const parts = [geo.street, geo.streetNumber].filter(Boolean);
        if (parts.length > 0) setField('calle', parts.join(' ').trim());
        if (geo.district || geo.subregion) setField('colonia', (geo.district ?? geo.subregion)!);
        if (geo.city)       setField('ciudad',       geo.city);
        if (geo.region)     setField('estado',       geo.region);
        if (geo.postalCode) setField('codigoPostal', geo.postalCode);
      }
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLoadingLocation(false);
    }
  }, [onMapPinDrop, setField]);

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      Alert.alert('✓ Guardado', 'Tu dirección fue guardada correctamente.', [
        { text: 'OK', onPress: () => navigation.navigate('DeliveryAddresses') },
      ]);
    }
  }, [submit, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── HEADER ──────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, {
          opacity: slideAnim,
          transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {esEdicion ? 'Editar Dirección' : 'Añadir Dirección'}
          </Text>
          <View style={{ width: 42 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* ── MAPA ────────────────────────────────────────────────── */}
          <Animated.View style={[styles.mapWrapper, {
            opacity: slideAnim,
            transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }],
          }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              customMapStyle={mapStyle}
            >
              <Marker coordinate={markerCoord} anchor={{ x: 0.5, y: 1 }}>
                <MapPin />
              </Marker>
            </MapView>

            {/* Botón ubicación actual */}
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleCurrentLocation}
              activeOpacity={0.85}
              disabled={loadingLocation}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.locationBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <TargetIcon />
                <Text style={styles.locationBtnText}>
                  {loadingLocation ? 'Obteniendo...' : 'Ubicación actual'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* ── FORMULARIO ──────────────────────────────────────────── */}
          <Animated.View style={[styles.formContainer, {
            opacity: formAnim,
            transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }]}>

            {/* Tipo / Etiqueta */}
            <Text style={styles.fieldLabel}>Guardar como:</Text>
            <View style={styles.typeRow}>
              {ETIQUETAS.map((etiqueta) => {
                const active = form.etiqueta === etiqueta;
                return (
                  <TouchableOpacity
                    key={etiqueta}
                    style={[styles.typeChip, active && styles.typeChipActive]}
                    onPress={() => setField('etiqueta', etiqueta)}
                    activeOpacity={0.8}
                  >
                    {active ? (
                      <LinearGradient
                        colors={['#22c55e', '#16a34a']}
                        style={styles.typeChipGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      >
                        <Text style={[styles.typeChipText, styles.typeChipTextActive]}>
                          {etiqueta === 'Casa' ? '🏠' : etiqueta === 'Trabajo' ? '💼' : etiqueta === 'Gym' ? '🏋️' : '📍'} {etiqueta}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.typeChipInner}>
                        <Text style={styles.typeChipText}>
                          {etiqueta === 'Casa' ? '🏠' : etiqueta === 'Trabajo' ? '💼' : etiqueta === 'Gym' ? '🏋️' : '📍'} {etiqueta}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Calle */}
            <Text style={styles.fieldLabel}>
              Calle <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, !!errors.calle && styles.inputError]}
              value={form.calle}
              onChangeText={v => setField('calle', v)}
              placeholder="Av. Insurgentes Sur #1234"
              placeholderTextColor="#94a3b8"
            />
            {!!errors.calle && <Text style={styles.errorText}>{errors.calle}</Text>}

            {/* Número ext / int */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Núm. Exterior</Text>
                <TextInput
                  style={styles.input}
                  value={form.numeroExt}
                  onChangeText={v => setField('numeroExt', v)}
                  placeholder="123"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Núm. Interior <Text style={styles.optional}>(Opcional)</Text></Text>
                <TextInput
                  style={styles.input}
                  value={form.numeroInt}
                  onChangeText={v => setField('numeroInt', v)}
                  placeholder="Depto. 4"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Colonia */}
            <Text style={styles.fieldLabel}>Colonia</Text>
            <TextInput
              style={styles.input}
              value={form.colonia}
              onChangeText={v => setField('colonia', v)}
              placeholder="Centro"
              placeholderTextColor="#94a3b8"
            />

            {/* Ciudad / Estado */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>
                  Ciudad <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, !!errors.ciudad && styles.inputError]}
                  value={form.ciudad}
                  onChangeText={v => setField('ciudad', v)}
                  placeholder="Zamora"
                  placeholderTextColor="#94a3b8"
                />
                {!!errors.ciudad && <Text style={styles.errorText}>{errors.ciudad}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Estado</Text>
                <TextInput
                  style={styles.input}
                  value={form.estado}
                  onChangeText={v => setField('estado', v)}
                  placeholder="Michoacán"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* CP / País */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Código Postal</Text>
                <TextInput
                  style={styles.input}
                  value={form.codigoPostal}
                  onChangeText={v => setField('codigoPostal', v)}
                  placeholder="59600"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>País</Text>
                <TextInput
                  style={styles.input}
                  value={form.pais}
                  onChangeText={v => setField('pais', v)}
                  placeholder="MX"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            {/* Referencias */}
            <Text style={styles.fieldLabel}>
              Instrucciones de entrega <Text style={styles.optional}>(Opcional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.referencias}
              onChangeText={v => setField('referencias', v)}
              placeholder="Portón blanco, tocar timbre fuerte..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Predeterminado */}
            <View style={styles.defaultToggleRow}>
              <View>
                <Text style={styles.defaultToggleTitle}>Establecer como predeterminada</Text>
                <Text style={styles.defaultToggleSub}>Se usará automáticamente al ordenar</Text>
              </View>
              <Switch
                value={form.esPredeterminado}
                onValueChange={v => setField('esPredeterminado', v)}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={form.esPredeterminado ? '#22c55e' : '#fff'}
              />
            </View>

            <View style={{ height: 16 }} />

            {/* Botón guardar */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.saveBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <SaveIcon />
                <Text style={styles.saveBtnText}>
                  {isLoading
                    ? (esEdicion ? 'Guardando...' : 'Agregando...')
                    : (esEdicion ? 'Guardar cambios' : 'Guardar Dirección')
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES (idénticos a los tuyos + ajustes de layout) ──────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: 0.1 },

  mapWrapper: { width: '100%', height: MAP_HEIGHT, position: 'relative', overflow: 'hidden' },
  map:        { ...StyleSheet.absoluteFillObject },

  mapPinContainer: { alignItems: 'center' },
  mapPinBubble: {
    backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginBottom: 4,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  mapPinText:   { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
  mapPinDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#22c55e',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  mapPinShadow: {
    width: 10, height: 4, borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.15)', marginTop: 2,
  },

  locationBtn: {
    position: 'absolute', bottom: 18, alignSelf: 'center',
    borderRadius: 28, overflow: 'hidden',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  locationBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 22, paddingVertical: 14,
  },
  locationBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },

  formContainer: { paddingHorizontal: 22, paddingTop: 26 },

  fieldLabel: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 10, marginTop: 20 },
  optional:   { fontSize: 13, fontWeight: '400', color: '#94a3b8' },
  required:   { color: '#ef4444' },
  errorText:  { color: '#ef4444', fontSize: 12, marginTop: 4 },

  row: { flexDirection: 'row', gap: 12 },

  input: {
    backgroundColor: '#f8fafc', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 15, color: '#0f172a',
    borderWidth: 1.5, borderColor: '#e2e8f0', fontWeight: '500',
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top', paddingTop: 14 },
  inputError: { borderColor: '#ef4444' },

  typeRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: {
    borderRadius: 50, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
  },
  typeChipActive: {
    borderColor: 'transparent',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  typeChipGrad:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12 },
  typeChipInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 12 },
  typeChipText:       { fontSize: 14, fontWeight: '700', color: '#475569' },
  typeChipTextActive: { color: '#fff' },

  defaultToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginTop: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  defaultToggleTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  defaultToggleSub:   { fontSize: 12, color: '#94a3b8' },

  saveBtn: {
    marginTop: 32, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  saveBtnText: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
});

// ─── CUSTOM MAP STYLE  ─────────────────────────────────────

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