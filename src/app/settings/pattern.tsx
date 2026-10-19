import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Sheet, Tooltip } from '@/components/overlays';
import { Badge, Button, Header, LinkButton, Row, Screen, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { getStats } from '@/services/api';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const COUPLE = require('../../../assets/images/welcome-bg.jpg');

const MIN_DECISIONS = 5;

export default function YourPattern() {
  const { data: stats } = useServer(getStats, { decisions: 0, interested: 0 });
  const decisions = stats.decisions;
  const interested = stats.interested;
  const plan = useApp((s) => s.plan);
  const type = useApp((s) => s.type);
  const insightsOn = useApp((s) => s.settings.patternInsights);
  const premium = planAtLeast(plan, 'premium');
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState('');

  if (!insightsOn || decisions < MIN_DECISIONS)
    return (
      <Screen>
        <Header title="Your Pattern" />
        <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 120 }}>
          <Text style={st.h1}>{insightsOn ? 'Nothing meaningful yet.' : 'Pattern insights are off.'}</Text>
          <T v="body" style={{ marginTop: 16 }}>
            {insightsOn ? 'Mirror needs more real choices before it can reflect a pattern back to you.' : 'Turn them on in Privacy to see what your choices show.'}
          </T>
          {!insightsOn ? <LinkButton title="Open Privacy" style={{ alignSelf: 'flex-start', marginTop: 16 }} onPress={() => router.replace('/settings/privacy')} /> : null}
        </View>
      </Screen>
    );

  const footer = premium ? (
    <>
      <Button title="Update preferences" onPress={() => router.push('/settings/my-type')} />
      <LinkButton title="Keep my preferences" onPress={() => setToast("Got it. We'll keep your preferences as they are.")} />
    </>
  ) : (
    <>
      <Button title="Update preferences" onPress={() => router.push('/settings/my-type')} />
      <Button title="Keep my preferences" variant="outline" onPress={() => setToast("Got it. We'll keep your preferences as they are.")} />
      <LinkButton title="Help me understand" color={colors.grey800} onPress={() => setHelp(true)} />
    </>
  );

  const detail = [
    ['WHAT YOU SAID', `${type.ageMin}–${type.ageMax} · within ${type.distanceKm} km · ${useApp.getState().profile.intent.toLowerCase() || 'open'}`],
    ['WHAT YOUR CHOICES SHOW', 'Your recent choices suggest ambition is influencing your decisions more than you originally indicated.'],
    ['RECURRING', 'Chosen often: shared faith, close family ties\nSkipped often: profiles with no stated intent'],
    ['PATTERN HISTORY', 'Month 1 · age range held steady\nMonth 2 · interest widened by ~4 years\nMonth 3 · faith mentioned in 6 of 9 choices'],
    ['MONTHLY REFLECTION', 'A short written summary, once a month. Nothing is scored or ranked.'],
    ['WHY MIRROR SURFACED THIS', `Based on ${decisions} decisions over 3 months. Nothing here is shared with anyone.`],
  ];

  return (
    <Screen scroll footer={footer}>
      <Header title="Your Pattern" />
      {premium ? (
        <>
          <T v="caption" color={colors.grey700} style={{ marginTop: 16, fontSize: 12 }}>
            Something we&apos;ve noticed
          </T>
          <View style={{ gap: 12, marginTop: 12 }}>
            {detail.map(([k, v]) => (
              <View key={k} style={st.card}>
                <Text style={st.k}>{k}</Text>
                <T v="body">{v}</T>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <T v="body" color={colors.grey700} style={{ marginTop: 24 }}>
            Something we&apos;ve noticed
          </T>
          <View style={[st.card, { marginTop: 16, paddingVertical: 16 }]}>
            <T v="bodyL" style={{ lineHeight: 20 }}>
              You&apos;re showing more interest in people slightly outside your original age preference.
            </T>
          </View>
          <View style={[st.card, { marginTop: 16, paddingVertical: 16 }]}>
            <Text style={st.k}>BASED ON</Text>
            <T v="bodyL" style={{ marginTop: 4 }}>
              {Math.min(interested, decisions)} of your last {decisions} &quot;Interested&quot; choices
            </T>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: 'premium' } })} style={st.promo}>
            <Image source={COUPLE} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(192,82,53,0.72)' }]} />
            <Row gap={10}>
              <Text style={st.promoTitle}>See your pattern over time</Text>
              <Badge kind="premium" small />
            </Row>
            <T v="bodyL" color={colors.white} style={{ marginTop: 16, lineHeight: 20 }}>
              Preference changes, recurring traits, stated preference vs. actual choices.
            </T>
            <T v="bodyM" color={colors.white} style={{ marginTop: 12, textDecorationLine: 'underline' }}>
              See your full pattern
            </T>
          </Pressable>
        </>
      )}
      <Sheet visible={help} onClose={() => setHelp(false)} title="How Your Pattern works">
        <T v="body" color={colors.grey800}>
          Mirror compares what you said you want with the choices you actually make. When there&apos;s a meaningful difference, we reflect it back — so you can
          decide whether to update your preferences or keep them. Patterns are context, not judgement, and are never shown to anyone else.
        </T>
        <Button title="Got it" style={{ marginTop: 16 }} onPress={() => setHelp(false)} />
      </Sheet>
      <Tooltip visible={!!toast} text={toast} onHide={() => setToast('')} top={64} />
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  k: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 20, color: colors.primary },
  promo: { marginTop: 16, borderRadius: 16, overflow: 'hidden', padding: 16 },
  promoTitle: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.white },
});
