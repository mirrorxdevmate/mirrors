import { router } from 'expo-router';
import { useState } from 'react';

import { Dialog } from '@/components/overlays';
import { Card, Header, LinkButton, ListRow, Screen } from '@/components/ui';
import { signOut } from '@/services/api';
import { useApp } from '@/store/useApp';

/** "+971501234567" → "+971 50 •••• 567" */
const maskPhone = (v: string) => {
  const m = v.match(/^(\+\d{3})(\d{2})\d*(\d{3})$/);
  return m ? `${m[1]} ${m[2]} •••• ${m[3]}` : v || '—';
};

export default function Account() {
  const p = useApp((s) => s.profile);
  const paused = useApp((s) => s.paused);
  const [confirmSignOut, setSignOut] = useState(false);

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
      <LinkButton title="Sign out" style={{ marginTop: 24 }} onPress={() => setSignOut(true)} />
      <Dialog
        visible={confirmSignOut}
        title="Sign out?"
        message="You can sign back in with your phone number at any time."
        primary={{
          label: 'Sign out',
          onPress: () => {
            setSignOut(false);
            // Your profile stays on the server; signing back in with this number resumes it.
            signOut(); // the root layout resets local data and returns to Welcome
          },
        }}
        secondary={{ label: 'Cancel', onPress: () => setSignOut(false) }}
        onClose={() => setSignOut(false)}
      />
    </Screen>
  );
}
