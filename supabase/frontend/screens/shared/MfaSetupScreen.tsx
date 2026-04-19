import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator, Clipboard
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Path } from 'react-native-svg'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/StacNavigation'
import { AuthRepositoryImpl } from '../../infraestructure/repositories/AuthRepositoryImpl'

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MfaSetup'> }

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
)

const CopyIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <Path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
  </Svg>
)

export default function MfaSetupScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    startEnrollment()
  }, [])

  const startEnrollment = async () => {
    try {
      setLoading(true)
      const repo = new AuthRepositoryImpl()
      const data = await repo.enrollMFA()
      setFactorId(data.factorId)
      setSecret(data.secret)
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo iniciar la configuración 2FA')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (secret) {
      Clipboard.setString(secret)
      Alert.alert('Copiado', 'El código secreto ha sido copiado al portapapeles.')
    }
  }

  const handleVerify = async () => {
    if (!factorId) return
    if (code.length < 6) {
      Alert.alert('Error', 'Ingresa el código completo de 6 dígitos')
      return
    }

    setVerifying(true)
    try {
      const repo = new AuthRepositoryImpl()
      await repo.verifyMFAEnrollment(factorId, code)
      Alert.alert('¡Éxito!', 'La autenticación de dos factores ha sido activada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error: any) {
      Alert.alert('Error', 'El código es incorrecto o ha expirado. Intenta nuevamente.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Preparando configuración...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar 2FA</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🔐</Text>
        </View>
        
        <Text style={styles.title}>Protege tu cuenta</Text>
        <Text style={styles.subtitle}>
          Agrega este código secreto en tu aplicación de autenticación (como Google Authenticator o Authy).
        </Text>

        <View style={styles.secretBox}>
          <Text style={styles.secretText}>{secret}</Text>
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            <CopyIcon />
            <Text style={styles.copyText}>Copiar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instruction}>
          Una vez agregado, ingresa el código de 6 dígitos generado por la aplicación para verificar y activar la seguridad 2FA.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
          />
        </View>

        <TouchableOpacity onPress={handleVerify} disabled={verifying} style={styles.button}>
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Activar 2FA</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { padding: 24, alignItems: 'center' },
  iconContainer: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  iconText: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  secretBox: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 16, width: '100%', alignItems: 'center', marginBottom: 24,
  },
  secretText: { fontSize: 16, fontWeight: 'bold', color: '#111827', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  copyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  copyText: { marginLeft: 8, fontSize: 14, fontWeight: 'bold', color: '#22c55e' },
  instruction: { fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  inputContainer: { width: '100%', marginBottom: 24 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16,
    padding: 16, fontSize: 28, letterSpacing: 8, textAlign: 'center', fontWeight: 'bold', color: '#111827',
  },
  button: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
})
