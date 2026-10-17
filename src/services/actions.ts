import { router } from 'expo-router';

import * as api from '@/services/api';
import { useApp } from '@/store/useApp';

/** Shows interest in someone. Opens the match screen when it's mutual; returns whether it was. */
export async function showInterest(id: string, opts?: { replace?: boolean }) {
  const r = await api.decide(id, 'interested');
  if (r.matched && r.matchId) {
    const st = useApp.getState();
    st.set({ matchIds: { ...st.matchIds, [id]: r.matchId } });
    if (opts?.replace) router.replace(`/match/${id}`);
    else router.push(`/match/${id}`);
    return true;
  }
  return false;
}
