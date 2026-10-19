import { router } from 'expo-router';
import { Card, Header, ListRow, Screen } from '@/components/ui';
import { useApp } from '@/store/useApp';

/** "+971501234567" → "+971 50 •••• 567" */
const maskPhone = (v: string) => {
  const m = v.match(/^(\+\d{3})(\d{2})\d*(\d{3})$/);
  return m ? `${m[1]} ${m[2]} •••• ${m[3]}` : v || '—';
};

export default function Account() {
  const p = useApp((s) => s.profile);
  const paused = useApp((s) => s.paused);

  return (
    <Screen scroll>
      <Header title="Account" spaced />
      <Card style={{ paddingVertical: 0, paddingHorizontal: 16 }}>
        <ListRow label="Phone number" value={maskPhone(p.phone)} />
        <ListRow label={p.email ? 'Email' : 'Add email'} value={p.email || 'Optional'} onPress={() => router.push({ pathname: '/email', params: { mode: 'change' } })} />
        <ListRow label="Change phone number" onPress={() => router.push({ pathname: '/phone', params: { mode: 'change' } })} />
        <ListRow label="Account status" value={paused ? 'Paused' : 'Active'} onPress={paused ? () => useApp.getState().setPaused(false) : undefined} />
        <ListRow label="Delete account" last onPress={() => router.push('/settings/delete-account')} />
      </Card>
    </Screen>
  );
}
