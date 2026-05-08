import React, { useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native'
import { useFonts, Inter_300Light } from '@expo-google-fonts/inter'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../navigation/StacNavigation'
import { useAuth } from '../../application/context/AuthContext'
import { useTheme } from '../../application/context/ThemeContext'

const LETTERS = ['K', 'i', 'v', 'o']
const STAGGER_MS = 85
const NAV_DELAY = 2200

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

  // Una pareja opacity+y por letra
  const letterAnims = useRef(
    LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(32),
    }))
  ).current

  const overlayOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!fontsLoaded) return

    Animated.stagger(
      STAGGER_MS,
      letterAnims.map(({ opacity, y }) =>
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 460,
            useNativeDriver: true,
          }),
          Animated.timing(y, {
            toValue: 0,
            duration: 460,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          }),
        ])
      )
    ).start()
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
      <View style={styles.row}>
        {LETTERS.map((letter, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.letter,
              {
                color: colors.titleText,
                opacity: letterAnims[i].opacity,
                transform: [{ translateY: letterAnims[i].y }],
              },
            ]}
            allowFontScaling={false}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>

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
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  letter: {
    fontFamily: 'Inter_300Light',
    fontSize: 54,
    letterSpacing: -2.2,
  },
})