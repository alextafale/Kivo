import type { IProfileRepository } from '../../domain/ports/repositories/lProfileRepository';
import type { User } from '../../domain/entities/User';
import { supabase } from '../../config/supabaseConfig';
import * as FileSystem from 'expo-file-system/legacy';

// Implementación concreta — llama a FastAPI /api/v1/me
export class ProfileRepositoryImpl implements IProfileRepository {

  async getMe(accessToken: string): Promise<User> {
    const res = await fetch(`${process.env.API_BASE_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? 'Error al obtener perfil')
    }
    return res.json()
  }

  async updateMe(
    accessToken: string,
    data: Partial<Pick<User, 'nombre' | 'apellido' | 'telefono' | 'avatar_url'>>
  ): Promise<User> {
    const res = await fetch(`${process.env.API_BASE_URL}/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail ?? 'Error al actualizar perfil')
    }
    return res.json()
  }

  // ── Foto de perfil (Almacenamiento Directo) ─────────────────────────
  async uploadAvatar(localUri: string, mimeType: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: "base64",
    });

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) throw new Error("Sin sesión activa en Supabase");
    const path = `clients/${session.user.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, bytes.buffer, { contentType: mimeType, upsert: true });

    if (error) throw new Error(`Error al subir foto: ${error.message}`);

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }
}