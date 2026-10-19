import { useState } from 'react';
import { View } from 'react-native';

import { Glyph } from '@/components/designIcons';
import { StepScreen, useStepNav } from '@/components/step';
import { Chip } from '@/components/ui';
import { HOBBIES } from '@/data/options';
import { useApp } from '@/store/useApp';
import { SubWithItalic } from './lifestyle';

const MAX = 8;
// Same rows as the design (4 / 4 / 4 / 3).
const ROWS = [HOBBIES.slice(0, 4), HOBBIES.slice(4, 8), HOBBIES.slice(8, 12), HOBBIES.slice(12)];

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
      sub={<SubWithItalic lead="What do you enjoy?" italic="These help us understand compatibility beyond the basics." />}
      canContinue={value.length > 0}
      onContinue={save}
      onSkip={save}>
      <View style={{ gap: 16, marginTop: 16 }}>
        {ROWS.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 8 }}>
            {row.map((h) => (
              <Chip
                key={h}
                label={h}
                icon={(c) => <Glyph name={h} color={c} />}
                selected={value.includes(h)}
                style={row.length === 4 ? { flexGrow: 1 } : null}
                onPress={() => setValue(value.includes(h) ? value.filter((x) => x !== h) : value.length < MAX ? [...value, h] : value)}
              />
            ))}
          </View>
        ))}
      </View>
    </StepScreen>
  );
}
