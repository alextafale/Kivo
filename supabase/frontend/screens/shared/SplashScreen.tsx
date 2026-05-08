import React, { useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
} from 'react-native'
import {
  useFonts,
  Inter_300Light,
} from '@expo-google-fonts/inter'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/StacNavigation'
import { useAuth } from '../../application/context/AuthContext'
import { useTheme } from '../../application/context/ThemeContext'

const SHOW_DURATION = 900
const NAV_DELAY = 2000

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

  const [fontsLoaded] = useFonts({ Inter_300Light })

  const fadeAnim = useRef(new Animated.Value(0)).current
  const textY = useRef(new Animated.Value(16)).current
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
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [fontsLoaded])

  useEffect(() => {
    if (isLoading || !fontsLoaded) return

    const t = setTimeout(() => {
      Animated.timing(overlayOp, {
        toValue: 1,
        duration: 350,
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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: textY }] }}>
        <Text style={[styles.wordmark, { color: colors.titleText }]} allowFontScaling={false}>
          Kivo
        </Text>
      </Animated.View>

      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: overlayOp, backgroundColor: colors.bg }]}
        pointerEvents="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: 'Inter_300Light',
    fontSize: 54,
    letterSpacing: -2.2,
  },
})