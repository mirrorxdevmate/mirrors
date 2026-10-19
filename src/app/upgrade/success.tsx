import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Confetti } from '@/components/overlays';
import { Button, Screen, T } from '@/components/ui';
import { FEATURES, PLAN_LABEL, useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';

export default function PurchaseSuccess() {
  const item = useCheckout((s) => s.item);
  const then = useCheckout((s) => s.then);
  const boosts = useApp((s) => s.boosts);
  if (!item) return null;

  const finish = () => {
    useCheckout.getState().set({ item: null, then: null });
    router.dismissAll();
    if (item.kind === 'boost') router.push({ pathname: '/boost', params: { purchased: '1' } });
    else router.navigate({ pathname: '/(tabs)', params: then === 'rewind' ? { notice: 'rewind' } : {} });
  };

  return (
    <Screen footer={<Button title={item.kind === 'boost' ? 'Use my Boost' : 'Start exploring'} onPress={finish} />}>
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: 180 }}>
        <View style={st.card}>
          <Text style={st.title}>{item.kind === 'plan' ? `Welcome to ${PLAN_LABEL[item.plan]}` : 'Your Boost is ready'}</Text>
          {item.kind === 'plan' ? (
            <>
              <T v="body" color={colors.grey700} style={{ marginTop: 16, marginBottom: 12 }}>
                You&apos;ve unlocked
              </T>
              <View style={{ gap: 8 }}>
                {FEATURES[item.plan].map((f) => (
                  <T key={f} v="body" color={colors.grey700}>
                    — {f}
                  </T>
                ))}
              </View>
            </>
          ) : (
            <>
              <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
                Mirror will consider your profile more often for compatible people once you start your Boost.
              </T>
              <View style={{ marginTop: 20, backgroundColor: colors.secondary, borderRadius: 8, padding: 14 }}>
                <T v="caption" style={{ fontSize: 12 }}>
                  Boosts remaining: {boosts}
                  {'\n'}Receipt sent to your email
                </T>
              </View>
            </>
          )}
        </View>
      </View>
      <Confetti />
    </Screen>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 27, paddingVertical: 24 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
});
