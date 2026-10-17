import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { Locked } from '@/components/Locked';
import { Tooltip } from '@/components/overlays';
import { Badge, Banner, Button, Card, Field, Header, Row, Screen, SectionLabel, T } from '@/components/ui';
import { planAtLeast, useApp } from '@/store/useApp';
import { colors } from '@/theme';

function validDate(s: string) {
  const m = s.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if (!m) return false;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getDate() === +m[1] && d >= today;
}

export default function TravelMode() {
  const plan = useApp((s) => s.plan);
  const travel = useApp((s) => s.settings.travel);
  const recent = useApp((s) => s.settings.recentDestinations);
  const updateSettings = useApp((s) => s.updateSettings);
  const unlocked = planAtLeast(plan, 'premium');
  const [city, setCity] = useState(travel?.city ?? '');
  const [date, setDate] = useState(travel?.date ?? '');
  const [picker, setPicker] = useState(false);
  const [tip, setTip] = useState(false);

  const formatDate = (t: string) => {
    const d = t.replace(/\D/g, '').slice(0, 8);
    return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join(' / ');
  };
  const dateOk = validDate(date);

  return (
    <Screen scroll>
      <Header
        title="Travel Mode"
        right={
          <Pressable accessibilityLabel="About travel mode" hitSlop={10} onPress={() => setTip(true)}>
            <Feather name="info" size={20} color={colors.grey700} />
          </Pressable>
        }
      />
      <Row>
        <T v="h2" style={{ flex: 1 }}>
          {city ? `Going to ${city.split(',')[0]}?` : 'Going somewhere soon?'}
        </T>
        {!unlocked ? <Badge kind="premium" /> : null}
      </Row>
      <T v="body" color={colors.grey700} style={{ marginTop: 6, marginBottom: 20 }}>
        Set a destination and Mirror starts preparing introductions before you arrive.
      </T>
      {travel ? <Banner tone="success" text={`Travel Mode is on: ${travel.city.split(',')[0]} from ${travel.date}.`} /> : null}

      <SectionLabel>Destination</SectionLabel>
      <Card onPress={unlocked ? () => setPicker(true) : undefined} style={{ marginBottom: 12 }}>
        <Row>
          <Feather name="search" size={16} color={colors.grey600} />
          <T v="body" color={city ? colors.grey900 : colors.grey500}>
            {city || 'Search a city'}
          </T>
        </Row>
      </Card>
      <Field
        label="Arrival Date"
        value={date}
        editable={unlocked}
        onChangeText={(t) => setDate(formatDate(t))}
        placeholder="DD / MM / YYYY"
        keyboardType="number-pad"
        error={date.length === 14 && !dateOk ? 'Choose a valid future date.' : undefined}
      />

      {unlocked ? (
        <>
          <Button
            title={travel ? 'Update trip' : 'Start showing me introductions'}
            disabled={!city || !dateOk}
            onPress={() => {
              updateSettings({ travel: { city, date }, recentDestinations: [city, ...recent.filter((r) => r !== city)].slice(0, 5) });
              setTip(true);
            }}
          />
          {travel ? (
            <Button
              title="Turn off Travel Mode"
              variant="ghost"
              onPress={() => {
                updateSettings({ travel: null });
                setCity('');
                setDate('');
              }}
            />
          ) : null}
          <SectionLabel>Recent Destinations</SectionLabel>
          <View style={{ gap: 8 }}>
            {recent.map((r) => (
              <Card key={r} onPress={() => setCity(r)}>
                <Row>
                  <Feather name="clock" size={14} color={colors.grey600} />
                  <T v="body">{r}</T>
                </Row>
              </Card>
            ))}
          </View>
        </>
      ) : (
        <Locked need="premium" text="Travel Mode is part of Premium." />
      )}
      <CityPicker visible={picker} onClose={() => setPicker(false)} onPick={setCity} title="Where are you going?" />
      <Tooltip visible={tip} onHide={() => setTip(false)} top={64} text="Your profile shows the destination and dates to people there, so nobody is misled about where you are." />
    </Screen>
  );
}
