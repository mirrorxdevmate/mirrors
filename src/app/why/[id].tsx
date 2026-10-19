import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Tooltip } from '@/components/overlays';
import { Badge, Button, Header, LinkButton, Screen, T } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import { showInterest } from '@/services/actions';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const COUPLE = require('../../../assets/images/welcome-bg.jpg');

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
      <View style={{ gap: 16, marginTop: 24 }}>
        {items.map((w) => (
          <View key={w.label} style={st.card}>
            <Text style={[st.k, w.tone === 'warn' && { color: colors.primaryPressed }]}>{w.label.toUpperCase()}</Text>
            <T v="body">{w.text}</T>
          </View>
        ))}
      </View>
      {!premium ? (
        <Pressable onPress={() => router.push('/upgrade')} accessibilityRole="button" accessibilityLabel="Go deeper, Premium. See deeper compatibility" style={st.deeper}>
          <Image source={COUPLE} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" />
          <LinearGradient colors={['#C05235', '#ECA193', '#E07A5F']} locations={[0, 0.51, 0.87]} start={{ x: 0, y: 0.3 }} end={{ x: 1, y: 0.7 }} style={[StyleSheet.absoluteFill, { opacity: 0.5 }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={st.deeperTitle}>Go deeper</Text>
            <Badge kind="premium" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, maxWidth: 290 }}>
            {['Communication', 'Long-term goals', 'Potential differences'].map((c) => (
              <View key={c} style={st.pill}>
                <T v="bodyM">{c}</T>
              </View>
            ))}
          </View>
          <T v="bodyM" color={colors.white} style={{ marginTop: 16, textDecorationLine: 'underline' }}>
            See deeper compatibility
          </T>
        </Pressable>
      ) : null}
      <Tooltip visible={tip} text="Mirror explains the fit. You decide." onHide={() => setTip(false)} top={64} />
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  k: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 20, color: colors.primary },
  deeper: { borderRadius: 16, overflow: 'hidden', padding: 16, paddingTop: 20, marginTop: 16, minHeight: 206 },
  deeperTitle: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.white },
  pill: { height: 40, backgroundColor: colors.white, borderRadius: 360, paddingHorizontal: 12, justifyContent: 'center' },
});
