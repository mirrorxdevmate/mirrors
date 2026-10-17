import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Screen, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function MirrorMoment() {
  const type = useApp((s) => s.type);
  const profile = useApp((s) => s.profile);
  const setStage = useApp((s) => s.setStage);
  const who = profile.interestedIn === 'Woman' ? 'Women' : profile.interestedIn === 'Everyone' ? 'Everyone' : 'Men';
  const rows = [
    ['Your type', `${who} · ${type.ageMin}–${type.ageMax}`],
    ['Your intent', profile.intent || 'Not set'],
    ['What matters', type.mattersMost.join(' · ') || '—'],
    ['Deal-breakers', type.dealBreakers.join(' · ') || 'None — you’re open'],
  ];
  return (
    <Screen
      scroll
      footer={
        <Button
          title="Meet my introductions"
          onPress={() => {
            setStage('verify');
            router.replace({ pathname: '/celebrate', params: { title: 'Your type is taking shape.', next: '/verify' } });
          }}
        />
      }>
      <View style={{ height: 24 }} />
      <T v="display" style={{ marginBottom: 24 }}>
        Here&apos;s how Mirror understands you.
      </T>
      {rows.map(([k, v]) => (
        <Card key={k} style={{ marginBottom: 12 }}>
          <T v="overline" color={colors.primary}>
            {k}
          </T>
          <T v="bodyLM" style={{ marginTop: 4 }}>
            {v}
          </T>
        </Card>
      ))}
      <T v="body" color={colors.grey700} center style={{ marginTop: 12 }}>
        We&apos;ll use this to find people — not just profiles.
      </T>
    </Screen>
  );
}
