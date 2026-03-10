import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Onboarding & Shared ─────────────────────────────────────────────────────
import SplashScreen from '../screens/shared/SplashScreen';
import Onboarding from '../onboarding/Onboarding';

// ─── Auth (Cliente) ───────────────────────────────────────────────────────────
import Signup from '../screens/client/auth/Signup';
import Login from '../screens/client/auth/Login';
import AccountTypeSelection from '../screens/client/auth/AccountTypeSelection';

// ─── Auth (Negocio - Placeholders) ───────────────────────────────────────────
import LoginBusiness from '../screens/delivery/LoginDelivery';
import RegisterBusiness from '../screens/delivery/SignupDelivery';

// ─── Auth (Delivery) ─────────────────────────────────────────────────────────
import LoginDelivery from '../screens/delivery/LoginDelivery';
import SignupDelivery from '../screens/delivery/SignupDelivery';

// ─── Cliente ──────────────────────────────────────────────────────────────────
import HomeFeed from '../screens/client/home/homeFeed';
import Chatbot from '../screens/client/chatbot/Chatbot';
import Profile from '../screens/client/profile/Profile';
import EditProfile from '../screens/client/profile/EditProfile';
import Orders from '../screens/client/orders/Order';
import { Order } from '../types/order';
import DeliveryAddresses from '../screens/client/addresses/DeliveryAddresses';
import AddAddress from '../screens/client/addresses/AddAddress';
import AddCard from '../screens/client/payments/AddCard';
import PaymentMethods from '../screens/client/payments/PaymentsMethod';
import OrderTrackingScreen from '../screens/client/orders/OrderTracking';

// ─── Admin / Negocio ──────────────────────────────────────────────────────────
import BusinessDashboard from '../screens/business/dashboard/Dashboard';
import MenuEditor from '../screens/business/menu/MenuEdit';
import SettingsScreen from '../screens/business/settings/SettingsBusiness';
import EditMenuItem from '../screens/business/menu/EditMenu';
import MenuItemEditor from '../screens/business/menu/MenuItemEditor';
import { Domicilio } from '../domain/entities/Domicilio';
import BusinessOnboarding from '../screens/business/onboarding/BusinessOnboarding';
// ─── Tipos de rutas ───────────────────────────────────────────────────────────
export type RootStackParamList = {
  // Onboarding
  Splash: undefined;
  Onboarding: undefined;
  AccountTypeSelection: undefined;

  // Auth (Cliente)
  Login: { accountType: 'client' };
  Signup: { accountType: 'client' };

  // Auth (Negocio)
  LoginBusiness: { accountType: 'business' };
  RegisterBusiness: { accountType: 'business' };

  // Auth (Delivery)
  LoginDelivery: { accountType: 'delivery' };
  SignupDelivery: { accountType: 'delivery' };

  // Cliente
  HomeFeed: undefined;
  Chatbot: undefined;
  Profile: undefined;
  EdithProfile: undefined;
  Orders: undefined;
  OrderDetails: { orderId: string };
  DeliveryAddresses: undefined;
  AddAddress: { domicilioId?: Domicilio } | undefined;
  AddCard: undefined;
  PaymentsMethod: undefined;
  orderTracking: { order: Order };

  // Admin / Negocio
  dashboard: undefined;
  BusinessDashboard: undefined;
  MenuEditor: undefined;
  MenuItemEditor: { itemId: string };
  Settings: undefined;
  BusinessOnboarding: undefined;
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
        {/* ── Onboarding ─────────────────────────────────────────────────── */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen
          name="AccountTypeSelection"
          component={AccountTypeSelection}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen name="BusinessOnboarding" component={BusinessOnboarding} />

        {/* ── Auth (Cliente) ─────────────────────────────────────────────── */}
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />

        {/* ── Auth (Negocio) ─────────────────────────────────────────────── */}
        <Stack.Screen name="LoginBusiness" component={LoginBusiness} />
        <Stack.Screen name="RegisterBusiness" component={RegisterBusiness} />

        {/* ── Auth (Delivery) ─────────────────────────────────────────────── */}
        <Stack.Screen name="LoginDelivery" component={LoginDelivery} />
        <Stack.Screen name="SignupDelivery" component={SignupDelivery} />

        {/* ── Cliente ────────────────────────────────────────────────────── */}
        <Stack.Screen name="HomeFeed" component={HomeFeed} />
        <Stack.Screen name="Chatbot" component={Chatbot} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="EdithProfile" component={EditProfile} />
        <Stack.Screen name="Orders" component={Orders} />
        <Stack.Screen name="OrderDetails" component={Orders} />
        <Stack.Screen name="DeliveryAddresses" component={DeliveryAddresses} />
        <Stack.Screen name="AddAddress" component={AddAddress} />
        <Stack.Screen name="AddCard" component={AddCard} />
        <Stack.Screen name="PaymentsMethod" component={PaymentMethods} />
        <Stack.Screen name="orderTracking" component={OrderTrackingScreen} />


        {/* ── Admin / Negocio ────────────────────────────────────────────── */}
        <Stack.Screen name="dashboard" component={BusinessDashboard} />
        <Stack.Screen name="BusinessDashboard" component={BusinessDashboard} />
        <Stack.Screen name="MenuEditor" component={MenuEditor} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="MenuItemEditor" component={MenuItemEditor} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}