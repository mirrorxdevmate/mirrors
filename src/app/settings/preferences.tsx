import { router } from 'expo-router';

import { SingleSelect } from '@/components/step';
import { Card, Header, ListRow, Screen, SectionLabel } from '@/components/ui';
import { useApp, type UserProfile } from '@/store/useApp';

export default function Preferences() {
  const interestedIn = useApp((s) => s.profile.interestedIn);
  const matters = useApp((s) => s.type.mattersMost);
  const updateProfile = useApp((s) => s.updateProfile);
  return (
    <Screen scroll>
      <Header title="Preferences" spaced />
      <SectionLabel>Who you&apos;d like to meet</SectionLabel>
      <SingleSelect options={['Man', 'Woman', 'Everyone']} value={interestedIn} onChange={(v) => updateProfile({ interestedIn: v as UserProfile['interestedIn'] })} />
      <SectionLabel>Matching</SectionLabel>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="What matters most" value={matters.join(', ')} onPress={() => router.push('/type/matters?edit=1')} />
        <ListRow label="Describe your type again" onPress={() => router.push('/type/describe?edit=1')} />
        <ListRow label="What appears on your profile" last onPress={() => router.push('/details/visibility?edit=1')} />
      </Card>
    </Screen>
  );
}
