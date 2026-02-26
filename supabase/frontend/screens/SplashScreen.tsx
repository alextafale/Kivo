import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StacNavigation';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

type Props = {
  navigation: SplashScreenNavigationProp;
};

// Logo component con los iconos SVG
const LogoIcon = () => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const chatBubbleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación del chat bubble
    Animated.spring(chatBubbleAnim, {
      toValue: 1,
      delay: 500,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, []);

  return (
    <View style={styles.logoContainer}>
      {/* Círculo de pulso */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0.5, 0],
            }),
          },
        ]}
      />

      {/* Círculo blanco de fondo */}
      <View style={styles.logoCircle}>
        {/* Shopping Bag Icon SVG */}
        <Svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <Path d="M3 6h18" />
          <Path d="M16 10a4 4 0 0 1-8 0" />
        </Svg>

        {/* Chat bubble overlay */}
        <Animated.View
          style={[
            styles.chatBubble,
            {
              transform: [{ scale: chatBubbleAnim }],
            },
          ]}
        >
          <Svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
            <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
};

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Animaciones de los puntos de carga
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Animación de los círculos decorativos
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      return hasSeenOnboarding === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };

  useEffect(() => {
    // Animación de entrada del logo con rotación
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Barra de progreso
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      delay: 800,
      useNativeDriver: false,
    }).start(async () => {
      // Cuando termina la animación de progreso, verificar si ya vio el onboarding
      const hasSeenOnboarding = await checkOnboardingStatus();
      
      setTimeout(() => {
        if (hasSeenOnboarding) {
          navigation.replace('HomeFeed');
        } else {
          navigation.replace('Onboarding');
        }
      }, 500);
    });

    // Animación de los círculos decorativos
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Scale, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle2Scale, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(circle2Scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animación de los puntos
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dot1, { toValue: -10, duration: 400, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { toValue: -10, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { toValue: -10, duration: 400, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    setTimeout(() => animateDots(), 1000);
  }, [navigation]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 256],
  });

  return (
    <LinearGradient
      colors={['#22c55e', '#16a34a', '#059669']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Círculos decorativos */}
      <Animated.View
        style={[
          styles.decorativeCircle1,
          {
            transform: [{ scale: circle1Scale }],
            opacity: circle1Scale.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0.3, 0.5],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.decorativeCircle2,
          {
            transform: [{ scale: circle2Scale }],
            opacity: circle2Scale.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0.5, 0.3],
            }),
          },
        ]}
      />

      {/* Contenido principal */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ rotate: spin }, { scale: rotateAnim }],
          },
        ]}
      >
        <LogoIcon />
      </Animated.View>

      {/* Nombre de la app */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>Pidelo</Text>
        <Text style={styles.subtitle}>Ordena con tu asistente virtual</Text>
      </Animated.View>

      {/* Barra de progreso */}
      <Animated.View style={[styles.progressContainer, { opacity: fadeAnim }]}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Puntos de carga */}
      <Animated.View style={[styles.dotsContainer, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3 }] }]} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -80,
    left: -80,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -40,
    right: -40,
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'white',
  },
  logoCircle: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  chatBubble: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  appName: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '300',
  },
  progressContainer: {
    width: 256,
    marginTop: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    marginHorizontal: 4,
  },
});