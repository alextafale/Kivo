import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, TextInput, Alert, ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';
import { useAuth } from '../../../application/context/AuthContext';
import { useAdminNegocio } from '../../../application/hooks/useAdminNegocio';
import { useAdminSucursal } from '../../../application/hooks/useAdminSucursal';
import type { HorarioDia } from '../../../domain/entities/Negocio';
import { useAdminMetricas } from '../../../application/hooks/useAdminMetricas';
import { useTheme } from '../../../application/context/ThemeContext';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'> };

// ─── Icons ─────────────────────────────────────────────────────────────────────

const CameraIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

const BrainIcon = ({ color = '#7C3AED' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
    <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <Path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
  </Svg>
);

// ─── Días ──────────────────────────────────────────────────────────────────────

const DIAS: HorarioDia['dia'][] = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIA_LABEL: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom',
};

// ─── Delivery Slider ───────────────────────────────────────────────────────────

const DeliverySlider = ({ value, onChange, isDark }: { value: number; onChange: (v: number) => void; isDark: boolean }) => {
  const steps = [1, 5, 10, 15];
  const pct = ((value - 1) / 14) * 100;
  return (
    <View style={{ paddingHorizontal: 4 }}>
      <View style={[sliderSt.track, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
        <View style={[sliderSt.fill, { width: `${pct}%` as any }]} />
        <View style={[sliderSt.thumb, { left: `${pct}%` as any }]} />
      </View>
      <View style={sliderSt.stepsRow}>
        {steps.map(s => (
          <TouchableOpacity key={s} onPress={() => onChange(s)} style={sliderSt.stepBtn}>
            <View style={[sliderSt.stepDot, value === s && sliderSt.stepDotActive]} />
            <Text style={[sliderSt.stepText, { color: isDark ? '#6B7280' : '#9CA3AF' }, value === s && { color: '#22c55e', fontWeight: '700' }]}>
              {s} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const sliderSt = StyleSheet.create({
  track: { height: 6, borderRadius: 3, marginTop: 12, marginBottom: 6, position: 'relative', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  thumb: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#fff', marginLeft: -11, top: -8, elevation: 4, shadowColor: '#22c55e', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepBtn: { alignItems: 'center', gap: 4 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB' },
  stepDotActive: { backgroundColor: '#22c55e' },
  stepText: { fontSize: 11, fontWeight: '500' },
});

// ─── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ title, icon, badge, children, isDark }: {
  title: string;
  icon: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <View style={[card.wrap, { backgroundColor: isDark ? '#141414' : '#fff', borderColor: isDark ? '#222' : '#F0F0F0' }]}>
      <View style={card.header}>
        <View style={[card.iconBox, { backgroundColor: isDark ? '#1a2e1a' : '#F0FDF4' }]}>
          <MaterialIcons name={icon as any} size={18} color="#22c55e" />
        </View>
        <Text style={[card.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>{title}</Text>
        {badge}
      </View>
      {children}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', flex: 1 },
});

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Settings');
  const { isDark, toggleTheme, colors } = useTheme();

  const { adminAccess, session, logout } = useAuth();
  const negocioId  = adminAccess?.negocioId  ?? '';
  const sucursalId = adminAccess?.sucursalId ?? '';
  const puedeEditar = adminAccess?.puedeEditarNegocio ?? false;

  const { metricas } = useAdminMetricas(negocioId);
  const { negocio, isLoading: loadingNegocio, isSaving: savingNegocio, error: errorNegocio, updateNegocio } = useAdminNegocio(negocioId);
  const { sucursal, isSaving: savingHorarios, updateHorarios, updateSucursal } = useAdminSucursal(negocioId, sucursalId || undefined);

  // ── Form states ─────────────────────────────────────────────────────────────
  const [slugEdit, setSlugEdit]         = useState('');
  const [nombreEdit, setNombreEdit]     = useState('');
  const [descripcionEdit, setDescEdit]  = useState('');
  const [categoriaEdit, setCatEdit]     = useState('');
  const [logoUrlEdit, setLogoUrlEdit]   = useState('');
  const [bannerUrlEdit, setBannerEdit]  = useState('');
  const [imageLogoUri, setLogoUri]      = useState<string | null>(null);
  const [imageBannerUri, setBannerUri]  = useState<string | null>(null);
  const [isLoadingSave, setSaving]      = useState(false);

  const [horariosEdit, setHorariosEdit] = useState<HorarioDia[]>([]);
  const [radius, setRadius]             = useState(5);

  // AI Review states
  const [aiAnalysis, setAiAnalysis]     = useState<string | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiCount, setAiCount]           = useState(0);

  // ── Effects ─────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (negocio) {
      setSlugEdit(negocio.slug);
      setNombreEdit(negocio.nombre);
      setDescEdit(negocio.descripcion ?? '');
      setCatEdit(negocio.categoria);
      setLogoUrlEdit(negocio.logo_url ?? '');
      setBannerEdit(negocio.banner_url ?? '');
    }
  }, [negocio]);

  React.useEffect(() => {
    if (!sucursal) return;
    setRadius(sucursal.radio_entrega_km);
    const base: HorarioDia[] = DIAS.map(dia => {
      const found = (sucursal.horarios ?? []).find(h => h.dia === dia);
      return found ?? { dia, abre: '09:00', cierra: '22:00', cerrado: false };
    });
    setHorariosEdit(base);
  }, [sucursal]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const generateSlug = (t: string) =>
    t.toLowerCase().trim().normalize('NFD')
      .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-');

  function toggleDia(dia: string) {
    setHorariosEdit(prev => prev.map(h =>
      h.dia === dia ? { ...h, cerrado: !h.cerrado, abre: null, cierra: null } : h
    ));
  }

  const pickImage = async (tipo: 'logo' | 'banner') => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: tipo === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (!r.canceled) {
      tipo === 'logo' ? setLogoUri(r.assets[0].uri) : setBannerUri(r.assets[0].uri);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('slug', slugEdit);
      fd.append('nombre', nombreEdit);
      fd.append('descripcion', descripcionEdit);
      fd.append('categoria', categoriaEdit);
      if (imageLogoUri) fd.append('logo_url', { uri: imageLogoUri, name: 'logo.jpg', type: 'image/jpeg' } as any);
      if (imageBannerUri) fd.append('banner_url', { uri: imageBannerUri, name: 'banner.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/negocios/${negocioId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session?.accessToken}` },
        body: fd,
      });
      if (!res.ok) throw new Error('Error actualizando');
      await updateHorarios(horariosEdit);
      await updateSucursal({ radio_entrega_km: radius });
      Alert.alert('Guardado', 'Los cambios se guardaron correctamente.');
    } catch {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
        await logout();
        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
      }},
    ]);
  };

  const fetchReviewAnalysis = useCallback(async () => {
    if (!sucursalId || !session?.accessToken) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/reviews?sucursal_id=${sucursalId}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const reviews: any[] = res.ok ? await res.json() : [];
      if (reviews.length === 0) {
        setAiAnalysis('Aún no tienes reseñas suficientes. ¡Sigue atendiendo a tus clientes!');
        return;
      }
      const apiBase = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') ?? '';
      const ar = await fetch(`${apiBase}/api/v1/chatbot/review-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews: reviews.slice(0, 30), negocio_nombre: nombreEdit || undefined }),
      });
      if (!ar.ok) throw new Error();
      const d = await ar.json();
      setAiAnalysis(d.analysis);
      setAiCount(d.total_reviews);
    } catch {
      setAiAnalysis('No se pudo generar el análisis. Intenta de nuevo.');
    } finally {
      setAiLoading(false);
    }
  }, [sucursalId, session?.accessToken, nombreEdit]);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (!negocioId) {
    return (
      <SafeAreaView style={[s.centered, { backgroundColor: colors.pageBg }]}>
        <MaterialIcons name="store-mall-directory" size={48} color="#9CA3AF" />
        <Text style={[s.emptyTitle, { color: isDark ? '#D1D5DB' : '#374151' }]}>Sin negocio asignado</Text>
        <Text style={s.emptyDesc}>Contacta con soporte para vincular tu cuenta.</Text>
      </SafeAreaView>
    );
  }

  if (loadingNegocio) {
    return (
      <SafeAreaView style={[s.centered, { backgroundColor: colors.pageBg }]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  const displayRadius = Math.round(radius * 2) / 2;
  const isSaving = savingNegocio || savingHorarios || isLoadingSave;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.container, { backgroundColor: isDark ? '#0A0A0A' : '#F4F7F4' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 170 }}>

        {/* ── Banner + Avatar ─────────────────────────────────────────────── */}
        <View style={s.hero}>
          {/* Banner */}
          <View style={StyleSheet.absoluteFill}>
            {(imageBannerUri || bannerUrlEdit) ? (
              <Image source={{ uri: imageBannerUri || bannerUrlEdit }} style={StyleSheet.absoluteFill as any} blurRadius={3} />
            ) : (
              <LinearGradient colors={isDark ? ['#0d1f0d', '#1a3a1a'] : ['#d1fae5', '#a7f3d0']} style={StyleSheet.absoluteFill as any} />
            )}
            <View style={s.heroOverlay} />
          </View>

          {/* Cambiar banner */}
          <TouchableOpacity onPress={() => pickImage('banner')} style={s.bannerBtn}>
            <View style={s.bannerBtnInner}>
              <MaterialIcons name="photo-camera" size={13} color="#fff" />
              <Text style={s.bannerBtnText}>Banner</Text>
            </View>
          </TouchableOpacity>

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoRing}>
              {(imageLogoUri || logoUrlEdit) ? (
                <Image source={{ uri: imageLogoUri || logoUrlEdit }} style={s.logoImg} />
              ) : (
                <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={s.logoImg}>
                  <MaterialIcons name="restaurant" size={42} color="#16a34a" />
                </LinearGradient>
              )}
            </View>
            <TouchableOpacity onPress={() => pickImage('logo')} style={s.logoCamBtn}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={s.logoCamInner}>
                <CameraIcon />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={s.heroName}>{nombreEdit || '—'}</Text>
          <Text style={s.heroCat}>{categoriaEdit || '—'}</Text>

          {/* Métricas rápidas */}
          <View style={s.heroStats}>
            <View style={s.heroStatItem}>
              <Text style={s.heroStatNum}>{metricas?.total ?? '—'}</Text>
              <Text style={s.heroStatLabel}>Pedidos</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStatItem}>
              <Text style={s.heroStatNum}>{metricas?.tiempo_promedio_min ? `${metricas.tiempo_promedio_min}m` : '—'}</Text>
              <Text style={s.heroStatLabel}>Tiempo prom.</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStatItem}>
              <Text style={[s.heroStatNum, { color: '#4ade80' }]}>Activo</Text>
              <Text style={s.heroStatLabel}>Estado</Text>
            </View>
          </View>
        </View>

        {/* ── Datos del negocio ────────────────────────────────────────────── */}
        <SectionCard title="Datos del negocio" icon="store" isDark={isDark}
          badge={!puedeEditar ? (
            <View style={[s.badge, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
              <MaterialIcons name="lock" size={11} color="#9CA3AF" />
              <Text style={s.badgeText}>Solo lectura</Text>
            </View>
          ) : null}
        >
          <Field label="Nombre del negocio" isDark={isDark}>
            <TextInput
              style={[s.fieldInput, { color: isDark ? '#F9FAFB' : '#111827', backgroundColor: isDark ? '#1C1C1C' : '#F9FAFB', borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}
              value={nombreEdit}
              onChangeText={t => { setNombreEdit(t); setSlugEdit(generateSlug(t)); }}
              editable={puedeEditar}
              placeholder="Ej. Mi Restaurante"
              placeholderTextColor="#9CA3AF"
            />
          </Field>
          <Field label="Categoría" isDark={isDark}>
            <TextInput
              style={[s.fieldInput, { color: isDark ? '#F9FAFB' : '#111827', backgroundColor: isDark ? '#1C1C1C' : '#F9FAFB', borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}
              value={categoriaEdit}
              onChangeText={setCatEdit}
              editable={puedeEditar}
              placeholder="Ej. Restaurante"
              placeholderTextColor="#9CA3AF"
            />
          </Field>
          <Field label="Descripción" isDark={isDark}>
            <TextInput
              style={[s.fieldInput, s.fieldMultiline, { color: isDark ? '#F9FAFB' : '#111827', backgroundColor: isDark ? '#1C1C1C' : '#F9FAFB', borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}
              value={descripcionEdit}
              onChangeText={setDescEdit}
              editable={puedeEditar}
              placeholder="Descripción breve..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </Field>
          <Field label="URL (slug)" isDark={isDark}>
            <View style={[s.fieldInput, s.slugRow, { backgroundColor: isDark ? '#1C1C1C' : '#F9FAFB', borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
              <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: '600' }}>kivo.app/</Text>
              <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 13 }}>{slugEdit || 'tu-negocio'}</Text>
            </View>
          </Field>
        </SectionCard>

        {/* ── Horarios ─────────────────────────────────────────────────────── */}
        <SectionCard title="Horario de atención" icon="schedule" isDark={isDark}>
          {horariosEdit.map((h, idx) => (
            <View key={h.dia}>
              <View style={s.horRow}>
                <Text style={[s.horDay, { color: h.cerrado ? (isDark ? '#4B5563' : '#9CA3AF') : '#22c55e' }]}>
                  {DIA_LABEL[h.dia]}
                </Text>
                {!h.cerrado ? (
                  <Text style={[s.horTime, { color: isDark ? '#D1D5DB' : '#374151' }]}>
                    {h.abre} – {h.cierra}
                  </Text>
                ) : (
                  <Text style={s.horClosed}>Cerrado</Text>
                )}
                <Switch
                  value={!h.cerrado}
                  onValueChange={() => toggleDia(h.dia)}
                  trackColor={{ false: isDark ? '#2A2A2A' : '#E5E7EB', true: '#22c55e' }}
                  thumbColor="#fff"
                  ios_backgroundColor={isDark ? '#2A2A2A' : '#E5E7EB'}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
              {idx < horariosEdit.length - 1 && <View style={[s.divider, { backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6' }]} />}
            </View>
          ))}
        </SectionCard>

        {/* ── Radio de entrega ─────────────────────────────────────────────── */}
        <SectionCard title="Radio de entrega" icon="delivery-dining" isDark={isDark}
          badge={
            <View style={[s.badge, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7', borderWidth: 1 }]}>
              <Text style={[s.badgeText, { color: '#16a34a', fontWeight: '700' }]}>{displayRadius} km</Text>
            </View>
          }
        >
          {/* Mini mapa visual */}
          <View style={[s.mapBox, { backgroundColor: isDark ? '#1A2E1A' : '#D1FAE5' }]}>
            <View style={[s.mapRoad, { top: '45%', left: 0, right: 0, height: 3, backgroundColor: isDark ? '#2A2A2A' : '#F5F0E8' }]} />
            <View style={[s.mapRoad, { top: 0, bottom: 0, left: '40%', width: 3, backgroundColor: isDark ? '#2A2A2A' : '#F5F0E8' }]} />
            <View style={[s.mapCircle, {
              width: 60 + displayRadius * 8, height: 60 + displayRadius * 8,
              borderRadius: (60 + displayRadius * 8) / 2,
              marginLeft: -(30 + displayRadius * 4), marginTop: -(30 + displayRadius * 4),
            }]} />
            <View style={s.mapPin}><View style={s.mapPinDot} /></View>
          </View>
          <DeliverySlider value={displayRadius} onChange={setRadius} isDark={isDark} />
        </SectionCard>

        {/* ── Apariencia ───────────────────────────────────────────────────── */}
        <SectionCard title="Apariencia" icon="palette" isDark={isDark}>
          <View style={s.appearRow}>
            <View style={[s.appearIconBox, { backgroundColor: isDark ? '#1A1A2E' : '#FEF3C7' }]}>
              <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={20} color={isDark ? '#818CF8' : '#F59E0B'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.appearLabel, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                {isDark ? 'Modo oscuro' : 'Modo claro'}
              </Text>
              <Text style={[s.appearSub, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                Cambiar apariencia de la app
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: isDark ? '#2A2A2A' : '#CBD5E1', true: '#22c55e' }}
              thumbColor="#fff"
              ios_backgroundColor={isDark ? '#2A2A2A' : '#CBD5E1'}
            />
          </View>
        </SectionCard>

        {/* ── Análisis de reseñas con IA ───────────────────────────────────── */}
        <View style={[s.aiCard, { backgroundColor: isDark ? '#120c24' : '#FAF5FF', borderColor: isDark ? '#3b1f72' : '#DDD6FE' }]}>
          <View style={s.aiHeader}>
            <View style={[s.aiIconBox, { backgroundColor: isDark ? '#2d1b69' : '#EDE9FE' }]}>
              <BrainIcon color={isDark ? '#A78BFA' : '#7C3AED'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.aiTitle, { color: isDark ? '#E9D5FF' : '#6D28D9' }]}>Análisis de Reseñas con IA</Text>
              <Text style={[s.aiSubtitle, { color: isDark ? '#7C3AED' : '#8B5CF6' }]}>
                {aiCount > 0 ? `Basado en ${aiCount} reseñas` : 'Powered by Qwen AI'}
              </Text>
            </View>
          </View>

          {aiAnalysis ? (
            <View style={[s.aiResult, { backgroundColor: isDark ? '#1e1040' : '#F5F3FF' }]}>
              <Text style={[s.aiResultText, { color: isDark ? '#E9D5FF' : '#4C1D95' }]}>{aiAnalysis}</Text>
            </View>
          ) : (
            <Text style={[s.aiPrompt, { color: isDark ? '#7C3AED' : '#8B5CF6' }]}>
              Obtén un resumen inteligente de lo que opinan tus clientes basado en sus calificaciones.
            </Text>
          )}

          <TouchableOpacity
            onPress={fetchReviewAnalysis}
            disabled={aiLoading}
            activeOpacity={0.8}
            style={[s.aiBtn, aiLoading && { opacity: 0.7 }]}
          >
            {aiLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name={aiAnalysis ? 'refresh' : 'auto-awesome'} size={15} color="#fff" />
                <Text style={s.aiBtnText}>{aiAnalysis ? 'Actualizar' : 'Analizar ahora'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Cerrar sesión ─────────────────────────────────────────────────── */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.75} style={[s.logoutBtn, { backgroundColor: isDark ? '#1A0808' : '#FEF2F2', borderColor: isDark ? '#7F1D1D' : '#FECACA' }]}>
          <MaterialIcons name="logout" size={18} color="#EF4444" />
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Botón guardar flotante ─────────────────────────────────────────── */}
      <View style={s.saveDock}>
        <TouchableOpacity onPress={handleSaveAll} disabled={isSaving} activeOpacity={0.85} style={s.saveOuter}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={s.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {isSaving
              ? <ActivityIndicator color="#fff" />
              : <><SaveIcon /><Text style={s.saveBtnText}>Guardar cambios</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, children, isDark }: { label: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[fld.label, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const fld = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 6 },
});

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyDesc:  { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden', marginBottom: 8 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  bannerBtn: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  bannerBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  bannerBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  logoWrap: { position: 'relative', marginBottom: 12 },
  logoRing: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#22c55e', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  logoImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  logoCamBtn: { position: 'absolute', bottom: 0, right: 0, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  logoCamInner: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 3, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroCat: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 18 },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 0 },
  heroStatItem: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8 },

  // Badges
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },

  // Fields
  fieldInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  fieldMultiline: { height: 80, textAlignVertical: 'top' },
  slugRow: { flexDirection: 'row', alignItems: 'center' },

  // Horarios
  horRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  horDay: { width: 36, fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  horTime: { flex: 1, fontSize: 13, fontWeight: '500' },
  horClosed: { flex: 1, fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  divider: { height: 1 },

  // Map
  mapBox: { height: 130, borderRadius: 14, marginBottom: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  mapRoad: { position: 'absolute' },
  mapCircle: { position: 'absolute', backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 2, borderColor: 'rgba(34,197,94,0.4)', borderStyle: 'dashed' },
  mapPin: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', shadowColor: '#22c55e', shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
  mapPinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  // Appearance
  appearRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appearIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appearLabel: { fontSize: 14, fontWeight: '600' },
  appearSub: { fontSize: 11, marginTop: 1 },

  // AI card
  aiCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 18, borderWidth: 1.5 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  aiIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  aiSubtitle: { fontSize: 11 },
  aiPrompt: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  aiResult: { borderRadius: 12, padding: 14, marginBottom: 14 },
  aiResultText: { fontSize: 13, lineHeight: 20 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 13, shadowColor: '#7C3AED', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  aiBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Logout
  logoutBtn: { marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1.5, borderRadius: 16, paddingVertical: 15 },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // Save dock
  saveDock: { position: 'absolute', bottom: 100, left: 20, right: 20, shadowColor: '#22c55e', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  saveOuter: { borderRadius: 28, overflow: 'hidden' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
