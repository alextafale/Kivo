// frontend/screens/delivery/home/DriverSupport.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DriverSupport'>;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const SendIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round">
    <Path d="m22 2-7 20-4-9-9-4Z" />
    <Path d="M22 2 11 13" />
  </Svg>
);

const SOSIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v4M12 16h.01" />
  </Svg>
);

const BotIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round">
    <Path d="M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3Z" />
    <Path d="M9 14h.01M15 14h.01M9 10h6" />
  </Svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface QwenMessage {
  role: string;
  content: string;
}

// ─── Quick Suggestions ────────────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  'El cliente no contesta',
  'El restaurante está cerrado',
  'Se me derramó la comida',
  'Tuve un accidente',
  'El pedido está muy lejos',
];

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
        <BotIcon />
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DriverSupport({ navigation }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '🆘 ¡Hola! Soy KivoSOS, tu asistente de soporte logístico.\n\nEstoy aquí para ayudarte en cualquier situación durante tus entregas. ¿Qué está pasando?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<QwenMessage[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = () =>
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || isTyping) return;

    setShowSuggestions(false);

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
      const apiBase = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
      const res = await fetch(`${apiBase}/api/v1/chatbot/driver-support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error('Error del servidor');

      const data = await res.json();
      const botText = data.content;

      // Actualizar historial para próximas llamadas
      setHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: botText },
      ]);

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
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
          text: 'No pude conectarme. Revisa tu internet e intenta de nuevo. 🔄',
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
            <BotIcon />
          </View>
        )}
        <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          <View style={[
            styles.bubble,
            isUser
              ? styles.userBubble
              : styles.botBubble,
          ]}>
            <Text style={[styles.msgText, { color: isUser ? '#fff' : '#1a1a1a' }]}>
              {item.text}
            </Text>
            <Text style={[styles.msgTime, { color: isUser ? 'rgba(255,255,255,0.6)' : '#9CA3AF', textAlign: isUser ? 'right' : 'left' }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a0000" />

      {/* Header */}
      <LinearGradient
        colors={['#7F1010', '#B91C1C']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.botAvatarHeader}>
            <SOSIcon />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerTitle}>KivoSOS</Text>
            <Text style={styles.headerSub}>Soporte logístico 24/7</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

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

      {/* Quick suggestions */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsLabel}>Situaciones frecuentes:</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_SUGGESTIONS}
            keyExtractor={s => s}
            contentContainerStyle={styles.suggestionsScroll}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => handleSend(item)}
              >
                <Text style={styles.suggestionChipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

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
              placeholder="Describe tu situación..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={400}
            />
          </View>

          <TouchableOpacity
            onPress={() => handleSend()}
            style={styles.sendBtn}
            activeOpacity={0.85}
            disabled={isTyping || !inputText.trim()}
          >
            <LinearGradient
              colors={['#DC2626', '#991B1B']}
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerDivider: { height: 1, backgroundColor: '#FECACA' },
  backBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  botAvatarHeader: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4ADE80',
    borderWidth: 2, borderColor: '#B91C1C',
  },
  headerTitle: {
    fontSize: 16, fontWeight: '800',
    color: '#fff', letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11, color: 'rgba(255,255,255,0.7)',
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
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5, borderColor: '#FECACA',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },

  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#DC2626',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  msgText: { fontSize: 14.5, lineHeight: 22 },
  msgTime: { fontSize: 10, marginTop: 5 },

  // Typing
  typingContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingBottom: 8, gap: 10,
  },
  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 20, borderBottomLeftRadius: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FECACA',
  },
  typingDots: { flexDirection: 'row', gap: 5 },
  typingDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  // Suggestions
  suggestionsContainer: {
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    backgroundColor: '#fff',
  },
  suggestionsLabel: {
    fontSize: 11, color: '#9CA3AF', fontWeight: '600',
    paddingHorizontal: 16, marginBottom: 8,
    letterSpacing: 0.3,
  },
  suggestionsScroll: { paddingHorizontal: 16, gap: 8 },
  suggestionChip: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#FECACA',
  },
  suggestionChipText: {
    fontSize: 12, color: '#DC2626',
    fontWeight: '600',
  },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    maxHeight: 120,
  },
  input: {
    fontSize: 14.5,
    color: '#1F2937',
    lineHeight: 20,
  },
  sendBtn: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  sendGradient: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
});
