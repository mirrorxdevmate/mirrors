import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { STATUSES } from '@/data/options';
import { useApp } from '@/store/useApp';

export default function RelationshipStatus() {
  const saved = useApp((s) => s.profile.relationshipStatus);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState(saved);
  const { advance } = useStepNav('/details/children');
  return (
    <StepScreen
      step={1}
      total={9}
      title="What's your relationship status?"
      sub="Where you are now. What you're looking for was asked earlier."
      canContinue={!!value}
      onContinue={() => {
        updateProfile({ relationshipStatus: value });
        advance();
      }}>
      <SingleSelect options={STATUSES} value={value} onChange={setValue} />
    </StepScreen>
  );
}
