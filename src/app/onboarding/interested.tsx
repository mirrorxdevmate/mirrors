import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { useApp, type UserProfile } from '@/store/useApp';

export default function InterestedIn() {
  const saved = useApp((s) => s.profile.interestedIn);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState<string>(saved);
  const { advance } = useStepNav('/onboarding/location');

  return (
    <StepScreen
      step={4}
      total={8}
      title="Who would you like to meet?"
      canContinue={!!value}
      onContinue={() => {
        updateProfile({ interestedIn: value as UserProfile['interestedIn'] });
        advance();
      }}>
      <SingleSelect options={['Man', 'Woman', 'Everyone']} value={value} onChange={setValue} />
    </StepScreen>
  );
}
