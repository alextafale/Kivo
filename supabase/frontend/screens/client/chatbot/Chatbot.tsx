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
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';
import { useNavigation } from '@react-navigation/native';
import {
  askGemini,
  cargarNegocios,
  guardarPedido,
  enviarPedidoWhatsApp,
  Negocio,
  PedidoEnCurso,
  GeminiMessage,
  parsePedidoFromResponse,
} from '../../../services/geminiService';
import { Order } from '../../types/order';

type ChatbotNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chatbot'>;
type Props = { navigation: ChatbotNavigationProp };

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const SendIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

const MicIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3" />
  </Svg>
);

const BotIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8">
    <Rect x="3" y="8" width="18" height="13" rx="3" />
    <Path d="M9 11v3M15 11v3M8 8V5a4 4 0 0 1 8 0v3" />
    <Circle cx="9" cy="13" r="1" fill="#22c55e" />
    <Circle cx="15" cy="13" r="1" fill="#22c55e" />
  </Svg>
);

const WAIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2">
    <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Svg>
);

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface PedidoConId extends PedidoEnCurso {
  pedidoId: string;
  order: Order;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  pedidoCard?: PedidoConId;
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: -6, duration: 350, delay: i * 120, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.botAvatar}><BotIcon /></View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Pedido Card ──────────────────────────────────────────────────────────────

interface PedidoCardProps {
  pedido: PedidoConId;
  onWhatsApp: () => void;
  onTracking: () => void;
}

const PedidoCard = ({ pedido, onWhatsApp, onTracking }: PedidoCardProps) => {
  const total = pedido.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <View style={styles.pedidoCard}>
      <View style={styles.pedidoHeader}>
        <Text style={styles.pedidoTitle}>🧾 Pedido Confirmado</Text>
        <Text style={styles.pedidoId}>#{pedido.pedidoId.slice(-6).toUpperCase()}</Text>
      </View>

      <Text style={styles.pedidoNegocio}>🏪 {pedido.negocio?.nombre}</Text>

      {pedido.items.map((item, i) => (
        <View key={i} style={styles.pedidoRow}>
          <Text style={styles.pedidoItemText}>{item.quantity}x {item.name}</Text>
          <Text style={styles.pedidoItemPrice}>${item.price * item.quantity}</Text>
        </View>
      ))}

      <View style={styles.pedidoTotalRow}>
        <Text style={styles.pedidoTotalLabel}>Total</Text>
        <Text style={styles.pedidoTotalValue}>${total}</Text>
      </View>

      <Text style={styles.pedidoDireccion}>📍 {pedido.direccionEntrega}</Text>
      {!!pedido.notas && <Text style={styles.pedidoNotas}>📝 {pedido.notas}</Text>}

      <View style={styles.pedidoActions}>
        <TouchableOpacity style={styles.waBtn} onPress={onWhatsApp} activeOpacity={0.85}>
          <WAIcon />
          <Text style={styles.waBtnText}>Enviar al negocio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trackBtn} onPress={onTracking} activeOpacity={0.85}>
          <Text style={styles.trackBtnText}>Ver seguimiento →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Chatbot Screen ───────────────────────────────────────────────────────────

export default function Chatbot({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! 👋 Soy tu asistente de Kivu.\n\nPuedo ayudarte a:\n🍕 Ver menús y precios\n📍 Info de negocios\n🛵 Tomar tu pedido\n\n¿Qué se te antoja hoy?',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['Ver restaurantes', 'Hacer un pedido', '¿Cuál es el horario?'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loadingNegocios, setLoadingNegocios] = useState(true);
  const [geminiHistory, setGeminiHistory] = useState<GeminiMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Cargar negocios al montar
  useEffect(() => {
    cargarNegocios().then(data => {
      setNegocios(data);
      setLoadingNegocios(false);
    });
  }, []);

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

  // ─── Procesar respuesta de Gemini ─────────────────────────────────────────

// Reemplaza la función procesarRespuesta en Chatbot.tsx por esta:

const procesarRespuesta = async (
  responseText: string
): Promise<{ displayText: string; pedidoCard?: PedidoConId }> => {

  const { displayText, pedidoJson } = parsePedidoFromResponse(responseText);

  if (!pedidoJson) return { displayText };

  try {
    // Buscar negocio en la lista local
    const negocio = negocios.find(n => n.id === pedidoJson.negocioId) ?? null;

    if (!negocio) {
      console.warn('Negocio no encontrado para ID:', pedidoJson.negocioId);
      return { displayText };
    }

    const pedido: PedidoEnCurso = {
      negocio,
      items: pedidoJson.items,
      direccionEntrega: pedidoJson.direccionEntrega ?? '',
      notas: pedidoJson.notas ?? '',
    };

    const result = await guardarPedido(pedido);
    if (!result) return { displayText: '⚠️ Error al guardar el pedido. Inténtalo de nuevo.' };

    return {
      displayText,
      pedidoCard: { ...pedido, pedidoId: result.pedidoId, order: result.order },
    };
  } catch (e) {
    console.error('Error en procesarRespuesta:', e);
    return { displayText };
  }
};
  // ─── Enviar mensaje ───────────────────────────────────────────────────────

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
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
      const responseText = await askGemini(text, geminiHistory, negocios);
      const { displayText, pedidoCard } = await procesarRespuesta(responseText);

      setGeminiHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: responseText }] },
      ]);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: displayText,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: pedidoCard
          ? undefined
          : ['Ver menú completo', 'Otro restaurante', 'Mis pedidos'],
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
          text: 'Ups, tuve un problema al conectarme 😅 ¿Puedes intentarlo de nuevo?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  };

  // ─── WhatsApp ─────────────────────────────────────────────────────────────

  const handleWhatsApp = (pedido: PedidoConId) => {
    Alert.alert(
      'Enviar pedido',
      `¿Enviar tu pedido a ${pedido.negocio?.nombre} por WhatsApp?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar ✓',
          onPress: () => enviarPedidoWhatsApp(pedido, pedido.pedidoId),
        },
      ]
    );
  };

  // ─── Navegar a orderTracking con el objeto Order ──────────────────────────
  // Usa el nombre exacto de la ruta en StacNavigation.tsx: 'orderTracking'

  const handleTracking = (order: Order) => {
    navigation.navigate('orderTracking', { order });
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  // ─── Render message ───────────────────────────────────────────────────────

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';

    return (
      <View style={[styles.messageContainer, isUser ? styles.userRow : styles.botRow]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <BotIcon />
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

          {/* Pedido card */}
          {item.pedidoCard && (
            <PedidoCard
              pedido={item.pedidoCard}
              onWhatsApp={() => handleWhatsApp(item.pedidoCard!)}
              onTracking={() => handleTracking(item.pedidoCard!.order)}
            />
          )}

          {/* Suggestion chips */}
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

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#22c55e', '#16a34a']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatarWrap}>
            <BotIcon />
          </View>
          <View>
            <Text style={styles.headerTitle}>Asistente Kivu</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, loadingNegocios && styles.statusDotLoading]} />
              <Text style={styles.headerSub}>
                {loadingNegocios ? 'Cargando negocios...' : `${negocios.length} negocios activos`}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Lista de mensajes */}
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
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>

          {inputText.trim() !== '' ? (
            <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
  container: { flex: 1, backgroundColor: '#F0F4F0' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A7F3D0' },
  statusDotLoading: { backgroundColor: '#FCD34D' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  // Messages
  list: { paddingHorizontal: 14, paddingVertical: 16, gap: 12 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },

  botAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0',
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },

  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: '#22c55e', borderBottomRightRadius: 4 },
  botBubble: {
    backgroundColor: '#FFF', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  msgText: { fontSize: 15, lineHeight: 21 },
  userText: { color: '#FFF' },
  botText: { color: '#1F2937' },
  msgTime: { fontSize: 10, marginTop: 4 },
  userTime: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  botTime: { color: '#9CA3AF' },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  chip: {
    backgroundColor: '#F0FDF4', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  chipText: { fontSize: 12, color: '#15803d', fontWeight: '600' },

  // Pedido Card
  pedidoCard: {
    backgroundColor: '#FFF', borderRadius: 16,
    padding: 16, marginTop: 10,
    borderWidth: 1.5, borderColor: '#BBF7D0',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    maxWidth: 300,
  },
  pedidoHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  pedidoTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  pedidoId: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  pedidoNegocio: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  pedidoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  pedidoItemText: { fontSize: 13, color: '#374151' },
  pedidoItemPrice: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  pedidoTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    paddingTop: 8, marginTop: 6, marginBottom: 8,
  },
  pedidoTotalLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  pedidoTotalValue: { fontSize: 16, fontWeight: '800', color: '#16a34a' },
  pedidoDireccion: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  pedidoNotas: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  pedidoActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 10,
  },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  trackBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 12,
    paddingVertical: 10, borderWidth: 1, borderColor: '#BBF7D0',
  },
  trackBtnText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },

  // Typing
  typingContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingBottom: 12, gap: 8,
  },
  typingBubble: {
    backgroundColor: '#FFF', borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  typingDots: { flexDirection: 'row', gap: 5 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  inputWrap: {
    flex: 1, backgroundColor: '#F9FAFB',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8,
    maxHeight: 100, borderWidth: 1, borderColor: '#E5E7EB',
  },
  input: { fontSize: 15, color: '#111', paddingVertical: 2 },
  sendBtn: { borderRadius: 22, overflow: 'hidden', marginBottom: 2 },
  sendGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  micBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 2, borderWidth: 1, borderColor: '#BBF7D0',
  },
});