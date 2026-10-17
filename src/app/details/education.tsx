import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { EDUCATION } from '@/data/options';
import { useApp } from '@/store/useApp';

export default function Education() {
  const saved = useApp((s) => s.profile.education);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState(saved);
  const { advance } = useStepNav('/details/profession');
  const save = () => {
    updateProfile({ education: value });
    advance();
  };
  return (
    <StepScreen step={7} total={9} title="What's your education level? (Optional)" canContinue={!!value} onContinue={save} onSkip={save}>
      <SingleSelect options={EDUCATION} value={value} onChange={setValue} />
    </StepScreen>
  );
}
