import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Header, Row, Screen, T, Toggle } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const POINTS = ['You still receive your normal introductions.', 'Existing matches and conversations are unaffected.', 'Reporting, blocking and safety tools work exactly as before.'];

export default function Incognito() {
  const plan = useApp((s) => s.plan);
  const on = useApp((s) => s.settings.incognito);
  const updateSettings = useApp((s) => s.updateSettings);
  const unlocked = planAtLeast(plan, 'premium');
  const dim = !unlocked;
  return (
    <Screen scroll footer={unlocked ? undefined : <Button title="See plans" onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: 'premium' } })} />}>
      <Header title="Incognito Mode" big={false} />
      <Row gap={10} style={{ marginTop: 24 }}>
        <Text style={st.h1}>Take control of your visibility</Text>
        <Badge kind="premium" />
      </Row>
      <Row style={{ marginTop: 24, justifyContent: 'space-between' }}>
        <Text style={[st.label, dim && { color: colors.grey600 }]}>Incognito Mode</Text>
        <Toggle label="Incognito Mode" value={on && unlocked} disabled={!unlocked} onChange={(v) => updateSettings({ incognito: v })} />
      </Row>
      <T v="body" color={dim ? colors.grey400 : colors.grey700} style={{ marginTop: 8 }}>
        Only people you show interest in can see you.
      </T>
      <View style={{ gap: 12, marginTop: 16 }}>
        {POINTS.map((p) => (
          <View key={p} style={[st.point, dim && { backgroundColor: colors.grey100 }]}>
            <T v="body" color={dim ? colors.grey600 : colors.grey800}>
              {p}
            </T>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, flexShrink: 1 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.grey900 },
  point: { backgroundColor: colors.base, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
});
