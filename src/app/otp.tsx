import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Spinner } from '@/components/Spinner';
import { Button, Header, LinkButton, Screen, T } from '@/components/ui';
import { ApiError, changePhone, RESEND_SECONDS, sendPhoneCode, verifyPhoneCode } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';
import { nowMs } from '@/utils/date';

type Status = 'idle' | 'verifying' | 'error' | 'expired';

/** "+971501234567" → "+971 50 123 4567" */
export function formatPhone(p: string) {
  const m = p.match(/^(\+971)(\d{2})(\d{3})(\d+)$/);
  if (m) return `${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
  const g = p.match(/^(\+\d{1,3})(\d+)$/);
  return g ? `${g[1]} ${g[2].replace(/(\d{3})(?=\d{4})/g, '$1 ')}` : p;
}

export default function Otp() {
  const params = useLocalSearchParams<{ sentAt: string; phone?: string; mode?: string }>();
  const savedPhone = useApp((s) => s.profile.phone);
  const phone = params.phone ?? savedPhone;
  const [sentAt, setSentAt] = useState(() => Number(params.sentAt) || nowMs());
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const input = useRef<TextInput>(null);

  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [sentAt]);

  const verify = async (c: string) => {
    setStatus('verifying');
    try {
      if (params.mode === 'change') {
        await changePhone(phone, c);
        const st = useApp.getState();
        st.set({ profile: { ...st.profile, phone } });
        router.dismissTo('/settings/account');
        return;
      }
      await verifyPhoneCode(phone, c, sentAt);
      // Returning users resume where they left off; new accounts see the greeting.
      await useApp.getState().refreshAccount();
      const st = useApp.getState();
      st.set({ profile: { ...st.profile, phone } });
      const returning = !!st.profile.firstName;
      if (!returning) st.set({ stage: 'auth' });
      if (returning) router.replace('/');
      else router.replace({ pathname: '/celebrate', params: { title: "You're verified!", next: '/greeting' } });
    } catch (e) {
      setStatus(e instanceof ApiError && e.code === 'expired' ? 'expired' : 'error');
      setCode('');
      setTimeout(() => input.current?.focus(), 50);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const r = await sendPhoneCode(phone);
      setSentAt(r.sentAt);
      setLeft(RESEND_SECONDS);
      setStatus('idle');
      setCode('');
      input.current?.focus();
    } finally {
      setResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <Spinner />
          <T v="bodyL" color={colors.grey700} center>
            Verifying your number…
          </T>
        </View>
      </Screen>
    );
  }

  const expired = status === 'expired';
  const error = status === 'error';
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Screen
      footer={
        <>
          {error || expired ? <Button title={expired ? 'Send a new code' : 'Resend code'} loading={resending} onPress={resend} /> : null}
          <LinkButton title="Change number" color={error || expired ? colors.grey900 : colors.grey700} onPress={() => router.back()} />
        </>
      }>
      <Header title={expired ? 'That code has expired.' : 'Enter your code'} top={32} />
      <T v="bodyL" color={colors.grey700} style={{ marginTop: 16, lineHeight: 20 }}>
        {expired ? 'Codes are valid for 10 minutes.' : `We sent a 6-digit code to ${formatPhone(phone)}.`}
      </T>
      <Pressable onPress={() => input.current?.focus()} style={st.boxes} accessibilityLabel="Verification code">
        {Array.from({ length: 6 }).map((_, i) => {
          const active = !expired && !error && i === code.length;
          const digit = code[i] ?? '';
          return (
            <View
              key={i}
              style={[
                st.box,
                active && st.boxActive,
                error && st.boxError,
                digit && !error ? { backgroundColor: colors.otpBox } : null,
              ]}>
              <Text style={[st.digit, active && { color: colors.primary }]}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        autoFocus
        editable={!expired}
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
      {error ? (
        <T v="bodyM" color={colors.red} style={{ marginTop: 12 }}>
          {"That code doesn't look right. Try again."}
        </T>
      ) : !expired ? (
        left > 0 ? (
          <T v="body" color={colors.grey700} style={{ marginTop: 12 }}>
            Resend code in <Text style={{ fontFamily: fonts.bodySemi, color: colors.primary }}>{`${mm}:${ss}`}</Text>
          </T>
        ) : (
          <Pressable accessibilityRole="button" onPress={resend} hitSlop={8} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            <T v="bodyS" color={colors.primary}>
              {resending ? 'Sending…' : 'Resend code'}
            </T>
          </Pressable>
        )
      ) : null}
      <T v="caption" color={colors.grey500} style={{ marginTop: 'auto', marginBottom: 4 }} center>
        Demo mode · use code 123456
      </T>
    </Screen>
  );
}

const st = StyleSheet.create({
  boxes: { flexDirection: 'row', gap: 8, marginTop: 16 },
  box: { flex: 1, height: 50, borderRadius: 12, backgroundColor: colors.otpBox, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  boxActive: { backgroundColor: colors.white, borderColor: colors.primary, borderWidth: 2 },
  boxError: { backgroundColor: colors.white, borderColor: colors.red },
  digit: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.grey900 },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
});
