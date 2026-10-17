import { useState } from 'react';

import { StepScreen, useStepNav } from '@/components/step';
import { Field } from '@/components/ui';
import { useApp } from '@/store/useApp';

export default function FirstName() {
  const saved = useApp((s) => s.profile.firstName);
  const updateProfile = useApp((s) => s.updateProfile);
  const [name, setName] = useState(saved);
  const { advance } = useStepNav('/onboarding/gender');
  const clean = name.trim();
  const valid = clean.length >= 2 && /^[\p{L}' -]+$/u.test(clean);

  return (
    <StepScreen
      step={2}
      total={8}
      title="What should we call you?"
      sub="This is how your name will appear on your profile."
      canContinue={valid}
      onContinue={() => {
        updateProfile({ firstName: clean.charAt(0).toUpperCase() + clean.slice(1) });
        advance();
      }}>
      <Field
        autoFocus
        value={name}
        onChangeText={setName}
        placeholder="First Name"
        autoCapitalize="words"
        textContentType="givenName"
        autoComplete="given-name"
        maxLength={30}
        error={clean.length > 0 && !valid ? 'Use letters only.' : undefined}
      />
    </StepScreen>
  );
}
