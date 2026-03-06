// components/addresses/MapPicker.tsx
// Pin draggable + botón "Mi ubicación" usando expo-location
// Instalar: expo install react-native-maps expo-location

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet,
} from 'react-native'
import MapView, { Marker, type Region, type MapPressEvent } from 'react-native-maps'
import * as Location from 'expo-location'
import type { Coordenadas } from '../../domain/entities/Domicilio'

type Props = {
  coordenadas?: Coordenadas | null
  onPinDrop:    (coords: Coordenadas) => void
  height?:      number
}

// Zamora de Hidalgo como región inicial por defecto
const FALLBACK: Coordenadas = { latitud: 19.9894, longitud: -102.2838 }
const DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 }

export const MapPicker = ({ coordenadas, onPinDrop, height = 260 }: Props) => {
  const mapRef                        = useRef<MapView>(null)
  const [pin,       setPin]           = useState<Coordenadas | null>(coordenadas ?? null)
  const [locating,  setLocating]      = useState(false)
  const [permError, setPermError]     = useState(false)

  // Modo edición: centrar en coords existentes
  useEffect(() => {
    if (coordenadas) {
      mapRef.current?.animateToRegion({
        latitude:  coordenadas.latitud,
        longitude: coordenadas.longitud,
        ...DELTA,
      })
    }
  }, [])

  const dropPin = useCallback((coords: Coordenadas) => {
    setPin(coords)
    onPinDrop(coords)
  }, [onPinDrop])

  const handleMapPress = useCallback((e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    dropPin({ latitud: latitude, longitud: longitude })
  }, [dropPin])

  const handleMyLocation = useCallback(async () => {
    setLocating(true)
    setPermError(false)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setPermError(true); return }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const coords: Coordenadas = {
        latitud:  loc.coords.latitude,
        longitud: loc.coords.longitude,
      }
      dropPin(coords)
      mapRef.current?.animateToRegion({
        latitude:  coords.latitud,
        longitude: coords.longitud,
        ...DELTA,
      })
    } catch {
      setPermError(true)
    } finally {
      setLocating(false)
    }
  }, [dropPin])

  const initialRegion: Region = {
    latitude:  coordenadas?.latitud  ?? FALLBACK.latitud,
    longitude: coordenadas?.longitud ?? FALLBACK.longitud,
    ...DELTA,
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pin && (
          <Marker
            coordinate={{ latitude: pin.latitud, longitude: pin.longitud }}
            draggable
            pinColor="#FF6B35"
            onDragEnd={e => {
              const { latitude, longitude } = e.nativeEvent.coordinate
              dropPin({ latitud: latitude, longitud: longitude })
            }}
          />
        )}
      </MapView>

      {/* Botón mi ubicación */}
      <Pressable style={styles.myLocBtn} onPress={handleMyLocation} disabled={locating}>
        {locating
          ? <ActivityIndicator size="small" color="#FF6B35" />
          : <Text style={styles.myLocText}>📍 Mi ubicación</Text>
        }
      </Pressable>

      {/* Hint si no hay pin */}
      {!pin && (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Toca el mapa para colocar el pin</Text>
        </View>
      )}

      {/* Coordenadas actuales */}
      {pin && (
        <View style={styles.coordsBadge}>
          <Text style={styles.coordsText}>
            {pin.latitud.toFixed(5)}, {pin.longitud.toFixed(5)}
          </Text>
        </View>
      )}

      {/* Error de permisos */}
      {permError && (
        <View style={styles.permError}>
          <Text style={styles.permErrorText}>
            Sin permiso de ubicación. Toca el mapa manualmente.
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden' },

  myLocBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#FFF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
    minWidth: 44, alignItems: 'center',
  },
  myLocText: { fontSize: 13, fontWeight: '600', color: '#FF6B35' },

  hint: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  hintText: { color: '#FFF', fontSize: 12 },

  coordsBadge: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    backgroundColor: 'rgba(255,107,53,0.9)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  coordsText: { color: '#FFF', fontSize: 11, fontWeight: '600' },

  permError: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8,
  },
  permErrorText: { color: '#DC2626', fontSize: 12, textAlign: 'center' },
})