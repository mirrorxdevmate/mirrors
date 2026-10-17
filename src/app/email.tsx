import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, Field, Header, Screen, T } from '@/components/ui';
import { REVIEW_EMAIL } from '@/lib/supabase';
import { changeEmail, sendOtp, signInWithPassword } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Sign in / sign up with an email code (also used to change the account email: ?mode=change). */
export default function EmailSignIn() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const saved = useApp((s) => s.profile.email);
  const [email, setEmail] = useState(mode === 'change' ? '' : saved);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState('');

  const clean = email.trim().toLowerCase();
  const valid = EMAIL_RE.test(clean);
  // App Store / Play reviewers sign in with a password instead of an emailed code.
  const reviewer = !!REVIEW_EMAIL && clean === REVIEW_EMAIL.toLowerCase() && mode !== 'change';

  const submit = async () => {
    setLoading(true);
    setFailed('');
    try {
      if (reviewer) {
        await signInWithPassword(clean, password);
        await useApp.getState().refreshAccount();
        router.replace('/');
        return;
      }
      if (mode === 'change') {
        const { sentAt } = await changeEmail(clean);
        router.push({ pathname: '/otp', params: { sentAt: String(sentAt), mode, email: clean } });
        return;
      }
      const { sentAt } = await sendOtp(clean);
      useApp.getState().set({ profile: { ...useApp.getState().profile, email: clean } });
      router.push({ pathname: '/otp', params: { sentAt: String(sentAt), email: clean } });
    } catch (e) {
      setFailed(e instanceof Error && e.message ? e.message : 'Check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (failed && !reviewer) {
    return (
      <Screen
        footer={
          <>
            <Button title="Try again" loading={loading} onPress={submit} />
            <Button title="Change email" variant="ghost" onPress={() => setFailed('')} />
          </>
        }>
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Feather name="mail" size={26} color={colors.primary} />
          </View>
          <T v="h2" center>
            We couldn&apos;t send the code.
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
            {failed}
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title="Continue" disabled={!valid || (reviewer && password.length < 6)} loading={loading} onPress={submit} />}>
      <Header title={mode === 'change' ? 'Change your email' : 'Enter your email'} />
      <T v="body" color={colors.grey700} style={{ marginBottom: 20 }}>
        We&apos;ll send you a 6-digit verification code. Your email won&apos;t be shown on your profile.
      </T>
      <Field
        autoFocus
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={120}
        returnKeyType="done"
        onSubmitEditing={() => valid && !reviewer && submit()}
        accessibilityLabel="Email address"
        left={<Feather name="mail" size={16} color={colors.grey600} />}
      />
      {reviewer ? (
        <>
          <Field value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoCapitalize="none" accessibilityLabel="Password" />
          {failed ? <Banner tone="error" text={failed} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
