import { router } from 'expo-router';
import { useState } from 'react';

import { Dialog } from '@/components/overlays';
import { Card, Header, ListRow, Screen, T } from '@/components/ui';
import { signOut } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function Account() {
  const p = useApp((s) => s.profile);
  const paused = useApp((s) => s.paused);
  const [confirmSignOut, setSignOut] = useState(false);

  return (
    <Screen scroll>
      <Header title="Account" />
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="Email" value={p.email || '—'} />
        <ListRow label="Change email" onPress={() => router.push({ pathname: '/email', params: { mode: 'change' } })} />
        <ListRow label="Account status" value={paused ? 'Paused' : 'Active'} onPress={paused ? () => useApp.getState().setPaused(false) : undefined} />
        <ListRow label="Sign out" onPress={() => setSignOut(true)} />
        <ListRow label="Delete account" danger last onPress={() => router.push('/settings/delete-account')} />
      </Card>
      <T v="caption" color={colors.grey600} style={{ marginTop: 10 }}>
        Your email is used to sign in and is never shown on your profile.
      </T>
      <Dialog
        visible={confirmSignOut}
        title="Sign out?"
        message="You can sign back in with your email at any time."
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
