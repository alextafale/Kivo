import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useAuth } from '../../../application/context/AuthContext';

type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterBusiness'>;
type Props = { navigation: RegisterNavigationProp };

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const EmailIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="m2 7 10 7 10-7" />
  </Svg>
);

const LockIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const UserIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const PhoneIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 1.13h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.91 5.91l1.14-1.14a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    {visible ? (
      <>
        <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <Circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <Path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <Path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <Path d="M2 2l20 20" />
      </>
    )}
  </Svg>
);

const ChatBubbleIcon = () => (
  <Svg width="60" height="60" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pwd.length === 0) return { level: 0, label: '', color: '#E5E7EB' };
  let score = 0;
  if (pwd.length >= 8)           score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  if (score <= 1) return { level: 1, label: 'Débil',  color: '#EF4444' };
  if (score <= 2) return { level: 2, label: 'Media',  color: '#F59E0B' };
  return             { level: 3, label: 'Fuerte', color: '#22c55e' };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegisterBusiness({ navigation }: Props) {
  const { register } = useAuth();

  // Campos del schema: profiles (nombre, apellido, telefono) + auth (email, password)
  const [nombre,       setNombre]       = useState('');
  const [apellido,     setApellido]     = useState('');
  const [telefono,     setTelefono]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPwd,   setConfirmPwd]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [accepted,     setAccepted]     = useState(false);
  const [loading,      setLoading]      = useState(false);

  const pwdStrength = getPasswordStrength(password);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleRegister = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Nombre, email y contraseña son obligatorios');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Ingresa un email válido');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmPwd) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (!accepted) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    try {
      // register() crea el usuario en Supabase Auth + profiles via trigger
      // El trigger handle_new_user() inserta en profiles con role='customer'
      // El onboarding posterior seteará role='business_admin' y creará el negocio
      await register(email.trim(), password);
      navigation.replace('BusinessOnboarding');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <ChatBubbleIcon />
            </View>
            <Text style={styles.logoText}>Kivu</Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Configura tu negocio en minutos</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>

            {/* Nombre + Apellido en fila */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.rowHalf]}>
                <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <UserIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="Juan"
                    placeholderTextColor="#9CA3AF"
                    value={nombre}
                    onChangeText={setNombre}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, styles.rowHalf]}>
                <Text style={styles.label}>Apellido</Text>
                <View style={styles.inputWrapper}>
                  <UserIcon />
                  <TextInput
                    style={styles.input}
                    placeholder="Pérez"
                    placeholderTextColor="#9CA3AF"
                    value={apellido}
                    onChangeText={setApellido}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.inputWrapper}>
                <PhoneIcon />
                <TextInput
                  style={styles.input}
                  placeholder="+52 33 1234 5678"
                  placeholderTextColor="#9CA3AF"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <EmailIcon />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña <Text style={styles.required}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <LockIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                  <EyeIcon visible={showPassword} />
                </TouchableOpacity>
              </View>
              {/* Password strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3].map(i => (
                      <View
                        key={i}
                        style={[
                          styles.strengthSegment,
                          { backgroundColor: i <= pwdStrength.level ? pwdStrength.color : '#E5E7EB' },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: pwdStrength.color }]}>
                    {pwdStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña <Text style={styles.required}>*</Text></Text>
              <View style={[
                styles.inputWrapper,
                confirmPwd.length > 0 && {
                  borderColor: confirmPwd === password ? '#22c55e' : '#EF4444',
                },
              ]}>
                <LockIcon />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
                  <EyeIcon visible={showConfirm} />
                </TouchableOpacity>
              </View>
              {confirmPwd.length > 0 && confirmPwd === password && (
                <View style={styles.matchRow}>
                  <CheckIcon />
                  <Text style={styles.matchText}>Las contraseñas coinciden</Text>
                </View>
              )}
            </View>

            {/* Términos */}
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAccepted(v => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                {accepted && <CheckIcon />}
              </View>
              <Text style={styles.termsText}>
                Acepto los{' '}
                <Text style={styles.termsLink}>Términos y Condiciones</Text>
                {' '}y la{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </TouchableOpacity>

            {/* Register button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              style={styles.registerButton}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.registerButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.registerButtonText}>Crear cuenta</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Info note */}
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                📋 Después configurarás los datos de tu negocio paso a paso
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Login link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Inicia sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:               { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView:            { flex: 1 },
  header:                  { paddingHorizontal: 20, paddingTop: 10 },
  backButton:              { width: 40, height: 40, justifyContent: 'center' },
  logoContainer:           { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoCircle:              { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:                { fontSize: 28, fontWeight: 'bold', color: '#000' },
  titleContainer:          { paddingHorizontal: 20, marginBottom: 28 },
  title:                   { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle:                { fontSize: 16, color: '#6B7280' },
  formContainer:           { paddingHorizontal: 20 },
  row:                     { flexDirection: 'row', gap: 12 },
  rowHalf:                 { flex: 1 },
  inputGroup:              { marginBottom: 20 },
  label:                   { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  required:                { color: '#EF4444' },
  inputWrapper:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  input:                   { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: '#000' },
  strengthContainer:       { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  strengthBar:             { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSegment:         { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel:           { fontSize: 12, fontWeight: '700', width: 48 },
  matchRow:                { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  matchText:               { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  termsRow:                { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 28 },
  checkbox:                { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxActive:          { backgroundColor: '#F0FDF4', borderColor: '#22c55e' },
  termsText:               { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 20 },
  termsLink:               { color: '#22c55e', fontWeight: '600' },
  registerButton:          { borderRadius: 30, overflow: 'hidden', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 16 },
  registerButtonGradient:  { paddingVertical: 18, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  registerButtonText:      { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  infoNote:                { backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#DCFCE7' },
  infoNoteText:            { fontSize: 13, color: '#16a34a', textAlign: 'center', lineHeight: 20 },
  loginContainer:          { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  loginText:               { fontSize: 14, color: '#6B7280' },
  loginLink:               { fontSize: 14, color: '#22c55e', fontWeight: 'bold' },
});