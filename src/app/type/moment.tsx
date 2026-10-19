import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function MirrorMoment() {
  const type = useApp((s) => s.type);
  const profile = useApp((s) => s.profile);
  const setStage = useApp((s) => s.setStage);
  const who = profile.interestedIn === 'Woman' ? 'Women' : profile.interestedIn === 'Everyone' ? 'Everyone' : 'Men';
  const rows = [
    ['YOUR TYPE', `${who} · ${type.ageMin}–${type.ageMax}`],
    ['YOUR INTENT', profile.intent || 'Not set'],
    ['WHAT MATTERS', type.mattersMost.join(' · ') || '—'],
    ['DEAL-BREAKERS', type.dealBreakers.join(' · ') || 'None — you’re open'],
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
      <Header title="Here's how Mirror understands you." />
      <View style={st.card}>
        {rows.map(([k, v]) => (
          <View key={k} style={st.row}>
            <Text style={st.k}>{k}</Text>
            <Text style={st.v}>{v}</Text>
          </View>
        ))}
      </View>
      <View style={st.rule} />
      <T v="body" style={{ marginTop: 28 }}>
        We’ll use this to find people — not just profiles.
      </T>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { marginTop: 24, backgroundColor: colors.base, borderRadius: 16, padding: 16, gap: 4 },
  row: { minHeight: 60, paddingVertical: 8, gap: 4 },
  k: { fontFamily: fonts.bodySemi, fontSize: 12, lineHeight: 20, color: colors.primary },
  v: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.grey900 },
  rule: { marginTop: 24, height: 0.5, backgroundColor: colors.grey500 },
});
