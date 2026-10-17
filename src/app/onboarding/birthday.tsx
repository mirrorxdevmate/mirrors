import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Dialog } from '@/components/overlays';
import { StepScreen } from '@/components/step';
import { Field, T } from '@/components/ui';
import { deleteAccount, signOut } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';
import { ageFrom } from '@/utils/date';

export default function Birthday() {
  const saved = useApp((s) => s.profile.birthday);
  const updateProfile = useApp((s) => s.updateProfile);
  const [d, setD] = useState(saved.d);
  const [m, setM] = useState(saved.m);
  const [y, setY] = useState(saved.y);
  const [error, setError] = useState('');
  const [under, setUnder] = useState(false);
  const mRef = useRef<TextInput>(null);
  const yRef = useRef<TextInput>(null);

  const complete = d.length >= 1 && m.length >= 1 && y.length === 4;

  const next = () => {
    const age = ageFrom(d, m, y);
    if (age === null || age > 100 || Number(y) < 1900) return setError("That date doesn't look right.");
    if (age < 18) return setUnder(true);
    updateProfile({ birthday: { d: d.padStart(2, '0'), m: m.padStart(2, '0'), y } });
    router.push('/onboarding/name');
  };

  const box = { flex: 1 } as const;
  return (
    <StepScreen
      step={1}
      total={8}
      title="When's your birthday?"
      sub="You must be 18 or older to use Mirror. Your exact birthday won't appear on your profile."
      canContinue={complete}
      onContinue={next}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={box}>
          <Field
            value={d}
            placeholder="DD"
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            accessibilityLabel="Day"
            onChangeText={(t) => {
              setError('');
              setD(t.replace(/\D/g, ''));
              if (t.length === 2) mRef.current?.focus();
            }}
          />
        </View>
        <View style={box}>
          <Field
            ref={mRef}
            value={m}
            placeholder="MM"
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            accessibilityLabel="Month"
            onChangeText={(t) => {
              setError('');
              setM(t.replace(/\D/g, ''));
              if (t.length === 2) yRef.current?.focus();
            }}
          />
        </View>
        <View style={{ flex: 1.4 }}>
          <Field
            ref={yRef}
            value={y}
            placeholder="YYYY"
            keyboardType="number-pad"
            maxLength={4}
            textAlign="center"
            accessibilityLabel="Year"
            onChangeText={(t) => {
              setError('');
              setY(t.replace(/\D/g, ''));
            }}
          />
        </View>
      </View>
      {error ? (
        <T v="body" color={colors.red}>
          {error}
        </T>
      ) : null}
      <Dialog
        visible={under}
        eyebrow="Attention"
        title="Are you 18 or older?"
        message="Mirror is for adults only. You must be 18 or older to create an account."
        primary={{
          label: "Yes, I'm 18+",
          onPress: () => {
            setUnder(false);
            setY('');
            setError('Please re-enter your date of birth.');
            setTimeout(() => yRef.current?.focus(), 300);
          },
        }}
        secondary={{
          label: 'No',
          onPress: () => {
            setUnder(false);
            // Under-18s can't have an account: remove what was created during sign-up.
            deleteAccount('under_18').catch(() => signOut());
          },
        }}
        onClose={() => setUnder(false)}
      />
    </StepScreen>
  );
}
