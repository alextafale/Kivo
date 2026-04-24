// navigation/StacNavigation.tsx

import React, { useEffect, useRef } from 'react'
import { NavigationContainer, NavigationContainerRef, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'

import SplashScreen from '../screens/shared/SplashScreen'
import Onboarding from '../onboarding/Onboarding'
import MfaSetupScreen from '../screens/shared/MfaSetupScreen'

// ─── Auth (Cliente) ───────────────────────────────────────────────────────────
import Signup from '../screens/client/auth/Signup'
import Login from '../screens/client/auth/Login'
import AccountTypeSelection from '../screens/client/auth/AccountTypeSelection'

// ─── Auth (Negocio) ───────────────────────────────────────────────────────────
import LoginBusiness from '../screens/business/auth/LoginBusiness'
import RegisterBusiness from '../screens/business/auth/RegisterBusiness'

// ─── Auth (Repartidor) ───────────────────────────────────────────────────────
import LoginDriver from '../screens/delivery/auth/LoginDriver'
import RegisterDriver from '../screens/delivery/auth/Registerdriver'

// ─── Cliente ──────────────────────────────────────────────────────────────────
import ChatHistorial from '../screens/client/chatbot/ChatHistorial'
import HomeFeed from '../screens/client/home/homeFeed'
import BusinessDetailScreen from '../screens/client/home/BusinessDetailScreen'
import Chatbot from '../screens/client/chatbot/Chatbot'
import Profile from '../screens/client/profile/Profile'
import EditProfile from '../screens/client/profile/EditProfile'
import Orders from '../screens/client/orders/Order'
import OrderSummary from '../screens/client/orders/OrderSummary'
import DeliveryAddresses from '../screens/client/addresses/DeliveryAddresses'
import AddAddress from '../screens/client/addresses/AddAddress'
import AddCard from '../screens/client/payments/AddCard'
import PaymentMethods from '../screens/client/payments/PaymentsMethod'
import ConfirmPayment from '../screens/client/payments/ConfirmPayment'
import OrderTrackingScreen from '../screens/client/orders/OrderTracking'
import CartScreen from '../screens/client/orders/CartScreen'
import OrderConfirmation from '../screens/client/orders/OrderConfirmation'
import OrderDelivered from '../screens/client/orders/OrderDelivered';
import RateOrder from '../screens/client/orders/RateOrder'
import ReportarProblema from '../screens/client/orders/ReportarProblema'

// ─── Negocio ──────────────────────────────────────────────────────────────────
import BusinessOnboarding from '../screens/business/onboarding/BusinessOnboarding'
import BusinessDashboard from '../screens/business/dashboard/Dashboard'
import MenuEditor from '../screens/business/menu/MenuEdit'
import SettingsScreen from '../screens/business/settings/SettingsBusiness'
import MenuItemEditor from '../screens/business/menu/MenuItemEditor'
import AdminCupones from '../screens/business/cupones/AdminCupones'
import ManageOrders from '../screens/business/orders/ManageOrders'   // ← nuevo
import OrderDetailsBusiness from '../screens/business/orders/OrderDetailsBusiness'

// ─── Repartidor ───────────────────────────────────────────────────────────────
import DriverOnboarding from '../screens/delivery/home/DriverOnboarding'
import DriverDashboard from '../screens/delivery/onboarding/Driverdashboard'
import DriverProfile from '../screens/delivery/profile/DriverProfile'
import DriverSupport from '../screens/delivery/home/DriverSupport'
import { DriverRoutesScreen } from '../components/ui/screens/DriverRoutesScreen'
// ─── Tipos ────────────────────────────────────────────────────────────────────
import type { Order, OrderItem } from '../types/order'
import type { Domicilio } from '../domain/entities/Domicilio'
import type { BusinessData } from '../screens/client/home/BusinessDetailScreen'
import type { RepartidorInfo } from '../domain/ports/repositories/lRepartidorRepository'

export type RootStackParamList = {
  // Shared
  Splash: undefined
  Onboarding: undefined
  AccountTypeSelection: undefined
  MfaSetup: undefined

  // Auth — Cliente
  Login: undefined
  Signup: { accountType: 'client' } | undefined

  // Auth — Negocio
  LoginBusiness: undefined
  RegisterBusiness: undefined
  BusinessOnboarding: undefined

  // Auth — Repartidor
  LoginDriver: undefined
  RegisterDriver: undefined
  DriverOnboarding: { vehiculo: string; placa: string; fromRegister?: boolean }

  // Cliente
  HomeFeed: undefined
  BusinessDetail: { sucursal_id: string }
  Chatbot: { sesionId?: string } | undefined
  ChatHistorial: undefined
  Profile: undefined
  EdithProfile: undefined
  Orders: undefined
  OrderDetails: { orderId: string }
  Cart: undefined
  OrderSummary: {
    restaurants: {
      sucursalId: string
      negocioId: string
      negocioNombre: string
      costoEnvio: number
      items: OrderItem[]
    }[]
  }
  OrderConfirmation: {
    orders: { orderNumber: string; negocioNombre: string; total: number }[]
    totalGeneral: number
  }
  OrderDelivered: {
    id: string;
    orderNumber: string;
    restaurantName: string;
    total: number;
    deliveryAddress: string;
    rating?: number;
  };
  RateOrder: {
    id: string;
  };
  ReportarProblema: {
    orderId: string;
    orderNumber: string;
    total: number;
  };

  ConfirmPayment: {
    items: OrderItem[]
    negocioId: string
    subtotal: number
    descuento: number
    costoEnvio: number
    total: number
    codigoCupon?: string
    cuponId?: string
    notas?: string
    direccionEntrega: string
  }
  DeliveryAddresses: undefined
  AddAddress: { domicilio?: Domicilio } | undefined
  AddCard: undefined
  PaymentsMethod: undefined
  orderTracking: { order: Order }

  // Negocio
  BusinessDashboard: undefined
  MenuEditor: undefined
  MenuItemEditor: { itemId: string }
  Settings: undefined
  AdminCupones: undefined
  ManageOrders: undefined   // ← nuevo
  OrderDetailsBusiness: { pedidoId: string }

  // Repartidor
  DriverDashboard: undefined
  DriverProfile: { repartidor: RepartidorInfo }
  DriverSupport: undefined
  DriverRoutesScreen: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const globalNavigationRef = createNavigationContainerRef<RootStackParamList>()

export default function StackNavigation() {

  useEffect(() => {
    // Listener: usuario toca una notificación push (app en background o killed)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        pedido_id?: string
        screen?: string
      }

      if (data?.screen === 'orderTracking' && data?.pedido_id && globalNavigationRef.isReady()) {
        // Navegar a Orders para ver el pedido actualizado
        // (OrderTracking requiere el objeto Order completo, así que redirigimos a Orders)
        globalNavigationRef.navigate('Orders')
      }
    })

    return () => subscription.remove()
  }, [])

  return (
    <NavigationContainer ref={globalNavigationRef}>
      <Stack.Navigator
        id="RootStack"
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {/* ── Shared ─────────────────────────────────────────────────────── */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="AccountTypeSelection" component={AccountTypeSelection} options={{ animation: 'fade' }} />
        <Stack.Screen name="MfaSetup" component={MfaSetupScreen} />

        {/* ── Auth — Cliente ─────────────────────────────────────────────── */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />

        {/* ── Auth — Negocio ─────────────────────────────────────────────── */}
        <Stack.Screen name="LoginBusiness" component={LoginBusiness} />
        <Stack.Screen name="RegisterBusiness" component={RegisterBusiness} />
        <Stack.Screen name="BusinessOnboarding" component={BusinessOnboarding} />

        {/* ── Auth — Repartidor ──────────────────────────────────────────── */}
        <Stack.Screen name="LoginDriver" component={LoginDriver} />
        <Stack.Screen name="RegisterDriver" component={RegisterDriver} />
        <Stack.Screen name="DriverOnboarding" component={DriverOnboarding} />

        {/* ── Cliente ────────────────────────────────────────────────────── */}
        <Stack.Screen name="HomeFeed" component={HomeFeed} />
        <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
        <Stack.Screen name="Chatbot" component={Chatbot} />
        <Stack.Screen name="ChatHistorial" component={ChatHistorial} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EdithProfile" component={EditProfile} />
        <Stack.Screen name="Orders" component={Orders} />
        <Stack.Screen name="OrderDetails" component={Orders} />
        <Stack.Screen name="OrderSummary" component={OrderSummary} />
        <Stack.Screen name="DeliveryAddresses" component={DeliveryAddresses} />
        <Stack.Screen name="AddAddress" component={AddAddress} />
        <Stack.Screen name="AddCard" component={AddCard} />
        <Stack.Screen name="PaymentsMethod" component={PaymentMethods} />
        <Stack.Screen name="ConfirmPayment" component={ConfirmPayment} />
        <Stack.Screen name="orderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="OrderConfirmation" component={OrderConfirmation} />
        <Stack.Screen name="OrderDelivered" component={OrderDelivered} />
        <Stack.Screen name="RateOrder" component={RateOrder} />
        <Stack.Screen name="ReportarProblema" component={ReportarProblema} />

        {/* ── Negocio ────────────────────────────────────────────────────── */}
        <Stack.Screen name="BusinessDashboard" component={BusinessDashboard} />
        <Stack.Screen name="MenuEditor" component={MenuEditor} />
        <Stack.Screen name="MenuItemEditor" component={MenuItemEditor} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AdminCupones" component={AdminCupones} />
        <Stack.Screen name="ManageOrders" component={ManageOrders} />
        <Stack.Screen name="OrderDetailsBusiness" component={OrderDetailsBusiness} />

        {/* ── Repartidor ─────────────────────────────────────────────────── */}
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
        <Stack.Screen name="DriverProfile" component={DriverProfile} />
        <Stack.Screen name="DriverSupport" component={DriverSupport} />
        <Stack.Screen name="DriverRoutesScreen" component={DriverRoutesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}