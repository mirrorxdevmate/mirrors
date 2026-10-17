import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import { View } from 'react-native';

import { CityPicker } from '@/components/CityPicker';
import { useStepNav } from '@/components/step';
import { Banner, Button, Header, ProgressHeader, Screen, T, Title } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function LocationStep() {
  const updateProfile = useApp((s) => s.updateProfile);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const { edit, advance } = useStepNav('/onboarding/photos');

  const done = (city: string, mode: 'gps' | 'manual') => {
    updateProfile({ location: { city, mode } });
    advance();
  };

  const enable = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Permission denied → fall through to manual entry (per spec).
        setNotice('Location access is off. Enter your city instead.');
        setManual(true);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
      const city = place ? [place.city ?? place.subregion ?? place.region, place.country].filter(Boolean).join(', ') : '';
      if (city) done(city, 'gps');
      else {
        setNotice("We couldn't work out your city. Enter it manually.");
        setManual(true);
      }
    } catch {
      setNotice("We couldn't get your location. Enter it manually.");
      setManual(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      footer={
        <>
          <Button title="Enable" loading={loading} onPress={enable} />
          <Button title="Enter location manually" variant="ghost" onPress={() => setManual(true)} />
        </>
      }>
      {edit ? <Header /> : <ProgressHeader step={5} total={8} />}
      <Title sub="We use your location to show you people nearby. You can also enter a location manually if you prefer.">Enable your location</Title>
      {notice ? <Banner text={notice} /> : null}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="map-pin" size={44} color={colors.primary} />
        </View>
        <T v="caption" color={colors.grey600} center style={{ marginTop: 16, maxWidth: 260 }}>
          Only your city is shown on your profile — never your exact location.
        </T>
      </View>
      <CityPicker visible={manual} onClose={() => setManual(false)} onPick={(c) => done(c, 'manual')} title="Where are you based?" />
    </Screen>
  );
}
