import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Chip, Header, Screen, T } from '@/components/ui';
import { FLEX_LEVELS } from '@/data/options';
import { useApp, type Flex } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function PreferenceFlexibility() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const type = useApp((s) => s.type);
  const updateType = useApp((s) => s.updateType);
  const traits = type.traits.filter((t) => t.key !== 'gender');
  const [flex, setFlex] = useState<Record<string, Flex>>(() =>
    Object.fromEntries(traits.map((t) => [t.key, type.flexibility[t.key] ?? (t.key === 'relationship' ? 'Important' : 'Preference')])),
  );
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? traits : traits.slice(0, 3);
  const rest = traits.slice(3);

  return (
    <Screen
      scroll
      footer={
        <Button
          title={edit ? 'Save' : 'Continue'}
          onPress={() => {
            const dealBreakers = traits.filter((t) => flex[t.key] === 'Deal-breaker').map((t) => t.label);
            updateType({ flexibility: flex, dealBreakers });
            if (edit) router.back();
            else router.push('/type/matters');
          }}
        />
      }>
      <Header title="How flexible are these?" />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 24, marginBottom: 10, lineHeight: 20 }}>
        {"Deal-breakers won't be intentionally crossed."}
      </T>
      {shown.map((t) => (
        <View key={t.key} style={st.group}>
          <View style={st.head}>
            <Text style={st.label}>{t.label}</Text>
            <Text style={st.label} numberOfLines={1}>
              {t.value}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FLEX_LEVELS.map((lvl) => (
              <Chip key={lvl} kind="tint" label={lvl} selected={flex[t.key] === lvl} style={{ flexGrow: 1, paddingHorizontal: 10 }} onPress={() => setFlex({ ...flex, [t.key]: lvl })} />
            ))}
          </View>
        </View>
      ))}
      {!showAll && rest.length ? (
        <Pressable accessibilityRole="button" onPress={() => setShowAll(true)} style={({ pressed }) => [st.more, pressed && { opacity: 0.6 }]}>
          <T v="body" color={colors.grey700}>
            {rest
              .slice(0, 2)
              .map((t) => t.label)
              .join(' · ')}
            {rest.length > 2 ? ' · scroll for the rest' : ''}
          </T>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  group: { paddingVertical: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, height: 20, marginBottom: 8 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.grey600 },
  more: { marginTop: 17, minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: colors.grey500, paddingHorizontal: 17, justifyContent: 'center' },
});
