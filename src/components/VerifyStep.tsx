import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { submitVerification } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';
import { takePhoto } from '@/utils/media';
import { Confetti } from './overlays';
import { Banner, Button, Header, Screen, T } from './ui';
import { finishVerification } from './verifyFlow';

type Phase = 'intro' | 'checking' | 'pending' | 'done';

export function VerifyStep({
  kind,
  title,
  steps,
  note,
  cta,
  checking,
}: {
  kind: 'photo' | 'identity';
  title: string;
  steps: string[];
  note?: string;
  cta: string;
  checking: string;
}) {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const verification = useApp((s) => s.verification);
  const set = useApp((s) => s.set);
  const [phase, setPhase] = useState<Phase>(verification[kind] === 'verified' ? 'done' : verification[kind] === 'pending' ? 'pending' : 'intro');
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState('');

  const start = async () => {
    setError('');
    const shot = kind === 'photo' ? await takePhoto({ front: true, square: true }) : await takePhoto();
    if (!shot) return;
    setUri(shot.uri);
    setPhase('checking');
    try {
      // Uploads privately and records the check; a reviewer/vendor moves it from pending to verified.
      const { status } = await submitVerification(kind, shot);
      set({ verification: { ...useApp.getState().verification, [kind]: status } });
      setPhase(status === 'verified' ? 'done' : 'pending');
    } catch {
      setError("We couldn't upload that. Check your connection and try again.");
      setPhase('intro');
    }
  };

  const next = () => {
    if (kind === 'photo' && ['none', 'rejected'].includes(useApp.getState().verification.identity))
      router.replace({ pathname: '/verify/identity', params: from ? { from } : {} });
    else finishVerification(!!from);
  };

  if (phase === 'checking' || phase === 'pending')
    return (
      <Screen>
        <Header title={title} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {uri ? <Image source={uri} style={{ width: 160, height: 160, borderRadius: kind === 'photo' ? 80 : radius.md, marginBottom: 24, opacity: 0.8 }} /> : null}
          {phase === 'checking' ? <ActivityIndicator color={colors.primary} size="large" /> : <Feather name="clock" size={36} color={colors.amber} />}
          <T v="h3" center style={{ marginTop: 16 }}>
            {phase === 'checking' ? checking : 'Submitted for review'}
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 6 }}>
            Pending — usually under 24 hours. You can keep using Mirror.
          </T>
        </View>
        <Button title={phase === 'pending' ? 'Continue' : 'Continue in background'} variant={phase === 'pending' ? 'primary' : 'ghost'} onPress={next} />
      </Screen>
    );

  if (phase === 'done')
    return (
      <Screen footer={<Button title="Continue" onPress={next} />}>
        <Header title={title} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#EAF8E4', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={44} color={colors.green} />
          </View>
          <T v="h2" center style={{ marginTop: 20 }}>
            {kind === 'photo' ? 'Photo verified' : 'Identity verified'}
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 6 }}>
            You&apos;re verified and ready to continue.
          </T>
        </View>
        <Confetti count={40} />
      </Screen>
    );

  return (
    <Screen
      footer={
        <>
          <Button title={cta} onPress={start} />
          {from ? <Button title="Later" variant="ghost" onPress={() => finishVerification(true)} /> : null}
        </>
      }>
      <Header title={title} />
      {error ? <Banner tone="error" text={error} /> : null}
      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <View style={{ width: 200, height: kind === 'photo' ? 200 : 130, borderRadius: kind === 'photo' ? 100 : radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name={kind === 'photo' ? 'user' : 'credit-card'} size={56} color={colors.grey500} />
          {kind === 'identity' ? (
            <T v="overline" color={colors.grey600} style={{ marginTop: 8 }}>
              ID document capture
            </T>
          ) : null}
        </View>
      </View>
      {steps.map((s) => (
        <T key={s} v="bodyL" style={{ marginBottom: 10 }}>
          {s}
        </T>
      ))}
      {note ? (
        <T v="body" color={colors.grey700} style={{ marginTop: 8 }}>
          {note}
        </T>
      ) : null}
    </Screen>
  );
}
