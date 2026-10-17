import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Sheet } from '@/components/overlays';
import { SingleSelect } from '@/components/step';
import { Badge, Card, CircleButton, Header, ListRow, Row, Screen, SectionLabel, T } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors } from '@/theme';

const ADVANCED: Record<string, string[]> = {
  Culture: ['Open', 'Similar to mine', 'Specific'],
  Nationality: ['Any', 'Same as mine', 'Specific'],
  Ethnicity: ['Any', 'Same as mine', 'Specific'],
  Religion: ['Any', 'Same as mine', 'Practising only'],
  Lifestyle: ['Any', 'Active', 'Balanced', 'Easy-going'],
  'Career / profession': ['Any', 'Ambitious', 'Stable'],
  Education: ["Any", "Bachelor's or higher", "Master's or higher"],
  'Family goals': ['Any', 'Wants children', "Doesn't want children"],
  'Communication style': ['Any', 'Frequent', 'Independent'],
  'Preference flexibility': ['Strict', 'Balanced', 'Open'],
  'Preference vs deal-breaker': ['Simple', 'Detailed'],
};

function Stepper({ label, value, onChange, min, max, suffix = '' }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; suffix?: string }) {
  return (
    <Row gap={10}>
      <T v="body" style={{ flex: 1 }}>
        {label}
      </T>
      <CircleButton size={30} label={`Decrease ${label}`} icon={<Feather name="minus" size={14} />} onPress={() => onChange(Math.max(min, value - 1))} />
      <T v="bodyS" style={{ minWidth: 44, textAlign: 'center' }}>
        {value}
        {suffix}
      </T>
      <CircleButton size={30} label={`Increase ${label}`} icon={<Feather name="plus" size={14} />} onPress={() => onChange(Math.min(max, value + 1))} />
    </Row>
  );
}

export default function MyType() {
  const type = useApp((s) => s.type);
  const plan = useApp((s) => s.plan);
  const intent = useApp((s) => s.profile.intent);
  const updateType = useApp((s) => s.updateType);
  const unlocked = planAtLeast(plan, 'plus');
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Screen scroll>
      <Header title="My Type" />
      <Card style={{ gap: 14 }}>
        <SectionLabel>Age range</SectionLabel>
        <Stepper label="From" value={type.ageMin} min={18} max={type.ageMax} onChange={(ageMin) => updateType({ ageMin })} />
        <Stepper label="To" value={type.ageMax} min={type.ageMin} max={80} onChange={(ageMax) => updateType({ ageMax })} />
      </Card>
      <Card style={{ marginTop: 12, gap: 10 }}>
        <SectionLabel>Distance</SectionLabel>
        <Stepper label="Within" value={type.distanceKm} min={5} max={300} suffix=" km" onChange={(distanceKm) => updateType({ distanceKm })} />
        <Row gap={8}>
          {[10, 25, 50, 100].map((d) => (
            <T key={d} v="captionM" color={type.distanceKm === d ? colors.primary : colors.grey600} onPress={() => updateType({ distanceKm: d })} style={{ padding: 6 }}>
              {d} km
            </T>
          ))}
        </Row>
      </Card>
      <Card style={{ marginTop: 12, paddingVertical: 0 }}>
        <ListRow label="Relationship goal" value={intent} onPress={() => router.push('/onboarding/intent?edit=1')} />
        <ListRow label="Basic type preferences" value="Edit" onPress={() => router.push('/type/understood?edit=1')} />
        <ListRow label="Deal-breakers" value={type.dealBreakers.join(', ') || 'None'} last onPress={() => router.push('/type/flexibility?edit=1')} />
      </Card>

      <Row style={{ marginTop: 24, marginBottom: 8 }}>
        <T v="h3" style={{ flex: 1 }}>
          Advanced type controls
        </T>
        {!unlocked ? <Badge kind="plus" /> : null}
      </Row>
      <Card style={{ paddingVertical: 0, opacity: unlocked ? 1 : 0.6 }}>
        {Object.keys(ADVANCED).map((k, i, arr) => (
          <ListRow
            key={k}
            label={k}
            value={unlocked ? type.advanced[k] ?? ADVANCED[k][0] : '—'}
            last={i === arr.length - 1}
            onPress={() => (unlocked ? setOpen(k) : router.push({ pathname: '/upgrade/plans', params: { plan: 'plus' } }))}
          />
        ))}
      </Card>
      {!unlocked ? (
        <T v="caption" color={colors.grey600} style={{ marginTop: 8 }}>
          Advanced controls are part of Mirror+. Tap any row to see plans.
        </T>
      ) : null}

      <Sheet visible={!!open} onClose={() => setOpen(null)} title={open ?? ''}>
        <ScrollView style={{ maxHeight: 420 }}>
          {open ? (
            <SingleSelect
              options={ADVANCED[open]}
              value={type.advanced[open] ?? ADVANCED[open][0]}
              onChange={(v) => {
                updateType({ advanced: { ...type.advanced, [open]: v } });
                setOpen(null);
              }}
            />
          ) : null}
          <View style={{ height: 8 }} />
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
