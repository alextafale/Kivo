import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Alert, Animated, Dimensions,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import { useDomicilios } from '../../../application/context/DomiciliosContext';
import { useTheme } from '../../../application/context/ThemeContext';
import type { Domicilio } from '../../../domain/entities/Domicilio';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DeliveryAddresses'>;
type Props = { navigation: Nav };

const { width } = Dimensions.get('window');

// ─── ICONS (idénticos a los tuyos) ───────────────────────────────────────────

const BackIcon = ({ color = '#0f172a' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </Svg>
);
const PlusIcon = ({ color = '#fff' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <Path d="M12 5v14M5 12h14" />
  </Svg>
);
const HomeIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <Path d="M9 21V12h6v9" />
  </Svg>
);
const OfficeIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="2" y="3" width="20" height="18" rx="2" />
    <Path d="M8 7h8M8 11h8M8 15h5" />
  </Svg>
);
const PinIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);
const EditIcon = ({ color = '#64748b' }: { color?: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
);
const TrashIcon = ({ color = '#ef4444' }: { color?: string }) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);
const CheckIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);
const EmptyIcon = ({ color = '#d1fae5' }: { color?: string }) => (
  <Svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

// ─── HELPER: ícono según etiqueta ─────────────────────────────────────────────

function etiquetaIcon(etiqueta: string, color = '#22c55e') {
  if (etiqueta === 'Casa')    return <HomeIcon color={color} />;
  if (etiqueta === 'Trabajo') return <OfficeIcon color={color} />;
  return <PinIcon color={color} />;
}

// ─── ADDRESS CARD ─────────────────────────────────────────────────────────────

const AddressCard = ({
  domicilio, onEdit, onDelete, onSetDefault, delay = 0,
}: {
  domicilio:    Domicilio;
  onEdit:       () => void;
  onDelete:     () => void;
  onSetDefault: () => void;
  delay?:       number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, delay, tension: 60, friction: 8, useNativeDriver: true,
    }).start();
  }, []);

  const linea1 = [domicilio.calle, domicilio.numeroExt, domicilio.colonia]
    .filter(Boolean).join(', ');
  const linea2 = [domicilio.ciudad, domicilio.estado].filter(Boolean).join(', ');

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }}>
      <View style={[styles.card, { backgroundColor: colors.cardBg, shadowColor: isDark ? '#000' : '#000', borderColor: isDark ? colors.border : 'transparent' }, domicilio.esPredeterminado && styles.cardDefault]}>

        {domicilio.esPredeterminado && (
          <View style={styles.defaultBadge}>
            <CheckIcon />
            <Text style={styles.defaultBadgeText}>Predeterminada</Text>
          </View>
        )}

        <View style={styles.cardTop}>
          <View style={[styles.typeIconWrap, { backgroundColor: colors.iconBg }, domicilio.esPredeterminado && [styles.typeIconWrapActive, isDark && { backgroundColor: '#15803d40' }]]}>
            {etiquetaIcon(domicilio.alias, isDark ? '#4ade80' : '#22c55e')}
          </View>
          <View style={styles.cardTextBlock}>
            <Text style={[styles.cardLabel, { color: colors.titleText }]}>{domicilio.alias}</Text>
            <Text style={[styles.cardStreet, { color: colors.titleText }]}>{linea1}</Text>
            {!!linea2 && <Text style={[styles.cardCity, { color: colors.subtitleText }]}>{linea2}</Text>}
            {!!domicilio.referencias && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <PinIcon color={colors.subtitleText} />
                <Text style={[styles.cardReference, { color: colors.subtitleText }]}>{domicilio.referencias}</Text>
              </View>
            )}
            {domicilio.coordenadas && (
              <Text style={styles.cardGps}>
                {domicilio.coordenadas.latitud.toFixed(4)}, {domicilio.coordenadas.longitud.toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.cardActions, { borderTopColor: colors.rowDivider }]}>
          {!domicilio.esPredeterminado && (
            <TouchableOpacity style={styles.actionSetDefault} onPress={onSetDefault}>
              <Text style={[styles.actionSetDefaultText, isDark && { color: '#4ade80' }]}>Usar como predeterminada</Text>
            </TouchableOpacity>
          )}
          <View style={styles.cardActionBtns}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.pageBg }]} onPress={onEdit}>
              <EditIcon color={colors.subtitleText} />
              <Text style={[styles.iconBtnText, { color: colors.subtitleText }]}>Editar</Text>
            </TouchableOpacity>
            <View style={[styles.actionDivider, { backgroundColor: colors.rowDivider }]} />
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDark ? '#ef444430' : '#fff5f5' }]} onPress={onDelete}>
              <TrashIcon />
              <Text style={styles.iconBtnTextDelete}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </Animated.View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export default function DeliveryAddresses({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const {
    domicilios, isLoading, error,
    fetchDomicilios, setDefault, deleteDomicilio,
  } = useDomicilios();

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    fetchDomicilios();
  }, [fetchDomicilios]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Eliminar dirección', '¿Deseas eliminar esta dirección?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteDomicilio(id) },
    ]);
  }, [deleteDomicilio]);

  const handleEdit = useCallback((d: Domicilio) => {
    navigation.navigate('AddAddress', { domicilio: d });
  }, [navigation]);

  // Predeterminado siempre primero
  const sorted = [...domicilios].sort((a, b) =>
    (b.esPredeterminado ? 1 : 0) - (a.esPredeterminado ? 1 : 0)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.pageBg} />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, {
        backgroundColor: colors.pageBg,
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
      }]}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeFeed')} style={[styles.backBtn, { backgroundColor: colors.backBtnBg }]}>
          <BackIcon color={colors.titleText} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.titleText }]}>Direcciones</Text>
          <Text style={[styles.headerSub, { color: colors.subtitleText }]}>
            {domicilios.length} {domicilios.length === 1 ? 'dirección guardada' : 'direcciones guardadas'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addHeaderBtn, { backgroundColor: isDark ? '#15803d40' : '#dcfce7' }]}
          onPress={() => navigation.navigate('AddAddress', undefined)}
        >
          <PlusIcon color={isDark ? '#4ade80' : '#22c55e'} />
        </TouchableOpacity>
      </Animated.View>

      {/* Error */}
      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── LIST ────────────────────────────────────────────────── */}
      {isLoading && domicilios.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Cargando direcciones…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => fetchDomicilios(true)}
              tintColor="#22c55e"
              colors={['#22c55e']}
            />
          }
        >
          {sorted.length === 0 ? (
            <View style={styles.emptyState}>
              <EmptyIcon color={isDark ? '#16a34a' : '#d1fae5'} />
              <Text style={[styles.emptyTitle, { color: colors.titleText }]}>Sin direcciones</Text>
              <Text style={[styles.emptySub, { color: colors.subtitleText }]}>Agrega tu primera dirección de entrega</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddAddress', undefined)}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.emptyBtnGrad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <PlusIcon />
                  <Text style={styles.emptyBtnText}>Agregar dirección</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {sorted.map((d, i) => (
                <AddressCard
                  key={d.id}
                  domicilio={d}
                  delay={i * 80}
                  onEdit={() => handleEdit(d)}
                  onDelete={() => handleDelete(d.id)}
                  onSetDefault={() => setDefault(d.id)}
                />
              ))}

              <TouchableOpacity
                style={[styles.addMoreBtn, { backgroundColor: colors.cardBg, borderColor: isDark ? colors.border : '#dcfce7' }]}
                onPress={() => navigation.navigate('AddAddress', undefined)}
                activeOpacity={0.8}
              >
                <View style={[styles.addMoreIcon, { backgroundColor: colors.iconBg }]}><PlusIcon color={isDark ? '#4ade80' : '#22c55e'} /></View>
                <Text style={[styles.addMoreText, isDark && { color: '#4ade80' }]}>Agregar nueva dirección</Text>
              </TouchableOpacity>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── FAB ─────────────────────────────────────────────────── */}
      {domicilios.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddAddress', undefined)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#22c55e', '#16a34a']}
            style={styles.fabGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <PlusIcon />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES (idénticos a los tuyos) ──────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0fdf4' },
  loadingWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText:  { color: '#64748b', fontSize: 14, fontWeight: '500' },
  errorBanner:  { backgroundColor: '#fee2e2', marginHorizontal: 20, marginTop: 8, padding: 12, borderRadius: 12 },
  errorText:    { color: '#dc2626', fontSize: 13, fontWeight: '500' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#f0fdf4',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: 0.1 },
  headerSub:    { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 1 },
  addHeaderBtn: {
    width: 42, height: 42, borderRadius: 13, backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { paddingHorizontal: 20, paddingTop: 8 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  cardDefault: { borderColor: '#22c55e', shadowColor: '#22c55e', shadowOpacity: 0.15 },
  defaultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#22c55e', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 12,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

  cardTop:            { flexDirection: 'row', gap: 14 },
  typeIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  typeIconWrapActive: { backgroundColor: '#dcfce7' },
  cardTextBlock:      { flex: 1 },
  cardLabel:          { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  cardStreet:         { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 1 },
  cardCity:           { fontSize: 12, color: '#94a3b8' },
  cardReference:      { fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 },
  cardGps:            { fontSize: 11, color: '#bbb', marginTop: 3 },

  cardActions: {
    marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  actionSetDefault:     { flex: 1 },
  actionSetDefaultText: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  cardActionBtns:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f8fafc',
  },
  iconBtnDelete:    { backgroundColor: '#fff5f5' },
  iconBtnText:      { fontSize: 12, fontWeight: '600', color: '#475569' },
  iconBtnTextDelete:{ fontSize: 12, fontWeight: '600', color: '#ef4444' },
  actionDivider:    { width: 1, height: 20, backgroundColor: '#e2e8f0', marginHorizontal: 2 },

  addMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#dcfce7', borderStyle: 'dashed',
    paddingHorizontal: 16, paddingVertical: 16, marginBottom: 14,
  },
  addMoreIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { fontSize: 15, fontWeight: '600', color: '#22c55e' },

  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  emptySub:   { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  emptyBtn:   { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  emptyBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 18,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 8, overflow: 'hidden',
  },
  fabGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});