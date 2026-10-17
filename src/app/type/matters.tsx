import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chip, Header, Screen, T, Title } from '@/components/ui';
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
      {edit ? <Header /> : <View style={{ height: 16 }} />}
      <Title sub="Select top 3. These carry the most weight in who you're introduced to.">What matters most when choosing someone?</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MATTERS.map((m) => (
          <Chip
            key={m}
            label={value.includes(m) ? `${value.indexOf(m) + 1}  ${m}` : m}
            selected={value.includes(m)}
            onPress={() => setValue(value.includes(m) ? value.filter((x) => x !== m) : value.length < 3 ? [...value, m] : value)}
          />
        ))}
      </View>
      <T v="caption" color={colors.grey600} style={{ marginTop: 14 }}>
        {value.length}/3 selected
      </T>
    </Screen>
  );
}
