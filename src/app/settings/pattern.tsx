import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Sheet, Tooltip } from '@/components/overlays';
import { Badge, Button, Card, Header, LinkButton, Row, Screen, SectionLabel, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { getStats } from '@/services/api';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors } from '@/theme';

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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <Feather name="activity" size={40} color={colors.grey400} />
          <T v="h3" center style={{ marginTop: 16 }}>
            {insightsOn ? 'Nothing meaningful yet.' : 'Pattern insights are off.'}
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
            {insightsOn
              ? `Mirror needs more real choices before it can reflect a pattern back to you. (${decisions}/${MIN_DECISIONS})`
              : 'Turn them on in Privacy to see what your choices show.'}
          </T>
          {!insightsOn ? <Button title="Open Privacy" small style={{ marginTop: 16 }} onPress={() => router.replace('/settings/privacy')} /> : null}
        </View>
      </Screen>
    );

  const footer = (
    <>
      <Button title="Update preferences" onPress={() => router.push('/settings/my-type')} />
      <Button title="Keep my preferences" variant="secondary" onPress={() => setToast("Got it. We'll keep your preferences as they are.")} />
      {!premium ? <LinkButton title="Help me understand" onPress={() => setHelp(true)} /> : null}
    </>
  );

  return (
    <Screen scroll footer={footer}>
      <Header title="Your Pattern" />
      <Card>
        <SectionLabel>Something we&apos;ve noticed</SectionLabel>
        <T v="bodyLM">You&apos;re showing more interest in people slightly outside your original age preference.</T>
        <T v="overline" color={colors.grey600} style={{ marginTop: 12 }}>
          Based on
        </T>
        <T v="body">
          {Math.min(interested, decisions)} of your last {decisions} &ldquo;Interested&rdquo; choices
        </T>
      </Card>

      {premium ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {[
            ['What you said', `${type.ageMin}–${type.ageMax} · within ${type.distanceKm} km · ${useApp.getState().profile.intent.toLowerCase() || 'open'}`],
            ['What your choices show', 'Your recent choices suggest ambition is influencing your decisions more than you originally indicated.'],
            ['Recurring', 'Chosen often: shared faith, close family ties\nSkipped often: profiles with no stated intent'],
            ['Pattern history', 'Month 1 · age range held steady\nMonth 2 · interest widened by ~4 years\nMonth 3 · faith mentioned in 6 of 9 choices'],
            ['Monthly reflection', 'A short written summary, once a month. Nothing is scored or ranked.'],
            ['Why Mirror surfaced this', `Based on ${decisions} decisions. Nothing here is shared with anyone.`],
          ].map(([k, v]) => (
            <Card key={k}>
              <SectionLabel>{k}</SectionLabel>
              <T v="body">{v}</T>
            </Card>
          ))}
        </View>
      ) : (
        <Card style={{ marginTop: 12, backgroundColor: colors.secondary }} onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: 'premium' } })}>
          <Row>
            <T v="bodyS" style={{ flex: 1 }}>
              See your pattern over time
            </T>
            <Badge kind="premium" />
          </Row>
          <T v="body" color={colors.grey700} style={{ marginTop: 6 }}>
            Preference changes, recurring traits, stated preference vs. actual choices.
          </T>
          <T v="bodyM" style={{ marginTop: 10, textDecorationLine: 'underline' }}>
            See your full pattern
          </T>
        </Card>
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
