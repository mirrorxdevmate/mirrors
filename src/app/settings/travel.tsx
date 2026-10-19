import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { Badge, Button, Header, Row, Screen, T, Toggle } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
};

export default function TravelMode() {
  const plan = useApp((s) => s.plan);
  const travel = useApp((s) => s.settings.travel);
  const recent = useApp((s) => s.settings.recentDestinations);
  const updateSettings = useApp((s) => s.updateSettings);
  const unlocked = planAtLeast(plan, 'premium');
  const [city, setCity] = useState(travel?.city ?? '');
  const [picker, setPicker] = useState(false);
  const [tip, setTip] = useState(false);
  const dest = (city || 'Paris').split(',')[0];

  const setActive = (on: boolean) => {
    if (!unlocked) return setTip(true);
    if (!on) return updateSettings({ travel: null });
    if (!city) return setPicker(true);
    updateSettings({ travel: { city, date: today() }, recentDestinations: [city, ...recent.filter((r) => r !== city)].slice(0, 5) });
  };

  return (
    <Screen
      scroll
      footer={
        unlocked ? undefined : (
          <>
            {tip ? (
              <View style={st.tip}>
                <Feather name="alert-circle" size={14} color={colors.primary} style={{ marginTop: 2 }} />
                <T v="body" color={colors.grey800} style={{ flex: 1 }}>
                  Your profile shows the destination and dates to people there, so nobody is misled about where you are.
                </T>
              </View>
            ) : null}
            <Button title="See plans" onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: 'premium' } })} />
          </>
        )
      }>
      <Header title="Travel Mode" big={false} />
      <Row gap={10} style={{ marginTop: 24 }}>
        <Text style={st.h1}>Going to {dest} next week?</Text>
        {!unlocked ? <Badge kind="premium" /> : null}
      </Row>
      <T v="body" color={colors.grey700} style={{ marginTop: 12 }}>
        Set a destination and Mirror starts preparing introductions before you arrive.
      </T>

      <Text style={[st.label, { marginTop: 24 }]}>Destination</Text>
      <Pressable accessibilityRole="button" onPress={() => (unlocked ? setPicker(true) : setTip(true))} style={st.search}>
        <Feather name="search" size={14} color={colors.grey600} />
        <T v="body" color={city ? colors.grey900 : colors.grey600}>
          {city || 'Search a city'}
        </T>
      </Pressable>
      <Row style={{ marginTop: 16, justifyContent: 'space-between' }}>
        <Text style={[st.label, !unlocked && { color: colors.grey700 }]}>Start showing me introductions</Text>
        <Toggle label="Start showing me introductions" value={!!travel && unlocked} onChange={setActive} />
      </Row>

      {unlocked && recent.length ? (
        <>
          <Text style={[st.small, { marginTop: 40 }]}>Recent Destinations</Text>
          <View style={{ gap: 12, marginTop: 16, alignItems: 'flex-start' }}>
            {recent.map((r) => (
              <Pressable key={r} accessibilityRole="button" onPress={() => setCity(r)} style={st.chip}>
                <T v="body" color={colors.grey800}>
                  {r.split(',')[0]}
                </T>
                <Pressable accessibilityLabel={`Remove ${r}`} hitSlop={8} onPress={() => updateSettings({ recentDestinations: recent.filter((x) => x !== r) })}>
                  <Feather name="x-circle" size={13} color={colors.grey700} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
      <CityPicker visible={picker} onClose={() => setPicker(false)} onPick={setCity} title="Where are you going?" />
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, flexShrink: 1 },
  label: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 20, color: colors.grey900, flexShrink: 1 },
  small: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.grey900 },
  search: { marginTop: 12, height: 55, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  chip: { height: 32, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  tip: { flexDirection: 'row', gap: 8, backgroundColor: colors.secondary, borderRadius: 8, padding: 12, marginBottom: 8 },
});
