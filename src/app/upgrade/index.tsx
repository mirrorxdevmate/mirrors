import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Header, LinkButton, Row, Screen, T } from '@/components/ui';
import { BATCH, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function UpgradeOverview() {
  const plan = useApp((s) => s.plan);
  const tiers = [
    { kind: 'plus' as const, sub: 'More discovery and more control', points: ['Refresh about every 8 hours', 'Larger curated batches', 'Advanced Type Controls', 'Global Discovery'] },
    { kind: 'premium' as const, sub: 'Everything in Mirror+, plus depth and privacy', points: ['Refresh about every 4 hours', 'Deeper Why you two?', 'Your Pattern+', 'Travel Mode', 'Incognito Mode'] },
  ];
  return (
    <Screen
      scroll
      footer={
        <>
          <Button title={plan === 'free' ? 'See plans' : 'Manage subscription'} onPress={() => (plan === 'free' ? router.push('/upgrade/plans') : router.replace('/subscription'))} />
          <LinkButton title="Maybe later" color={colors.grey800} onPress={() => router.back()} />
        </>
      }>
      <Header title="Choose how you want to use Mirror." />
      <View style={[st.card, { marginTop: 24, paddingVertical: 12 }]}>
        <T v="bodyL" style={{ lineHeight: 20 }}>
          {plan === 'free'
            ? `You're on Free — ${BATCH.free.size} curated introductions every 24 hours, matching, messaging, verification and all safety features.`
            : `You're on ${BATCH[plan].label}.`}
        </T>
      </View>
      {tiers.map((t) => (
        <Pressable
          key={t.kind}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: t.kind } })}
          style={({ pressed }) => [st.card, { marginTop: 16, paddingTop: 20, paddingBottom: 20 }, plan === t.kind && { borderWidth: 1.5, borderColor: colors.primary }, pressed && { opacity: 0.85 }]}>
          <Row gap={16}>
            <Text style={st.title}>See your pattern over time</Text>
            <Badge kind={t.kind} />
          </Row>
          <T v="bodyL" color={colors.grey800} style={{ marginTop: 16 }}>
            {t.sub}
          </T>
          <View style={{ marginTop: 16, gap: 8 }}>
            {t.points.map((x) => (
              <T key={x} v="bodyL" color={colors.grey800}>
                {'  •  '}
                {x}
              </T>
            ))}
          </View>
          {plan === t.kind ? (
            <T v="captionM" color={colors.primary} style={{ marginTop: 8 }}>
              Current plan
            </T>
          ) : null}
        </Pressable>
      ))}
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16 },
  title: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.grey900 },
});
