import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PaymentsMethod'>;
type Props = { navigation: Nav };

const { width } = Dimensions.get('window');

// ─── ICONS ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

const ShieldIcon = () => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <Path d="m9 12 2 2 4-4" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <Path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const WalletIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2">
    <Path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4" />
    <Path d="M20 12h-4a2 2 0 0 0 0 4h4" />
  </Svg>
);

const CashIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Rect x="2" y="6" width="20" height="12" rx="2" />
    <Circle cx="12" cy="12" r="2" />
    <Path d="M6 12h.01M18 12h.01" />
  </Svg>
);

// Visa logo text
const VisaLogo = () => (
  <Svg width="38" height="14" viewBox="0 0 50 16">
    <Path
      d="M18 1L13 15H9L14 1H18ZM32 10L34 4L35 10H32ZM36 15H40L37 1H34C33 1 32.3 1.5 32 2.2L26 15H30L31 12H36L36 15ZM25 5C23.8 4.5 22.4 4.1 20.8 4.1C17 4.1 14.3 6.1 14.3 9C14.3 11.1 16.2 12.3 17.7 13C19.2 13.8 19.7 14.2 19.7 14.8C19.7 15.7 18.6 16.1 17.6 16.1C16.2 16.1 14.7 15.7 13.5 15.1L13 14.8L12.2 18.5C13.7 19.2 15.7 19.7 17.8 19.7C21.9 19.7 24.5 17.7 24.5 14.6C24.5 12.5 23.3 10.9 20.8 9.6C19.4 8.9 18.6 8.5 18.6 7.8C18.6 7.2 19.3 6.6 20.8 6.6C22 6.5 23 6.8 23.8 7.1L24.2 7.3L25 5Z"
      fill="#1a1f71"
    />
  </Svg>
);

// Mastercard circles
const MastercardLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EB001B' }} />
    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#F79E1B', marginLeft: -9 }} />
  </View>
);

// ─── TYPES ───────────────────────────────────────────────────────────────────

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'unknown';
type OtherMethod = 'wallet' | 'cash';

interface SavedCard {
  id: string;
  network: CardNetwork;
  last4: string;
  name: string;
  expiry: string;
  isDefault: boolean;
}

const MOCK_CARDS: SavedCard[] = [
  { id: '1', network: 'visa',       last4: '4242', name: 'Juan Pérez', expiry: '12/26', isDefault: true  },
  { id: '2', network: 'mastercard', last4: '8890', name: 'Juan Pérez', expiry: '05/25', isDefault: false },
];

const CARD_GRADIENTS: Record<CardNetwork, string[]> = {
  visa:       ['#1a1f71', '#2d3a8c'],
  mastercard: ['#1a1a2e', '#374151'],
  amex:       ['#1d4ed8', '#1e3a8a'],
  unknown:    ['#334155', '#1e293b'],
};

const CARD_NETWORK_LABEL: Record<CardNetwork, string> = {
  visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', unknown: 'Tarjeta',
};

// ─── RADIO BUTTON ─────────────────────────────────────────────────────────────

const RadioBtn = ({ selected }: { selected: boolean }) => (
  <View style={[styles.radio, selected && styles.radioSelected]}>
    {selected && <View style={styles.radioDot} />}
  </View>
);

// ─── CARD NETWORK BADGE ───────────────────────────────────────────────────────

const CardBadge = ({ network }: { network: CardNetwork }) => (
  <LinearGradient
    colors={CARD_GRADIENTS[network] as [string, string]}
    style={styles.cardBadge}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    {network === 'visa'       && <VisaLogo />}
    {network === 'mastercard' && <MastercardLogo />}
    {network === 'amex'       && <Text style={styles.amexText}>AMEX</Text>}
    {network === 'unknown'    && <Text style={styles.amexText}>CARD</Text>}
  </LinearGradient>
);

// ─── ANIMATED CARD ROW ────────────────────────────────────────────────────────

const CardRow = ({
  card, selected, onSelect, onDelete, delay,
}: {
  card: SavedCard;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  delay: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
    }}>
      <TouchableOpacity
        style={[styles.cardRow, selected && styles.cardRowSelected]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <CardBadge network={card.network} />

        <View style={styles.cardRowText}>
          <Text style={styles.cardRowTitle}>
            {CARD_NETWORK_LABEL[card.network]} •••• {card.last4}
          </Text>
          <Text style={styles.cardRowSub}>Vence {card.expiry}</Text>
        </View>

        <View style={styles.cardRowRight}>
          {selected ? (
            <View style={styles.radioFilled}>
              <CheckIcon />
            </View>
          ) : (
            <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <TrashIcon />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── OTHER METHOD ROW ─────────────────────────────────────────────────────────

const OtherRow = ({
  icon, title, sub, selected, onSelect, delay,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 60, friction: 8, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
    }}>
      <TouchableOpacity
        style={[styles.otherRow, selected && styles.otherRowSelected]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <View style={[styles.otherIcon, selected && styles.otherIconSelected]}>
          {icon}
        </View>
        <View style={styles.otherText}>
          <Text style={styles.otherTitle}>{title}</Text>
          <Text style={styles.otherSub}>{sub}</Text>
        </View>
        {selected ? (
          <View style={styles.radioFilled}><CheckIcon /></View>
        ) : (
          <RadioBtn selected={false} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function PaymentMethods({ navigation }: Props) {
  const [cards, setCards]             = useState<SavedCard[]>(MOCK_CARDS);
  const [selectedCard, setSelectedCard] = useState<string>('1');
  const [selectedOther, setSelectedOther] = useState<OtherMethod | null>(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(footerAnim, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
    ]).start();
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const stored = await AsyncStorage.getItem('paymentMethods');
      if (stored) {
        const parsed: SavedCard[] = JSON.parse(stored);
        setCards(parsed);
        const def = parsed.find(c => c.isDefault);
        if (def) setSelectedCard(def.id);
      }
    } catch {}
  };

  const handleSelectCard = (id: string) => {
    setSelectedCard(id);
    setSelectedOther(null);
  };

  const handleSelectOther = (method: OtherMethod) => {
    setSelectedOther(method);
    setSelectedCard('');
  };

  const handleDeleteCard = (id: string) => {
    Alert.alert('Eliminar tarjeta', '¿Deseas eliminar esta tarjeta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const updated = cards.filter(c => c.id !== id);
          setCards(updated);
          if (selectedCard === id) {
            setSelectedCard(updated[0]?.id ?? '');
          }
          await AsyncStorage.setItem('paymentMethods', JSON.stringify(updated));
        },
      },
    ]);
  };

  const handleConfirm = async () => {
    if (!selectedCard && !selectedOther) {
      Alert.alert('Selecciona un método', 'Por favor elige un método de pago para continuar.');
      return;
    }

    const label = selectedCard
      ? (() => {
          const c = cards.find(x => x.id === selectedCard);
          return c ? `${CARD_NETWORK_LABEL[c.network]} •••• ${c.last4}` : '';
        })()
      : selectedOther === 'wallet' ? 'Apple / Google Pay' : 'Efectivo';

    // Save default
    if (selectedCard) {
      const updated = cards.map(c => ({ ...c, isDefault: c.id === selectedCard }));
      setCards(updated);
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updated));
    }

    Alert.alert('✓ Método confirmado', `Pagarás con: ${label}`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const selectedLabel = selectedCard
    ? (() => { const c = cards.find(x => x.id === selectedCard); return c ? `${CARD_NETWORK_LABEL[c.network]} ••${c.last4}` : ''; })()
    : selectedOther === 'wallet' ? 'Apple/Google Pay' : selectedOther === 'cash' ? 'Efectivo' : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fafafa" />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Métodos de Pago</Text>
        <View style={{ width: 42 }} />
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── TARJETAS GUARDADAS ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Tarjetas Guardadas</Text>

        {cards.map((card, i) => (
          <CardRow
            key={card.id}
            card={card}
            selected={selectedCard === card.id}
            onSelect={() => handleSelectCard(card.id)}
            onDelete={() => handleDeleteCard(card.id)}
            delay={i * 70}
          />
        ))}

        {/* Add card dashed button */}
        <TouchableOpacity
          style={styles.addCardBtn}
          onPress={() => navigation.navigate('AddCard')}
          activeOpacity={0.75}
        >
          <View style={styles.addCardIcon}>
            <PlusIcon />
          </View>
          <Text style={styles.addCardText}>Añadir Nueva Tarjeta</Text>
        </TouchableOpacity>

        {/* ── OTRAS FORMAS DE PAGO ────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Otras formas de pago</Text>

        <OtherRow
          icon={<WalletIcon />}
          title="Apple / Google Pay"
          sub="Billetera digital rápida"
          selected={selectedOther === 'wallet'}
          onSelect={() => handleSelectOther('wallet')}
          delay={180}
        />
        <OtherRow
          icon={<CashIcon />}
          title="Efectivo"
          sub="Paga al recibir tu pedido"
          selected={selectedOther === 'cash'}
          onSelect={() => handleSelectOther('cash')}
          delay={240}
        />

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── FOOTER FIXED ───────────────────────────────────────── */}
      <Animated.View style={[styles.footer, {
        opacity: footerAnim,
        transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
      }]}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.87}>
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.confirmGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.confirmText}>Confirmar Selección</Text>
            {selectedLabel && (
              <View style={styles.confirmBadge}>
                <Text style={styles.confirmBadgeText}>{selectedLabel}</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.securityRow}>
          <ShieldIcon />
          <Text style={styles.securityText}>
            Tus datos de pago están protegidos con{'\n'}encriptación de grado bancario.
          </Text>
        </View>
      </Animated.View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  // Card row
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  cardRowSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    shadowColor: '#22c55e',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  cardBadge: {
    width: 58,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amexText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardRowText: {
    flex: 1,
  },
  cardRowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  cardRowSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  cardRowRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Radio
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#22c55e',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  radioFilled: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  // Add card button
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#dcfce7',
    borderStyle: 'dashed',
    paddingVertical: 16,
    marginTop: 4,
  },
  addCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22c55e',
  },

  // Other methods
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  otherRowSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    shadowColor: '#22c55e',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  otherIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherIconSelected: {
    backgroundColor: '#dcfce7',
  },
  otherText: {
    flex: 1,
  },
  otherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  otherSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  confirmBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 14,
  },
  confirmGrad: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  confirmText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  confirmBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confirmBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },
});