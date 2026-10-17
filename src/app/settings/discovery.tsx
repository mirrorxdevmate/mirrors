import { Feather } from '@expo/vector-icons';
import { useState } from 'react';

import { CityPicker } from '@/components/CityPicker';
import { Locked } from '@/components/Locked';
import { Badge, Button, Card, Header, Row, Screen, SectionLabel, T } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function Discovery() {
  const plan = useApp((s) => s.plan);
  const city = useApp((s) => s.profile.location.city);
  const distance = useApp((s) => s.type.distanceKm);
  const discoveryCity = useApp((s) => s.settings.discoveryCity);
  const updateSettings = useApp((s) => s.updateSettings);
  const unlocked = planAtLeast(plan, 'plus');
  const [picker, setPicker] = useState(false);

  return (
    <Screen scroll>
      <Header title="Discovery location" />
      <Row style={{ marginBottom: 4 }}>
        <T v="h2" style={{ flex: 1 }}>
          See people in other places
        </T>
        {!unlocked ? <Badge kind="plus" /> : null}
      </Row>
      <T v="body" color={colors.grey700} style={{ marginBottom: 20 }}>
        Browse introductions outside your local area, now.
      </T>
      <SectionLabel>Current city</SectionLabel>
      <Card style={{ marginBottom: 16 }}>
        <Row>
          <Feather name="map-pin" size={16} color={colors.grey700} />
          <T v="bodyM">
            {(city || 'Dubai').split(',')[0]} · within {distance} km
          </T>
        </Row>
      </Card>
      <SectionLabel>Explore another city</SectionLabel>
      {unlocked ? (
        <>
          <Card onPress={() => setPicker(true)}>
            <Row>
              <Feather name="search" size={16} color={colors.grey600} />
              <T v="body" color={discoveryCity ? colors.grey900 : colors.grey500}>
                {discoveryCity ?? 'Search a city'}
              </T>
            </Row>
          </Card>
          {discoveryCity ? <Button title="Back to my city" variant="ghost" onPress={() => updateSettings({ discoveryCity: null })} /> : null}
        </>
      ) : (
        <Locked need="plus" text="Global Discovery is part of Mirror+." />
      )}
      <CityPicker visible={picker} onClose={() => setPicker(false)} onPick={(c) => updateSettings({ discoveryCity: c })} />
    </Screen>
  );
}
