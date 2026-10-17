import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { Field } from '@/components/ui';
import { useApp } from '@/store/useApp';

const OPTIONS = ['Woman', 'Man', 'Prefer to self-describe'];

export default function Gender() {
  const saved = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [gender, setGender] = useState(saved.gender);
  const [custom, setCustom] = useState(saved.genderCustom);
  const self = gender === OPTIONS[2];
  const { advance } = useStepNav('/onboarding/interested');

  return (
    <StepScreen
      step={3}
      total={8}
      title="How do you identify?"
      canContinue={!!gender && (!self || custom.trim().length > 1)}
      onContinue={() => {
        updateProfile({ gender, genderCustom: self ? custom.trim() : '' });
        advance();
      }}>
      <SingleSelect options={OPTIONS} value={gender} onChange={setGender} />
      {self ? <Field autoFocus value={custom} onChangeText={setCustom} placeholder="How do you describe yourself?" maxLength={40} /> : null}
    </StepScreen>
  );
}
