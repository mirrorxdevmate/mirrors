import { useState } from 'react';

import { Glyph } from '@/components/designIcons';
import { OptionalTag, StepScreen, useStepNav } from '@/components/step';
import { Field } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function Profession() {
  const saved = useApp((s) => s.profile.profession);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState(saved);
  const { advance } = useStepNav('/details/culture');
  const save = () => {
    updateProfile({ profession: value.trim() });
    advance();
  };
  return (
    <StepScreen step={8} total={9} title="What do you do?"
      titleExtra={<OptionalTag />} canContinue={value.trim().length > 1} onContinue={save} onSkip={save}>
      <Field autoFocus value={value} onChangeText={setValue} placeholder="Co-founder"
        left={<Glyph name="Briefcase" color={colors.grey600} />} maxLength={40} autoCapitalize="words" returnKeyType="done" onSubmitEditing={save} />
    </StepScreen>
  );
}
