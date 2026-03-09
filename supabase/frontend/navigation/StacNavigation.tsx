import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ─── Onboarding ───────────────────────────────────────────────────────────────
import SplashScreen from '../screens/SplashScreen';
import Onboarding from '../onboarding/Onboarding';
import AccountTypeSelection from '../screens/accountTypeSelection/AccountTypeSelection';

// ─── Auth (Cliente) ───────────────────────────────────────────────────────────
import Signup from '../screens/auth/Signup';
import Login from '../screens/auth/Login';


// ─── Auth (Delivery) ───────────────────────────────────────────────────────────
import LoginDelivery from '../screens/delivery/LoginDelivery';
import SignupDelivery from '../screens/delivery/SignupDelivery';

// ─── Cliente ──────────────────────────────────────────────────────────────────
import HomeFeed from '../screens/homeFeed/homeFeed';
import Chatbot from '../screens/chatbot/Chatbot';
import Profile from '../screens/profile/Profile';
import EdithProfile from '../screens/profile/EdithProfile';
import Orders from '../screens/orders/Order';
import { Order } from '../types/order';
import deliveryAddresses from '../screens/addresses/deliveryAddresses';
import OrderDetails from '../screens/orders/Order';
import AddAddress from '../screens/addresses/addAddress';
import AddCard from '../screens/PaymentsMethod/addCard';
import PaymentMethods from '../screens/PaymentsMethod/paymentsMethod';
import OrderTrackingScreen from '../screens/orders/orderTraking';

// ─── Admin / Negocio ──────────────────────────────────────────────────────────
import BusinessDashboard from '../screens/admin/dashboard/dashboard';
import MenuEditor from '../screens/admin/menuEdit/menuEdit';
import SettingsScreen from '../screens/admin/settingsBusiness/settingsBusiness';
import EditMenuItem from '../screens/admin/businessSettings/menu/edithMenu';
import MenuItemEditor from '../screens/admin/menuEdit/MenuItemEditor';
import { Domicilio } from '../domain/entities/Domicilio';
import BusinessOnboarding from '../screens/admin/onBoarding/BusinessOnboarding';
import LoginBusiness from '../screens/business/auth/LoginBusiness';
import RegisterBusiness from '../screens/business/auth/RegisterBusiness';
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
        <Stack.Screen name="EdithProfile" component={EdithProfile} />
        <Stack.Screen name="Orders" component={Orders} />
        <Stack.Screen name="OrderDetails" component={OrderDetails} />
        <Stack.Screen name="DeliveryAddresses" component={deliveryAddresses} />
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