import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { adminReviewVerification, adminVerifications, verificationImageUrl, type AdminVerification } from '@/services/api';
import { colors, radius } from '@/theme';

function Item({ v, onDone }: { v: AdminVerification; onDone: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    verificationImageUrl(v.path).then(setUrl).catch(() => setUrl(''));
  }, [v.path]);

  const review = async (approve: boolean) => {
    setBusy(true);
    try {
      await adminReviewVerification(v.id, approve);
      onDone();
    } catch {
      Alert.alert('Could not save the review');
      setBusy(false);
    }
  };

  return (
    <Card style={{ marginBottom: 12, gap: 10 }}>
      <T v="bodyS">
        {v.kind === 'photo' ? 'Selfie check' : 'ID document'} · {v.user.name || 'Member'} ({v.user.email})
      </T>
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <T v="caption" color={colors.grey600} style={{ marginBottom: 4 }}>
            Submitted
          </T>
          {url ? (
            <Image source={url} style={{ width: '100%', aspectRatio: 0.8, borderRadius: radius.sm }} contentFit="cover" />
          ) : (
            <View style={{ aspectRatio: 0.8, alignItems: 'center', justifyContent: 'center' }}>
              {url === null ? <ActivityIndicator color={colors.primary} /> : <T v="caption">Image unavailable</T>}
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <T v="caption" color={colors.grey600} style={{ marginBottom: 4 }}>
            Profile photo
          </T>
          {v.user.photos?.[0] ? <Image source={v.user.photos[0]} style={{ width: '100%', aspectRatio: 0.8, borderRadius: radius.sm }} contentFit="cover" /> : null}
        </View>
      </Row>
      <T v="caption" color={colors.grey700}>
        {v.kind === 'photo'
          ? 'Approve only if the selfie clearly matches the profile photos.'
          : 'Approve only if the ID is valid, readable, and the person is 18+. Never save or share it.'}
      </T>
      <Row gap={8}>
        <Button title="Reject" small variant="outline" style={{ flex: 1 }} disabled={busy} onPress={() => review(false)} />
        <Button title="Approve" small style={{ flex: 1 }} loading={busy} onPress={() => review(true)} />
      </Row>
    </Card>
  );
}

export default function AdminVerifications() {
  const { data, loading, setData } = useServer(adminVerifications, [] as AdminVerification[]);
  return (
    <Screen scroll>
      <Header title="Verification review" spaced />
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && data.length === 0 ? (
        <T v="body" color={colors.grey600} center style={{ marginTop: 40 }}>
          Nothing waiting for review.
        </T>
      ) : null}
      {data.map((v) => (
        <Item key={v.id} v={v} onDone={() => setData(data.filter((x) => x.id !== v.id))} />
      ))}
    </Screen>
  );
}
