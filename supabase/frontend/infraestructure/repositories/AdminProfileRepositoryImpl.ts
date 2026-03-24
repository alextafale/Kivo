import { supabase } from '../../config/supabaseConfig'
import type { IAdminProfileRepository } from '../../domain/ports/lNegocioRepository.ts/lAdminProfileRepository'
import type { AdminProfile } from '../../domain/entities/AdminProfile'
import { API_URL } from '@env'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('No hay sesión activa')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export class AdminProfileRepositoryImpl implements IAdminProfileRepository {
  async getMyAdminProfile(): Promise<AdminProfile | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.log('[getMyAdminProfile] Error: No user authenticated', authError)
        return null
      }

      console.log(`[getMyAdminProfile] Buscando roles admin para usuario: ${user.id}`)

      // Consultar la tabla negocio_admins para ver si el usuario es administrador de algún negocio
      const { data: adminRecord, error: adminError } = await supabase
        .from('negocio_admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminRecord) {
        console.log('[getMyAdminProfile] Error/Not Found en negocio_admins:', adminError)
        return null // No es admin o no se encontró
      }

      console.log(`[getMyAdminProfile] Negocio Admin encontrado:`, adminRecord)

      // Consultar si hay una sucursal para este negocio
      const { data: sucursalRecord, error: sucursalError } = await supabase
        .from('sucursales')
        .select('id')
        .eq('negocio_id', adminRecord.negocio_id)
        .limit(1)
        .maybeSingle()

      if (sucursalError) {
        console.log('[getMyAdminProfile] Error buscando sucursal:', sucursalError)
      } else {
        console.log(`[getMyAdminProfile] Sucursal encontrada:`, sucursalRecord)
      }

      return {
        negocioId: adminRecord.negocio_id,
        sucursalId: sucursalRecord?.id ?? null,
        puedeEditarMenu: adminRecord.puede_editar_menu,
        puedeVerPedidos: adminRecord.puede_ver_pedidos,
        puedeEditarNegocio: adminRecord.puede_editar_negocio,
      } as AdminProfile
    } catch (e) {
      console.log('[getMyAdminProfile] Catch Exception:', e)
      return null
    }
  }
}