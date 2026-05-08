// frontend/screens/chatbot/Chatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
  FlatList, KeyboardAvoidingView, Platform, Animated, ActivityIndicator,
  Dimensions, ScrollView, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import {
  askGemini, cargarNegocios, cargarSugerenciasPersonalizadas,
  crearSesionChat, guardarMensaje, cargarMensajesSesion,
  Negocio, GeminiMessage, parsePedidoFromResponse,
} from '../../../../services/geminiService';
import { useCart, ChatbotOrder } from '../../../application/context/CartContext';
import { supabase } from '../../../config/supabaseConfig';
import { useAuth } from '../../../application/context/AuthContext';
import { useTheme } from '../../../application/context/ThemeContext';

const { width } = Dimensions.get('window');

type ChatbotNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chatbot'>;
type ChatbotRouteProp = RouteProp<RootStackParamList, 'Chatbot'>;
type Props = { navigation: ChatbotNavigationProp; route: ChatbotRouteProp };

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  pedidoCard?: ChatbotOrder;
}

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

const MicIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3" />
  </Svg>
);

// ─── Animated Robot Avatar ────────────────────────────────────────────────────

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RobotAvatar = ({ color, size = 20 }: { color: string; size?: number }) => {
  const eyeR = useRef(new Animated.Value(1.5)).current;
  const antennaR = useRef(new Animated.Value(1.5)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Float up/down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -2.5, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Antenna pulsing radius
    Animated.loop(
      Animated.sequence([
        Animated.timing(antennaR, { toValue: 2.3, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(antennaR, { toValue: 1.5, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();

    // Eyes blink at random intervals
    const blink = () => {
      Animated.sequence([
        Animated.timing(eyeR, { toValue: 0.15, duration: 70, useNativeDriver: false }),
        Animated.timing(eyeR, { toValue: 1.5, duration: 110, useNativeDriver: false }),
      ]).start(() => setTimeout(blink, 2200 + Math.random() * 2500));
    };
    const t = setTimeout(blink, 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: floatY }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Antenna stem */}
        <Path d="M12 6V3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        {/* Antenna tip — pulsing */}
        <AnimatedCircle cx="12" cy="3" r={antennaR} fill={color} />
        {/* Head */}
        <Rect x="3" y="6" width="18" height="14" rx="3.5"
          stroke={color} strokeWidth="1.8" fill="none" />
        {/* Eyes — blink */}
        <AnimatedCircle cx="9" cy="12" r={eyeR} fill={color} />
        <AnimatedCircle cx="15" cy="12" r={eyeR} fill={color} />
        {/* Mouth / grill */}
        <Rect x="8" y="15" width="8" height="2" rx="1" fill={color} />
        {/* Side bolts */}
        <Path d="M3 10.5H1.5M22.5 10.5H21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
};

const CartIcon = ({ color }: { color: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const CheckIcon = ({ color }: { color: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const HistoryIcon = ({ color }: { color: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5" />
    <Path d="M12 7v5l4 2" />
  </Svg>
);

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
          Animated.delay(600),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
          Animated.delay(600),
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

// ─── Rich Message Text ────────────────────────────────────────────────────────
// Parses bot responses: **bold**, bullet lines (• or -), numbered lists.

function parseInline(text: string, color: string, bold: boolean = false): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700', color }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i} style={{ fontWeight: bold ? '600' : '400', color }}>{part}</Text>;
  });
}

const MessageText = ({ text, color, dimColor }: { text: string; color: string; dimColor: string }) => {
  const lines = text.split('\n');

  return (
    <View style={{ gap: 2 }}>
      {lines.map((line, i) => {
        const t = line.trim();

        // Empty line → small spacer
        if (!t) return <View key={i} style={{ height: 5 }} />;

        // Bullet (• or -)
        if (t.startsWith('• ') || t.startsWith('- ')) {
          const content = t.slice(2);
          return (
            <View key={i} style={msgStyles.bulletRow}>
              <View style={[msgStyles.bulletDot, { backgroundColor: color }]} />
              <Text style={[msgStyles.bulletText, { color }]}>
                {parseInline(content, color)}
              </Text>
            </View>
          );
        }

        // Numbered list (1. text)
        const numMatch = t.match(/^(\d+)\.\s(.+)$/);
        if (numMatch) {
          return (
            <View key={i} style={msgStyles.bulletRow}>
              <Text style={[msgStyles.numLabel, { color: dimColor }]}>{numMatch[1]}.</Text>
              <Text style={[msgStyles.bulletText, { color }]}>
                {parseInline(numMatch[2], color)}
              </Text>
            </View>
          );
        }

        // Section header: line ending with ':' and no period before
        if (t.endsWith(':') && t.length < 60) {
          return (
            <Text key={i} style={[msgStyles.sectionHeader, { color: dimColor }]}>
              {t}
            </Text>
          );
        }

        // Regular line
        return (
          <Text key={i} style={[msgStyles.lineText, { color }]}>
            {parseInline(t, color)}
          </Text>
        );
      })}
    </View>
  );
};

const msgStyles = StyleSheet.create({
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 1 },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  bulletText: { flex: 1, fontSize: 14.5, lineHeight: 22 },
  numLabel: { fontSize: 12, fontWeight: '700', marginTop: 4, minWidth: 18, textAlign: 'right' },
  sectionHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4, marginBottom: 2 },
  lineText: { fontSize: 14.5, lineHeight: 22 },
});

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = () => {
  const { colors } = useTheme();
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
      <View style={[styles.botAvatarSm, { backgroundColor: colors.greenGlow }]}>
        <RobotAvatar color={colors.green} size={16} />
      </View>
      <View style={[styles.typingBubble, {
        backgroundColor: colors.botBubble,
        borderColor: colors.border,
        borderLeftColor: colors.green,
      }]}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { backgroundColor: colors.green, transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Pedido Card ──────────────────────────────────────────────────────────────

interface PedidoCardProps { pedido: ChatbotOrder; onVerCarrito: () => void }

const ArrowIcon = ({ color }: { color: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M5 12h14M12 5l7 7-7 7" />
  </Svg>
);

const PinIcon = ({ color }: { color: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
    <Circle cx="12" cy="9" r="2.5" />
  </Svg>
);

const NoteIcon = ({ color }: { color: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </Svg>
);

const PedidoCard = ({ pedido, onVerCarrito }: PedidoCardProps) => {
  const { colors, isDark } = useTheme();
  const subtotal = pedido.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const envio = 12;
  const total = subtotal + envio;

  // Entry animation
  const entryScale = useRef(new Animated.Value(0.93)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entryScale, { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }),
      Animated.timing(entryOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const onPressIn = () =>
    Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, speed: 80, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const initials = (pedido.negocio?.nombre ?? '?')
    .split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <Animated.View style={[
      styles.pedidoCard,
      { backgroundColor: colors.card, borderColor: colors.border },
      { opacity: entryOpacity, transform: [{ scale: entryScale }] },
    ]}>
      {/* Restaurant header */}
      <View style={[styles.pedidoRestaurantRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.pedidoInitialsCircle, { backgroundColor: colors.greenGlow }]}>
          <Text style={[styles.pedidoInitialsText, { color: colors.green }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pedidoRestaurantLabel, { color: colors.textSec }]}>Pedido en</Text>
          <Text style={[styles.pedidoRestaurantName, { color: colors.textPrimary }]} numberOfLines={1}>
            {pedido.negocio?.nombre}
          </Text>
        </View>
        <View style={[styles.pedidoReadyBadge, { backgroundColor: colors.greenGlow }]}>
          <CheckIcon color={colors.green} />
          <Text style={[styles.pedidoReadyText, { color: colors.green }]}>Listo</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.pedidoItems}>
        {pedido.items.map((item, i) => (
          <View key={i} style={[
            styles.pedidoRow,
            { borderBottomColor: colors.border },
            i < pedido.items.length - 1 && styles.pedidoRowDivider,
          ]}>
            <View style={[styles.pedidoQtyBadge, { backgroundColor: colors.greenGlow }]}>
              <Text style={[styles.pedidoQtyText, { color: colors.green }]}>{item.quantity}</Text>
            </View>
            <Text style={[styles.pedidoItemText, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.pedidoItemPrice, { color: colors.textSec }]}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Breakdown */}
      <View style={[styles.pedidoBreakdown, { borderTopColor: colors.border }]}>
        <View style={styles.pedidoBreakdownRow}>
          <Text style={[styles.pedidoBreakdownLabel, { color: colors.textSec }]}>Subtotal</Text>
          <Text style={[styles.pedidoBreakdownVal, { color: colors.textSec }]}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.pedidoBreakdownRow}>
          <Text style={[styles.pedidoBreakdownLabel, { color: colors.textSec }]}>Envío</Text>
          <Text style={[styles.pedidoBreakdownVal, { color: colors.textSec }]}>${envio.toFixed(2)}</Text>
        </View>
      </View>

      {/* Total highlight row */}
      <View style={[styles.pedidoTotalStrip, { backgroundColor: colors.greenGlow, borderColor: colors.border }]}>
        <Text style={[styles.pedidoTotalStripLabel, { color: colors.textPrimary }]}>Total</Text>
        <Text style={[styles.pedidoTotalStripValue, { color: colors.green }]}>${total.toFixed(2)}</Text>
      </View>

      {/* Delivery address */}
      <View style={[styles.pedidoMetaRow, { borderTopColor: colors.border }]}>
        <PinIcon color={colors.green} />
        <Text style={[styles.pedidoMetaText, { color: colors.textSec }]} numberOfLines={2}>
          {pedido.direccionEntrega}
        </Text>
      </View>

      {!!pedido.notas && (
        <View style={[styles.pedidoMetaRow, { paddingTop: 2, paddingBottom: 12, borderTopWidth: 0 }]}>
          <NoteIcon color={colors.textSec} />
          <Text style={[styles.pedidoMetaText, { color: colors.textSec }]}>{pedido.notas}</Text>
        </View>
      )}

      {/* CTA */}
      <Animated.View style={[styles.carritoBtnWrap, { transform: [{ scale: pressScale }] }]}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onVerCarrito}
          activeOpacity={1}
        >
          <LinearGradient
            colors={[colors.green, colors.greenDark]}
            style={styles.carritoBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.carritoBtnText, { color: isDark ? '#000' : '#fff' }]}>
              Ir al carrito
            </Text>
            <ArrowIcon color={isDark ? '#000' : '#fff'} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Chatbot({ navigation, route }: Props) {
  const { colors, isDark } = useTheme();
  const { setChatbotOrder } = useCart();
  const { session } = useAuth();
  const sesionIdRef = useRef<string | null>(route?.params?.sesionId ?? null);

  const [direccionPredeterminada, setDireccionPredeterminada] = useState('');
  const [domicilioId, setDomicilioId] = useState<string>('');
  const [inputFocused, setInputFocused] = useState(false);
  const sendScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!session?.userId) return;
    supabase
      .from('domicilios')
      .select('id, calle, numero_ext, colonia, ciudad')
      .eq('user_id', session.userId)
      .eq('es_predeterminado', true)
      .eq('activo', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDomicilioId(data.id);
          setDireccionPredeterminada(
            `${data.calle} ${data.numero_ext ?? ''}, ${data.colonia}, ${data.ciudad}`.trim()
          );
        }
      });
  }, [session?.userId]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola, soy KivoBot.\n\nPuedo ayudarte con:\n- Ver menús y precios\n- Información de negocios\n- Tomar tu pedido\n\n¿Qué quieres hoy?',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['Ver restaurantes', 'Quiero ordenar', 'Que hay de comer'],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loadingNegocios, setLoadingNegocios] = useState(true);
  const [geminiHistory, setGeminiHistory] = useState<GeminiMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    cargarNegocios().then(data => {
      setNegocios(data);
      setLoadingNegocios(false);
    });
  }, []);

  useEffect(() => {
    if (!session?.userId) return;
    cargarSugerenciasPersonalizadas(session.userId).then(sugerencias => {
      setMessages(prev =>
        prev.map(msg => msg.id === '1' ? { ...msg, suggestions: sugerencias } : msg)
      );
    });
  }, [session?.userId]);

  useEffect(() => {
    if (!session?.userId) return;
    const init = async () => {
      const idFromRoute = route?.params?.sesionId;
      if (idFromRoute) {
        sesionIdRef.current = idFromRoute;
        const guardados = await cargarMensajesSesion(idFromRoute);
        if (guardados.length > 0) {
          setMessages(guardados.map(m => ({
            id: m.id,
            text: m.content,
            sender: m.role as 'user' | 'bot',
            timestamp: new Date(m.created_at),
            suggestions: m.suggestions ?? undefined,
            pedidoCard: m.pedido_card ?? undefined,
          })));
          setGeminiHistory(guardados.map(m => ({
            role: (m.role === 'bot' ? 'model' : 'user') as 'user' | 'model',
            parts: [{ text: m.content }],
          })));
        }
      } else {
        const newId = await crearSesionChat(session.userId);
        sesionIdRef.current = newId;
      }
    };
    init();
  }, [session?.userId]);

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

  const procesarRespuesta = async (
    responseText: string
  ): Promise<{ displayText: string; pedidoCard?: ChatbotOrder }> => {
    const { displayText, pedidoJson } = parsePedidoFromResponse(responseText);
    if (!pedidoJson) return { displayText };
    const negocio = negocios.find(n => n.id === pedidoJson.negocioId) ?? null;
    if (!negocio) return { displayText };
    const chatbotOrder: ChatbotOrder = {
      negocio: {
        id: negocio.id,
        nombre: negocio.nombre,
        whatsapp: negocio.whatsapp,
        telefono: negocio.telefono,
        direccion: negocio.direccion,
      },
      items: pedidoJson.items,
      direccionEntrega: pedidoJson.direccionEntrega || direccionPredeterminada,
      notas: pedidoJson.notas ?? '',
      sucursalId: (negocio as any).sucursalId ?? '',
      domicilioId,
    };
    setChatbotOrder(chatbotOrder);
    return { displayText, pedidoCard: chatbotOrder };
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || isTyping) return;

    // Animate send button
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.8, useNativeDriver: true, speed: 80, bounciness: 0 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    if (sesionIdRef.current) guardarMensaje(sesionIdRef.current, 'user', text);

    try {
      const responseText = await askGemini(text, geminiHistory, negocios, direccionPredeterminada);
      const { displayText, pedidoCard } = await procesarRespuesta(responseText);

      setGeminiHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]);

      const botText = pedidoCard
        ? `Pedido armado en **${pedidoCard.negocio?.nombre}**.\n\nRevisa el resumen y ve al carrito para confirmar.`
        : displayText;

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: pedidoCard ? undefined : ['Ver menu completo', 'Otro restaurante', 'Mis pedidos'],
        pedidoCard,
      };

      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
      scrollToBottom();

      if (sesionIdRef.current) {
        guardarMensaje(sesionIdRef.current, 'bot', botText, botMsg.suggestions, pedidoCard ?? undefined);
      }
    } catch {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Hubo un problema al responder. Intenta de nuevo.',
          sender: 'bot',
          timestamp: new Date(),
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
              <View style={[styles.botAvatarSm, { backgroundColor: colors.greenGlow }]}>
                <RobotAvatar color={colors.green} size={16} />
              </View>
            </View>
          )}

          <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
            {/* Bubble */}
            {isUser ? (
              <LinearGradient
                colors={[colors.green, colors.greenDark]}
                style={[styles.bubble, styles.userBubble]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <MessageText
                  text={item.text}
                  color={isDark ? '#000' : '#fff'}
                  dimColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
                />
                <Text style={[styles.msgTime, { color: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)', textAlign: 'right', marginTop: 6 }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.botBubble, {
                backgroundColor: colors.botBubble,
                borderColor: colors.border,
                borderLeftColor: colors.green,
              }]}>
                <MessageText
                  text={item.text}
                  color={colors.textPrimary}
                  dimColor={colors.textSec}
                />
                <Text style={[styles.msgTime, { color: colors.textSec, marginTop: 6 }]}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
            )}

            {/* Pedido card */}
            {item.pedidoCard && (
              <PedidoCard
                pedido={item.pedidoCard}
                onVerCarrito={() => navigation.navigate('Cart')}
              />
            )}

            {/* Suggestion chips */}
            {!isUser && !item.pedidoCard && item.suggestions && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContent}
              >
                {item.suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.chip, {
                      backgroundColor: isDark ? colors.greenGlow : colors.greenGlow,
                      borderColor: colors.green + (isDark ? '55' : '66'),
                    }]}
                    onPress={() => handleSend(s)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: colors.green }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </AnimatedMessage>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Ambient background gradient */}
      <LinearGradient
        colors={isDark
          ? ['#001408', colors.bg, colors.bg]
          : ['#F0FFF4', colors.bg, colors.bg]}
        locations={[0, 0.28, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <BackIcon color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {/* Avatar with pulse ring */}
          <View style={styles.avatarHeaderWrap}>
            <PulseRing color={colors.green} size={46} />
            <View style={[styles.botAvatarHeader, { backgroundColor: colors.greenGlow, borderColor: colors.green + '55' }]}>
              <RobotAvatar color={colors.green} size={22} />
            </View>
            <View style={[styles.onlineDot, { backgroundColor: colors.green, borderColor: colors.bg }]} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>KivoBot</Text>
            <Text style={[styles.headerSub, { color: colors.green }]}>
              {loadingNegocios ? 'Cargando...' : `${negocios.length} negocios · En línea`}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('ChatHistorial')}
          activeOpacity={0.7}
        >
          <HistoryIcon color={colors.green} />
        </TouchableOpacity>
      </View>

      {/* Divider with gradient accent */}
      <LinearGradient
        colors={[colors.green + '00', colors.green + '44', colors.green + '00']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.headerAccentLine}
      />

      {/* FlatList + Input share the KeyboardAvoidingView so the list shrinks when keyboard opens */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />

        {isTyping && <TypingIndicator />}

        {/* Input */}
        <View style={[styles.inputBar, {
          backgroundColor: colors.surface,
          borderTopColor: inputFocused ? colors.green + '44' : colors.border,
        }]}>
          <View style={[styles.inputWrap, {
            backgroundColor: colors.card,
            borderColor: inputFocused ? colors.green + '88' : colors.border,
            shadowColor: inputFocused ? colors.green : 'transparent',
            shadowOpacity: inputFocused ? 0.25 : 0,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            elevation: inputFocused ? 4 : 0,
          }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.placeholderText}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              blurOnSubmit={false}
            />
          </View>

          {inputText.trim() !== '' ? (
            <Animated.View style={[styles.sendBtnWrap, { transform: [{ scale: sendScale }] }]}>
              <TouchableOpacity
                onPress={() => handleSend()}
                activeOpacity={0.9}
                disabled={isTyping}
              >
                <LinearGradient
                  colors={[colors.green, colors.greenDark]}
                  style={styles.sendGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  {isTyping
                    ? <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
                    : <SendIcon color={isDark ? '#000' : '#fff'} />
                  }
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              style={[styles.micBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <MicIcon color={colors.green} />
            </TouchableOpacity>
          )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAccentLine: {
    height: 1,
    marginBottom: 4,
  },
  iconBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatarHeaderWrap: {
    width: 46, height: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  botAvatarHeader: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 2,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11, marginTop: 1, fontWeight: '500',
  },

  // ── Messages ──
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 14,
  },
  messageContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
  },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },

  avatarWrap: {
    width: 30,
    alignItems: 'center',
    paddingBottom: 2,
  },
  botAvatarSm: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },

  bubble: {
    maxWidth: width * 0.78,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  botBubble: {
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  msgText: { fontSize: 14.5, lineHeight: 22 },
  msgTime: { fontSize: 10, marginTop: 5 },

  // ── Chips ──
  chipsScroll: {
    marginTop: 8,
    maxHeight: 44,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12.5, fontWeight: '600', letterSpacing: 0.2,
  },

  // ── Typing ──
  typingContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 4, gap: 8,
  },
  typingBubble: {
    borderRadius: 18, borderBottomLeftRadius: 5,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1,
    borderLeftWidth: 3,
  },
  typingDots: { flexDirection: 'row', gap: 5 },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
  },

  // ── Pedido Card ──
  pedidoCard: {
    borderRadius: 18, marginTop: 10,
    borderWidth: 1, overflow: 'hidden',
    maxWidth: width * 0.84,
  },
  pedidoRestaurantRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1,
  },
  pedidoInitialsCircle: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pedidoInitialsText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  pedidoRestaurantLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 1 },
  pedidoRestaurantName: { fontSize: 14, fontWeight: '700' },
  pedidoReadyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4,
  },
  pedidoReadyText: { fontSize: 11, fontWeight: '700' },

  pedidoItems: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4 },
  pedidoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  pedidoRowDivider: { borderBottomWidth: 1 },
  pedidoQtyBadge: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  pedidoQtyText: { fontSize: 12, fontWeight: '800' },
  pedidoItemText: { flex: 1, fontSize: 13, fontWeight: '500' },
  pedidoItemPrice: { fontSize: 13, fontWeight: '600' },

  pedidoBreakdown: {
    marginHorizontal: 14, borderTopWidth: 1,
    paddingTop: 10, paddingBottom: 6, gap: 4,
  },
  pedidoBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pedidoBreakdownLabel: { fontSize: 12 },
  pedidoBreakdownVal: { fontSize: 12 },

  pedidoTotalStrip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 14, marginTop: 8, marginBottom: 4,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1,
  },
  pedidoTotalStripLabel: { fontSize: 14, fontWeight: '700' },
  pedidoTotalStripValue: { fontSize: 18, fontWeight: '800' },

  pedidoMetaRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 6, marginHorizontal: 14, paddingTop: 10, paddingBottom: 10,
    borderTopWidth: 1,
  },
  pedidoMetaText: { flex: 1, fontSize: 11.5, lineHeight: 16 },

  carritoBtnWrap: { margin: 14, marginTop: 6, borderRadius: 14, overflow: 'hidden' },
  carritoBtnGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 13,
  },
  carritoBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  // ── Input ──
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
  },
  input: {
    fontSize: 14.5,
    paddingVertical: 0,
  },
  sendBtnWrap: { borderRadius: 22, overflow: 'hidden', marginBottom: 2 },
  sendGradient: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1,
  },
});
