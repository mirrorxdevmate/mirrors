import { Feather } from '@expo/vector-icons';

import { Locked } from '@/components/Locked';
import { Badge, Card, Header, Row, Screen, T, ToggleRow } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors } from '@/theme';

const POINTS = [
  'Only people you show interest in can see you.',
  'You still receive your normal introductions.',
  'Existing matches and conversations are unaffected.',
  'Reporting, blocking and safety tools work exactly as before.',
];

export default function Incognito() {
  const plan = useApp((s) => s.plan);
  const on = useApp((s) => s.settings.incognito);
  const updateSettings = useApp((s) => s.updateSettings);
  const unlocked = planAtLeast(plan, 'premium');
  return (
    <Screen scroll>
      <Header title="Incognito Mode" />
      <Row>
        <T v="h2" style={{ flex: 1 }}>
          Take control of your visibility
        </T>
        {!unlocked ? <Badge kind="premium" /> : null}
      </Row>
      <Card style={{ marginTop: 16, gap: 12 }}>
        {POINTS.map((p) => (
          <Row key={p} gap={10} style={{ alignItems: 'flex-start' }}>
            <Feather name="check" size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <T v="body" style={{ flex: 1 }}>
              {p}
            </T>
          </Row>
        ))}
      </Card>
      {unlocked ? (
        <Card style={{ marginTop: 16, paddingVertical: 4 }}>
          <ToggleRow label="Incognito Mode" sub={on ? 'You are hidden from people you haven’t liked.' : 'Off'} value={on} onChange={(v) => updateSettings({ incognito: v })} />
        </Card>
      ) : (
        <Locked need="premium" text="Incognito Mode is part of Premium." />
      )}
    </Screen>
  );
}
