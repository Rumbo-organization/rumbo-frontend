/* ============================================================
   RUMBO — TanStack Query (server state del cockpit)
   Cliente + hooks publicados en window (mismo contrato global que el resto
   de los módulos: sin imports entre pantallas — ver globals.js). Las
   pantallas consumen useApiQuery / useInfiniteQuery; las mutaciones siguen
   imperativas vía window.rumboApi y rumboRefresh() invalida TODAS las
   queries después de re-hidratar el BFF.
   ============================================================ */
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Las mutaciones invalidan explícitamente (rumboRefresh / invalidateQueries):
      // dentro de esta ventana, volver a una pantalla no re-pide lo mismo.
      staleTime: 30_000,
    },
  },
});

// Azúcar para las pantallas: useApiQuery(key, fn, { keepPrevious, enabled }).
// keepPrevious: en listas paginadas mantiene la página anterior visible
// mientras llega la nueva (sin flash de skeleton al paginar/filtrar).
function useApiQuery(queryKey, queryFn, opts = {}) {
  return useQuery({
    queryKey,
    queryFn,
    enabled: opts.enabled !== false,
    placeholderData: opts.keepPrevious ? keepPreviousData : undefined,
  });
}

Object.assign(window, {
  queryClient,
  QueryClientProvider,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  keepPreviousData,
  useApiQuery,
});
