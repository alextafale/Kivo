import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, G, Defs, ClipPath } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/StacNavigation';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;
type Props = { navigation: ProfileNavigationProp };

const { width } = Dimensions.get('window');

// ─── ICONS ────────────────────────────────────────────────────────────────────

const EditPenIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
    <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </Svg>
);

const EmailIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="m2 7 10 7 10-7" />
  </Svg>
);

const PhoneIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Svg>
);

const LocationIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

const OrdersIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <Rect x="9" y="3" width="6" height="4" rx="1" />
    <Path d="M9 12h6M9 16h4" />
  </Svg>
);

const PaymentIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Rect x="1" y="4" width="22" height="16" rx="2" />
    <Path d="M1 10h22" />
  </Svg>
);

const HelpIcon = ({ color = '#22c55e' }: { color?: string }) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Circle cx="12" cy="17" r="0.5" fill={color} />
  </Svg>
);

const ChevronRightIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
    <Path d="m9 18 6-6-6-6" />
  </Svg>
);

const SignOutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Path d="M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

const CloseIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="12" height="12" viewBox="0 0 24 24" fill="#22c55e" stroke="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

// ─── INTERFACES ──────────────────────────────────────────────────────────────

interface UserData {
  name: string;
  email: string;
  phone: string;
  address: string;
  businessName?: string;
  accountType: 'client' | 'business';
  level?: number;
  title?: string;
}

// ─── ANIMATED ROW ─────────────────────────────────────────────────────────────

const AnimatedInfoRow = ({
  icon,
  label,
  value,
  onEdit,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit: () => void;
  delay?: number;
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <TouchableOpacity style={styles.infoRow} onPress={onEdit} activeOpacity={0.7}>
        <View style={styles.infoIconWrap}>{icon}</View>
        <View style={styles.infoTextBlock}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
        <View style={styles.editBadge}>
          <EditPenIcon />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Profile({ navigation }: Props) {
  const [userData, setUserData] = useState<UserData>({
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+1 (555) 234-5678',
    address: 'Calle Principal #123, CDMX',
    accountType: 'client',
    level: 12,
    title: 'Gourmet Explorer',
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editField, setEditField] = useState<keyof UserData | ''>('');
  const [editValue, setEditValue] = useState('');

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    Animated.stagger(120, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      const accountType = await AsyncStorage.getItem('accountType');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setUserData({
          ...parsed,
          accountType: (accountType as 'client' | 'business') || 'client',
          level: parsed.level ?? 12,
          title: parsed.title ?? 'Gourmet Explorer',
        });
      }
    } catch {}
  };

  const handleEdit = (field: keyof UserData, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (editField && editValue.trim()) {
      const updatedData = { ...userData, [editField]: editValue };
      setUserData(updatedData);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      setEditModalVisible(false);
      Alert.alert('✓ Actualizado', 'Tu información fue guardada correctamente.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          navigation.reset({ index: 0, routes: [{ name: 'AccountTypeSelection' }] });
        },
      },
    ]);
  };

  const fieldLabels: Record<string, string> = {
    name: 'Nombre', email: 'Email', phone: 'Teléfono', address: 'Dirección', businessName: 'Negocio',
  };

  return (
    <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── TOP HEADER ─────────────────────────────────────── */}
        <Animated.View
          style={[styles.topHeader, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>Mi Perfil</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* ── PROFILE HERO ────────────────────────────────────── */}
        <Animated.View
          style={{
            opacity: cardAnim,
            transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
          }}
        >
          <View style={styles.heroSection}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarRing}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300' }}
                  style={styles.avatar}
                />
              </View>
              <TouchableOpacity style={styles.editAvatarBtn}>
                <EditPenIcon />
              </TouchableOpacity>
            </View>

            {/* Name & title */}
            <Text style={styles.heroName}>{userData.name}</Text>
            <View style={styles.heroSubRow}>
              <StarIcon />
              <Text style={styles.heroSub}>
                {userData.title}  •  Nivel {userData.level}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── PERSONAL INFO ────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>INFORMACIÓN PERSONAL</Text>
            <TouchableOpacity onPress={() => handleEdit('name', userData.name)}>
              <Text style={styles.sectionEditLink}>Editar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <AnimatedInfoRow
              icon={<EmailIcon />}
              label="Correo Electrónico"
              value={userData.email}
              onEdit={() => handleEdit('email', userData.email)}
              delay={100}
            />
            <View style={styles.rowDivider} />
            <AnimatedInfoRow
              icon={<PhoneIcon />}
              label="Número de Teléfono"
              value={userData.phone}
              onEdit={() => handleEdit('phone', userData.phone)}
              delay={160}
            />
            {userData.address ? (
              <>
                <View style={styles.rowDivider} />
                <AnimatedInfoRow
                  icon={<LocationIcon />}
                  label="Dirección"
                  value={userData.address}
                  onEdit={() => handleEdit('address', userData.address)}
                  delay={220}
                />
              </>
            ) : null}
          </View>
        </View>

        {/* ── QUICK ACTIONS ────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>ACCIONES RÁPIDAS</Text>
          <View style={styles.card}>
            {[
              { icon: <OrdersIcon />, title: 'Mis Pedidos', sub: 'Rastrea y reordena comidas', route: 'Orders' },
              { icon: <LocationIcon />, title: 'Direcciones', sub: 'Casa, oficina y más', route: 'DeliveryAddresses' },
              { icon: <PaymentIcon />, title: 'Métodos de Pago', sub: 'Visa terminada en 4242', route: 'PaymentsMethod' },
              { icon: <HelpIcon />, title: 'Ayuda & Soporte', sub: 'Servicio al cliente 24/7', route: 'Chatbot' },
            ].map((item, i, arr) => (
              <View key={item.title}>
                <TouchableOpacity
                  style={styles.actionRow}
                  activeOpacity={0.7}
                  onPress={() => item.route && navigation.navigate(item.route as any)}
                >
                  <View style={styles.actionIconWrap}>{item.icon}</View>
                  <View style={styles.actionTextBlock}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionSub}>{item.sub}</Text>
                  </View>
                  <ChevronRightIcon />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── RECENT ORDER ─────────────────────────────────────── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>PEDIDO RECIENTE</Text>
          <View style={styles.recentOrderCard}>
            <View style={styles.orderLeft}>
              <View style={styles.orderImageWrap}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' }}
                  style={styles.orderImage}
                />
              </View>
              <View>
                <Text style={styles.orderName}>Burger King Elite</Text>
                <Text style={styles.orderMeta}>Oct 24  •  $24.50</Text>
              </View>
            </View>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.reorderBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.reorderBtnText}>Reordenar</Text>
            </LinearGradient>
          </View>
        </View>

        {/* ── SIGN OUT ─────────────────────────────────────────── */}
        <View style={[styles.sectionContainer, { marginTop: 8 }]}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <SignOutIcon />
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Pidelo Delivery App  •  v2.4.0</Text>
      </ScrollView>

      {/* ── EDIT MODAL ──────────────────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHead}>
                <Text style={styles.modalTitle}>
                  Editar {fieldLabels[editField as string] || editField}
                </Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                  <CloseIcon />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalFieldLabel}>
                  {fieldLabels[editField as string] || editField}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder={`Ingresa tu ${(fieldLabels[editField as string] || '').toLowerCase()}`}
                  placeholderTextColor="#94A3B8"
                  autoFocus
                  keyboardType={
                    editField === 'phone' ? 'phone-pad' :
                    editField === 'email' ? 'email-address' : 'default'
                  }
                />
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                  <LinearGradient
                    colors={['#22c55e', '#16a34a']}
                    style={styles.saveBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.saveBtnText}>Guardar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },

  // Top Header
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.2,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: '#22c55e',
    padding: 3,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 52,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#f0fdf4',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSub: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 4,
  },

  // Section
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  sectionEditLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22c55e',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  editBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTextBlock: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },

  // Recent order
  recentOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  orderImage: {
    width: '100%',
    height: '100%',
  },
  orderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  orderMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  reorderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reorderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Sign out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },

  // Version
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 11,
    color: '#cbd5e1',
    letterSpacing: 0.4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  saveBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});