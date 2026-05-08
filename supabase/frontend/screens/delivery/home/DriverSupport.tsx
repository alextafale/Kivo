// frontend/screens/delivery/home/DriverSupport.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
  FlatList, KeyboardAvoidingView, Platform, Animated, ActivityIndicator,
  Linking, Dimensions, ScrollView, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useTheme } from '../../../application/context/ThemeContext';
import {
  askDriverSupport,
  buildWhatsAppMessage,
  SUPPORT_WHATSAPP,
  type DriverSupportMessage,
  type SupportAction,
} from '../../../../services/driverSupportService';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverSupport'>;
};

// ─── Paleta SOS ───────────────────────────────────────────────────────────────

const R = {
  red: '#EF4444',
  redDark: '#DC2626',
  redDeep: '#991B1B',
  redGlow: '#EF444415',
  redMid: '#B91C1C',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const SendIcon = ({ color }: { color: string }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

const SOSIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v4M12 16h.01" />
  </Svg>
);

const BotIcon = ({ color }: { color: string }) => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3Z" />
    <Path d="M9 14h.01M15 14h.01M9 10h6" />
  </Svg>
);

const LocationIcon = ({ color }: { color: string }) => (
  <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
    <Circle cx="12" cy="9" r="2.5" />
  </Svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  action?: SupportAction | null;
}

const QUICK_SUGGESTIONS = [
  'El cliente no contesta',
  'El restaurante está cerrado',
  'Se me derramó la comida',
  'Tuve un accidente',
  'El pedido está muy lejos',
];

// ─── Pulse Ring ───────────────────────────────────────────────────────────────

const PulseRing = ({ color, size }: { color: string; size: number }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.65, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.delay(700),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
          Animated.delay(700),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
};

// ─── Animated Message Wrapper ─────────────────────────────────────────────────

const AnimatedMessage = ({ children, isUser }: { children: React.ReactNode; isUser: boolean }) => {
  const slideY = useRef(new Animated.Value(18)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(isUser ? 10 : -10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, damping: 20, stiffness: 220, useNativeDriver: true }),
      Animated.spring(slideX, { toValue: 0, damping: 20, stiffness: 220, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideY }, { translateX: slideX }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = ({ isDark }: { isDark: boolean }) => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -7, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(350),
        ])
      ).start();
    });
  }, []);

  return (
    <Animated.View style={[styles.typingContainer, { opacity: fadeIn }]}>
      <View style={[styles.botAvatarSm, { backgroundColor: R.redGlow, borderColor: R.red + '44' }]}>
        <BotIcon color={R.red} />
      </View>
      <View style={[styles.typingBubble, {
        backgroundColor: isDark ? '#180808' : '#FFF5F5',
        borderColor: isDark ? '#330000' : '#FECACA',
        borderLeftColor: R.red,
      }]}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { backgroundColor: R.red, transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Action Button ────────────────────────────────────────────────────────────

const ActionButton = ({ action }: { action: SupportAction }) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, speed: 80, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const handlePress = async () => {
    if (sent || loading) return;
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const url = `whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=${encodeURIComponent(action.whatsappTemplate + '\n\n⚠️ Ubicación no disponible')}`;
        await Linking.openURL(url);
        setSent(true);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const mensaje = buildWhatsAppMessage(action.whatsappTemplate, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      const waUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP}&text=${encodeURIComponent(mensaje)}`;
      const webUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
      const canOpen = await Linking.canOpenURL(waUrl);
      await Linking.openURL(canOpen ? waUrl : webUrl);
      setSent(true);
    } catch (err) {
      console.error('[KivoSOS] Error abriendo WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[styles.actionBtnWrap, { transform: [{ scale: pressScale }] }]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handlePress}
        activeOpacity={1}
        disabled={sent || loading}
      >
        <LinearGradient
          colors={sent ? ['#16A34A', '#15803D'] : [R.redDark, R.redDeep]}
          style={styles.actionBtnGradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              {!sent && <LocationIcon color="#fff" />}
              <Text style={styles.actionBtnText}>
                {sent ? '✓ Soporte notificado' : action.label}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DriverSupport({ navigation }: Props) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola! Soy KivoSOS, tu asistente de soporte logístico.\n\nEstoy aquí para ayudarte en cualquier situación durante tus entregas. ¿Qué está pasando?',
      sender: 'bot',
      timestamp: new Date(),
      action: null,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<DriverSupportMessage[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const sendScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || isTyping) return;

    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.8, useNativeDriver: true, speed: 80, bounciness: 0 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    setShowSuggestions(false);
    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await askDriverSupport(text, history);
      setHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: response.text },
      ]);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        action: response.action,
      };
      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
      scrollToBottom();
    } catch {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'No pude conectarme con KivoSOS. Revisa que estés en la misma red que el servidor e intenta de nuevo.',
          sender: 'bot',
          timestamp: new Date(),
          action: null,
        },
      ]);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <AnimatedMessage isUser={isUser}>
        <View style={[styles.messageContainer, isUser ? styles.userRow : styles.botRow]}>
          {!isUser && (
            <View style={styles.avatarWrap}>
              <View style={[styles.botAvatarSm, { backgroundColor: R.redGlow, borderColor: R.red + '44' }]}>
                <BotIcon color={R.red} />
              </View>
            </View>
          )}

          <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
            {isUser ? (
              <LinearGradient
                colors={[R.redDark, R.redDeep]}
                style={[styles.bubble, styles.userBubble]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.msgText, { color: '#fff', fontWeight: '500' }]}>{item.text}</Text>
                <Text style={[styles.msgTime, { color: 'rgba(255,255,255,0.55)', textAlign: 'right' }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.botBubble, {
                backgroundColor: isDark ? '#180808' : '#FFF5F5',
                borderColor: isDark ? '#2A0808' : '#FECACA',
                borderLeftColor: R.red,
              }]}>
                <Text style={[styles.msgText, { color: isDark ? '#F9FAFB' : '#1F2937' }]}>{item.text}</Text>
                <Text style={[styles.msgTime, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            )}

            {!isUser && item.action && (
              <View style={styles.actionBtnOuter}>
                <ActionButton action={item.action} />
              </View>
            )}
          </View>
        </View>
      </AnimatedMessage>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A0000' : '#FFF5F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* Ambient red glow at top */}
      <LinearGradient
        colors={isDark ? ['#1A0000', '#0A0000', '#0A0000'] : ['#FEE2E2', '#FFF5F5', '#FFF5F5']}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <LinearGradient
        colors={[R.redMid, R.redDeep]}
        style={styles.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <BackIcon color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {/* Avatar with pulse ring */}
          <View style={styles.avatarHeaderWrap}>
            <PulseRing color="rgba(255,255,255,0.6)" size={46} />
            <View style={styles.botAvatarHeader}>
              <SOSIcon size={22} />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>KivoSOS</Text>
            <Text style={styles.headerSub}>Soporte logístico 24/7</Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Gradient accent line */}
      <LinearGradient
        colors={[R.red + '00', R.red + '55', R.red + '00']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.headerAccentLine}
      />

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* Quick suggestions */}
      {showSuggestions && (
        <View style={[styles.suggestionsContainer, {
          backgroundColor: isDark ? '#120404' : '#FFF',
          borderTopColor: isDark ? '#2A0808' : '#FECACA',
        }]}>
          <Text style={[styles.suggestionsLabel, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
            Situaciones frecuentes:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {QUICK_SUGGESTIONS.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.suggestionChip, {
                  backgroundColor: isDark ? R.redGlow : '#FEF2F2',
                  borderColor: isDark ? R.red + '44' : '#FECACA',
                }]}
                onPress={() => handleSend(s)}
                activeOpacity={0.7}
              >
                <Text style={[styles.suggestionChipText, { color: R.redDark }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {isTyping && <TypingIndicator isDark={isDark} />}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.inputBar, {
          backgroundColor: isDark ? '#120404' : '#FFF',
          borderTopColor: inputFocused
            ? R.red + '66'
            : isDark ? '#2A0808' : '#FECACA',
        }]}>
          <View style={[styles.inputWrap, {
            backgroundColor: isDark ? '#1A0000' : '#FFF5F5',
            borderColor: inputFocused
              ? R.red + '99'
              : isDark ? '#2A0808' : '#FECACA',
            shadowColor: inputFocused ? R.red : 'transparent',
            shadowOpacity: inputFocused ? 0.3 : 0,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: inputFocused ? 4 : 0,
          }]}>
            <TextInput
              style={[styles.input, { color: isDark ? '#F9FAFB' : '#1F2937' }]}
              placeholder="Describe tu situación..."
              placeholderTextColor={isDark ? '#4B0000' : '#FCA5A5'}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              multiline
              maxLength={400}
            />
          </View>

          <Animated.View style={[styles.sendBtnWrap, { transform: [{ scale: sendScale }] }]}>
            <TouchableOpacity
              onPress={() => handleSend()}
              activeOpacity={0.9}
              disabled={isTyping || !inputText.trim()}
            >
              <LinearGradient
                colors={inputText.trim() ? [R.redDark, R.redDeep] : [isDark ? '#1A0000' : '#FECACA', isDark ? '#1A0000' : '#FECACA']}
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                {isTyping
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <SendIcon color={inputText.trim() ? '#fff' : (isDark ? '#330000' : '#F87171')} />
                }
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerAccentLine: { height: 1, marginBottom: 4 },
  headerBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarHeaderWrap: {
    width: 46, height: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  botAvatarHeader: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#4ADE80',
    borderWidth: 2, borderColor: R.redMid,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1, fontWeight: '500' },

  // ── Messages ──
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 14 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },

  avatarWrap: { width: 30, alignItems: 'center', paddingBottom: 2 },
  botAvatarSm: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  bubble: { maxWidth: width * 0.78, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { borderBottomRightRadius: 5 },
  botBubble: { borderBottomLeftRadius: 5, borderWidth: 1, borderLeftWidth: 3 },
  msgText: { fontSize: 14.5, lineHeight: 22 },
  msgTime: { fontSize: 10, marginTop: 5 },

  // ── Action Button ──
  actionBtnOuter: { marginTop: 8 },
  actionBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  actionBtnGradient: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 16, paddingVertical: 11,
  },
  actionBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },

  // ── Typing ──
  typingContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 4, gap: 8,
  },
  typingBubble: {
    borderRadius: 18, borderBottomLeftRadius: 5,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderLeftWidth: 3,
  },
  typingDots: { flexDirection: 'row', gap: 5 },
  typingDot: { width: 7, height: 7, borderRadius: 4 },

  // ── Suggestions ──
  suggestionsContainer: {
    paddingTop: 10, paddingBottom: 8,
    borderTopWidth: 1,
  },
  suggestionsLabel: {
    fontSize: 11, fontWeight: '600',
    paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.4,
  },
  suggestionsScroll: { paddingHorizontal: 16, gap: 8 },
  suggestionChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1,
  },
  suggestionChipText: { fontSize: 12.5, fontWeight: '600' },

  // ── Input ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, gap: 10,
  },
  inputWrap: {
    flex: 1, borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, maxHeight: 120,
  },
  input: { fontSize: 14.5, lineHeight: 20 },
  sendBtnWrap: { borderRadius: 22, overflow: 'hidden', marginBottom: 2 },
  sendGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
