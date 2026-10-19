import { useState } from 'react';

import { SingleSelect, StepScreen, useStepNav } from '@/components/step';
import { View } from 'react-native';

import { ToggleRow } from '@/components/ui';
import { FAITHS } from '@/data/options';
import { useApp } from '@/store/useApp';

export default function Faith() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const [value, setValue] = useState(profile.faith);
  const [vis, setVis] = useState(profile.visibility.faith);
  const { advance } = useStepNav('/details/height');
  const save = () => {
    updateProfile({ faith: value, visibility: { ...profile.visibility, faith: vis } });
    advance();
  };
  return (
    <StepScreen step={5} total={9} title="What best describes your faith or belief?" canContinue={!!value} onContinue={save} onSkip={save}>
      <SingleSelect options={FAITHS} value={value} onChange={setValue} />
      <View style={{ marginTop: 0 }}>
        <ToggleRow label="Show on my profile" value={vis.show} onChange={(show) => setVis({ ...vis, show })} />
        <ToggleRow label="Use for matching" value={vis.match} onChange={(match) => setVis({ ...vis, match })} />
      </View>
    </StepScreen>
  );
}
