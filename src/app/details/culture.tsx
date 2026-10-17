import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { MultiSelect, StepScreen } from '@/components/step';
import { CULTURES } from '@/data/options';
import { useApp } from '@/store/useApp';

export default function Culture() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const saved = useApp((s) => s.profile.culture);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState<string[]>(saved);
  const save = () => {
    updateProfile({ culture: value });
    if (edit) router.back();
    else router.push('/details/visibility');
  };
  return (
    <StepScreen step={9} total={9} title="How would you describe your cultural or ethnic background?" canContinue={value.length > 0} onContinue={save} onSkip={save}>
      <MultiSelect options={CULTURES} value={value} onChange={setValue} max={2} />
    </StepScreen>
  );
}
