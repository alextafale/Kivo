import React, { useEffect } from 'react'
import { StyleSheet, ActivityIndicator, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/StacNavigation'
import { useAuth } from '../../application/context/AuthContext'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>
}

// Mapeo rol → pantalla destino
const ROLE_HOME: Record<string, keyof RootStackParamList> = {
  driver:         'DriverDashboard',
  business_admin: 'BusinessDashboard',
  customer:       'HomeFeed',
  // fallback para roles desconocidos → HomeFeed
}

export default function SplashScreen({ navigation }: Props) {
  // isLoading es true mientras AuthContext restaura la sesión desde SecureStore/Supabase
  const { session, isLoading } = useAuth()

  useEffect(() => {
    // Esperar a que AuthContext termine de restaurar la sesión
    if (isLoading) return

    const redirect = async () => {
      // Pequeña pausa para que el splash se vea (UX)
      await new Promise(resolve => setTimeout(resolve, 1500))

      if (session) {
        //  Hay sesión activa — ir a la pantalla correcta según el rol
        const destination = ROLE_HOME[session.role] ?? 'HomeFeed'
        navigation.replace(destination as any)
      } else {
        // Sin sesión — flujo normal de onboarding / login
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding')
        if (hasSeenOnboarding === 'true') {
          navigation.replace('Signup')
        } else {
          navigation.replace('Onboarding')
        }
      }
    }

    redirect()
  }, [isLoading, session])

  return (
    <LinearGradient
      colors={['#22c55e', '#16a34a', '#059669']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.textContainer}>
        <Text style={styles.appName}>Kivo</Text>
        <Text style={styles.subtitle}>Ordena con tu asistente virtual</Text>
      </View>
      <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textContainer: { alignItems: 'center', marginBottom: 40 },
  appName:       {
    fontSize: 72, fontWeight: 'bold', color: 'white',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20, color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8, fontWeight: '300',
  },
})