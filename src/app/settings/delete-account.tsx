import { router } from 'expo-router';
import { useState } from 'react';

import { Dialog } from '@/components/overlays';
import { SingleSelect } from '@/components/step';
import { Banner, Button, Header, Screen, T } from '@/components/ui';
import { LEAVE_REASONS } from '@/data/options';
import { deleteAccount } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function DeleteAccount() {
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Screen
      scroll
      footer={
        <>
          <Button
            title="Pause my account"
            variant="outline"
            onPress={() => {
              useApp.getState().setPaused(true);
              router.dismissAll();
              router.navigate('/(tabs)');
            }}
          />
          <Button title="Delete" disabled={!reason} loading={busy} onPress={() => setConfirm(true)} />
        </>
      }>
      <Header title="Delete Account" spaced />
      {error ? <Banner tone="error" text={error} /> : null}
      <T v="body" color={colors.grey700}>
        We&apos;re sorry to see you go. Deleting your account will permanently remove your profile, matches, conversations, and all personal data from Mirror.
      </T>
      <T v="h3" style={{ marginTop: 24 }}>
        Help us understand
      </T>
      <T v="body" color={colors.grey700} style={{ marginTop: 8, marginBottom: 16 }}>
        What made you decide to leave Mirror? Your feedback helps us improve the experience.
      </T>
      <SingleSelect options={LEAVE_REASONS} value={reason} onChange={setReason} />
      <Dialog
        visible={confirm}
        title="Delete your account?"
        message="This permanently removes your profile, matches and conversations. It can't be undone."
        destructive
        primary={{
          label: 'Delete permanently',
          onPress: async () => {
            setConfirm(false);
            setBusy(true);
            setError('');
            try {
              await deleteAccount(reason); // signs out → root layout returns to Welcome
            } catch {
              setError("We couldn't delete your account. Check your connection and try again.");
              setBusy(false);
            }
          },
        }}
        secondary={{ label: 'Cancel', onPress: () => setConfirm(false) }}
        onClose={() => setConfirm(false)}
      />
    </Screen>
  );
}
