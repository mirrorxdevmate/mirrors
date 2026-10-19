import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Header, Screen, T } from '@/components/ui';
import { MATTERS } from '@/data/options';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function WhatMattersMost() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const saved = useApp((s) => s.type.mattersMost);
  const updateType = useApp((s) => s.updateType);
  const [value, setValue] = useState<string[]>(saved);

  return (
    <Screen
      scroll
      footer={
        <Button
          title={edit ? 'Save' : 'Continue'}
          disabled={value.length !== 3}
          onPress={() => {
            updateType({ mattersMost: value });
            if (edit) router.back();
            else router.push('/type/moment');
          }}
        />
      }>
      <Header title="What matters most when choosing someone?" />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 24, marginBottom: 24, lineHeight: 20 }}>
        {"Select top 3. These carry the most weight in who you're introduced to."}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 16 }}>
        {MATTERS.map((m) => (
          <Chip
            key={m}
            label={m}
            selected={value.includes(m)}
            style={{ height: 40 }}
            onPress={() => setValue(value.includes(m) ? value.filter((x) => x !== m) : value.length < 3 ? [...value, m] : value)}
          />
        ))}
      </View>
    </Screen>
  );
}
