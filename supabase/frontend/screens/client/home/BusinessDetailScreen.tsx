import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useCart } from '../../../application/context/CartContext';
import { useAuth } from '../../../application/context/AuthContext';

const GREEN = '#22c55e';
const ORANGE = '#FF6B00';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category: string;
}

export interface BusinessData {
  id: string;
  name: string;
  category: string;
  logo: string;
  coverImage: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  description: string;
  address: string;
  openingHours: { weekdays: string; weekends: string };
  menu: MenuItem[];
}

interface Comentario {
  id: string;
  user_id: string;
  contenido: string;
  creado_en: string;
}

interface ReaccionConteo {
  tipo: string;
  conteo: number;
}

interface ReaccionesData {
  total: number;
  por_tipo: ReaccionConteo[];
  mi_reaccion: string | null;
}

type BusinessDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BusinessDetail'>;
type BusinessDetailRouteProp = RouteProp<RootStackParamList, 'BusinessDetail'>;
type Props = { navigation: BusinessDetailNavigationProp; route: BusinessDetailRouteProp };

// ─── Emojis de reacción ───────────────────────────────────────────────────────

const REACCIONES = [
  { tipo: 'like', emoji: '👍' },
  { tipo: 'love', emoji: '❤️' },
  { tipo: 'haha', emoji: '😂' },
  { tipo: 'wow',  emoji: '😮' },
  { tipo: 'sad',  emoji: '😢' },
];

// ─── Componente de reacciones por comentario ──────────────────────────────────

const ReaccionesRow = ({
  comentarioId,
  negocioId,
  token,
}: {
  comentarioId: string;
  negocioId: string;
  token: string | null;
}) => {
  const [data, setData] = useState<ReaccionesData | null>(null);

  const cargar = useCallback(async () => {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(
        `${process.env.API_BASE_URL}/negocios/${negocioId}/comentarios/${comentarioId}/reacciones`,
        { headers }
      );
      if (res.ok) setData(await res.json());
    } catch {}
  }, [comentarioId, negocioId, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleReaccion = async (tipo: string) => {
    if (!token) { Alert.alert('Inicia sesión para reaccionar'); return; }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    try {
      if (data?.mi_reaccion) {
        // Quitar reacción existente
        await fetch(
          `${process.env.API_BASE_URL}/negocios/${negocioId}/comentarios/${comentarioId}/reacciones`,
          { method: 'DELETE', headers }
        );
        // Si era distinta, poner la nueva
        if (data.mi_reaccion !== tipo) {
          await fetch(
            `${process.env.API_BASE_URL}/negocios/${negocioId}/comentarios/${comentarioId}/reacciones`,
            { method: 'POST', headers, body: JSON.stringify({ tipo }) }
          );
        }
      } else {
        await fetch(
          `${process.env.API_BASE_URL}/negocios/${negocioId}/comentarios/${comentarioId}/reacciones`,
          { method: 'POST', headers, body: JSON.stringify({ tipo }) }
        );
      }
      cargar();
    } catch {}
  };

  if (!data) return null;

  return (
    <View style={styles.reaccionesRow}>
      {REACCIONES.map(r => {
        const conteo = data.por_tipo.find(p => p.tipo === r.tipo)?.conteo ?? 0;
        const activa = data.mi_reaccion === r.tipo;
        return (
          <TouchableOpacity
            key={r.tipo}
            style={[styles.reaccionBtn, activa && styles.reaccionBtnActiva]}
            onPress={() => toggleReaccion(r.tipo)}
            activeOpacity={0.75}
          >
            <Text style={styles.reaccionEmoji}>{r.emoji}</Text>
            {conteo > 0 && (
              <Text style={[styles.reaccionConteo, activa && styles.reaccionConteoActivo]}>
                {conteo}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function BusinessDetailScreen({ navigation, route }: Props) {
  const { sucursal_id } = route.params;
  const { session } = useAuth();
  const { addItem, increaseQuantity, decreaseQuantity, cart, getTotalItems } = useCart();

  const [business, setBusiness]           = useState<BusinessData | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  // ─── Estado comentarios ───────────────────────────────────────────────────
  const [comentarios, setComentarios]     = useState<Comentario[]>([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [hayMas, setHayMas]               = useState(false);
  const [pagina, setPagina]               = useState(1);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [publicando, setPublicando]       = useState(false);
  const [negocioId, setNegocioId]         = useState<string | null>(null);

  // Token del usuario para llamadas autenticadas
  const token = (session as any)?.accessToken ?? null;

  // ─── Fetch negocio ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res  = await fetch(`${process.env.API_BASE_URL}/sucursales/${sucursal_id}`);
        const data = await res.json();
        console.log('sucursal data:', JSON.stringify(data)); // ← confirma el campo
        setNegocioId(data.negocio_id ?? null);
        setBusiness({
          id:           data.id,
          name:         data.nombre,
          category:     data.categoria,
          logo:         data.logo_url,
          coverImage:   data.banner_url,
          rating:       data.calificacion,
          deliveryTime: data.tiempo_entrega,
          deliveryFee:  data.costo_envio === 'Gratis' ? 0 : Number(data.costo_envio),
          description:  data.descripcion,
          address:      data.direccion,
          openingHours: {
            weekdays: data.horarios?.entre_semana ?? '',
            weekends: data.horarios?.fin_semana ?? '',
          },
          menu: data.menu.map((item: any) => ({
            id:          item.id,
            name:        item.nombre,
            price:       item.precio,
            image:       item.imagen_url,
            description: item.descripcion,
            category:    item.categoria,
          })),
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchBusiness();
  }, [sucursal_id]);

  // ─── Fetch comentarios ────────────────────────────────────────────────────
  const cargarComentarios = useCallback(async (nid: string, p: number, reset = false) => {
    setLoadingComentarios(true);
    try {
      console.log("Borrar luego: ", `${process.env.API_BASE_URL}/negocios/${nid}/comentarios?pagina=${p}&por_pagina=10`);
      const res  = await fetch(`${process.env.API_BASE_URL}/negocios/${nid}/comentarios?pagina=${p}&por_pagina=10`);
      const data = await res.json();
      setComentarios(prev => reset ? data.items : [...prev, ...data.items]);
      setHayMas(data.hay_mas);
      setPagina(p);
    } catch {}
    finally { setLoadingComentarios(false); }
  }, []);

  useEffect(() => {
    if (negocioId) cargarComentarios(negocioId, 1, true);
  }, [negocioId, cargarComentarios]);

  // ─── Publicar comentario ──────────────────────────────────────────────────
const publicarComentario = async () => {
  console.log('📝 token:', token);
  console.log('📝 negocioId:', negocioId);
  console.log('📝 contenido:', nuevoComentario.trim());

  if (!nuevoComentario.trim()) return;
  if (!token) { Alert.alert('Inicia sesión para comentar'); return; }
  if (!negocioId) return;

  setPublicando(true);
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/negocios/${negocioId}/comentarios`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contenido: nuevoComentario.trim() }),
    });

    console.log('📝 status:', res.status);
    const body = await res.text();
    console.log('📝 response body:', body);

    if (!res.ok) throw new Error(body);
    setNuevoComentario('');
    cargarComentarios(negocioId, 1, true);
  } catch (e) {
    console.error('📝 error:', e);
    Alert.alert('Error', 'No se pudo publicar el comentario.');
  } finally {
    setPublicando(false);
  }
};

  // ─── Eliminar comentario ──────────────────────────────────────────────────
  const eliminarComentario = (comentarioId: string) => {
    if (!token || !negocioId) return;
    Alert.alert('Eliminar', '¿Eliminar este comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${process.env.API_BASE_URL}/negocios/${negocioId}/comentarios/${comentarioId}`, {
              method:  'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            });
            cargarComentarios(negocioId, 1, true);
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el comentario.');
          }
        },
      },
    ]);
  };

  // ─── Carrito helpers ──────────────────────────────────────────────────────
  if (!business) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  const categories = ['All', ...Array.from(new Set(business.menu.map(m => m.category)))];
  const filteredMenu = activeCategory === 'All'
    ? business.menu
    : business.menu.filter(m => m.category === activeCategory);

  const restaurantInCart        = cart.find(r => r.sucursal_id === sucursal_id);
  const getItemQty              = (id: string) => restaurantInCart?.items.find(i => i.id === id)?.cantidad ?? 0;
  const totalItemsThisRestaurant = restaurantInCart?.items.reduce((a, i) => a + i.cantidad, 0) ?? 0;
  const totalPrecioThisRestaurant = restaurantInCart?.items.reduce((a, i) => a + i.precio_unitario * i.cantidad, 0) ?? 0;

  const handleAdd = (item: MenuItem) => {
    if (getItemQty(item.id) === 0) {
      addItem(
        { sucursal_id, negocio_id: business.id, nombre: business.name, logo: business.logo, tiempo_entrega: business.deliveryTime },
        { id: item.id, menu_item_id: item.id, nombre: item.name, precio_unitario: item.price, cantidad: 1, imagen: item.image }
      );
    } else {
      increaseQuantity(sucursal_id, item.id);
    }
  };

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.stickyHeader}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="share-2" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Cover ── */}
        <View style={styles.coverWrapper}>
          <Image source={{ uri: business.coverImage }} style={styles.coverImage} />
          <View style={styles.coverOverlay} />
        </View>

        {/* ── Identity ── */}
        <View style={styles.identityRow}>
          <Image source={{ uri: business.logo }} style={styles.logo} />
          <View style={styles.identityText}>
            <Text style={styles.restaurantName}>{business.name}</Text>
            <Text style={styles.restaurantCategory}>{business.category}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="star" size={16} color={ORANGE} />
            <Text style={styles.statValue}>{business.rating}</Text>
            <Text style={styles.statLabel}>RATING</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBadge}>
            <Ionicons name="time-outline" size={16} color="#555" />
            <Text style={styles.statValue}>{business.deliveryTime}</Text>
            <Text style={styles.statLabel}>MINS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBadge}>
            <MaterialIcons name="delivery-dining" size={18} color="#555" />
            <Text style={styles.statValue}>
              {business.deliveryFee === 0 ? 'Gratis' : `$${business.deliveryFee}`}
            </Text>
            <Text style={styles.statLabel}>ENVÍO</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Menú ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menú</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredMenu.map(item => {
            const qty = getItemQty(item.id);
            return (
              <View key={item.id} style={styles.menuCard}>
                <Image source={{ uri: item.image }} style={styles.menuCardImage} />
                <View style={styles.menuCardInfo}>
                  <Text style={styles.menuCardName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.menuCardDesc} numberOfLines={2}>{item.description}</Text>
                  )}
                  <View style={styles.menuCardFooter}>
                    <Text style={styles.menuCardPrice}>${item.price.toFixed(2)}</Text>
                    {qty === 0 ? (
                      <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(item)}>
                        <Ionicons name="add" size={20} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyControl}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQuantity(sucursal_id, item.id)}>
                          <Ionicons name="remove" size={16} color={ORANGE} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => handleAdd(item)}>
                          <Ionicons name="add" size={16} color={ORANGE} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.divider} />

        {/* ── Acerca de ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <Text style={styles.aboutText}>{business.description}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── Comentarios ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentarios</Text>

          {/* Input para nuevo comentario */}
          <View style={styles.comentarioInputWrap}>
            <TextInput
              style={styles.comentarioInput}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#9CA3AF"
              value={nuevoComentario}
              onChangeText={setNuevoComentario}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.comentarioSendBtn,
                (!nuevoComentario.trim() || publicando) && styles.comentarioSendBtnDisabled,
              ]}
              onPress={publicarComentario}
              disabled={!nuevoComentario.trim() || publicando}
              activeOpacity={0.85}
            >
              {publicando
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={16} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {/* Lista de comentarios */}
          {loadingComentarios && comentarios.length === 0 ? (
            <ActivityIndicator color={GREEN} style={{ marginTop: 16 }} />
          ) : comentarios.length === 0 ? (
            <View style={styles.sinComentarios}>
              <Text style={styles.sinComentariosEmoji}>💬</Text>
              <Text style={styles.sinComentariosText}>Sé el primero en comentar</Text>
            </View>
          ) : (
            comentarios.map(c => (
              <View key={c.id} style={styles.comentarioCard}>
                {/* Cabecera del comentario */}
                <View style={styles.comentarioHeader}>
                  <View style={styles.comentarioAvatar}>
                    <Ionicons name="person" size={16} color={GREEN} />
                  </View>
                  <View style={styles.comentarioMeta}>
                    <Text style={styles.comentarioUsuario}>
                      {c.user_id === session?.userId ? 'Tú' : `Usuario`}
                    </Text>
                    <Text style={styles.comentarioFecha}>{formatFecha(c.creado_en)}</Text>
                  </View>
                  {/* Botón eliminar solo para el autor */}
                  {c.user_id === session?.userId && (
                    <TouchableOpacity
                      onPress={() => eliminarComentario(c.id)}
                      style={styles.comentarioDeleteBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Contenido */}
                <Text style={styles.comentarioContenido}>{c.contenido}</Text>

                {/* Reacciones */}
                {negocioId && (
                  <ReaccionesRow
                    comentarioId={c.id}
                    negocioId={negocioId}
                    token={token}
                  />
                )}
              </View>
            ))
          )}

          {/* Ver más */}
          {hayMas && (
            <TouchableOpacity
              style={styles.verMasBtn}
              onPress={() => negocioId && cargarComentarios(negocioId, pagina + 1)}
              disabled={loadingComentarios}
            >
              {loadingComentarios
                ? <ActivityIndicator size="small" color={GREEN} />
                : <Text style={styles.verMasText}>Ver más comentarios</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Botón carrito ── */}
      {totalItemsThisRestaurant > 0 && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaBadgeText}>{getTotalItems()}</Text>
            </View>
            <Text style={styles.ctaButtonText}>Ver carrito</Text>
            <Text style={styles.ctaTotal}>${totalPrecioThisRestaurant.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:              { flex: 1, backgroundColor: '#fff' },
  stickyHeader:           { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerActions:          { flexDirection: 'row', gap: 8 },
  iconBtn:                { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  coverWrapper:           { width: '100%', height: 220 },
  coverImage:             { width: '100%', height: '100%', resizeMode: 'cover' },
  coverOverlay:           { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  identityRow:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  logo:                   { width: 64, height: 64, borderRadius: 12, borderWidth: 2, borderColor: '#fff', backgroundColor: '#1a5c3a' },
  identityText:           { marginLeft: 12 },
  restaurantName:         { fontSize: 22, fontWeight: '700', color: '#1a1a1a', letterSpacing: -0.3 },
  restaurantCategory:     { fontSize: 14, color: ORANGE, fontWeight: '500', marginTop: 2 },
  statsRow:               { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  statBadge:              { flex: 1, alignItems: 'center', gap: 4 },
  statValue:              { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  statLabel:              { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 0.5 },
  statDivider:            { width: 1, height: 32, backgroundColor: '#e8e8e8' },
  divider:                { height: 8, backgroundColor: '#f5f5f5' },
  section:                { padding: 16 },
  sectionTitle:           { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  categoryTabsContainer:  { paddingBottom: 12, gap: 8 },
  categoryTab:            { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0' },
  categoryTabActive:      { backgroundColor: ORANGE },
  categoryTabText:        { fontSize: 13, fontWeight: '600', color: '#666' },
  categoryTabTextActive:  { color: '#fff' },
  menuCard:               { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
  menuCardImage:          { width: 110, height: 110, resizeMode: 'cover' },
  menuCardInfo:           { flex: 1, padding: 12, justifyContent: 'space-between' },
  menuCardName:           { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  menuCardDesc:           { fontSize: 12, color: '#888', marginTop: 4, lineHeight: 17 },
  menuCardFooter:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  menuCardPrice:          { fontSize: 16, fontWeight: '700', color: ORANGE },
  addButton:              { width: 32, height: 32, borderRadius: 16, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  qtyControl:             { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:                 { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  qtyText:                { fontSize: 15, fontWeight: '700', color: '#1a1a1a', minWidth: 18, textAlign: 'center' },
  aboutText:              { fontSize: 14, color: '#555', lineHeight: 22, marginTop: 8 },

  // ── Comentarios ──
  comentarioInputWrap:    { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  comentarioInput:        { flex: 1, fontSize: 14, color: '#111827', maxHeight: 80, paddingVertical: 2 },
  comentarioSendBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  comentarioSendBtnDisabled: { backgroundColor: '#BBF7D0' },

  sinComentarios:         { alignItems: 'center', paddingVertical: 24, gap: 8 },
  sinComentariosEmoji:    { fontSize: 36 },
  sinComentariosText:     { fontSize: 14, color: '#9CA3AF' },

  comentarioCard:         { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  comentarioHeader:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  comentarioAvatar:       { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', alignItems: 'center', justifyContent: 'center' },
  comentarioMeta:         { flex: 1 },
  comentarioUsuario:      { fontSize: 13, fontWeight: '700', color: '#111827' },
  comentarioFecha:        { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  comentarioDeleteBtn:    { padding: 4 },
  comentarioContenido:    { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 10 },

  // ── Reacciones ──
  reaccionesRow:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  reaccionBtn:            { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  reaccionBtnActiva:      { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  reaccionEmoji:          { fontSize: 14 },
  reaccionConteo:         { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  reaccionConteoActivo:   { color: GREEN },

  // ── Ver más ──
  verMasBtn:              { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  verMasText:             { fontSize: 14, color: GREEN, fontWeight: '600' },

  // ── CTA carrito ──
  ctaContainer:           { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 },
  ctaButton:              { backgroundColor: GREEN, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, shadowColor: GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  ctaBadge:               { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ctaBadgeText:           { fontSize: 13, fontWeight: '800', color: GREEN },
  ctaButtonText:          { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  ctaTotal:               { fontSize: 16, fontWeight: '800', color: '#fff' },
});