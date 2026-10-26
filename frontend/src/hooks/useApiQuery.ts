import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { toApiError, type ApiError } from '@/api';

interface QueryState<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  setData: (data: T) => void;
}

/** Fetches data whenever the screen gains focus, with pull-to-refresh support. */
export function useApiQuery<T>(fetcher: () => Promise<T>): QueryState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Always call the latest fetcher without refetching every time it changes
  // (e.g. while the user is typing a search term).
  const fetcherRef = useRef(fetcher);
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  const refresh = useCallback(() => load(true), [load]);

  return { data, error, loading, refreshing, refresh, setData };
}
