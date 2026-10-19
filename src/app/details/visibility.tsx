import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Header, Screen, T, ToggleRow } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

/** "Have children and want more" → Children: Yes · Family goals: Want more */
function splitChildren(v: string) {
  if (!v) return { has: 'Not set', goals: 'Not set' };
  if (v === 'Prefer not to say') return { has: 'Prefer not to say', goals: 'Prefer not to say' };
  if (v === 'Not sure yet') return { has: '—', goals: 'Not sure yet' };
  const has = v.startsWith('Have') ? 'Yes' : 'No';
  const goals = /want more/i.test(v) && !/don.t want more/i.test(v) ? 'Want more' : /but want them/i.test(v) ? 'Want children' : "Don't want children";
  return { has, goals };
}

const SHORT: Record<string, string> = { 'Middle Eastern / North African': 'MENA', 'Black / African': 'African', 'White / European': 'European', 'Latin / Hispanic': 'Latin' };

export default function WhatOthersSee() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const setStage = useApp((s) => s.setStage);
  const [vis, setVis] = useState(profile.visibility);
  const kids = splitChildren(profile.children);

  const rows = [
    { key: 'faith', label: 'Faith', value: profile.faith || 'Not set' },
    { key: 'children', label: 'Children', value: kids.has },
    { key: 'familyGoals', label: 'Family goals', value: kids.goals },
    { key: 'culture', label: 'Cultural background', value: profile.culture.map((c) => SHORT[c] ?? c).join(' · ') || 'Not set' },
  ];

  const get = (k: string) => vis[k] ?? { show: false, match: true };
  const set = (k: string, patch: Partial<{ show: boolean; match: boolean }>) => setVis({ ...vis, [k]: { ...get(k), ...patch } });

  const save = () => {
    updateProfile({ visibility: vis });
    if (edit) return router.back();
    setStage('type');
    router.replace({ pathname: '/celebrate', params: { title: 'Lifestyle, understood.', next: '/type/describe' } });
  };

  return (
    <Screen scroll footer={<Button title="Save" onPress={save} />}>
      <Header title="What appears on your profile?" />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 24, marginBottom: 24, lineHeight: 20 }}>
        Anything can be used for matching without being shown. Nothing sensitive is shown unless you turn it on.
      </T>
      <View style={{ gap: 16 }}>
        {rows.map((r) => (
          <View key={r.key} style={st.card}>
            <View style={st.cardHead}>
              <Text style={st.cardLabel}>{r.label}</Text>
              <Text style={st.cardValue} numberOfLines={1}>
                {r.value}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <ToggleRow pill label="Show on my profile" value={get(r.key).show} onChange={(show) => set(r.key, { show })} />
              <ToggleRow pill label="Use for matching" value={get(r.key).match} onChange={(match) => set(r.key, { match })} />
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.base, borderRadius: 16, padding: 16, gap: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardLabel: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 20, color: colors.grey900 },
  cardValue: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 20, color: colors.grey600, flexShrink: 1, textAlign: 'right' },
});
