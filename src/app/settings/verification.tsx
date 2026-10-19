import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function VerificationSettings() {
  const v = useApp((s) => s.verification);
  const rows = [
    { key: 'photo' as const, label: 'Photo verification', path: '/verify/photo' },
    { key: 'identity' as const, label: 'Identity verification', path: '/verify/identity' },
  ];
  return (
    <Screen scroll>
      <Header title="Verification" spaced />
      <T v="body" color={colors.grey700} style={{ marginBottom: 16 }}>
        Verification helps people feel more confident about who they&apos;re meeting. Only a verified/not-verified result is stored.
      </T>
      {rows.map((r) => {
        const st = v[r.key];
        return (
          <Card key={r.key} style={{ marginBottom: 12 }}>
            <Row>
              <Feather name={st === 'verified' ? 'check-circle' : st === 'pending' ? 'clock' : 'circle'} size={20} color={st === 'verified' ? colors.green : st === 'pending' ? colors.amber : colors.grey500} />
              <View style={{ flex: 1 }}>
                <T v="bodyS">{r.label}</T>
                <T v="caption" color={colors.grey600}>
                  {st === 'verified' ? 'Verified' : st === 'pending' ? 'Pending — usually under 24 hours' : 'Not verified'}
                </T>
              </View>
              {st !== 'verified' ? <Button title="Verify" small onPress={() => router.push({ pathname: r.path as never, params: { from: 'settings' } })} /> : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
