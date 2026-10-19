import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { StyleSheet, View } from 'react-native';

import { Button, Header, Screen, T } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import { colors } from '@/theme';

export default function TrustSignals() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { person: p } = usePerson(id);
  const signals = [
    { ok: !!p?.idVerified, label: 'Identity verified' },
    { ok: !!p?.verified, label: 'Photo verified' },
    { ok: true, label: 'Profile complete' },
    { ok: !p?.patternFlag, label: p?.patternFlag ? 'A pattern notice is active' : 'No current concerns surfaced' },
  ];
  return (
    <Screen footer={<Button title="Report or block" variant="outline" onPress={() => router.replace({ pathname: '/safety/report', params: { id } })} />}>
      <Header title="Trust signals" />
      <View style={{ gap: 14, marginTop: 24 }}>
        {signals.map((s) => (
          <View key={s.label} style={st.pill}>
            {s.ok ? <Feather name="check-circle" size={16} color={colors.white} style={st.okIcon} /> : <View style={st.empty} />}
            <T v={s.ok ? 'bodyM' : 'body'} color={s.ok ? colors.grey900 : colors.grey600}>
              {s.label}
            </T>
          </View>
        ))}
      </View>
      {p?.patternFlag ? (
        <Button title="View summary" variant="ghost" onPress={() => router.push({ pathname: '/safety/pattern', params: { id, summary: '1' } })} />
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  pill: { minHeight: 50, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  okIcon: { backgroundColor: colors.green, borderRadius: 8, overflow: 'hidden' },
  empty: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.grey500 },
});
