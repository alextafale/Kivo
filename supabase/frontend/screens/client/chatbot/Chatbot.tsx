// frontend/screens/chatbot/Chatbot.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import {
  askGemini,
  cargarNegocios,
  Negocio,
  GeminiMessage,
  parsePedidoFromResponse,
} from '../../../../services/geminiService';
import { useCart, ChatbotOrder } from '../../../application/context/CartContext';
import { supabase } from '../../../config/supabaseConfig';
import { useAuth } from '../../../application/context/AuthContext';

const { width } = Dimensions.get('window');

type ChatbotNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chatbot'>;
type Props = { navigation: ChatbotNavigationProp };

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#000000',
  surface: '#000000',
  card: '#0A0A0A',
  border: '#1A1A1A',
  green: '#00FF87',
  greenDark: '#00CC6A',
  greenGlow: '#00FF8710',
  greenSoft: '#00E676',
  textPrimary: '#FFFFFF',
  textSec: '#ffffffff',
  textMuted: '#222222',
  userBubble: '#ffffffff',
  botBubble: '#0A0A0A',
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.textPrimary} strokeWidth="2" strokeLinecap="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const SendIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

const MicIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3" />
  </Svg>
);

const SparkIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round">
    <Path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
  </Svg>
);

const CartIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round">
    <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  pedidoCard?: ChatbotOrder;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -5, duration: 380, delay: i * 130, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 380, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.botAvatar}>
        <SparkIcon />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Pedido Card ──────────────────────────────────────────────────────────────

interface PedidoCardProps {
  pedido: ChatbotOrder;
  onVerCarrito: () => void;
}

const PedidoCard = ({ pedido, onVerCarrito }: PedidoCardProps) => {
  const subtotal = pedido.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const envio = 12;
  const total = subtotal + envio;

  return (
    <View style={styles.pedidoCard}>
      {/* Header */}
      <LinearGradient
        colors={['#0f2d0f', '#0a1a0a']}
        style={styles.pedidoCardHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.pedidoHeaderLeft}>
          <Text style={styles.pedidoHeaderEmoji}>🧾</Text>
          <View>
            <Text style={styles.pedidoHeaderTitle}>Resumen del Pedido</Text>
            <Text style={styles.pedidoHeaderSub}>{pedido.negocio?.nombre}</Text>
          </View>
        </View>
        <View style={styles.pedidoStatusBadge}>
          <CheckIcon />
          <Text style={styles.pedidoStatusText}>Listo</Text>
        </View>
      </LinearGradient>

      {/* Items */}
      <View style={styles.pedidoItems}>
        {pedido.items.map((item, i) => (
          <View key={i} style={styles.pedidoRow}>
            <View style={styles.pedidoQtyBadge}>
              <Text style={styles.pedidoQtyText}>{item.quantity}</Text>
            </View>
            <Text style={styles.pedidoItemText} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.pedidoItemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.pedidoTotales}>
        <View style={styles.pedidoTotalRow}>
          <Text style={styles.pedidoTotalLabel}>Subtotal</Text>
          <Text style={styles.pedidoTotalNum}>${subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.pedidoTotalRow}>
          <Text style={styles.pedidoTotalLabel}>Envío</Text>
          <Text style={styles.pedidoTotalNum}>${envio.toFixed(2)}</Text>
        </View>
        <View style={[styles.pedidoTotalRow, styles.pedidoTotalFinal]}>
          <Text style={styles.pedidoTotalFinalLabel}>Total</Text>
          <Text style={styles.pedidoTotalFinalNum}>${total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Dirección */}
      <View style={styles.pedidoDireccionRow}>
        <Text style={styles.pedidoDireccionIcon}>📍</Text>
        <Text style={styles.pedidoDireccionText} numberOfLines={2}>
          {pedido.direccionEntrega}
        </Text>
      </View>

      {!!pedido.notas && (
        <View style={styles.pedidoNotasRow}>
          <Text style={styles.pedidoDireccionIcon}>📝</Text>
          <Text style={styles.pedidoNotasText}>{pedido.notas}</Text>
        </View>
      )}

      {/* CTA */}
      <TouchableOpacity onPress={onVerCarrito} activeOpacity={0.85} style={styles.carritoBtn}>
        <LinearGradient
          colors={[C.green, C.greenDark]}
          style={styles.carritoBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <CartIcon />
          <Text style={styles.carritoBtnText}>Confirmar en carrito</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Chatbot({ navigation }: Props) {
  const { setChatbotOrder } = useCart();
  const { session } = useAuth();

  const [direccionPredeterminada, setDireccionPredeterminada] = useState('');
  const [domicilioId, setDomicilioId] = useState<string>('');

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
      text: '¡Hola! 👋 Soy KivoBot.\n\nPuedo ayudarte a:\n🍕 Ver menús y precios\n📍 Info de negocios\n🛵 Tomar tu pedido\n\n¿Qué se te antoja hoy?',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['Ver restaurantes', 'Hacer un pedido', '¿Qué hay de comer?'],
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

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const responseText = await askGemini(text, geminiHistory, negocios, direccionPredeterminada);
      const { displayText, pedidoCard } = await procesarRespuesta(responseText);

      setGeminiHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]);

      const botText = pedidoCard
        ? `¡Listo! Tu pedido en ${pedidoCard.negocio?.nombre} está confirmado 🎉\n\nRevisa el resumen abajo y ve al carrito para finalizar.`
        : displayText;

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: pedidoCard ? undefined : ['Ver menú completo', 'Otro restaurante', 'Mis pedidos'],
        pedidoCard,
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
          text: 'Ups, tuve un problema 😅 ¿Puedes intentarlo de nuevo?',
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
      <View style={[styles.messageContainer, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <SparkIcon />
          </View>
        )}

        <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.msgText, isUser ? styles.userText : styles.botText]}>
              {item.text}
            </Text>
            <Text style={[styles.msgTime, isUser ? styles.userTime : styles.botTime]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>

          {item.pedidoCard && (
            <PedidoCard
              pedido={item.pedidoCard}
              onVerCarrito={() => navigation.navigate('Cart')}
            />
          )}

          {!isUser && !item.pedidoCard && item.suggestions && (
            <View style={styles.chips}>
              {item.suggestions.map((s, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => handleSend(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.botAvatarHeader}>
            <SparkIcon />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>KivoBot</Text>
            <Text style={styles.headerSub}>
              {loadingNegocios ? '⏳ Cargando...' : `${negocios.length} negocios disponibles`}
            </Text>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Divider */}
      <View style={styles.headerDivider} />

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

      {isTyping && <TypingIndicator />}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor="#374151"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>

          {inputText.trim() !== '' ? (
            <TouchableOpacity
              onPress={() => handleSend()}
              style={styles.sendBtn}
              activeOpacity={0.85}
              disabled={isTyping}
            >
              <LinearGradient
                colors={[C.green, C.greenDark]}
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isTyping
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <SendIcon />
                }
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn}>
              <MicIcon />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
  },
  headerDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  backBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
    backgroundColor: C.card,
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  botAvatarHeader: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.greenGlow,
    borderWidth: 1.5, borderColor: C.green + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.green,
    borderWidth: 2, borderColor: C.surface,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '700',
    color: C.textPrimary, letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11, color: C.textSec,
    marginTop: 1,
  },

  // Messages
  list: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  messageContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
  },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.greenGlow,
    borderWidth: 1, borderColor: C.green + '33',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },

  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: C.green,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: C.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  msgText: { fontSize: 14.5, lineHeight: 22 },
  userText: { color: '#fff', fontWeight: '500' },
  botText: { color: C.textPrimary },
  msgTime: { fontSize: 10, marginTop: 5 },
  userTime: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  botTime: { color: C.textSec },

  // Chips
  chips: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, marginTop: 10,
  },
  chip: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: C.green + '44',
  },
  chipText: {
    fontSize: 12, color: C.green,
    fontWeight: '600', letterSpacing: 0.2,
  },

  // Typing
  typingContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 8, gap: 10,
  },
  typingBubble: {
    backgroundColor: C.card,
    borderRadius: 20, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: C.border,
  },
  typingDots: { flexDirection: 'row', gap: 5 },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.green,
  },

  // Pedido Card
  pedidoCard: {
    backgroundColor: C.card,
    borderRadius: 20, marginTop: 10,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    maxWidth: width * 0.82,
  },
  pedidoCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  pedidoHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  pedidoHeaderEmoji: { fontSize: 22 },
  pedidoHeaderTitle: {
    fontSize: 13, fontWeight: '700',
    color: C.textPrimary, letterSpacing: 0.2,
  },
  pedidoHeaderSub: {
    fontSize: 11, color: C.green,
    marginTop: 1, fontWeight: '600',
  },
  pedidoStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.greenGlow,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: C.green + '33',
  },
  pedidoStatusText: {
    fontSize: 11, color: C.green, fontWeight: '700',
  },

  pedidoItems: {
    paddingHorizontal: 14, paddingTop: 12, gap: 8,
  },
  pedidoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6,
  },
  pedidoQtyBadge: {
    width: 24, height: 24, borderRadius: 8,
    backgroundColor: C.greenGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.green + '33',
  },
  pedidoQtyText: {
    fontSize: 11, fontWeight: '800', color: C.green,
  },
  pedidoItemText: {
    flex: 1, fontSize: 13, color: C.textPrimary,
  },
  pedidoItemPrice: {
    fontSize: 13, fontWeight: '700', color: C.textPrimary,
  },

  pedidoTotales: {
    marginHorizontal: 14, marginTop: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    paddingTop: 10, gap: 6,
  },
  pedidoTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  pedidoTotalLabel: { fontSize: 12, color: C.textSec },
  pedidoTotalNum: { fontSize: 12, color: C.textPrimary, fontWeight: '600' },
  pedidoTotalFinal: {
    marginTop: 4, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  pedidoTotalFinalLabel: {
    fontSize: 14, fontWeight: '800', color: C.textPrimary,
  },
  pedidoTotalFinalNum: {
    fontSize: 16, fontWeight: '800', color: C.green,
  },

  pedidoDireccionRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 6, marginHorizontal: 14, marginTop: 10,
  },
  pedidoDireccionIcon: { fontSize: 12 },
  pedidoDireccionText: {
    flex: 1, fontSize: 11, color: C.textSec, lineHeight: 16,
  },
  pedidoNotasRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 6, marginHorizontal: 14, marginTop: 4,
  },
  pedidoNotasText: {
    flex: 1, fontSize: 11, color: C.textSec,
  },

  carritoBtn: {
    margin: 14, borderRadius: 14, overflow: 'hidden',
  },
  carritoBtnGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 13,
  },
  carritoBtnText: {
    fontSize: 14, fontWeight: '700', color: '#FFF', letterSpacing: 0.3,
  },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.surface,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1, borderColor: C.border,
  },
  input: {
    fontSize: 14.5, color: C.textPrimary,
    paddingVertical: 0,
  },
  sendBtn: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 2,
  },
  sendGradient: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.card,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    borderWidth: 1, borderColor: C.border,
  },
});