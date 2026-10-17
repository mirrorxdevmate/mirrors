import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Header, LinkButton, Loading, Screen, T } from '@/components/ui';
import { DEMO_AUTH } from '@/lib/supabase';
import { ApiError, changeEmail, DEV_OTP, RESEND_SECONDS, sendOtp, verifyEmailChange, verifyOtp } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts, radius } from '@/theme';
import { nowMs } from '@/utils/date';

type Status = 'idle' | 'verifying' | 'error' | 'expired';

export default function Otp() {
  const params = useLocalSearchParams<{ sentAt: string; mode?: string; email?: string }>();
  const savedEmail = useApp((s) => s.profile.email);
  const email = params.email ?? savedEmail;
  const [sentAt, setSentAt] = useState(() => Number(params.sentAt) || nowMs());
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [errorText, setErrorText] = useState("That code doesn't look right. Try again.");
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [sentAt]);


  const verify = async (c: string) => {
    setStatus('verifying');
    try {
      if (params.mode === 'change') {
        await verifyEmailChange(email, c);
        const st = useApp.getState();
        st.set({ profile: { ...st.profile, email } });
        router.dismissTo('/settings/account');
        return;
      }
      await verifyOtp(email, c, sentAt);
      // Returning users (profile already on the server) resume where they left off;
      // new accounts see the greeting and start onboarding.
      const st = useApp.getState();
      await st.refreshAccount();
      const returning = !!useApp.getState().profile.firstName;
      if (!returning) useApp.getState().set({ stage: 'auth' });
      const next = returning ? '/' : '/greeting';
      router.replace({ pathname: '/celebrate', params: { title: "You're verified!", next } });
    } catch (e) {
      setStatus(e instanceof ApiError && e.code === 'expired' ? 'expired' : 'error');
      setErrorText(e instanceof ApiError && e.code !== 'invalid' ? e.message : "That code doesn't look right. Try again.");
      setCode('');
      setTimeout(() => input.current?.focus(), 50);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const r = params.mode === 'change' ? await changeEmail(email) : await sendOtp(email);
      setSentAt(r.sentAt);
      setLeft(RESEND_SECONDS);
      setStatus('idle');
      setCode('');
    } catch {
      router.back();
    } finally {
      setResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <Screen>
        <Loading label="Verifying your code…" />
      </Screen>
    );
  }

  if (status === 'expired') {
    return (
      <Screen
        footer={
          <>
            <Button title="Send a new code" loading={resending} onPress={resend} />
            <Button title="Change email" variant="ghost" onPress={() => router.back()} />
          </>
        }>
        <Header />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={st.icon}>
            <Feather name="clock" size={26} color={colors.primary} />
          </View>
          <T v="h2" center>
            That code has expired.
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
            Codes are valid for 10 minutes.
          </T>
        </View>
      </Screen>
    );
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Screen>
      <Header title="Enter your code" />
      <T v="body" color={colors.grey700}>
        We sent a 6-digit code to {email}. Check your inbox (and spam folder).
      </T>
      <Pressable onPress={() => input.current?.focus()} style={st.boxes} accessibilityLabel="Verification code">
        {Array.from({ length: 6 }).map((_, i) => {
          const active = i === code.length && status !== 'error';
          return (
            <View key={i} style={[st.box, active && { borderColor: colors.primary, borderWidth: 1.5 }, status === 'error' && { borderColor: colors.red, borderWidth: 1 }]}>
              <T v="h2" style={{ fontFamily: fonts.heading }}>
                {code[i] ?? ''}
              </T>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        autoFocus
        onChangeText={(t) => {
          const c = t.replace(/\D/g, '').slice(0, 6);
          setCode(c);
          if (status === 'error') setStatus('idle');
          if (c.length === 6) verify(c);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={6}
        style={st.hidden}
      />
      {status === 'error' ? (
        <T v="body" color={colors.red} style={{ marginTop: 12 }}>
          {errorText}
        </T>
      ) : null}
      <View style={{ marginTop: 16, alignItems: 'flex-start' }}>
        {left > 0 && status !== 'error' ? (
          <T v="body" color={colors.grey700}>
            Resend code in {mm}:{ss}
          </T>
        ) : (
          <LinkButton title={resending ? 'Sending…' : 'Resend code'} style={{ alignSelf: 'flex-start', paddingVertical: 0 }} onPress={resend} />
        )}
      </View>
      <LinkButton title="Change email" style={{ alignSelf: 'flex-start' }} onPress={() => router.back()} />
      {DEMO_AUTH ? (
        <T v="caption" color={colors.grey500} style={{ marginTop: 'auto', marginBottom: 12 }} center>
          Test mode · use code {DEV_OTP}
        </T>
      ) : null}
    </Screen>
  );
}

const st = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8, marginTop: 24 },
  box: { flex: 1, aspectRatio: 0.9, maxHeight: 64, borderRadius: radius.md, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center' },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
});
