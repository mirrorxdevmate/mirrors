import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Button, Card, Header, Row, Screen, T, Title } from '@/components/ui';
import { BATCH, useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function UpgradeOverview() {
  const plan = useApp((s) => s.plan);
  const tiers = [
    { kind: 'plus' as const, title: 'Mirror+', sub: 'More discovery and more control', points: 'Refresh about every 8 hours · Larger curated batches · Advanced Type Controls · Global Discovery' },
    { kind: 'premium' as const, title: 'Premium', sub: 'Everything in Mirror+, plus depth and privacy', points: 'Refresh about every 5 hours · Deeper Why you two? · Your Pattern+ · Travel Mode · Incognito Mode' },
  ];
  return (
    <Screen
      scroll
      footer={
        <>
          <Button title={plan === 'free' ? 'See plans' : 'Manage subscription'} onPress={() => (plan === 'free' ? router.push('/upgrade/plans') : router.replace('/subscription'))} />
          <Button title="Maybe later" variant="ghost" onPress={() => router.back()} />
        </>
      }>
      <Header />
      <Title
        sub={
          plan === 'free'
            ? `You're on Free — ${BATCH.free.size} curated introductions every 24 hours, matching, messaging, verification and all safety features.`
            : `You're on ${BATCH[plan].label}.`
        }>
        Choose how you want to use Mirror.
      </Title>
      {tiers.map((t) => (
        <Card key={t.kind} style={{ marginBottom: 12, borderWidth: plan === t.kind ? 1.5 : 0, borderColor: colors.primary }} onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: t.kind } })}>
          <Row>
            <T v="h3" style={{ flex: 1 }}>
              {t.title}
            </T>
            <Badge kind={t.kind} />
          </Row>
          <T v="bodyM" style={{ marginTop: 4 }}>
            {t.sub}
          </T>
          <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
            {t.points}
          </T>
          {plan === t.kind ? (
            <View style={{ marginTop: 8 }}>
              <T v="captionM" color={colors.primary}>
                Current plan
              </T>
            </View>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
