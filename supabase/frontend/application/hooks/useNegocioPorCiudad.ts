import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseConfig';

export interface NegocioCard {
  id: string;           // negocio_id
  sucursal_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  calificacion: number | null;
  banner_url: string | null;
}

export function useNegociosPorCiudad(ciudad: string | null, categoria: string) {
  const [negocios, setNegocios] = useState<NegocioCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ciudad) {
      setNegocios([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        let query = supabase
          .from('sucursales')
          .select(`
            id,
            calificacion,
            negocios!inner (
              id,
              nombre,
              descripcion,
              categoria,
              banner_url,
              activo
            )
          `)
          .eq('ciudad', ciudad)
          .eq('activo', true)
          .eq('negocios.activo', true)
          .order('calificacion', { ascending: false });

        // Filtro de categoría (excepto "Todos")
        if (categoria !== 'Todos') {
          query = query.ilike('negocios.categoria', `%${categoria}%`);
        }

        const { data, error: sbError } = await query;

        if (sbError) throw sbError;
        if (cancelled) return;

        const mapped: NegocioCard[] = (data ?? []).map((row: any) => ({
          id:           row.negocios.id,
          sucursal_id:  row.id,
          nombre:       row.negocios.nombre,
          descripcion:  row.negocios.descripcion ?? null,
          categoria:    row.negocios.categoria,
          calificacion: row.calificacion != null ? Number(row.calificacion) : null,
          banner_url:   row.negocios.banner_url ?? null,
        }));

        setNegocios(mapped);
      } catch (e: any) {
        if (!cancelled) setError('No pudimos cargar los negocios. Intenta de nuevo.');
        console.error('useNegociosPorCiudad error:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [ciudad, categoria]);

  return { negocios, isLoading, error };
}