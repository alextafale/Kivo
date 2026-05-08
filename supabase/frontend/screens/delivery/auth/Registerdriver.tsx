import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/StacNavigation'
import { useAuth } from '../../../application/context/AuthContext'
import { useTheme } from '../../../application/context/ThemeContext'
import TermsAndConditionsModal from '../../../components/ui/TermsAndConditionsModal'
import OAuthButtons from '../../../components/ui/OAuthButtons'
import { MaterialIcons } from '@expo/vector-icons'

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'RegisterDriver'> }

// ─── Icons ───────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)
const EmailIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Rect x="2" y="4" width="20" height="16" rx="2" /><Path d="m2 7 10 7 10-7" />
  </Svg>
)
const LockIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
)
const UserIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Circle cx="12" cy="8" r="4" /><Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </Svg>
)
const PhoneIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.04 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.99 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z" />
  </Svg>
)
const BikeIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Circle cx="5.5" cy="17.5" r="3.5" />
    <Circle cx="18.5" cy="17.5" r="3.5" />
    <Path d="M15 6a1 1 0 0 0 0-2h-3l-3 9" />
    <Path d="M9 15h6l1.5-6H7.5" />
  </Svg>
)
const CarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l4 4v4a2 2 0 0 1-2 2h-1" />
    <Circle cx="7" cy="17" r="2" /><Circle cx="17" cy="17" r="2" />
  </Svg>
)
const PlateIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Rect x="2" y="7" width="20" height="10" rx="2" />
    <Path d="M6 11h.01M10 11h4M18 11h.01" />
  </Svg>
)
const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    {visible ? (
      <><Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><Circle cx="12" cy="12" r="3" /></>
    ) : (
      <><Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><Path d="M2 2l20 20" /></>
    )}
  </Svg>
)

// ─── Tipo vehículo selector ───────────────────────────────────────────────────
const VEHICULOS = ['moto', 'bici', 'auto'] as const
type Vehiculo = typeof VEHICULOS[number]

// ─── Component ───────────────────────────────────────────────────────────────
export default function RegisterDriver({ navigation }: Props) {
  const { registerDriver } = useAuth()
  const { colors, isDark } = useTheme()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [vehiculo, setVehiculo] = useState<Vehiculo>('moto')
  const [placa, setPlaca] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios')
      return
    }
    if (!acceptTerms) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      // 1. Crear cuenta en Supabase Auth + profile con role 'driver'
      await registerDriver(email.trim(), password, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim(),
        vehiculo,
        placa: placa.trim(),
      })
      // 2. Después del registro ir al onboarding de repartidor
      //    (ahí se llama POST /repartidores/registro con vehiculo y placa)
      navigation.replace('DriverOnboarding', {
        vehiculo,
        placa: placa.trim(),
        fromRegister: true,   // ← agregar esto
      })
    } catch (e: any) {
      Alert.alert('Error al registrarse', e.message ?? 'Intenta nuevamente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.titleText} strokeWidth="2">
                <Path d="M19 12H5M12 19l-7-7 7-7" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              <BikeIcon />
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Cuenta Repartidor</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.titleText }]}>Únete como repartidor</Text>
            <Text style={[styles.subtitle, { color: colors.subtitleText }]}>Empieza a ganar con Pidelo</Text>
          </View>

          <View style={styles.formContainer}>

            {/* Nombre + Apellido */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.titleText }]}>Nombre</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <UserIcon />
                  <TextInput
                    style={[styles.input, { color: colors.titleText }]}
                    placeholder="Juan"
                    placeholderTextColor={colors.placeholderText}
                    value={nombre}
                    onChangeText={setNombre}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.titleText }]}>Apellido</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.titleText, paddingHorizontal: 4 }]}
                    placeholder="Pérez"
                    placeholderTextColor={colors.placeholderText}
                    value={apellido}
                    onChangeText={setApellido}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.titleText }]}>Teléfono <Text style={[styles.optional, { color: colors.labelText }]}>(opcional)</Text></Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <PhoneIcon />
                <TextInput
                  style={[styles.input, { color: colors.titleText }]}
                  placeholder="+52 000 000 0000"
                  placeholderTextColor={colors.placeholderText}
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Tipo de vehículo */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.titleText }]}>Tipo de vehículo</Text>
              <View style={styles.vehiculoRow}>
                {VEHICULOS.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.vehiculoChip, { backgroundColor: colors.inputBg, borderColor: colors.border }, vehiculo === v && styles.vehiculoChipActive]}
                    onPress={() => setVehiculo(v)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons
                        name={v === 'moto' ? 'moped' : v === 'bici' ? 'pedal-bike' : 'directions-car'}
                        size={16}
                        color={vehiculo === v ? '#16a34a' : colors.labelText}
                      />
                      <Text style={[styles.vehiculoText, { color: colors.subtitleText }, vehiculo === v && styles.vehiculoTextActive]}>
                        {v === 'moto' ? 'Moto' : v === 'bici' ? 'Bici' : 'Auto'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Placa */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.titleText }]}>Placa <Text style={[styles.optional, { color: colors.labelText }]}>(opcional)</Text></Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <PlateIcon />
                <TextInput
                  style={[styles.input, { color: colors.titleText }]}
                  placeholder="ABC-123"
                  placeholderTextColor={colors.placeholderText}
                  value={placa}
                  onChangeText={setPlaca}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.titleText }]}>Correo electrónico</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <EmailIcon />
                <TextInput
                  style={[styles.input, { color: colors.titleText }]}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.titleText }]}>Contraseña</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <LockIcon />
                <TextInput
                  style={[styles.input, { color: colors.titleText }]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.titleText }]}>Confirmar contraseña</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <LockIcon />
                <TextInput
                  style={[styles.input, { color: colors.titleText }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.placeholderText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <EyeIcon visible={showConfirm} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAcceptTerms(!acceptTerms)}>
              <View style={[styles.checkbox, { borderColor: colors.border }, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && (
                  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                )}
              </View>
              <Text style={[styles.checkboxText, { color: colors.subtitleText }]}>
                Acepto los{' '}
                <Text style={styles.linkText} onPress={() => setShowTermsModal(true)}>
                  términos y condiciones
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.registerButton}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.registerButtonGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TermsAndConditionsModal
              visible={showTermsModal}
              onClose={() => setShowTermsModal(false)}
            />

            <OAuthButtons />

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.loginContainer, { borderTopColor: colors.rowDivider }]}>
        <Text style={[styles.loginText, { color: colors.subtitleText }]}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginDriver')}>
          <Text style={styles.loginLink}>Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  badgeContainer: { alignItems: 'center', marginTop: 16, marginBottom: 8, gap: 10 },
  badge: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    justifyContent: 'center', alignItems: 'center',
  },
  badgePill: {
    backgroundColor: '#DCFCE7', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  vehiculoText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  vehiculoTextActive: { color: '#16a34a' },
  badgePillText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  titleContainer: { paddingHorizontal: 20, marginTop: 12, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  formContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  row: { flexDirection: 'row' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 12, color: '#9CA3AF' },

  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: '#000' },
  vehiculoRow: { flexDirection: 'row', gap: 10 },
  vehiculoChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB', alignItems: 'center',
  },
  vehiculoChipActive: {
    borderColor: '#22c55e', backgroundColor: '#F0FDF4',
  },
  vehiculoChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  vehiculoChipTextActive: { color: '#16a34a' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, marginTop: 8 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: '#D1D5DB', marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkboxText: { flex: 1, fontSize: 14, color: '#6B7280', lineHeight: 20 },
  linkText: { color: '#22c55e', fontWeight: '600' },
  registerButton: {
    borderRadius: 30, overflow: 'hidden', marginTop: 8,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  registerButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  registerButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  loginContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  loginText: { fontSize: 14, color: '#6B7280' },
  loginLink: { fontSize: 14, color: '#22c55e', fontWeight: 'bold' },
})