import React, { useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  Easing,
  ImageBackground,
} from 'react-native'
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/StacNavigation'
import { useAuth } from '../../application/context/AuthContext'
import { useTheme } from '../../application/context/ThemeContext'

const { height: H } = Dimensions.get('window')

// ─── Timing ─────────────────────────────────────────────────────────────────────
const SHOW_DURATION = 1000
const NAV_DELAY = 2200

// ─── Roles ───────────────────────────────────────────────────────────────────────
const ROLE_HOME: Record<string, keyof RootStackParamList> = {
  driver: 'DriverDashboard',
  business_admin: 'BusinessDashboard',
  customer: 'HomeFeed',
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>
}

export default function SplashScreen({ navigation }: Props) {
  const { session, isLoading } = useAuth()
  const { colors } = useTheme()

  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
  })

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current
  const textY = useRef(new Animated.Value(20)).current
  const overlayOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!fontsLoaded) return

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: SHOW_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(textY, {
        toValue: 0,
        duration: SHOW_DURATION,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start()
  }, [fontsLoaded])

  // ── Navegación ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !fontsLoaded) return

    const t = setTimeout(() => {
      Animated.timing(overlayOp, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(async () => {
        if (session) {
          navigation.replace((ROLE_HOME[session.role] ?? 'HomeFeed') as any)
        } else {
          const seen = await AsyncStorage.getItem('hasSeenOnboarding')
          navigation.replace(seen === 'true' ? 'Signup' : 'Onboarding')
        }
      })
    }, NAV_DELAY)

    return () => clearTimeout(t)
  }, [isLoading, fontsLoaded, session])

  if (!fontsLoaded) return null

  return (
    <ImageBackground
      source={require('../../../../assets/logo.png')}
      style={[styles.root, { backgroundColor: colors.pageBg }]}
      resizeMode="cover"
    >

      {/* Texto Kivo superpuesto, un poco abajo del centro */}
      <Animated.View style={[styles.textWrapper, {
        opacity: fadeAnim,
        transform: [{ translateY: textY }]
      }]}>
        <Text style={[styles.nameText, { color: colors.titleText }]} allowFontScaling={false}>
          Kivo
        </Text>
      </Animated.View>

      {/* Overlay de salida para transición suave */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOp, backgroundColor: colors.pageBg }]}
        pointerEvents="none"
      />
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    marginTop: H * 0.18, // Posiciona el texto un poco abajo del centro
    alignItems: 'center',
  },
  nameText: {
    fontFamily: 'Inter_300Light', // Tipografía Uber Move Light
    fontSize: 54,                 // Tamaño más grande para impacto sobre el fondo
    letterSpacing: -2.2,          // Tracking negativo agresivo estilo branding Uber
    textAlign: 'center',
    // Sombra sutil para legibilidad si la imagen es compleja
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  overlay: {
    backgroundColor: '#FFFFFF',
  },
})