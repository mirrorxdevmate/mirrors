import { useState } from 'react';
import { View } from 'react-native';

import { StepScreen, useStepNav } from '@/components/step';
import { Chip, T } from '@/components/ui';
import { HOBBIES } from '@/data/options';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

const MAX = 8;

export default function Hobbies() {
  const saved = useApp((s) => s.profile.hobbies);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState<string[]>(saved);
  const { advance } = useStepNav('/details/faith');
  const save = () => {
    updateProfile({ hobbies: value });
    advance();
  };
  return (
    <StepScreen
      step={4}
      total={9}
      title="Hobbies"
      sub="What do you enjoy? These help us understand compatibility beyond the basics."
      canContinue={value.length > 0}
      onContinue={save}
      onSkip={save}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {HOBBIES.map((h) => (
          <Chip
            key={h}
            label={h}
            selected={value.includes(h)}
            onPress={() => setValue(value.includes(h) ? value.filter((x) => x !== h) : value.length < MAX ? [...value, h] : value)}
          />
        ))}
      </View>
      <T v="caption" color={colors.grey600} style={{ marginTop: 12 }}>
        {value.length}/{MAX} selected
      </T>
    </StepScreen>
  );
}
