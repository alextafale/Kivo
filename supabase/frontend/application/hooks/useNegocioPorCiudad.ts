import { useState, useEffect } from 'react';
import { NegocioRepositoryImpl } from '../../infraestructure/repositories/NegocioRepositoryImpl';
import type { NegocioResumen } from '../../domain/entities/Negocio';

const negocioRepo = new NegocioRepositoryImpl();

export const useNegociosPorCiudad = (
  ciudad: string | null,
  categoria: string,
  page: number,
  limit: number
) => {
  const [negocios, setNegocios] = useState<NegocioResumen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!ciudad) {
      setNegocios([]);
      return;
    }

    const fetchNegocios = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await negocioRepo.getNegociosPorCiudad(
          ciudad,
          categoria,
          page,
          limit
        );

        const nuevos = res?.data || [];
        // Si tu backend NO manda un total real, 'total' será igual a nuevos.length (según el repo que arreglamos antes)
        const totalEnRespuesta = res?.total || 0;

        // 1. Actualizamos la lista
        setNegocios(prev => {
          if (page === 1) return nuevos;
          const idsExistentes = new Set(prev.map(n => n.id));
          const nuevosNoDuplicados = nuevos.filter(n => !idsExistentes.has(n.id));
          return [...prev, ...nuevosNoDuplicados];
        });

        // 2. LÓGICA DE PAGINACIÓN CORREGIDA
        // Si llegaron MENOS de los que pedimos (ej. llegaron 3 y pedimos 4), ya no hay más.
        if (nuevos.length < limit) {
          setHasMore(false);
        } else {
          // Si llegaron exactamente el límite (ej. 4 de 4), asumimos que PUEDE haber más.
          setHasMore(true);
        }

      } catch (e) {
        console.error('[useNegociosPorCiudad] Error:', e);
        setError('No se pudieron cargar los negocios');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNegocios();
  }, [ciudad, categoria, page, limit]);

  return { negocios, isLoading, error, hasMore };
};