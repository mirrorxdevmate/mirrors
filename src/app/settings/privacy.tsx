import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Sheet } from '@/components/overlays';
import { SingleSelect } from '@/components/step';
import { Badge, Card, Header, ListRow, Screen, SectionLabel, ToggleRow } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { getBlocked } from '@/services/api';
import { useApp } from '@/store/useApp';

export default function Privacy() {
  const s = useApp((st) => st.settings);
  const { data: blockedList } = useServer(getBlocked, []);
  const blocked = blockedList.length;
  const update = useApp((st) => st.updateSettings);
  const [sheet, setSheet] = useState<null | 'visibility' | 'precision'>(null);

  return (
    <Screen scroll>
      <Header title="Privacy" />
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="Phone visibility" value="Private · locked" />
        <ListRow label="Profile visibility" value={s.profileVisibility} onPress={() => setSheet('visibility')} />
        <ListRow label="Location precision" value={s.locationPrecision} onPress={() => setSheet('precision')} />
        <ListRow label="Incognito Mode" badge={<Badge kind="premium" />} value={s.incognito ? 'On' : 'Off'} last onPress={() => router.push('/settings/incognito')} />
      </Card>
      <SectionLabel>Personalisation & safety</SectionLabel>
      <Card style={{ paddingVertical: 4 }}>
        <ToggleRow label="Discovery visibility" sub="When off, you won't appear in new introductions." value={s.discoveryVisible} onChange={(v) => update({ discoveryVisible: v })} />
        <ToggleRow label="Behavioral personalization" sub="Use your choices to improve who you're introduced to." value={s.behavioralPersonalization} onChange={(v) => update({ behavioralPersonalization: v })} />
        <ToggleRow label="Conversation safety analysis" sub="Automatically flag scams and harassment. Message content is never shown to people." value={s.safetyAnalysis} onChange={(v) => update({ safetyAnalysis: v })} />
        <ToggleRow label="Pattern insights" sub="Let Mirror reflect patterns in your own choices back to you." value={s.patternInsights} onChange={(v) => update({ patternInsights: v })} />
      </Card>
      <SectionLabel>Your data</SectionLabel>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="What appears on your profile" onPress={() => router.push('/details/visibility?edit=1')} />
        <ListRow label="Blocked users" value={String(blocked)} onPress={() => router.push('/settings/blocked')} />
        <ListRow
          label="Download data"
          onPress={() => Alert.alert('Request received', "We'll prepare a copy of your data and send a download link to your account email within 48 hours.")}
        />
        <ListRow label="Delete data / account" danger last onPress={() => router.push('/settings/delete-account')} />
      </Card>
      <Sheet visible={sheet === 'visibility'} onClose={() => setSheet(null)} title="Profile visibility">
        <SingleSelect options={['Everyone', 'Matches only']} value={s.profileVisibility} onChange={(v) => { update({ profileVisibility: v as 'Everyone' }); setSheet(null); }} />
      </Sheet>
      <Sheet visible={sheet === 'precision'} onClose={() => setSheet(null)} title="Location precision">
        <SingleSelect options={['City', 'Neighbourhood']} value={s.locationPrecision} onChange={(v) => { update({ locationPrecision: v as 'City' }); setSheet(null); }} />
      </Sheet>
    </Screen>
  );
}
