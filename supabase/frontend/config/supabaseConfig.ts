import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:          AsyncStorage,   // ← persiste el token en el dispositivo
    autoRefreshToken: true,           // ← refresca el token automáticamente
    persistSession:   true,           // ← guarda la sesión entre cierres
    detectSessionInUrl: false,        // ← desactivar para React Native (no hay URL)
  },
})