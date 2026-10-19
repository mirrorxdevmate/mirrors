import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Sheet } from '@/components/overlays';
import { ChevronDown, CloudX, UaeFlag } from '@/components/icons';
import { Button, Header, Screen, T } from '@/components/ui';
import { sendPhoneCode } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export const COUNTRIES = [
  { code: '+971', name: 'United Arab Emirates', flag: 'ae' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
];

export const Flag = ({ flag }: { flag: string }) =>
  flag === 'ae' ? <UaeFlag /> : <Text style={{ fontSize: 16, lineHeight: 18, width: 22, textAlign: 'center' }}>{flag}</Text>;

export default function PhoneNumber() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const saved = useApp((s) => s.profile);
  const [country, setCountry] = useState(COUNTRIES.find((c) => c.code === saved.countryCode) ?? COUNTRIES[0]);
  const [number, setNumber] = useState('');
  const [picking, setPicking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const digits = number.replace(/\D/g, '');
  const valid = digits.length >= 7 && digits.length <= 12;
  const full = `${country.code}${digits.replace(/^0+/, '')}`;

  const submit = async () => {
    setLoading(true);
    try {
      const { sentAt } = await sendPhoneCode(full);
      if (mode !== 'change') useApp.getState().set({ profile: { ...useApp.getState().profile, phone: full, countryCode: country.code } });
      setFailed(false);
      router.push({ pathname: '/otp', params: { sentAt: String(sentAt), phone: full, ...(mode ? { mode } : {}) } });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  if (failed) {
    return (
      <Screen
        footer={
          <>
            <Button title="Try again" loading={loading} onPress={submit} />
            <Button title="Change number" variant="outline" onPress={() => setFailed(false)} />
          </>
        }>
        <Header title="We couldn't send the code." top={32} onBack={() => setFailed(false)} />
        <T v="bodyL" color={colors.grey700} style={{ marginTop: 16, lineHeight: 20 }}>
          Check your connection or try again.
        </T>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CloudX />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Continue" disabled={!valid} loading={loading} onPress={submit} />}>
      <Header title={mode === 'change' ? 'Enter your new number' : 'Enter your phone number'} top={32} />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 16, lineHeight: 20 }}>
        {"We'll send you a verification code. Your number won't be shown on your profile."}
      </T>
      <View style={st.field}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Country code ${country.code}`} hitSlop={8} onPress={() => setPicking(true)} style={st.country}>
          <Flag flag={country.flag} />
          <Text style={[st.text, { color: colors.grey500 }]}>{country.code}</Text>
          <ChevronDown />
        </Pressable>
        <View style={st.divider} />
        <TextInput
          autoFocus
          value={number}
          onChangeText={(t) => setNumber(t.replace(/[^\d ]/g, '').slice(0, 15))}
          placeholder="Phone number"
          placeholderTextColor={colors.grey500}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="done"
          onSubmitEditing={() => valid && submit()}
          accessibilityLabel="Phone number"
          style={[st.text, st.input]}
        />
      </View>
      <Sheet visible={picking} onClose={() => setPicking(false)} title="Country code">
        <ScrollView style={{ maxHeight: 420 }}>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              accessibilityRole="button"
              onPress={() => {
                setCountry(c);
                setPicking(false);
              }}
              style={({ pressed }) => [st.countryRow, pressed && { opacity: 0.6 }]}>
              <Flag flag={c.flag} />
              <T v="bodyL" style={{ flex: 1 }}>
                {c.name}
              </T>
              <T v="bodyL" color={c.code === country.code ? colors.primary : colors.grey700}>
                {c.code}
              </T>
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

const st = StyleSheet.create({
  field: { marginTop: 26, height: 55, borderRadius: 360, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 16 },
  country: { flexDirection: 'row', alignItems: 'center', gap: 10, height: '100%' },
  divider: { width: 1, height: 24, backgroundColor: colors.grey300, marginHorizontal: 10 },
  text: { fontFamily: fonts.body, fontSize: 14, color: colors.grey900 },
  input: { flex: 1, height: '100%', paddingVertical: 0, outlineStyle: 'none' } as object,
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.grey300 },
});
