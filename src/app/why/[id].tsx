import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Tooltip } from '@/components/overlays';
import { Badge, Button, Card, Header, LinkButton, Screen, T } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import { showInterest } from '@/services/actions';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';

let tooltipShown = false;

export default function WhyYouTwo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { person: p } = usePerson(id);
  const [busy, setBusy] = useState(false);
  const plan = useApp((s) => s.plan);
  const premium = planAtLeast(plan, 'premium');
  const [tip, setTip] = useState(() => {
    if (tooltipShown) return false;
    tooltipShown = true;
    return true;
  });
  if (!p) return null;
  const items = premium ? p.whyPremium : p.why;

  return (
    <Screen
      scroll
      footer={
        <>
          <Button
            title="Interested"
            loading={busy}
            onPress={async () => {
              setBusy(true);
              try {
                if (!(await showInterest(p.id, { replace: true }))) router.back();
              } catch {
                setBusy(false);
              }
            }}
          />
          <LinkButton title="Back to profile" onPress={() => router.back()} />
        </>
      }>
      <Header title="Why you two?" />
      {items.map((w) => (
        <Card key={w.label} style={{ marginBottom: 10 }}>
          <T v="overline" color={w.tone === 'warn' ? colors.primaryPressed : colors.primary}>
            {w.label}
          </T>
          <T v="body" style={{ marginTop: 2 }}>
            {w.text}
          </T>
        </Card>
      ))}
      {!premium ? (
        <Pressable onPress={() => router.push('/upgrade')} accessibilityRole="button" style={st.deeper}>
          <Image source={p.photos[0]} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={8} />
          <LinearGradient colors={['rgba(224,122,95,0.92)', 'rgba(224,122,95,0.55)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <T v="h4" color={colors.white}>
              Go deeper
            </T>
            <Badge kind="premium" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {['Communication', 'Long-term goals', 'Potential differences'].map((c) => (
              <View key={c} style={st.pill}>
                <T v="captionM">{c}</T>
              </View>
            ))}
          </View>
          <T v="bodyM" color={colors.white} style={{ marginTop: 14, textDecorationLine: 'underline' }}>
            See deeper compatibility
          </T>
        </Pressable>
      ) : null}
      <Tooltip visible={tip} text="Mirror explains the fit. You decide." onHide={() => setTip(false)} top={64} />
    </Screen>
  );
}

const st = StyleSheet.create({
  deeper: { borderRadius: radius.md, overflow: 'hidden', padding: 16, marginTop: 6 },
  pill: { backgroundColor: colors.white, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 8 },
});
