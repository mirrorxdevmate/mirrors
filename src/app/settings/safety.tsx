import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking } from 'react-native';

import { Card, Header, ListRow, Row, Screen, SectionLabel, T } from '@/components/ui';
import { useServer } from '@/hooks/useServer';
import { getBlocked } from '@/services/api';
import { colors } from '@/theme';

const TIPS = [
  ['Keep it on Mirror', 'Stay in Mirror chat until you trust someone. It keeps safety tools working for you.'],
  ['Never send money', 'No genuine match will ask for money, gift cards or crypto. Report it straight away.'],
  ['Meet in public', 'For a first meeting, choose a busy public place and tell a friend where you’ll be.'],
  ['Trust your instincts', 'If something feels off, you can unmatch, block or report at any time — they won’t be told.'],
];

export default function Safety() {
  const { data: blockedList } = useServer(getBlocked, []);
  const blocked = blockedList.length;
  return (
    <Screen scroll>
      <Header title="Safety" spaced />
      {TIPS.map(([h, b]) => (
        <Card key={h} style={{ marginBottom: 10 }}>
          <Row style={{ alignItems: 'flex-start' }} gap={10}>
            <Feather name="shield" size={18} color={colors.primary} style={{ marginTop: 2 }} />
            <T v="body" style={{ flex: 1 }}>
              <T v="bodyS">{h}. </T>
              {b}
            </T>
          </Row>
        </Card>
      ))}
      <SectionLabel>Tools</SectionLabel>
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="Blocked users" value={String(blocked)} onPress={() => router.push('/settings/blocked')} />
        <ListRow label="Contact the safety team" last onPress={() => Linking.openURL('mailto:safety@mirror.app?subject=Safety%20concern')} />
      </Card>
      <T v="caption" color={colors.grey600} style={{ marginTop: 16 }}>
        If you are in immediate danger, contact your local emergency services.
      </T>
    </Screen>
  );
}
