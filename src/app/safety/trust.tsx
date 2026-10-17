import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { usePerson } from '@/hooks/usePerson';
import { colors } from '@/theme';

export default function TrustSignals() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { person: p } = usePerson(id);
  const signals = [
    { ok: !!p?.idVerified, label: 'Identity verified' },
    { ok: !!p?.verified, label: 'Photo verified' },
    { ok: true, label: 'Profile complete' },
    { ok: !p?.patternFlag, label: p?.patternFlag ? 'A pattern notice is active' : 'No current concerns surfaced' },
  ];
  return (
    <Screen footer={<Button title="Report or block" variant="secondary" onPress={() => router.replace({ pathname: '/safety/report', params: { id } })} />}>
      <Header title="Trust signals" />
      {signals.map((s) => (
        <Card key={s.label} style={{ marginBottom: 10 }}>
          <Row gap={12}>
            <Feather name={s.ok ? 'check-circle' : 'alert-circle'} size={20} color={s.ok ? colors.green : colors.amber} />
            <T v="bodyLM">{s.label}</T>
          </Row>
        </Card>
      ))}
      {p?.patternFlag ? (
        <Button title="View summary" variant="ghost" onPress={() => router.push({ pathname: '/safety/pattern', params: { id, summary: '1' } })} />
      ) : null}
    </Screen>
  );
}
