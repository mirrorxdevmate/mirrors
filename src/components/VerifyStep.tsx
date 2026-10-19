import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { submitVerification } from '@/services/api';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';
import { takePhoto } from '@/utils/media';
import { Spinner } from './Spinner';
import { Banner, Button, Header, LinkButton, Screen, StatusBanner, T } from './ui';
import { finishVerification } from './verifyFlow';

type Phase = 'intro' | 'checking' | 'pending' | 'done';

/** Dashed oval face guide from the PHOTO VERIFICATION frame (274×350). */
const FaceGuide = () => (
  <Svg width={274} height={350}>
    <Rect x={0.5} y={0.5} width={273} height={349} rx={136.5} fill="none" stroke={colors.grey800} strokeDasharray="4 4" />
  </Svg>
);

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
  const [error, setError] = useState('');

  const start = async () => {
    setError('');
    const shot = kind === 'photo' ? await takePhoto({ front: true, square: true }) : await takePhoto();
    if (!shot) return;
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

  // PHOTO / IDENTITY VERIFICATION (Loading) — pending review
  if (phase === 'checking' || phase === 'pending')
    return (
      <Screen
        footer={
          <>
            <StatusBanner tone="pending" text="Pending — Usually under 24 hours" style={{ marginBottom: 18 }} />
            <Button title="Continue" loading={phase === 'checking'} onPress={next} />
          </>
        }>
        <Header title={title} />
        <View style={st.center}>
          <Spinner />
          <T v="bodyL" color={colors.grey700} center>
            {checking}
          </T>
        </View>
      </Screen>
    );

  // PHOTO / IDENTITY VERIFIED
  if (phase === 'done')
    return (
      <Screen
        footer={
          <>
            <StatusBanner tone="success" text={kind === 'photo' ? 'Photo verified' : 'Identity verified'} style={{ marginBottom: 18 }} />
            <Button title="Continue" onPress={next} />
          </>
        }>
        <Header title={kind === 'photo' ? 'Photo verified' : 'Identity verified'} />
        <T v="bodyL" color={colors.grey700} style={{ marginTop: 24, lineHeight: 20 }}>
          You’re verified and ready to continue.
        </T>
        <View style={st.center}>
          <View style={st.tick}>
            <Feather name="check" size={26} color={colors.white} />
          </View>
        </View>
      </Screen>
    );

  return (
    <Screen
      footer={
        <>
          <Button title={cta} onPress={start} />
          <LinkButton title="Later" onPress={() => finishVerification(!!from)} />
        </>
      }>
      <Header title={title} />
      {error ? (
        <View style={{ marginTop: 16 }}>
          <Banner tone="error" text={error} />
        </View>
      ) : null}
      {kind === 'photo' ? (
        <View style={st.camera}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <FaceGuide />
          </View>
          <View style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 40 }}>
            {steps.map((s) => (
              <T key={s} v="body" color={colors.grey700}>
                {s}
              </T>
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={st.idBox}>
            <T v="body" color={colors.grey700}>
              ID DOCUMENT CAPTURE
            </T>
          </View>
          {note ? (
            <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
              {note}
            </T>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 40 },
  tick: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1, marginTop: 36, marginBottom: 8, borderRadius: 8, backgroundColor: colors.grey300, overflow: 'hidden' },
  idBox: { marginTop: 32, height: 196, borderRadius: 8, backgroundColor: colors.grey300, alignItems: 'center', justifyContent: 'center' },
});
