// Entidad pura — sin imports externos
// Representa los permisos y acceso que tiene un business_admin sobre su negocio

export type AdminProfile = {
  negocioId: string
  sucursalId: string | null          // primera sucursal activa (null si no tiene)
  puedeEditarMenu: boolean
  puedeVerPedidos: boolean
  puedeEditarNegocio: boolean
}