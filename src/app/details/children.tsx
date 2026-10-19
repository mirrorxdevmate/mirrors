import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { View } from 'react-native';

import { ToggleRow } from '@/components/ui';
import { CHILDREN } from '@/data/options';
import { useApp } from '@/store/useApp';

export default function Children() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState(profile.children);
  const [vis, setVis] = useState(profile.visibility.children);
  const { advance } = useStepNav('/details/lifestyle');
  return (
    <StepScreen
      step={2}
      total={9}
      title="What are your plans for children?"
      canContinue={!!value}
      onContinue={() => {
        updateProfile({ children: value, visibility: { ...profile.visibility, children: vis } });
        advance();
      }}>
      <SingleSelect options={CHILDREN} value={value} onChange={setValue} />
      <View style={{ marginTop: 0 }}>
        <ToggleRow label="Show on my profile" value={vis.show} onChange={(show) => setVis({ ...vis, show })} />
        <ToggleRow label="Use for matching" value={vis.match} onChange={(match) => setVis({ ...vis, match })} />
      </View>
    </StepScreen>
  );
}
