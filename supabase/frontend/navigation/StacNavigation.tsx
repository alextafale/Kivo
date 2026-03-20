import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Onboarding & Shared ─────────────────────────────────────────────────────
import SplashScreen         from '../screens/shared/SplashScreen';
import Onboarding           from '../onboarding/Onboarding';

// ─── Auth (Cliente) ───────────────────────────────────────────────────────────
import Signup               from '../screens/client/auth/Signup';
import Login                from '../screens/client/auth/Login';
import AccountTypeSelection from '../screens/client/auth/AccountTypeSelection';

// ─── Auth (Negocio) ──────────────────────────────────────────────────────────
import LoginBusiness        from '../screens/business/auth/LoginBusiness';
import RegisterBusiness     from '../screens/business/auth/RegisterBusiness';

// ─── Auth (Repartidor) ───────────────────────────────────────────────────────
import LoginDriver          from '../screens/delivery/auth/LoginDriver';
import RegisterDriver       from '../screens/delivery/auth/Registerdriver';

// ─── Cliente ──────────────────────────────────────────────────────────────────
import HomeFeed             from '../screens/client/home/homeFeed';
import BusinessDetailScreen from '../screens/client/home/BusinessDetailScreen';

import Chatbot              from '../screens/client/chatbot/Chatbot';
import Profile              from '../screens/client/profile/Profile';
import EditProfile          from '../screens/client/profile/EditProfile';
import Orders               from '../screens/client/orders/Order';
import OrderSummary         from '../screens/client/orders/OrderSummary';
import DeliveryAddresses    from '../screens/client/addresses/DeliveryAddresses';
import AddAddress           from '../screens/client/addresses/AddAddress';
import AddCard              from '../screens/client/payments/AddCard';
import PaymentMethods       from '../screens/client/payments/PaymentsMethod';
import ConfirmPayment       from '../screens/client/payments/ConfirmPayment';
import OrderTrackingScreen  from '../screens/client/orders/OrderTracking';
import CartScreen           from '../screens/client/orders/CartScreen';

// ─── Negocio ──────────────────────────────────────────────────────────────────
import BusinessOnboarding   from '../screens/business/onboarding/BusinessOnboarding';
import BusinessDashboard    from '../screens/business/dashboard/Dashboard';
import MenuEditor           from '../screens/business/menu/MenuEdit';
import SettingsScreen       from '../screens/business/settings/SettingsBusiness';
import MenuItemEditor       from '../screens/business/menu/MenuItemEditor';
import AdminCupones         from '../screens/business/cupones/AdminCupones';

// ─── Repartidor ───────────────────────────────────────────────────────────────
import DriverOnboarding     from '../screens/delivery/home/DriverOnboarding';
import DriverDashboard      from '../screens/delivery/onboarding/Driverdashboard';

// ─── Tipos ────────────────────────────────────────────────────────────────────
import type { Order, OrderItem }  from '../types/order';
import type { Domicilio }         from '../domain/entities/Domicilio';
import type { BusinessData }      from '../screens/client/home/BusinessDetailScreen';

export type RootStackParamList = {
  // Shared
  Splash:               undefined;
  Onboarding:           undefined;
  AccountTypeSelection: undefined;

  // Auth — Cliente
  Login:                undefined;
  Signup:               { accountType: 'client' } | undefined;

  // Auth — Negocio
  LoginBusiness:        undefined;
  RegisterBusiness:     undefined;
  BusinessOnboarding:   undefined;

  // Auth — Repartidor
  LoginDriver:          undefined;
  RegisterDriver:       undefined;
  DriverOnboarding:     { vehiculo: string; placa: string; fromRegister?: boolean };

  // Cliente
  HomeFeed:             undefined;

  BusinessDetail:       { sucursal_id: string };

  Chatbot:              undefined;
  Profile:              undefined;
  EdithProfile:         undefined;
  Orders:               undefined;
  OrderDetails:         { orderId: string };
  Cart: undefined;

  OrderSummary: {
    items: OrderItem[];
    negocioId: string;
    negocioNombre: string;
    direccionEntrega: string;
    costoEnvio: number;
  };
  ConfirmPayment: {
    items: OrderItem[];
    negocioId: string;
    subtotal: number;
    descuento: number;
    costoEnvio: number;
    total: number;
    codigoCupon?: string;
    cuponId?: string;
    notas?: string;
    direccionEntrega: string;
  };
  DeliveryAddresses:    undefined;
  AddAddress:           { domicilioId?: Domicilio } | undefined;
  AddCard:              undefined;
  PaymentsMethod:       undefined;
  orderTracking:        { order: Order };

  // Negocio
  BusinessDashboard:    undefined;
  MenuEditor:           undefined;
  MenuItemEditor:       { itemId: string };
  Settings:             undefined;
  AdminCupones:         undefined;

  // Repartidor
  DriverDashboard:      undefined;


};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        id="RootStack"
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* ── Shared ─────────────────────────────────────────────────────── */}
        <Stack.Screen name="Splash"               component={SplashScreen} />
        <Stack.Screen name="Onboarding"           component={Onboarding} />
        <Stack.Screen name="AccountTypeSelection" component={AccountTypeSelection} options={{ animation: 'fade' }} />

        {/* ── Auth — Cliente ─────────────────────────────────────────────── */}
        <Stack.Screen name="Login"                component={Login} />
        <Stack.Screen name="Signup"               component={Signup} />

        {/* ── Auth — Negocio ─────────────────────────────────────────────── */}
        <Stack.Screen name="LoginBusiness"        component={LoginBusiness} />
        <Stack.Screen name="RegisterBusiness"     component={RegisterBusiness} />
        <Stack.Screen name="BusinessOnboarding"   component={BusinessOnboarding} />

        {/* ── Auth — Repartidor ──────────────────────────────────────────── */}
        <Stack.Screen name="LoginDriver"          component={LoginDriver} />
        <Stack.Screen name="RegisterDriver"       component={RegisterDriver} />
        <Stack.Screen name="DriverOnboarding"     component={DriverOnboarding} />

        {/* ── Cliente ────────────────────────────────────────────────────── */}
        <Stack.Screen name="HomeFeed"             component={HomeFeed} />

        <Stack.Screen name="BusinessDetail"       component={BusinessDetailScreen} />
        <Stack.Screen name="Chatbot"              component={Chatbot} />
        <Stack.Screen name="Profile"              component={Profile} />
        <Stack.Screen name="EdithProfile"         component={EditProfile} />
        <Stack.Screen name="Orders"               component={Orders} />
        <Stack.Screen name="OrderDetails"         component={Orders} />
        <Stack.Screen name="OrderSummary"         component={OrderSummary} />
        <Stack.Screen name="DeliveryAddresses"    component={DeliveryAddresses} />
        <Stack.Screen name="AddAddress"           component={AddAddress} />
        <Stack.Screen name="AddCard"              component={AddCard} />
        <Stack.Screen name="PaymentsMethod"       component={PaymentMethods} />
        <Stack.Screen name="ConfirmPayment"       component={ConfirmPayment} />
        <Stack.Screen name="orderTracking"        component={OrderTrackingScreen} />
        <Stack.Screen name="Cart"                 component={CartScreen} />

        {/* ── Negocio ────────────────────────────────────────────────────── */}
        <Stack.Screen name="BusinessDashboard"    component={BusinessDashboard} />
        <Stack.Screen name="MenuEditor"           component={MenuEditor} />
        <Stack.Screen name="MenuItemEditor"       component={MenuItemEditor} />
        <Stack.Screen name="Settings"             component={SettingsScreen} />
        <Stack.Screen name="AdminCupones"         component={AdminCupones} />

        {/* ── Repartidor ─────────────────────────────────────────────────── */}
        <Stack.Screen name="DriverDashboard"      component={DriverDashboard} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}