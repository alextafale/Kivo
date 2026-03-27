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
import { supabase } from '../../../config/supabaseConfig'

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'LoginBusiness'> }

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
const StoreIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function LoginBusiness({ navigation }: Props) {
  const { login } = useAuth()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigation.replace('BusinessDashboard')
    } catch (e: any) {
      Alert.alert('Error al iniciar sesión', e.message ?? 'Intenta nuevamente')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginwithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    options: {
      redirectTo: 'http://localhost:8081',    
    }
  })
  }

  const handleLoginwithX = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'twitter',
    options: {
      redirectTo: 'http://localhost:8081',    
    }
    })
  }

  const handleLoginwithSpotify = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'spotify',
    options: {
      redirectTo: 'http://localhost:8081',    
    }
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon />
            </TouchableOpacity>
          </View>

          {/* Badge de negocio */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <StoreIcon />
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Acceso Negocio</Text>
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Panel de Negocio</Text>
            <Text style={styles.subtitle}>Inicia sesión para administrar tu negocio</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <EmailIcon />
                <TextInput
                  style={styles.input}
                  placeholder="negocio@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <LockIcon />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
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

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginButton}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterBusiness')}>
          <Text style={styles.signupLink}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FFFFFF' },
  header:             { paddingHorizontal: 20, paddingTop: 10 },
  backButton:         { width: 40, height: 40, justifyContent: 'center' },
  badgeContainer:     { alignItems: 'center', marginTop: 16, marginBottom: 8, gap: 10 },
  badge:              {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    justifyContent: 'center', alignItems: 'center',
  },
  badgePill:          {
    backgroundColor: '#DCFCE7', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 4,
  },
  badgePillText:      { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  titleContainer:     { paddingHorizontal: 20, marginTop: 12, marginBottom: 30 },
  title:              { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8, textAlign: 'center' },
  subtitle:           { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  formContainer:      { paddingHorizontal: 20 },
  inputGroup:         { marginBottom: 20 },
  label:              { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputWrapper:       {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB',
  },
  input:              { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, color: '#000' },
  forgotPassword:     { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontSize: 14, color: '#22c55e', fontWeight: '600' },
  loginButton:        {
    borderRadius: 30, overflow: 'hidden',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  loginButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  loginButtonText:    { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  signupContainer:    {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  signupText:         { fontSize: 14, color: '#6B7280' },
  signupLink:         { fontSize: 14, color: '#22c55e', fontWeight: 'bold' },
})