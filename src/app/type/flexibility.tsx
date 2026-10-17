import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Card, Header, Screen, T, Title } from '@/components/ui';
import { FLEX_LEVELS } from '@/data/options';
import { useApp, type Flex } from '@/store/useApp';
import { colors, radius } from '@/theme';

export default function PreferenceFlexibility() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const type = useApp((s) => s.type);
  const updateType = useApp((s) => s.updateType);
  const traits = type.traits.filter((t) => t.key !== 'gender');
  const [flex, setFlex] = useState<Record<string, Flex>>(() =>
    Object.fromEntries(traits.map((t) => [t.key, type.flexibility[t.key] ?? (t.key === 'relationship' ? 'Important' : 'Preference')])),
  );

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
      {edit ? <Header /> : <View style={{ height: 16 }} />}
      <Title sub="Deal-breakers won't be intentionally crossed.">How flexible are these?</Title>
      {traits.map((t) => (
        <Card key={t.key} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <T v="bodyS">{t.label}</T>
            <T v="body" color={colors.grey700}>
              {t.value}
            </T>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {FLEX_LEVELS.map((lvl) => {
              const on = flex[t.key] === lvl;
              return (
                <Pressable
                  key={lvl}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setFlex({ ...flex, [t.key]: lvl })}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center', backgroundColor: on ? (lvl === 'Deal-breaker' ? colors.primaryPressed : colors.primary) : colors.white }}>
                  <T v="caption" color={on ? colors.white : colors.grey800} numberOfLines={1} style={{ fontSize: 11 }}>
                    {lvl}
                  </T>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
    </Screen>
  );
}
