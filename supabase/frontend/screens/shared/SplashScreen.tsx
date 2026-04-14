import React, { useEffect, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  Easing,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/StacNavigation'
import { useAuth } from '../../application/context/AuthContext'

const { width } = Dimensions.get('window')

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>
}

const ROLE_HOME: Record<string, keyof RootStackParamList> = {
  driver: 'DriverDashboard',
  business_admin: 'BusinessDashboard',
  customer: 'HomeFeed',
}

export default function SplashScreen({ navigation }: Props) {
  const { session, isLoading } = useAuth()

  // — Valores animados —
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoY = useRef(new Animated.Value(30)).current
  const subtitleOpacity = useRef(new Animated.Value(0)).current
  const dotScale = useRef(new Animated.Value(0)).current
  const barWidth = useRef(new Animated.Value(0)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 1. Entrada del logo
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0, duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start()

    // 2. Subtitle
    Animated.timing(subtitleOpacity, {
      toValue: 1, duration: 400, delay: 400,
      useNativeDriver: true,
    }).start()

    // 3. Badge scale bounce
    Animated.spring(dotScale, {
      toValue: 1, delay: 600,
      friction: 5, tension: 80,
      useNativeDriver: true,
    }).start()

    // 4. Barra de progreso (useNativeDriver: false porque anima width)
    Animated.timing(barWidth, {
      toValue: width * 0.55, duration: 1800, delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }, [])

  // — Navegación al terminar la barra —
  useEffect(() => {
    if (isLoading) return

    const timer = setTimeout(async () => {
      // Fade out antes de navegar
      Animated.timing(overlayOpacity, {
        toValue: 1, duration: 350,
        useNativeDriver: true,
      }).start(async () => {
        if (session) {
          const destination = ROLE_HOME[session.role] ?? 'HomeFeed'
          navigation.replace(destination as any)
        } else {
          const seen = await AsyncStorage.getItem('hasSeenOnboarding')
          navigation.replace(seen === 'true' ? 'Signup' : 'Onboarding')
        }
      })
    }, 2300)

    return () => clearTimeout(timer)
  }, [isLoading, session])

  return (
    <LinearGradient
      colors={['#064e3b', '#065f46', '#047857']}
      style={styles.container}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      {/* Círculo decorativo top */}
      <View style={styles.circleTop} />
      {/* Círculo decorativo bottom */}
      <View style={styles.circleBottom} />

      {/* Logo + nombre */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ translateY: logoY }] },
        ]}
      >
        {/* Anillo decorativo */}
        <View style={styles.ring}>
          <View style={styles.ringInner} />
        </View>

        {/* Nombre */}
        <View style={styles.nameRow}>
          <Text style={styles.nameK}>K</Text>
          <Text style={styles.nameRest}>ivo</Text>
        </View>

        {/* Badge */}
        <Animated.View
          style={[styles.badge, { transform: [{ scale: dotScale }] }]}
        >
          <Text style={styles.badgeText}>● DELIVERY</Text>
        </Animated.View>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Tu asistente virtual de comida
      </Animated.Text>

      {/* Progress bar + tagline */}
      <View style={styles.bottomContainer}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <Text style={styles.tagline}>La Piedad · Michoacán</Text>
      </View>

      {/* Overlay de salida */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: overlayOpacity }]}
      />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // — Decoración de fondo —
  circleTop: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width * 0.65,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    top: -width * 0.5,
    left: -width * 0.15,
  },
  circleBottom: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    bottom: -width * 0.28,
    right: -width * 0.18,
  },

  // — Logo —
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    top: -55,
  },
  ringInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  nameK: {
    fontSize: 92,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -3,
    textShadowColor: '#6ee7b7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  nameRest: {
    fontSize: 92,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: -3,
    marginBottom: 6,
  },
  badge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
  },

  // — Textos —
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '300',
    letterSpacing: 0.4,
    marginBottom: 64,
  },

  // — Progress —
  bottomContainer: {
    position: 'absolute',
    bottom: 64,
    width: width * 0.55,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#a7f3d0',
    borderRadius: 1,
  },
  tagline: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '500',
  },

  // — Overlay salida —
  overlay: {
    backgroundColor: '#064e3b',
  },
})