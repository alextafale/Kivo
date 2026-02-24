import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';
import { useNavigation } from '@react-navigation/native';
import Signup from '../auth/Signup';

type AccountTypeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountTypeSelection'>;

type Props = {
  navigation: AccountTypeNavigationProp;
};

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const ChatIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 24 24" fill="#22c55e" stroke="#22c55e" strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const StoreIcon = () => (
  <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" fill="#22c55e" />
    <Path d="M3 9a2 2 0 0 1 .709-1.528l2.472-2.059A2 2 0 0 1 7.456 5h9.088a2 2 0 0 1 1.275.472l2.472 2.059A2 2 0 0 1 21 9" />
    <Rect x="9" y="13" width="6" height="6" fill="white" />
  </Svg>
);

const ArrowIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

export default function AccountTypeSelection({ navigation }: Props) {
  const [selectedType, setSelectedType] = useState<'client' | 'business' | null>(null);

  const handleContinue = async () => {
    if (!selectedType) return;
    await AsyncStorage.setItem('accountType', selectedType);

    if (selectedType === 'client') {
      // Cliente → login de clientes
      navigation.navigate('Login');
    } else {
      // Negocio → login de negocios
      navigation.navigate('LoginBusiness');
    }
  };

  const handleLogin = () => {
    if (!selectedType) return; // debe seleccionar primero

    if (selectedType === 'client') {
      // Cliente → login de clientes
      navigation.navigate('Login');
    } else {
      // Negocio → login de negocios
      navigation.navigate('LoginBusiness');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.textSection}>
          <Text style={styles.title}>
            Únete a <Text style={styles.titleGreen}>Pidelo</Text>
          </Text>
          <Text style={styles.subtitle}>
            Selecciona tu perfil para comenzar a pedir o vender de forma conversacional.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {/* Cliente Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'client' && styles.optionCardSelected,
            ]}
            onPress={() => { setSelectedType('client'); }}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <ChatIcon />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Soy un Cliente</Text>
              <Text style={styles.optionDescription}>
                Quiero pedir comida deliciosa a través del chat de forma rápida y fácil.
              </Text>
            </View>
            {selectedType === 'client' && <View style={styles.checkmark} />}
          </TouchableOpacity>

          {/* Negocio Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedType === 'business' && styles.optionCardSelected,
            ]}
            onPress={() => { setSelectedType('business'); }}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <StoreIcon />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Tengo un Negocio</Text>
              <Text style={styles.optionDescription}>
                Quiero gestionar mis pedidos y llegar a más clientes con inteligencia artificial.
              </Text>
            </View>
            {selectedType === 'business' && <View style={styles.checkmark} />}
          </TouchableOpacity>
        </View>

        {/* Decorative Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' }}
            style={styles.decorativeImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!selectedType}
          style={[styles.button, !selectedType && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={selectedType ? ['#22c55e', '#16a34a'] : ['#E5E7EB', '#D1D5DB']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.buttonText, !selectedType && styles.buttonTextDisabled]}>
              Continuar
            </Text>
            <ArrowIcon />
          </LinearGradient>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={handleLogin} disabled={!selectedType}>
            <Text style={[styles.loginLink, !selectedType && styles.loginLinkDisabled]}>
              Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
        {!selectedType && (
          <Text style={styles.loginHint}>Selecciona un perfil primero</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  textSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  titleGreen: {
    color: '#22c55e',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22c55e',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    marginLeft: 12,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  decorativeImage: {
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonTextDisabled: {
    color: '#9CA3AF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  loginLinkDisabled: {
    color: '#D1D5DB',
  },
  loginHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
});
