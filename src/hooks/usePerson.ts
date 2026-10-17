import { useEffect, useState } from 'react';

import type { Profile } from '@/data/profiles';
import { getCard } from '@/services/api';
import { useApp } from '@/store/useApp';

/** A person from the local cache, fetched from the server if we haven't seen them yet. */
export function usePerson(id: string | undefined): { person: Profile | undefined; loading: boolean } {
  const person = useApp((s) => (id ? s.people[id] : undefined));
  const [loading, setLoading] = useState(!person && !!id);
  useEffect(() => {
    if (!id || person) return;
    let alive = true;
    getCard(id)
      .then((c) => {
        if (alive && c) useApp.getState().cachePeople([c]);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, person]);
  return { person, loading: loading && !person };
}
