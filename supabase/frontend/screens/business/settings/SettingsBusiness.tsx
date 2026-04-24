import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, TextInput, Alert, ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from "expo-image-picker";
import { RootStackParamList } from '../../../navigation/StacNavigation';
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';

import { useAuth } from '../../../application/context/AuthContext';
import { useAdminNegocio } from '../../../application/hooks/useAdminNegocio';
import { useAdminSucursal } from '../../../application/hooks/useAdminSucursal';
import type { HorarioDia } from '../../../domain/entities/Negocio';
import { useAdminMetricas } from '../../../application/hooks/useAdminMetricas';
import { useTheme } from '../../../application/context/ThemeContext';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;
type Props = { navigation: SettingsScreenNavigationProp };

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
    <Path d="m15 18-6-6 6-6" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const BoltIcon = () => (
  <Svg width="13" height="13" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </Svg>
);

const RobotIcon = () => (
  <Svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="11" width="18" height="10" rx="2" />
    <Circle cx="12" cy="5" r="2" />
    <Path d="M12 7v4" />
    <Path d="M8 15h.01M16 15h.01" />
    <Path d="M9 19h6" />
  </Svg>
);

const SaveIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <Path d="M17 21v-8H7v8M7 3v5h8" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5" />
    <Path d="M21 12H9" />
  </Svg>
);

const LockIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const BrainIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round">
    <Path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <Path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <Path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <Path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <Path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <Path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <Path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <Path d="M6 18a4 4 0 0 1-1.967-.516" />
    <Path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </Svg>
);

// ─── Días de la semana ────────────────────────────────────────────────────────

const DIAS: HorarioDia['dia'][] = [
  'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo',
];

const DIA_LABEL: Record<string, string> = {
  lunes: 'LUN', martes: 'MAR', miercoles: 'MIÉ',
  jueves: 'JUE', viernes: 'VIE', sabado: 'SÁB', domingo: 'DOM',
};

// ─── Delivery Slider ──────────────────────────────────────────────────────────

const DeliverySlider = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const MIN = 1; const MAX = 15;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;
  const steps = [1, 5, 10, 15];
  return (
    <View>
      <View style={sliderStyles.track}>
        <View style={[sliderStyles.fill, { width: `${pct}%` as any }]} />
        <View style={[sliderStyles.thumb, { left: `${pct}%` as any }]} />
      </View>
      <View style={sliderStyles.tapRow}>
        {steps.map((s) => (
          <TouchableOpacity key={s} onPress={() => onChange(s)} style={sliderStyles.tapZone}>
            <Text style={[sliderStyles.stepLabel, value === s && sliderStyles.stepLabelActive]}>
              {s} KM
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  track: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginHorizontal: 8, marginTop: 16, marginBottom: 4, position: 'relative', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  thumb: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#22c55e', borderWidth: 3, borderColor: '#FFFFFF', marginLeft: -11, top: -8, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  tapRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  tapZone: { alignItems: 'center', padding: 4 },
  stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  stepLabelActive: { color: '#22c55e', fontWeight: '700' },
});

// ─── Map Placeholder ──────────────────────────────────────────────────────────

const MapPlaceholder = ({ radius }: { radius: number }) => (
  <View style={mapStyles.container}>
    <View style={mapStyles.map}>
      <View style={[mapStyles.road, { top: '45%', left: 0, right: 0, height: 3 }]} />
      <View style={[mapStyles.road, { top: '25%', left: 0, right: 0, height: 2 }]} />
      <View style={[mapStyles.road, { top: 0, bottom: 0, left: '38%', width: 3 }]} />
      <View style={[mapStyles.road, { top: 0, bottom: 0, left: '65%', width: 2 }]} />
      <View style={mapStyles.park} />
      <View style={[mapStyles.radiusCircle, { width: 80 + radius * 6, height: 80 + radius * 6, borderRadius: (80 + radius * 6) / 2, marginLeft: -(40 + radius * 3), marginTop: -(40 + radius * 3) }]} />
      <View style={mapStyles.pin}><View style={mapStyles.pinDot} /></View>
    </View>
  </View>
);

const mapStyles = StyleSheet.create({
  container: { borderRadius: 16, overflow: 'hidden', height: 160, marginBottom: 8 },
  map: { flex: 1, backgroundColor: '#D1E8D1', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  road: { position: 'absolute', backgroundColor: '#F5F0E8' },
  park: { position: 'absolute', top: '30%', left: '40%', width: 60, height: 45, backgroundColor: '#A8D5A8', borderRadius: 8 },
  radiusCircle: { position: 'absolute', backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 2, borderColor: 'rgba(34,197,94,0.5)', borderStyle: 'dashed' },
  pin: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 6 },
  pinDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TabName>('Settings');
  console.log('Estas en settings business');
  const { isDark, toggleTheme, colors } = useTheme();

  // IDs dinámicos desde AuthContext
  const { adminAccess, session, logout } = useAuth();
  const negocioId = adminAccess?.negocioId ?? '';
  const sucursalId = adminAccess?.sucursalId ?? '';
  const puedeEditar = adminAccess?.puedeEditarNegocio ?? false;
  // Agrega el hook junto a los otros
  const { metricas, isLoading: loadingMetricas } = useAdminMetricas(negocioId)

  // ── Negocio ──────────────────────────────────────────────────────────────
  const { negocio, isLoading: loadingNegocio, isSaving: savingNegocio, error: errorNegocio, updateNegocio } =
    useAdminNegocio(negocioId);



  const [slugEdit, setSlugEdit] = useState('');
  const [nombreEdit, setNombreEdit] = useState('');
  const [descripcionEdit, setDescriptionEdit] = useState('');
  const [categoriaEdit, setCatEdit] = useState('');
  const [tagsEdit, setTagsEdit] = useState<string[]>([]);
  const [paisEdit, setPaisEdit] = useState('');
  const [logoUrlEdit, setLogoUrlEdit] = useState('');
  const [bannerUrlEdit, setBannerUrlEdit] = useState('');
  const [imageLogoUri, setImageLogoUri] = useState<string | null>(null);
  const [imageBannerUri, setImageBannerUri] = useState<string | null>(null); // [,setBannerUri]
  const [isLoadingSave, setLoadingSave] = useState(false);

  const [delivered, setDelivered] = useState(0);
  const [failed, setFailed] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState(0);

  // AI Review Insights
  const [aiReviewAnalysis, setAiReviewAnalysis] = useState<string | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewCount, setAiReviewCount] = useState(0);

  const fetchReviewAnalysis = useCallback(async () => {
    if (!sucursalId || !session?.accessToken) return;
    setAiReviewLoading(true);
    setAiReviewAnalysis(null);
    try {
      // 1. Obtener reseñas de la sucursal
      const res = await fetch(
        `${process.env.API_BASE_URL}/reviews?sucursal_id=${sucursalId}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      let reviews: any[] = [];
      if (res.ok) {
        reviews = await res.json();
      }

      if (reviews.length === 0) {
        setAiReviewAnalysis('Aún no tienes reseñas suficientes para analizar. ¡Sigue atendiendo a tus clientes!');
        setAiReviewCount(0);
        return;
      }

      // 2. Enviar al endpoint de análisis de Qwen
      const apiBase = process.env.API_BASE_URL?.replace('/api/v1', '') ?? '';
      const analysisRes = await fetch(`${apiBase}/api/v1/chatbot/review-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews: reviews.slice(0, 30),
          negocio_nombre: nombreEdit || undefined,
        }),
      });
      if (!analysisRes.ok) throw new Error('Error en análisis');
      const data = await analysisRes.json();
      setAiReviewAnalysis(data.analysis);
      setAiReviewCount(data.total_reviews);
    } catch (e) {
      setAiReviewAnalysis('No se pudo generar el análisis. Intenta de nuevo más tarde.');
    } finally {
      setAiReviewLoading(false);
    }
  }, [sucursalId, session?.accessToken, nombreEdit]);




  // ── Sucursal / Horarios ──────────────────────────────────────────────────
  const { sucursal, isSaving: savingHorarios, error: errorHorarios, updateHorarios, updateSucursal } =
    useAdminSucursal(negocioId, sucursalId || undefined);

  const [horariosEdit, setHorariosEdit] = useState<HorarioDia[]>([]);
  const [horariosReady, setHorariosReady] = useState(false);

  // Radio de entrega — inicializado desde la sucursal
  const [radius, setRadius] = useState(sucursal?.radio_entrega_km ?? 5);

  const fetchPedidos = useCallback(async () => {
    if (!negocioId || !session?.accessToken) return;

    try {
      const res = await fetch(
        `${process.env.API_BASE_URL}/negocios/${negocioId}/pedidos`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          method: 'GET',
        }
      );

      if (res.ok) {
        const data = await res.json();

        const delivered = data.filter(
          (p: any) => p.status === 'delivered'
        ).length;

        const failed = data.filter(
          (p: any) =>
            p.status === 'cancelled' || p.status === 'refunded'
        ).length;

        const totalFinalizados = delivered + failed;

        const deliveryRate =
          totalFinalizados > 0 ? delivered / totalFinalizados : 0;

        setDelivered(delivered);
        setFailed(failed);
        setDeliveryRate(deliveryRate);
      }
    } catch (e) {
      console.warn('fetchPedidos error:', e);
    }
  }, [negocioId, session?.accessToken]);

  React.useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Inicializar estados locales cuando llegan los datos del backend
  React.useEffect(() => {
    if (negocio) {
      setSlugEdit(negocio.slug);
      setNombreEdit(negocio.nombre);
      setDescriptionEdit(negocio.descripcion ?? '');
      setCatEdit(negocio.categoria);
      setTagsEdit(negocio.tags);
      setPaisEdit(negocio.pais);
      setLogoUrlEdit(negocio.logo_url ?? '');
      setBannerUrlEdit(negocio.banner_url ?? '');
      console.log("Negocio despues borrar: ", negocio);
    }
  }, [negocio]);
  // sincroniza siempre que sucursal cambie y tenga horarios reales
  React.useEffect(() => {
    if (!sucursal) return;

    setRadius(sucursal.radio_entrega_km);

    const sucursalHorarios = sucursal.horarios ?? [];

    // Solo sobreescribir si llegaron horarios reales del backend,
    // o si el usuario aún no ha editado nada (horariosEdit vacío)
    if (sucursalHorarios.length > 0 || horariosEdit.length === 0) {
      const base: HorarioDia[] = DIAS.map(dia => {
        const existente = sucursalHorarios.find(h => h.dia === dia);
        return existente ?? { dia, abre: '09:00', cierra: '22:00', cerrado: false };
      });
      setHorariosEdit(base);
    }
  }, [sucursal]);

  function toggleDia(dia: string) {
    setHorariosEdit(prev =>
      prev.map(h => h.dia === dia ? { ...h, cerrado: !h.cerrado, abre: null, cierra: null } : h)
    );
  }

  // Logout usando AuthContext (limpia sesión + SecureStore)
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
          },
        },
      ]
    );
  };

  const pickImage = async (tipo: 'logo' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: tipo === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (tipo === 'logo') {
        setImageLogoUri(uri);
      } else {
        setImageBannerUri(uri);
      }
    }
  };

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("slug", slugEdit);
    formData.append("nombre", nombreEdit);
    formData.append("descripcion", descripcionEdit);
    formData.append("categoria", categoriaEdit);
    formData.append("tags", tagsEdit.join(', '));
    formData.append("pais", paisEdit);

    if (imageLogoUri) {
      formData.append("logo_url", {
        uri: imageLogoUri,
        name: "logo.jpg",
        type: "image/jpeg",
      } as any | null);
    }

    if (imageBannerUri) {
      formData.append("banner_url", {
        uri: imageBannerUri,
        name: "banner.jpg",
        type: "image/jpeg",
      } as any | null);
    }

    return formData;
  };

  const handleSaveAll = async () => {
    try {
      setLoadingSave(true);
      const formData = buildFormData();

      const res = await fetch(
        `${process.env.API_BASE_URL}/negocios/${negocioId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Error actualizando");
      Alert.alert("Éxito", "Negocio actualizado");
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSave(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };


  const isSaving = savingNegocio || savingHorarios;
  const displayRadius = Math.round(radius * 2) / 2;

  // ─── Guard: sin negocio asignado ─────────────────────────────────────────
  if (!negocioId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.noAccessText}>No tienes un negocio asignado.</Text>
      </SafeAreaView>
    );
  }

  if (loadingNegocio) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F2F7F2' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDark ? '#0A0A0A' : 'transparent' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Business Profile</Text>
          <TouchableOpacity>
            <Text style={styles.previewLink}>Preview</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Section con Banner y Logo */}
        <View style={styles.avatarSection}>

          {/* 1. IMAGEN DE BANNER (FONDO) */}
          <View style={StyleSheet.absoluteFill}>
            {(imageBannerUri || bannerUrlEdit) ? (
              <Image
                source={{ uri: imageBannerUri || bannerUrlEdit }}
                style={styles.bannerImageBackground}
                blurRadius={4} // Difuminado nativo de React Native
              />
            ) : (
              <View style={[styles.bannerImageBackground, { backgroundColor: '#F3F4F6' }]} />
            )}
            {/* Capa oscura para que el texto sea legible */}
            <View style={styles.bannerOverlay} />
          </View>

          {/* 2. BOTÓN EDITAR BANNER (PORTADA) */}
          <TouchableOpacity
            style={styles.changeBannerButton}
            onPress={() => pickImage('banner')}
          >
            <View style={styles.bannerEditBadge}>
              <CameraIcon />
              <Text style={styles.bannerEditText}>Cambiar banner</Text>
            </View>
          </TouchableOpacity>

          {/* 3. CONTENEDOR DEL LOGO (AVATAR) */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {imageLogoUri || logoUrlEdit ? (
                <Image
                  source={{ uri: imageLogoUri || logoUrlEdit }}
                  style={styles.avatarGradient}
                />
              ) : (
                <LinearGradient colors={['#DCFCE7', '#BBF7D0']} style={styles.avatarGradient}>
                  <MaterialIcons name="restaurant" size={48} color="#22c55e" />
                </LinearGradient>
              )}
            </View>

            {/* BOTÓN EDITAR LOGO */}
            <TouchableOpacity style={styles.cameraButton} onPress={() => pickImage('logo')}>
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.cameraGradient}>
                <CameraIcon />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* INFO DEL NEGOCIO (Usando los estados de edición para feedback instantáneo) */}
          <Text style={styles.businessNameText}>{nombreEdit || '—'}</Text>
          <Text style={styles.businessMeta}>{categoriaEdit || '—'}</Text>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>DATOS REALES</Text>
            </View>
          </View>
          <View style={styles.aiCard}>
            <View style={styles.aiTopRow}>
              <View>
                <Text style={styles.aiLabel}>TASA DE ENTREGA</Text>
                {loadingMetricas
                  ? <ActivityIndicator color="#22c55e" style={{ marginTop: 8 }} />
                  : <Text style={styles.aiRate}>
                    {deliveryRate}
                  </Text>
                }
              </View>
              <View style={styles.robotIconContainer}><RobotIcon /></View>
            </View>

            <View style={styles.aiStatsRow}>
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>Entregados</Text>
                <Text style={styles.aiStatValue}>
                  {delivered}
                </Text>
              </View>
              <View style={styles.aiStatDivider} />
              <View style={styles.aiStat}>
                <Text style={styles.aiStatLabel}>Cancelados</Text>
                <Text style={styles.aiStatValue}>
                  {failed}
                </Text>
              </View>
            </View>

            <View style={styles.aiInfoBar}>
              <BoltIcon />
              <Text style={styles.aiInfoText}>
                {metricas
                  ? `${metricas.total} pedidos en total · ${metricas.tiempo_promedio_min
                    ? `${metricas.tiempo_promedio_min} min promedio`
                    : 'sin datos de tiempo aún'
                  }`
                  : 'Cargando estadísticas…'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Radius */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Radius</Text>
            <Text style={styles.radiusValue}>{displayRadius} KM</Text>
          </View>
          <View style={styles.whiteCard}>
            <MapPlaceholder radius={displayRadius} />
            <DeliverySlider value={displayRadius} onChange={setRadius} />
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          <View style={styles.whiteCard}>
            {horariosEdit.map((h, idx) => (
              <View key={h.dia}>
                <View style={styles.scheduleRow}>
                  <Text style={[styles.dayLabel, h.cerrado && styles.dayLabelDisabled]}>
                    {DIA_LABEL[h.dia]}
                  </Text>
                  {!h.cerrado ? (
                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>{h.abre}</Text>
                      <Text style={styles.timeDash}>–</Text>
                      <Text style={styles.timeText}>{h.cierra}</Text>
                    </View>
                  ) : (
                    <Text style={styles.closedNote}>Closed</Text>
                  )}
                  <Switch
                    value={!h.cerrado}
                    onValueChange={() => toggleDia(h.dia)}
                    trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#E5E7EB"
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
                {idx < horariosEdit.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Business Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Details</Text>
            {!puedeEditar && (
              <View style={styles.lockedRow}>
                <LockIcon /><Text style={styles.lockedText}>Solo lectura</Text>
              </View>
            )}
          </View>
          <View style={styles.whiteCard}>
            <Text style={styles.fieldLabel}>NOMBRE DEL NEGOCIO</Text>
            <TextInput
              style={[styles.fieldInput, !puedeEditar && styles.fieldInputDisabled]}
              value={nombreEdit}
              onChangeText={(text) => {
                setNombreEdit(text);
                // Actualizamos el slug automáticamente al escribir el nombre
                setSlugEdit(generateSlug(text));
              }}
              editable={puedeEditar}
              placeholder="Ej. Mi Restaurante"
            />

            <View style={styles.fieldDivider} />

            <Text style={styles.fieldLabel}>CATEGORÍA</Text>
            <TextInput
              style={[styles.fieldInput, !puedeEditar && styles.fieldInputDisabled]}
              value={categoriaEdit}
              onChangeText={setCatEdit}
              editable={puedeEditar}
            />

            <View style={styles.fieldDivider} />

            <Text style={styles.fieldLabel}>SLUG (URL)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputDisabled]}
              /* Usamos el nuevo estado slugEdit para que sea reactivo */
              value={slugEdit}
              editable={false} // El slug suele ser automático, no manual
              placeholder="auto-generado"
            />
          </View>
        </View>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>Appearance</Text>
          <View style={[styles.whiteCard, { backgroundColor: isDark ? '#111111' : '#FFFFFF' }]}>
            <View style={[styles.scheduleRow, { justifyContent: 'space-between' }]}>
              <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={18} color={isDark ? '#E9D5FF' : '#F59E0B'} />
                    <Text style={[styles.timeText, { color: isDark ? '#FFFFFF' : '#374151' }]}>
                      {isDark ? 'Modo Oscuro' : 'Modo Claro'}
                    </Text>
                  </View>
                <Text style={{ fontSize: 11, color: isDark ? '#888888' : '#9CA3AF', marginTop: 2 }}>
                  Cambiar apariencia de la app
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: '#22c55e' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#CBD5E1"
              />
            </View>
          </View>
        </View>


        {/* AI Review Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="rate-review" size={18} color={isDark ? '#FFFFFF' : '#111827'} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>AI Review Insights</Text>
            </View>
          </View>
          <View style={[styles.aiReviewCard, { backgroundColor: isDark ? '#1a0a2e' : '#FAF5FF', borderColor: isDark ? '#4c1d95' : '#DDD6FE' }]}>
            <View style={styles.aiReviewHeader}>
              <View style={styles.aiReviewIconWrap}>
                <BrainIcon />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aiReviewTitle, { color: isDark ? '#E9D5FF' : '#6D28D9' }]}>Análisis de Reseñas con IA</Text>
                <Text style={[styles.aiReviewSubtitle, { color: isDark ? '#A78BFA' : '#7C3AED' }]}>
                  {aiReviewCount > 0 ? `Basado en ${aiReviewCount} reseñas recientes` : 'Qwen analiza tus calificaciones'}
                </Text>
              </View>
            </View>

            {aiReviewAnalysis ? (
              <View style={[styles.aiReviewResult, { backgroundColor: isDark ? '#2d1b5e' : '#F5F3FF' }]}>
                <Text style={[styles.aiReviewText, { color: isDark ? '#E9D5FF' : '#4C1D95' }]}>{aiReviewAnalysis}</Text>
              </View>
            ) : (
              <Text style={[styles.aiReviewPrompt, { color: isDark ? '#A78BFA' : '#8B5CF6' }]}>
                Toca el botón para obtener un resumen inteligente de lo que tus clientes piensan.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.aiReviewBtn, aiReviewLoading && { opacity: 0.7 }]}
              onPress={fetchReviewAnalysis}
              disabled={aiReviewLoading}
              activeOpacity={0.8}
            >
              {aiReviewLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons
                    name={aiReviewAnalysis ? 'refresh' : 'auto-awesome'}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.aiReviewBtnText}>
                    {aiReviewAnalysis ? 'Actualizar análisis' : 'Analizar ahora'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.75}>
            <LogoutIcon />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity activeOpacity={0.85} style={styles.saveWrapper} onPress={handleSaveAll} disabled={isLoadingSave}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.saveButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {isLoadingSave
              ? <ActivityIndicator color="#fff" />
              : <><SaveIcon /><Text style={styles.saveButtonText}>Save All Changes</Text></>
            }
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} navigation={navigation} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F7F2' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noAccessText: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  scrollContent: { paddingBottom: 160 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  previewLink: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, overflow: 'hidden', borderWidth: 3, borderColor: '#DCFCE7', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 38 },
  cameraButton: { position: 'absolute', bottom: 0, right: 0, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF' },
  cameraGradient: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  businessNameText: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  businessMeta: { fontSize: 13, color: '#9CA3AF' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '800', color: '#16a34a', letterSpacing: 0.5 },
  aiCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#DCFCE7', shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  aiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  aiLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 4 },
  aiRate: { fontSize: 38, fontWeight: '800', color: '#111827', letterSpacing: -1 },
  robotIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  aiStatsRow: { flexDirection: 'row', marginBottom: 14 },
  aiStat: { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  aiStatDivider: { width: 8 },
  aiStatLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  aiStatValue: { fontSize: 20, fontWeight: '800', color: '#111827' },
  aiInfoBar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  aiInfoText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
  radiusValue: { fontSize: 16, fontWeight: '800', color: '#22c55e', marginBottom: 12 },
  whiteCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  dayLabel: { width: 38, fontSize: 13, fontWeight: '800', color: '#22c55e', letterSpacing: 0.3 },
  dayLabelDisabled: { color: '#9CA3AF' },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  timeDash: { fontSize: 14, color: '#9CA3AF' },
  closedNote: { flex: 1, fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  rowDivider: { height: 1, backgroundColor: '#F3F4F6' },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  lockedText: { fontSize: 12, color: '#9CA3AF' },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 8 },
  fieldInput: { fontSize: 15, color: '#111827', paddingVertical: 0 },
  fieldInputDisabled: { color: '#9CA3AF' },
  fieldDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
  saveContainer: { position: 'absolute', bottom: 120, left: 20, right: 20, shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  saveWrapper: { borderRadius: 30, overflow: 'hidden' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  saveButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA', borderRadius: 16, paddingVertical: 16 },
  logoutButtonText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  // AI Review Insights
  aiReviewCard: {
    borderRadius: 20, padding: 18, borderWidth: 1.5,
    backgroundColor: '#FAF5FF', borderColor: '#DDD6FE',
  },
  aiReviewHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  aiReviewIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  aiReviewTitle: {
    fontSize: 14, fontWeight: '800', color: '#6D28D9', marginBottom: 2,
  },
  aiReviewSubtitle: {
    fontSize: 11, color: '#7C3AED',
  },
  aiReviewPrompt: {
    fontSize: 13, color: '#8B5CF6', lineHeight: 18, marginBottom: 14,
  },
  aiReviewResult: {
    borderRadius: 12, padding: 14, marginBottom: 14, backgroundColor: '#F5F3FF',
  },
  aiReviewText: {
    fontSize: 13, color: '#4C1D95', lineHeight: 20,
  },
  aiReviewBtn: {
    backgroundColor: '#7C3AED', borderRadius: 14,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  aiReviewBtnText: {
    fontSize: 14, fontWeight: '800', color: '#fff',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 35,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20
  },
  bannerImageBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  changeBannerButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  bannerEditBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  bannerEditText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});