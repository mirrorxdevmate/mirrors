import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Sheet } from '@/components/overlays';
import { SingleSelect } from '@/components/step';
import { Badge, Card, Header, ListRow, Screen, ToggleRow } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { getBlocked } from '@/services/api';
import { planAtLeast, useApp } from '@/store/useApp';

export default function Privacy() {
  const s = useApp((st) => st.settings);
  const { data: blockedList } = useServer(getBlocked, []);
  const blocked = blockedList.length;
  const update = useApp((st) => st.updateSettings);
  const plan = useApp((st) => st.plan);
  const [sheet, setSheet] = useState<null | 'visibility' | 'precision'>(null);

  return (
    <Screen scroll>
      <Header title="Privacy" spaced />
      <Card style={{ paddingVertical: 8 }}>
        <ListRow compact label="Phone visibility" value="Private · locked" />
        <ListRow compact label="Profile visibility" value={s.profileVisibility} onPress={() => setSheet('visibility')} />
        <ListRow compact label="Location precision" value={s.locationPrecision} onPress={() => setSheet('precision')} />
        <ToggleRow
          row
          label="Incognito Mode"
          badge={<Badge kind="premium" />}
          value={s.incognito}
          onChange={(v) => (planAtLeast(plan, 'premium') ? update({ incognito: v }) : router.push('/settings/incognito'))}
        />
        <ToggleRow row label="Discovery visibility" value={s.discoveryVisible} onChange={(v) => update({ discoveryVisible: v })} />
        <ToggleRow row label="Behavioral personalization" value={s.behavioralPersonalization} onChange={(v) => update({ behavioralPersonalization: v })} />
        <ToggleRow row label="Conversation safety analysis" value={s.safetyAnalysis} onChange={(v) => update({ safetyAnalysis: v })} />
        <ToggleRow row label="Pattern insights" value={s.patternInsights} onChange={(v) => update({ patternInsights: v })} />
        <ListRow compact label="Blocked users" value={String(blocked)} onPress={() => router.push('/settings/blocked')} />
        <ListRow
          compact
          label="Download data"
          onPress={() => Alert.alert('Request received', "We'll prepare a copy of your data and send you a download link within 48 hours.")}
        />
        <ListRow compact label="Delete data / account" last onPress={() => router.push('/settings/delete-account')} />
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
