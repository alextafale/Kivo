// frontend/screens/chatbot/ChatHistorial.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { cargarSesionesPrevias, SesionResumen } from '../../../../services/geminiService';
import { useAuth } from '../../../application/context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ChatHistorial'>;
};

// ─── Paleta (igual que Chatbot) ───────────────────────────────────────────────
const C = {
  bg: '#000000',
  card: '#0A0A0A',
  border: '#1A1A1A',
  green: '#00FF87',
  greenDark: '#00CC6A',
  greenGlow: '#00FF8710',
  textPrimary: '#FFFFFF',
  textSec: '#888888',
  textMuted: '#333333',
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.textPrimary} strokeWidth="2" strokeLinecap="round">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);

const ChatBubbleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const ChevronIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textSec} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

const EmptyIcon = () => (
  <Svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tiempoRelativo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  if (hrs < 24) return `Hace ${hrs}h`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatHistorial({ navigation }: Props) {
  const { session } = useAuth();
  const [sesiones, setSesiones] = useState<SesionResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    if (!session?.userId) return;
    const data = await cargarSesionesPrevias(session.userId);
    setSesiones(data);
    setLoading(false);
    setRefreshing(false);
  }, [session?.userId]);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const abrirSesion = (sesionId: string) =>
    navigation.navigate('Chatbot', { sesionId });

  const nuevaConversacion = () =>
    navigation.navigate('Chatbot');

  const renderItem = ({ item }: { item: SesionResumen }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => abrirSesion(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconWrap}>
        <ChatBubbleIcon />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTime}>{tiempoRelativo(item.updated_at)}</Text>
        <Text style={styles.cardPreview} numberOfLines={2}>
          {item.preview ?? 'Sin mensajes'}
        </Text>
      </View>
      <ChevronIcon />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de chats</Text>
        <TouchableOpacity style={styles.newBtn} onPress={nuevaConversacion}>
          <PlusIcon />
          <Text style={styles.newBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.green} size="large" />
        </View>
      ) : sesiones.length === 0 ? (
        <View style={styles.centered}>
          <EmptyIcon />
          <Text style={styles.emptyTitle}>Sin conversaciones</Text>
          <Text style={styles.emptySubtitle}>
            Tus chats con KivoBot aparecerán aquí
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={nuevaConversacion}>
            <Text style={styles.emptyBtnText}>Iniciar conversación</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sesiones}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.green}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: { height: 1, backgroundColor: C.border },
  headerTitle: {
    fontSize: 17, fontWeight: '700',
    color: C.textPrimary, letterSpacing: 0.2,
  },
  backBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20, backgroundColor: C.card,
  },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1, borderColor: C.green + '55',
    backgroundColor: C.greenGlow,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: C.green },

  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700',
    color: C.textPrimary, marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13, color: C.textSec,
    textAlign: 'center', lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5, borderColor: C.green,
    backgroundColor: C.greenGlow,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: C.green },

  list: { paddingHorizontal: 16, paddingVertical: 12 },
  separator: { height: 1, backgroundColor: C.border, marginLeft: 68 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.greenGlow,
    borderWidth: 1, borderColor: C.green + '33',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTime: {
    fontSize: 11, color: C.green,
    fontWeight: '600', marginBottom: 4,
  },
  cardPreview: {
    fontSize: 13.5, color: C.textPrimary, lineHeight: 20,
  },
});
