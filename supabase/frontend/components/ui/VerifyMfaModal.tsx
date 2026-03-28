import React, { useState, useEffect } from 'react'
import {
  Modal, View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Platform, KeyboardAvoidingView
} from 'react-native'
import { supabase } from '../../config/supabaseConfig'
import { AuthRepositoryImpl } from '../../infraestructure/repositories/AuthRepositoryImpl'
import { LinearGradient } from 'expo-linear-gradient'

type Props = {
  visible: boolean
  onVerifySuccess: () => void
  onCancel: () => Promise<void>
}

export default function VerifyMfaModal({ visible, onVerifySuccess, onCancel }: Props) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      loadFactor()
    }
  }, [visible])

  const loadFactor = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      const totpFactor = data.totp[0]
      if (totpFactor) {
        setFactorId(totpFactor.id)
      } else {
        Alert.alert('Error', 'No se encontró un factor TOTP configurado.')
      }
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleVerify = async () => {
    if (!factorId) return
    if (code.length < 6) {
      Alert.alert('Error', 'Ingresa el código completo de 6 dígitos')
      return
    }

    setLoading(true)
    try {
      const repo = new AuthRepositoryImpl()
      await repo.challengeAndVerifyMFA(factorId, code)
      onVerifySuccess()
      setCode('')
    } catch (error: any) {
      Alert.alert('Error de verificación', 'Código incorrecto o expirado.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    await onCancel()
    setCode('')
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🛡️</Text>
          </View>
          
          <Text style={styles.title}>Autenticación en 2 pasos</Text>
          <Text style={styles.subtitle}>
            Abre tu aplicación de autenticación (Google Authenticator, Authy) e ingresa el código de 6 dígitos.
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
              autoFocus={true}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, !factorId && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading || !factorId}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verificar Código</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar y salir</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    fontSize: 32,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#111827',
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
})
