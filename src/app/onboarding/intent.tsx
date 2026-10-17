import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { INTENTS } from '@/data/options';
import { useApp } from '@/store/useApp';


export default function Intent() {
  const saved = useApp((s) => s.profile.intent);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState(saved);
  const { advance } = useStepNav('/onboarding/intent-detail');
  return (
    <StepScreen
      step={7}
      total={8}
      title="What are you looking for?"
      canContinue={!!value}
      onContinue={() => {
        updateProfile({ intent: value });
        advance();
      }}>
      <SingleSelect options={INTENTS} value={value} onChange={setValue} />
    </StepScreen>
  );
}
