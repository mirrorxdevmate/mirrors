import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { StepScreen, useStepNav } from '@/components/step';
import { CircleButton, Segmented, T } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';
import { toFtIn } from '@/utils/date';

export default function Height() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [cm, setCm] = useState(profile.heightCm || 170);
  const [unit, setUnit] = useState<'cm' | 'ft'>(profile.heightUnit);
  const { advance } = useStepNav('/details/education');
  const step = unit === 'cm' ? 1 : 2.54;
  const bump = (d: number) => setCm((c) => Math.min(230, Math.max(120, Math.round(c + d * step))));
  const save = () => {
    updateProfile({ heightCm: cm, heightUnit: unit });
    advance();
  };
  return (
    <StepScreen step={6} total={9} title="What's your height?" onContinue={save} onSkip={save}>
      <Segmented options={[{ label: 'cm', value: 'cm' }, { label: 'ft / in', value: 'ft' }]} value={unit} onChange={setUnit} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32, marginTop: 56 }}>
        <CircleButton size={52} label="Decrease" icon={<Feather name="minus" size={22} color={colors.grey900} />} onPress={() => bump(-1)} />
        <View style={{ minWidth: 130, alignItems: 'center' }} accessibilityLiveRegion="polite">
          <T v="h1" style={{ fontSize: 48, lineHeight: 56 }}>
            {unit === 'cm' ? cm : toFtIn(cm)}
          </T>
          {unit === 'cm' ? (
            <T v="body" color={colors.grey600}>
              cm
            </T>
          ) : null}
        </View>
        <CircleButton size={52} label="Increase" icon={<Feather name="plus" size={22} color={colors.grey900} />} onPress={() => bump(1)} />
      </View>
    </StepScreen>
  );
}
