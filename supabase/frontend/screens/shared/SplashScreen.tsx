import React, { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

type Props = {
  navigation: SplashScreenNavigationProp;
};

export default function SplashScreen({ navigation }: Props) {
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
    const timer = setTimeout(async () => {
      const hasSeenOnboarding = await checkOnboardingStatus();
      if (hasSeenOnboarding) {
        navigation.replace('HomeFeed');
      } else {
        navigation.replace('Onboarding');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
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
});