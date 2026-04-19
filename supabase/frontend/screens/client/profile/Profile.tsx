import React, { useRef, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Image, Modal, TextInput,
  Alert, Animated, Dimensions, KeyboardAvoidingView, Platform,
  ActivityIndicator, Switch,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'
import { useProfile } from '../../../application/hooks/useProfile'
import { useTheme } from '../../../application/context/ThemeContext'

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'> }
const { width } = Dimensions.get('window')

// ─── Icons ────────────────────────────────────────────────────────────────────
const EditPenIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
)
const EmailIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="m2 7 10 7 10-7" />
  </Svg>
)
const PhoneIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
)
const ChevronRightIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
)
const SignOutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
)
const CloseIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
    <Line x1="18" y1="6" x2="6" y2="18" /><Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
)

// ─── Component ──────────────────────────────────────────────────────────────
export default function Profile({ navigation }: Props) {
  console.log("-> Renderizando Profile de Cliente (con toggle theme)")
  const { session, logout } = useAuth()
  const { profile, isLoading, updateProfile, uploadProfileAvatar } = useProfile()
  const { isDark, toggleTheme, colors } = useTheme()
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  const [alergias, setAlergias] = useState('');

  // Estados visuales y de UI
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editField, setEditField] = useState<'nombre' | 'apellido' | 'telefono' | 'alergias' | null>(null)
  const [editValue, setEditValue] = useState('')

  const headerAnim = useRef(new Animated.Value(0)).current
  const cardAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()

    AsyncStorage.getItem('KIVO_ALERGIAS').then(val => {
      if (val) setAlergias(val);
    })
  }, [])

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar tu foto.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    const mimeType = asset.mimeType ?? 'image/jpeg'

    setIsUploadingPhoto(true)
    try {
      await uploadProfileAvatar(asset.uri, mimeType)
    } catch (error: any) {
      console.error("[Profile.tsx] Falló al subir foto:", error?.message || error)
      Alert.alert('Error', 'No se pudo actualizar tu foto de perfil')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const openEdit = (field: 'nombre' | 'apellido' | 'telefono' | 'alergias', currentValue: string) => {
    setEditField(field)
    setEditValue(currentValue)
    setEditModalVisible(true)
  }

  const handleSave = async () => {
    if (!editField) return;
    
    // Si editField no requiere backend (o está vacío)
    if (editField === 'alergias') {
      try {
        await AsyncStorage.setItem('KIVO_ALERGIAS', editValue.trim())
        setAlergias(editValue.trim())
        setEditModalVisible(false)
        Alert.alert('✓ Actualizado', 'Información dietética guardada.')
        return
      } catch (e: any) {
        Alert.alert('Error', 'No se pudieron guardar las alergias')
        return
      }
    }

    if (!editValue.trim()) return;

    try {
      await updateProfile({ [editField]: editValue.trim() })   // ← PATCH /me real
      setEditModalVisible(false)
      Alert.alert('✓ Actualizado', 'Tu información fue guardada correctamente.')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar')
    }
  }

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await logout()                                        // ← logout real
          navigation.reset({ index: 0, routes: [{ name: 'AccountTypeSelection' }] })
        },
      },
    ])
  }

  const fieldLabels = { nombre: 'Nombre', apellido: 'Apellido', telefono: 'Teléfono', alergias: 'Alergias/Restricciones' }

  // Nombre para mostrar en el hero
  const displayName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || session?.email || '—'

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.pageBg} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── TOP HEADER ────────────────────────────────────── */}
          <Animated.View style={[styles.topHeader, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.backBtnBg }]}>
              <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.titleText} strokeWidth="2.5">
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
            <Text style={[styles.topHeaderTitle, { color: colors.titleText }]}>Mi Perfil</Text>
            <View style={{ width: 40 }} />
          </Animated.View>

          {/* ── LOADING STATE ───────────────────────────────────── */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          )}

          {/* ── PROFILE HERO ────────────────────────────────────── */}
          {!isLoading && (
            <Animated.View style={{
              opacity: cardAnim,
              transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
            }}>
              <View style={styles.heroSection}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarRing}>
                    <Image
                      source={
                        profile?.avatar_url
                          ? { uri: profile.avatar_url }
                          : { uri: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=22c55e&color=fff' }
                      }
                      style={styles.avatar}
                    />
                    {isUploadingPhoto && (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 52, justifyContent: 'center', alignItems: 'center' }]}>
                        <ActivityIndicator color="#fff" />
                      </View>
                    )}
                  </View>
                  <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage} disabled={isUploadingPhoto}>
                    <EditPenIcon />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.heroName, { color: colors.titleText }]}>{displayName}</Text>
                <Text style={[styles.heroSub, { color: colors.subtitleText }]}>{session?.email}</Text>
              </View>
            </Animated.View>
          )}

          {/* ── INFORMACIÓN PERSONAL ────────────────────────── */}
          {!isLoading && profile && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionLabel, { color: colors.labelText }]}>INFORMACIÓN PERSONAL</Text>
              <View style={[styles.card, { backgroundColor: colors.cardBg }]}>

                {/* Nombre */}
                <TouchableOpacity style={styles.infoRow}
                  onPress={() => openEdit('nombre', profile.nombre ?? '')} activeOpacity={0.7}>
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.iconBg }]}><EmailIcon /></View>
                  <View style={styles.infoTextBlock}>
                    <Text style={[styles.infoLabel, { color: colors.labelText }]}>Nombre</Text>
                    <Text style={[styles.infoValue, { color: colors.titleText }]}>{profile.nombre || '—'}</Text>
                  </View>
                  <View style={styles.editBadge}><EditPenIcon /></View>
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: colors.rowDivider }]} />

                {/* Apellido */}
                <TouchableOpacity style={styles.infoRow}
                  onPress={() => openEdit('apellido', profile.apellido ?? '')} activeOpacity={0.7}>
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.iconBg }]}><EmailIcon /></View>
                  <View style={styles.infoTextBlock}>
                    <Text style={[styles.infoLabel, { color: colors.labelText }]}>Apellido</Text>
                    <Text style={[styles.infoValue, { color: colors.titleText }]}>{profile.apellido || '—'}</Text>
                  </View>
                  <View style={styles.editBadge}><EditPenIcon /></View>
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: colors.rowDivider }]} />

                {/* Teléfono */}
                <TouchableOpacity style={styles.infoRow}
                  onPress={() => openEdit('telefono', profile.telefono ?? '')} activeOpacity={0.7}>
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.iconBg }]}><PhoneIcon /></View>
                  <View style={styles.infoTextBlock}>
                    <Text style={[styles.infoLabel, { color: colors.labelText }]}>Teléfono</Text>
                    <Text style={[styles.infoValue, { color: colors.titleText }]}>{profile.telefono || '—'}</Text>
                  </View>
                  <View style={styles.editBadge}><EditPenIcon /></View>
                </TouchableOpacity>

                <View style={[styles.rowDivider, { backgroundColor: colors.rowDivider }]} />

                {/* Alergias / Dieta */}
                <TouchableOpacity style={styles.infoRow}
                  onPress={() => openEdit('alergias', alergias)} activeOpacity={0.7}>
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.iconBg }]}><Text style={{fontSize: 16}}>⚕️</Text></View>
                  <View style={styles.infoTextBlock}>
                    <Text style={[styles.infoLabel, { color: colors.labelText }]}>Alergias y Dieta IA</Text>
                    <Text style={[styles.infoValue, { color: colors.titleText }]}>{alergias || 'Sin restricciones'}</Text>
                  </View>
                  <View style={styles.editBadge}><EditPenIcon /></View>
                </TouchableOpacity>

              </View>
            </View>
          )}

          {/* ── ACCIONES RÁPIDAS ─────────────────────────────── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, { color: colors.labelText }]}>ACCIONES RÁPIDAS</Text>
            <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
              {[
                { title: 'Mis Pedidos', sub: 'Rastrea y reordena comidas', route: 'Orders' },
                { title: 'Direcciones', sub: 'Casa, oficina y más', route: 'DeliveryAddresses' },
                { title: 'Métodos de Pago', sub: 'Tarjetas guardadas', route: 'PaymentsMethod' },
                { title: 'Ayuda & Soporte', sub: 'Servicio al cliente 24/7', route: 'Chatbot' },
              ].map((item, i, arr) => (
                <View key={item.title}>
                  <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}
                    onPress={() => navigation.navigate(item.route as any)}>
                    <View style={styles.actionTextBlock}>
                      <Text style={[styles.actionTitle, { color: colors.titleText }]}>{item.title}</Text>
                      <Text style={[styles.actionSub, { color: colors.labelText }]}>{item.sub}</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={[styles.rowDivider, { backgroundColor: colors.rowDivider }]} />}
                </View>
              ))}

              {/* Separador antes del toggle */}
              <View style={[styles.rowDivider, { backgroundColor: colors.rowDivider }]} />

              {/* Toggle de Apariencia */}
              <View style={styles.actionRow}>
                <View style={styles.actionTextBlock}>
                  <Text style={[styles.actionTitle, { color: colors.titleText }]}>
                    {isDark ? ' Modo Oscuro' : ' Modo Claro'}
                  </Text>
                  <Text style={[styles.actionSub, { color: colors.labelText }]}>Cambiar apariencia de la app</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#CBD5E1', true: '#22c55e' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#CBD5E1"
                />
              </View>
            </View>
          </View>

          {/* ── CERRAR SESIÓN ────────────────────────────────────── */}
          <View style={[styles.sectionContainer, { marginTop: 8 }]}>
            <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.signOutBg, borderColor: colors.signOutBorder }]} onPress={handleLogout} activeOpacity={0.8}>
              <SignOutIcon />
              <Text style={styles.signOutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.versionText, { color: colors.labelText }]}>Pidelo Delivery App  •  v1.0.0</Text>
        </ScrollView>

        {/* ── EDIT MODAL ──────────────────────────────────────────── */}
        <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalSheet, { backgroundColor: colors.modalBg }]}>
                <View style={styles.modalHandle} />
                <View style={styles.modalHead}>
                  <Text style={[styles.modalTitle, { color: colors.titleText }]}>
                    Editar {fieldLabels[editField as keyof typeof fieldLabels] ?? editField}
                  </Text>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                    <CloseIcon />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: colors.modalInputBg, borderColor: colors.modalInputBorder, color: colors.titleText }]}
                    value={editValue}
                    onChangeText={setEditValue}
                    placeholder={`Ingresa tu ${(fieldLabels[editField as keyof typeof fieldLabels] ?? '').toLowerCase()}`}
                    placeholderTextColor="#94A3B8"
                    autoFocus
                    keyboardType={editField === 'telefono' ? 'phone-pad' : 'default'}
                  />
                </View>
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.cancelBtnBg }]} onPress={() => setEditModalVisible(false)}>
                    <Text style={[styles.cancelBtnText, { color: colors.subtitleText }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isLoading}>
                    <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveBtnGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Text style={styles.saveBtnText}>{isLoading ? 'Guardando...' : 'Guardar'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  topHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: 0.2 },
  heroSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatarRing: {
    width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: '#22c55e',
    padding: 3, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 52 },
  editAvatarBtn: {
    position: 'absolute', bottom: 2, right: 2, width: 32, height: 32,
    borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#f0fdf4',
  },
  heroName: { fontSize: 26, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  sectionContainer: { marginTop: 20, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  rowDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  infoIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  infoTextBlock: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  editBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  actionTextBlock: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  actionSub: { fontSize: 12, color: '#94a3b8' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff5f5', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  versionText: { textAlign: 'center', marginTop: 24, fontSize: 11, color: '#cbd5e1', letterSpacing: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20 },
  modalInput: {
    backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15,
    fontSize: 16, color: '#0f172a', borderWidth: 1.5, borderColor: '#e2e8f0', fontWeight: '500',
  },
  modalFooter: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  saveBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
})