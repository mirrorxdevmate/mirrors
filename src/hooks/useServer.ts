import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** Runs a server query whenever the screen gains focus. */
export function useServer<T>(fetcher: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    fetcher()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFocusEffect(reload);
  return { data, loading, reload, setData };
}
