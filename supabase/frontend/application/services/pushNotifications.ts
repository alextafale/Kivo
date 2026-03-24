// application/services/pushNotifications.ts
// Pide permisos, obtiene el token y lo registra en el backend

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

const BASE_URL = 'https://kivo-v1.onrender.com/api/v1'

// Configura cómo se muestran las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Registra el dispositivo para recibir notificaciones push.
 * Llama esto una vez al iniciar sesión (en AuthContext o en HomeFeed).
 * Requiere un development build — no funciona en Expo Go.
 */
export async function registerForPushNotificationsAsync(
  authToken: string
): Promise<string | null> {
  // Solo funciona en dispositivos físicos
  if (!Device.isDevice) {
    console.log('[Push] Las notificaciones requieren un dispositivo físico')
    return null
  }

  // Crear canal Android (requerido para Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('pedidos', {
      name: 'Estado de pedidos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
      sound: 'default',
    })
  }

  // Pedir permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[Push] Permisos denegados por el usuario')
    return null
  }

  // Obtener el Expo Push Token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '4cf63da6-272b-4193-ad25-6d0254116a50', // extra.eas.projectId de app.json
  })

  const token = tokenData.data
  console.log('[Push] Token obtenido:', token)

  // Registrar en el backend
  try {
    await fetch(`${BASE_URL}/users/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    })
    console.log('[Push] Token registrado en backend')
  } catch (e) {
    console.warn('[Push] No se pudo registrar el token en backend:', e)
  }

  return token
}

/**
 * Elimina el token del backend al hacer logout.
 */
export async function unregisterPushToken(authToken: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/users/push-token`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    })
  } catch (e) {
    console.warn('[Push] No se pudo eliminar el token:', e)
  }
}