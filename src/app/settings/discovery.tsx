import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { Badge, Button, Header, LinkButton, Row, Screen, T } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function Discovery() {
  const plan = useApp((s) => s.plan);
  const city = useApp((s) => s.profile.location.city);
  const distance = useApp((s) => s.type.distanceKm);
  const discoveryCity = useApp((s) => s.settings.discoveryCity);
  const updateSettings = useApp((s) => s.updateSettings);
  const unlocked = planAtLeast(plan, 'plus');
  const [picker, setPicker] = useState(false);

  return (
    <Screen scroll footer={unlocked ? undefined : <Button title="See plans" onPress={() => router.push({ pathname: '/upgrade/plans', params: { plan: 'plus' } })} />}>
      <Header title="Discovery location" big={false} />
      <Row gap={10} style={{ marginTop: 24 }}>
        <Text style={st.h1}>See people in other places</Text>
        {!unlocked ? <Badge kind="plus" /> : null}
      </Row>
      <T v="body" color={colors.grey700} style={{ marginTop: 12 }}>
        Browse introductions outside your local area, now.
      </T>
      <View style={st.current}>
        <Text style={st.label}>Current city</Text>
        <T v="body" color={colors.grey700}>
          {(city || 'Dubai').split(',')[0]} · within {distance} km
        </T>
      </View>
      <Text style={[st.label, { marginTop: 24 }]}>Explore another city</Text>
      <Pressable accessibilityRole="button" disabled={!unlocked} onPress={() => setPicker(true)} style={[st.search, !unlocked && { opacity: 0.6 }]}>
        <Feather name="search" size={14} color={colors.grey600} />
        <T v="body" color={discoveryCity ? colors.grey900 : colors.grey600}>
          {discoveryCity ?? 'Search a city'}
        </T>
      </Pressable>
      {discoveryCity ? <LinkButton title="Back to my city" style={{ marginTop: 16 }} onPress={() => updateSettings({ discoveryCity: null })} /> : null}
      <CityPicker visible={picker} onClose={() => setPicker(false)} onPick={(c) => updateSettings({ discoveryCity: c })} />
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, flexShrink: 1 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.grey900 },
  current: { marginTop: 16, backgroundColor: colors.base, borderRadius: 12, padding: 12, gap: 4 },
  search: { marginTop: 12, height: 48, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
});
