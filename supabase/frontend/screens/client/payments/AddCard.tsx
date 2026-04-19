import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddCard'>;
type Props = { navigation: Nav };

const { width } = Dimensions.get('window');
const CARD_WIDTH  = width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.58;

// ─── ICONS ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const CardIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Rect x="1" y="4" width="22" height="16" rx="2" />
    <Path d="M1 10h22" />
  </Svg>
);

const UserIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const LockIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Rect x="3" y="11" width="18" height="11" rx="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const InfoIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4M12 8h.01" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

// NFC icon
const NfcIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8">
    <Path d="M20 12a8 8 0 0 0-8-8" />
    <Path d="M17 12a5 5 0 0 0-5-5" />
    <Path d="M14 12a2 2 0 0 0-2-2" />
    <Circle cx="12" cy="12" r="1" fill="rgba(255,255,255,0.9)" />
  </Svg>
);

// ─── DETECT CARD TYPE ─────────────────────────────────────────────────────────

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'unknown';

const detectNetwork = (num: string): CardNetwork => {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'unknown';
};

// Visa logo
const VisaLogo = () => (
  <Svg width="52" height="18" viewBox="0 0 52 18">
    <Path d="M21.5 1L16 17H11L16.5 1H21.5ZM38.5 11.3L41 4.5L42.5 11.3H38.5ZM44.5 17H49L44.5 1H40C39 1 38.2 1.5 37.8 2.3L30.5 17H35.5L36.5 14.3H42.5L43 17H44.5ZM29 5.5C27.5 4.9 26 4.5 24.2 4.5C19.5 4.5 16.2 6.9 16.2 10.3C16.2 12.8 18.5 14.2 20.2 15C22 15.9 22.5 16.5 22.5 17.2C22.5 18.3 21.2 18.8 20 18.8C18.3 18.8 16.5 18.3 15 17.5L14.2 17.1L13.3 21.6C15.1 22.4 17.5 23 20 23C25 23 28.2 20.6 28.2 17C28.2 14.5 26.7 12.6 23.7 11.1C22.1 10.3 21.1 9.8 21.1 9C21.1 8.3 21.9 7.6 23.7 7.6C25.1 7.5 26.3 7.8 27.2 8.2L27.7 8.4L28.5 4.1L29 5.5Z" fill="white"/>
  </Svg>
);

// MC logo
const MastercardLogo = () => (
  <View style={{ flexDirection: 'row' }}>
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#EB001B', opacity: 0.95 }} />
    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#F79E1B', marginLeft: -10, opacity: 0.95 }} />
  </View>
);

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────

const formatCardNumber = (val: string, network: CardNetwork) => {
  const digits = val.replace(/\D/g, '').slice(0, network === 'amex' ? 15 : 16);
  if (network === 'amex') {
    return digits.replace(/^(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
};

const maskCardDisplay = (num: string, network: CardNetwork) => {
  const digits = num.replace(/\s/g, '');
  if (!digits) return network === 'amex' ? 'XXXX XXXXXX XXXXX' : 'XXXX XXXX XXXX XXXX';
  const total = network === 'amex' ? 15 : 16;
  const padded = digits.padEnd(total, 'X');
  if (network === 'amex') {
    return `${padded.slice(0,4)} ${padded.slice(4,10)} ${padded.slice(10)}`;
  }
  return `${padded.slice(0,4)} ${padded.slice(4,8)} ${padded.slice(8,12)} ${padded.slice(12)}`;
};

// ─── LIVE CARD PREVIEW ────────────────────────────────────────────────────────

const CardPreview = ({
  number, name, expiry, network,
}: {
  number: string; name: string; expiry: string; network: CardNetwork;
}) => {
  const gradients: Record<CardNetwork, string[]> = {
    visa:       ['#22c55e', '#15803d'],
    mastercard: ['#1a1a2e', '#16213e'],
    amex:       ['#1d4ed8', '#1e3a8a'],
    unknown:    ['#22c55e', '#15803d'],
  };
  const colors = gradients[network] as [string, string];

  return (
    <View style={[styles.cardPreview, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      <LinearGradient
        colors={colors}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative circles */}
        <View style={styles.cardCircle1} />
        <View style={styles.cardCircle2} />

        {/* Top row */}
        <View style={styles.cardTopRow}>
          <Text style={styles.cardBrand}>KIVU CARD</Text>
          <NfcIcon />
        </View>

        {/* Chip */}
        <View style={styles.cardChip}>
          <LinearGradient
            colors={['#d4a820', '#f5d060', '#d4a820']}
            style={styles.cardChipGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.chipLine1} />
            <View style={styles.chipLine2} />
          </LinearGradient>
        </View>

        {/* Network logo */}
        <View style={styles.cardNetworkLogo}>
          {network === 'visa' && <VisaLogo />}
          {network === 'mastercard' && <MastercardLogo />}
        </View>

        {/* Number */}
        <Text style={styles.cardNumber} numberOfLines={1}>
          {maskCardDisplay(number, network)}
        </Text>

        {/* Bottom info */}
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardBottomLabel}>TITULAR DE LA TARJETA</Text>
            <Text style={styles.cardBottomValue} numberOfLines={1}>
              {name.toUpperCase() || 'NOMBRE APELLIDO'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardBottomLabel}>VENCE</Text>
            <Text style={styles.cardBottomValue}>{expiry || 'MM/AA'}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// ─── INPUT FIELD ──────────────────────────────────────────────────────────────

const Field = ({
  label, icon, value, onChange, placeholder, keyboardType, maxLength, style,
}: {
  label?: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  maxLength?: number;
  style?: any;
}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () =>
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  const onBlur = () =>
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#22c55e'],
  });

  return (
    <View style={style}>
      <Animated.View style={[styles.inputWrap, { borderColor }]}>
        <View style={styles.inputIcon}>{icon}</View>
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#b0bec5"
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize="characters"
        />
      </Animated.View>
    </View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function AddCard({ navigation }: Props) {
  const [cardNumber, setCardNumber]   = useState('');
  const [cardName, setCardName]       = useState('');
  const [expiry, setExpiry]           = useState('');
  const [cvv, setCvv]                 = useState('');
  const [isDefault, setIsDefault]     = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showCvv, setShowCvv]         = useState(false);

  const network = detectNetwork(cardNumber);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const formAnim   = useRef(new Animated.Value(0)).current;
  const flipAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(cardAnim,   { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(formAnim,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  // Subtle card tilt on CVV focus
  const handleCvvFocus = () => {
    Animated.spring(flipAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
  };
  const handleCvvBlur = () => {
    Animated.spring(flipAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }).start();
  };

  const cardTilt = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-4deg'] });

  const handleSave = async () => {
    if (!cardNumber.replace(/\s/g, '') || cardNumber.replace(/\s/g, '').length < 15) {
      Alert.alert('Número inválido', 'Ingresa un número de tarjeta válido.'); return;
    }
    if (!cardName.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del titular.'); return;
    }
    const [mm, yy] = expiry.split('/');
    if (!mm || !yy || parseInt(mm) > 12 || parseInt(mm) < 1) {
      Alert.alert('Fecha inválida', 'Ingresa una fecha de vencimiento válida.'); return;
    }
    if (!cvv || cvv.length < 3) {
      Alert.alert('CVV inválido', 'Ingresa el código de seguridad.'); return;
    }

    setSaving(true);
    try {
      const stored = await AsyncStorage.getItem('paymentMethods');
      const existing = stored ? JSON.parse(stored) : [];

      const newCard = {
        id: Date.now().toString(),
        network,
        last4: cardNumber.replace(/\s/g, '').slice(-4),
        name: cardName.trim(),
        expiry,
        isDefault,
        createdAt: new Date().toISOString(),
      };

      const updated = isDefault
        ? [...existing.map((c: any) => ({ ...c, isDefault: false })), newCard]
        : [...existing, newCard];

      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updated));

      Alert.alert('✓ Tarjeta guardada', 'Tu tarjeta fue agregada exitosamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la tarjeta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── HEADER ──────────────────────────────────────────── */}
        <Animated.View
          style={[styles.header, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }],
          }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Añadir Nueva Tarjeta</Text>
          <View style={{ width: 42 }} />
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── CARD PREVIEW ──────────────────────────────────── */}
          <Animated.View
            style={[styles.cardContainer, {
              opacity: cardAnim,
              transform: [
                { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
                { rotateZ: cardTilt },
              ],
            }]}
          >
            <CardPreview
              number={cardNumber}
              name={cardName}
              expiry={expiry}
              network={network}
            />
          </Animated.View>

          {/* ── FORM ──────────────────────────────────────────── */}
          <Animated.View
            style={[styles.form, {
              opacity: formAnim,
              transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
            }]}
          >
            {/* Card number */}
            <Text style={styles.fieldLabel}>Número de Tarjeta</Text>
            <Field
              icon={<CardIcon />}
              value={cardNumber}
              onChange={(v) => setCardNumber(formatCardNumber(v, network))}
              placeholder="0000 0000 0000 0000"
              keyboardType="number-pad"
              maxLength={network === 'amex' ? 17 : 19}
            />

            {/* Name */}
            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Nombre en la Tarjeta</Text>
            <Field
              icon={<UserIcon />}
              value={cardName}
              onChange={setCardName}
              placeholder="Ej. Juan Pérez"
            />

            {/* Expiry + CVV */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Vencimiento</Text>
                <Field
                  icon={<CalendarIcon />}
                  value={expiry}
                  onChange={(v) => setExpiry(formatExpiry(v))}
                  placeholder="MM/AA"
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={styles.rowGap} />
              <View style={{ flex: 1 }}>
                <View style={styles.cvvLabelRow}>
                  <Text style={styles.fieldLabel}>CVV</Text>
                  <TouchableOpacity onPress={() => Alert.alert('CVV', 'El CVV son los 3 o 4 dígitos en el reverso de tu tarjeta.')}>
                    <InfoIcon />
                  </TouchableOpacity>
                </View>
                <Field
                  icon={<LockIcon />}
                  value={cvv}
                  onChange={setCvv}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={network === 'amex' ? 4 : 3}
                />
              </View>
            </View>

            {/* Default toggle */}
            <View style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Método de pago principal</Text>
                <Text style={styles.toggleSub}>Se usará por defecto en tus pedidos.</Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: '#e2e8f0', true: '#86efac' }}
                thumbColor={isDefault ? '#22c55e' : '#f1f5f9'}
                ios_backgroundColor="#e2e8f0"
              />
            </View>

            {/* Security badge */}
            <View style={styles.securityBadge}>
              <ShieldIcon />
              <Text style={styles.securityText}>PAGO 100% SEGURO</Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.87}
              disabled={saving}
            >
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.saveBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <SaveIcon />
                <Text style={styles.saveBtnText}>
                  {saving ? 'Guardando...' : 'Guardar Tarjeta'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.1,
  },

  scrollContent: {
    paddingBottom: 48,
  },

  // Card preview wrapper
  cardContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    // shadow under card
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 14,
  },
  cardPreview: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative circles
  cardCircle1: {
    position: 'absolute',
    width: CARD_WIDTH * 0.7,
    height: CARD_WIDTH * 0.7,
    borderRadius: CARD_WIDTH * 0.35,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -CARD_WIDTH * 0.2,
    right: -CARD_WIDTH * 0.15,
  },
  cardCircle2: {
    position: 'absolute',
    width: CARD_WIDTH * 0.5,
    height: CARD_WIDTH * 0.5,
    borderRadius: CARD_WIDTH * 0.25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -CARD_WIDTH * 0.15,
    left: -CARD_WIDTH * 0.1,
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 2,
  },

  // Chip
  cardChip: {
    width: 44,
    height: 34,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardChipGrad: {
    flex: 1,
    padding: 4,
    justifyContent: 'space-around',
  },
  chipLine1: {
    height: 2,
    backgroundColor: 'rgba(120,80,0,0.35)',
    borderRadius: 1,
    marginHorizontal: 3,
  },
  chipLine2: {
    height: 2,
    backgroundColor: 'rgba(120,80,0,0.35)',
    borderRadius: 1,
    marginHorizontal: 3,
  },

  // Network logo
  cardNetworkLogo: {
    position: 'absolute',
    top: 18,
    right: 54,
  },

  // Card number
  cardNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardBottomLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  cardBottomValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    maxWidth: 160,
  },

  // Form
  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    paddingVertical: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Row (expiry + cvv)
  row: {
    flexDirection: 'row',
    marginTop: 20,
  },
  rowGap: {
    width: 14,
  },
  cvvLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },

  // Toggle
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  toggleSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },

  // Security
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 4,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.8,
  },

  // Save button
  saveBtn: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 10,
  },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 19,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});