import { useState } from 'react';
import { View } from 'react-native';

import { StepScreen, useStepNav } from '@/components/step';
import { Chip, T } from '@/components/ui';
import { LIFESTYLE } from '@/data/options';
import { useApp } from '@/store/useApp';

export default function Lifestyle() {
  const saved = useApp((s) => s.profile.lifestyle);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState<Record<string, string>>(saved);
  const { advance } = useStepNav('/details/hobbies');
  const save = (v: Record<string, string>) => {
    updateProfile({ lifestyle: v });
    advance();
  };
  return (
    <StepScreen
      step={3}
      total={9}
      title="Lifestyle"
      sub="A few things about your everyday life. These help us understand compatibility beyond the basics."
      canContinue={Object.keys(value).length > 0}
      onContinue={() => save(value)}
      onSkip={() => save(value)}>
      {LIFESTYLE.map((g) => (
        <View key={g.key} style={{ marginBottom: 18 }}>
          <T v="bodyS" style={{ marginBottom: 8 }}>
            {g.label}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {g.options.map((o) => (
              <Chip
                key={o}
                label={o}
                selected={value[g.key] === o}
                onPress={() => {
                  const next = { ...value };
                  if (next[g.key] === o) delete next[g.key];
                  else next[g.key] = o;
                  setValue(next);
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </StepScreen>
  );
}
