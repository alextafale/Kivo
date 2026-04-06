import React, { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TouchableOpacity, Image, ActivityIndicator,
  Animated, Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'
import { useDriverPhoto } from '../../../application/hooks/useDriverPhoto'
import { RepartidorRepositoryImpl } from '../../../infraestructure/repositories/RepartidorRepositoryImpl'
import type { RepartidorInfo } from '../../../domain/ports/repositories/lRepartidorRepository'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverProfile'>
  route: { params: { repartidor: RepartidorInfo } }
}

const repartidorRepo = new RepartidorRepositoryImpl()

// ─── Icons ────────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)
const CameraIcon = () => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
)
const StarIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="#FBBF24" stroke="#FBBF24" strokeWidth="1">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
)
const BikeIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 0 0 0-2h-3l-3 9" />
    <Path d="M9 15h6l1.5-6H7.5" />
  </Svg>
)
const PackageIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <Path d="M12 22V12" />
  </Svg>
)
const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
)

const ESTADO_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  offline:   { label: 'Offline',    color: '#6B7280', bg: '#F3F4F6' },
  available: { label: 'Disponible', color: '#16a34a', bg: '#DCFCE7' },
  busy:      { label: 'Ocupado',    color: '#D97706', bg: '#FEF3C7' },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DriverProfile({ navigation, route }: Props) {
  console.log("Estas en DriverProfile")
  const { session, logout } = useAuth()
  const { isUploading, pickAndUpload } = useDriverPhoto()

  // Toma el repartidor que pasó el Dashboard como parámetro de navegación
  const [repartidor, setRepartidor] = useState<RepartidorInfo>(route.params.repartidor)
  const [fotoUri, setFotoUri]       = useState<string | null>(repartidor.foto_url ?? null)

  const headerAnim = useRef(new Animated.Value(0)).current
  const cardAnim   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(cardAnim,   { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start()
  }, [])

  // Maneja la selección y subida de foto
  const handlePickPhoto = () => {
    pickAndUpload(repartidor, (url) => setFotoUri(url))
  }

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await logout()
          navigation.reset({ index: 0, routes: [{ name: 'LoginDriver' }] })
        },
      },
    ])
  }

  const estadoConf    = ESTADO_LABEL[repartidor.estado] ?? ESTADO_LABEL.offline
  const vehiculoLabel = repartidor.vehiculo
    ? repartidor.vehiculo.charAt(0).toUpperCase() + repartidor.vehiculo.slice(1)
    : '—'

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.topHeader, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Mi Perfil</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* ── AVATAR HERO ─────────────────────────────────────────────────── */}
        <Animated.View style={[styles.heroSection, {
          opacity: cardAnim,
          transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        }]}>
          {/* Foto de perfil */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.avatar} />
              ) : (
                // Placeholder con inicial del email si no hay foto
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {session?.email?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </LinearGradient>
              )}
            </View>

            {/* Botón de cámara */}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handlePickPhoto}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              {isUploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <CameraIcon />
              }
            </TouchableOpacity>
          </View>

          <Text style={styles.heroEmail}>{session?.email ?? '—'}</Text>

          {/* Pill de estado */}
          <View style={[styles.estadoPill, { backgroundColor: estadoConf.bg }]}>
            <View style={[styles.estadoDot, { backgroundColor: estadoConf.color }]} />
            <Text style={[styles.estadoPillText, { color: estadoConf.color }]}>
              {estadoConf.label}
            </Text>
          </View>
        </Animated.View>

        {/* ── ESTADÍSTICAS ─────────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardAnim }}>
          <Text style={styles.sectionLabel}>ESTADÍSTICAS</Text>
          <View style={styles.statsRow}>

            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <PackageIcon />
              </View>
              <Text style={styles.statValue}>{repartidor.total_entregas}</Text>
              <Text style={styles.statLabel}>Entregas</Text>
            </View>

            <View style={[styles.statCard, styles.statCardHighlight]}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <StarIcon />
              </View>
              <Text style={styles.statValue}>
                {repartidor.calificacion?.toFixed(1) ?? '—'}
              </Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <BikeIcon />
              </View>
              <Text style={styles.statValue}>{vehiculoLabel}</Text>
              <Text style={styles.statLabel}>Vehículo</Text>
            </View>

          </View>
        </Animated.View>

        {/* ── INFO DE CUENTA ───────────────────────────────────────────────── */}
        <Animated.View style={{ opacity: cardAnim }}>
          <Text style={styles.sectionLabel}>CUENTA</Text>
          <View style={styles.card}>

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="m2 7 10 7 10-7" />
                </Svg>
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Correo</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{session?.email ?? '—'}</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <BikeIcon />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Vehículo</Text>
                <Text style={styles.infoValue}>{vehiculoLabel}</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <PackageIcon />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>Total de entregas</Text>
                <Text style={styles.infoValue}>{repartidor.total_entregas}</Text>
              </View>
            </View>

          </View>
        </Animated.View>

        {/* ── CERRAR SESIÓN ────────────────────────────────────────────────── */}
        <View style={styles.sectionPadded}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogoutIcon />
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Pidelo Delivery  •  v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#f0fdf4' },

  // Header
  topHeader:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn:             { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  topHeaderTitle:      { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },

  // Hero
  heroSection:         { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatarWrapper:       { position: 'relative', marginBottom: 14 },
  avatarRing:          { width: 116, height: 116, borderRadius: 58, borderWidth: 3, borderColor: '#22c55e', padding: 3, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  avatar:              { width: '100%', height: '100%', borderRadius: 54 },
  avatarPlaceholder:   { width: '100%', height: '100%', borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:       { fontSize: 40, fontWeight: '800', color: '#fff' },
  cameraBtn:           { position: 'absolute', bottom: 2, right: 2, width: 34, height: 34, borderRadius: 17, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#f0fdf4' },
  heroEmail:           { fontSize: 15, color: '#64748b', fontWeight: '500', marginBottom: 10 },
  estadoPill:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  estadoDot:           { width: 7, height: 7, borderRadius: 4 },
  estadoPillText:      { fontSize: 13, fontWeight: '600' },

  // Stats
  sectionLabel:        { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 10, marginTop: 20, paddingHorizontal: 20 },
  statsRow:            { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
  statCard:            { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statCardHighlight:   { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  statIconWrap:        { width: 38, height: 38, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  statValue:           { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel:           { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  // Card info
  card:                { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  rowDivider:          { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  infoRow:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  infoIconWrap:        { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoTextBlock:       { flex: 1 },
  infoLabel:           { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  infoValue:           { fontSize: 15, color: '#0f172a', fontWeight: '600' },

  // Logout
  sectionPadded:       { marginTop: 20, paddingHorizontal: 20 },
  signOutBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff5f5', borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#fee2e2' },
  signOutText:         { fontSize: 15, fontWeight: '700', color: '#ef4444' },

  versionText:         { textAlign: 'center', marginTop: 24, fontSize: 11, color: '#cbd5e1', letterSpacing: 0.4 },
})

// Necesita que Rect esté importado para el ícono de email
import { Rect } from 'react-native-svg'