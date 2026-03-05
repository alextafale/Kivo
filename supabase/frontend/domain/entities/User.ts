// Entidad pura del usuario — sin imports externos
export type User = {
  id: string
  role: string
  nombre: string | null
  apellido: string | null
  telefono: string | null
  avatar_url: string | null
  pais: string | null
  idioma: string | null
  activo: boolean
}

// Sesión de autenticación devuelta por Supabase
export type AuthSession = {
  accessToken: string
  userId: string
  email: string
}
