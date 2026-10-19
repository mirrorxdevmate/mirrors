import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/appIcons';
import { RadioDot } from '@/components/icons';
import { Badge, Button, Header, Row, Screen, T } from '@/components/ui';
import { billingEnabled, buy, loadProducts, productId } from '@/lib/billing';
import { activateBoost, PRICES } from '@/services/api';
import { boostDiscount, money, useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors, fonts } from '@/theme';
import { countdown, nowMs } from '@/utils/date';

const PACKS = [1, 3, 5];
const NEVER = ['Deal-breakers', 'Gender preference', 'Age eligibility', 'Relationship intent', 'Compatibility eligibility', 'Blocks, moderation, safety restrictions'];

export default function Boost() {
  const boosts = useApp((s) => s.boosts);
  const endsAt = useApp((s) => s.boostEndsAt);
  const plan = useApp((s) => s.plan);
  const [pack, setPack] = useState(3);
  const [now, setNow] = useState(nowMs);
  useEffect(() => {
    const t = setInterval(() => setNow(nowMs()), 1000);
    return () => clearInterval(t);
  }, []);
  const active = !!endsAt && endsAt > now;
  const discount = boostDiscount(plan);
  const [busy, setBusy] = useState(false);
  const [storePrices, setStorePrices] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!billingEnabled) return;
    loadProducts(PACKS.map(productId.boost)).then((ps) =>
      setStorePrices(Object.fromEntries(PACKS.filter((n) => ps[productId.boost(n)]).map((n) => [n, ps[productId.boost(n)].priceString]))),
    );
  }, []);
  const purchase = async () => {
    useCheckout.getState().set({ item: { kind: 'boost', count: pack } });
    if (!billingEnabled) return router.push('/upgrade/payment'); // test checkout (no store keys yet)
    setBusy(true);
    try {
      if ((await buy(productId.boost(pack))) === 'ok') {
        await useApp.getState().refreshAccount().catch(() => {});
        router.push('/upgrade/success');
      }
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (active)
    return (
      <Screen footer={<Button title="Back to Mirror" onPress={() => router.back()} />}>
        <Header title="Profile Boost" spaced />
        <Text style={st.h1}>You’re in the spotlight</Text>
        <T v="bodyL" color={colors.grey700} style={{ marginTop: 16, lineHeight: 20 }}>
          Your Boost is active. More compatible people can discover your profile right now.
        </T>
        <View style={st.timer}>
          <Text style={st.clock}>{countdown(endsAt! - now).clock}</Text>
          <T v="captionM" style={{ flex: 1 }}>
            Remaining
          </T>
          <View style={st.bolt}>
            <AppIcon name="boost" height={20} />
          </View>
        </View>
        <T v="caption" color={colors.grey700} style={{ marginTop: 12 }}>
          Boosts remaining: {boosts}
        </T>
      </Screen>
    );

  return (
    <Screen
      scroll
      footer={
        <>
          {boosts > 0 ? (
            <Button
              title={`Use a Boost now (${boosts} left)`}
              onPress={async () => {
                try {
                  const ends = await activateBoost();
                  useApp.getState().set({ boostEndsAt: new Date(ends).getTime(), boosts: Math.max(0, boosts - 1), boostResultPending: true });
                  router.dismissTo({ pathname: '/(tabs)', params: { notice: 'boost' } });
                } catch {
                  useApp.getState().refreshAccount().catch(() => {});
                }
              }}
            />
          ) : null}
          <Button title="Review purchase" variant={boosts > 0 ? 'outline' : 'primary'} loading={busy} onPress={purchase} />
        </>
      }>
      <Header title="Profile Boost" />
      <T v="body" color={colors.grey700} style={{ marginTop: 24 }}>
        {"Mirror will consider your profile more often for people you're already compatible with."}
      </T>
      <View style={{ gap: 12, marginTop: 24 }}>
        {PACKS.map((n) => {
          const on = pack === n;
          return (
            <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setPack(n)} style={[st.pack, on && { backgroundColor: colors.secondary }]}>
              <RadioDot on={on} />
              <View style={{ flex: 1 }}>
                <T v="bodyM">
                  {n} Boost{n > 1 ? 's' : ''}
                </T>
                <T v="caption" color={colors.grey600} style={{ fontSize: 10, lineHeight: 14 }}>
                  30 min each
                </T>
              </View>
              <T v="bodyM">{storePrices[n] ?? money(PRICES.boosts[n] * discount)}</T>
            </Pressable>
          );
        })}
      </View>
      {plan !== 'free' ? (
        <Row style={{ marginTop: 10 }}>
          <Badge kind={plan === 'plus' ? 'plus' : 'premium'} small />
          <T v="caption" color={colors.grey700}>
            Member pricing applied
          </T>
        </Row>
      ) : null}
      <View style={st.info}>
        <Row gap={8}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="check" size={10} color={colors.white} />
          </View>
          <T v="body">More visibility, Same standards.</T>
        </Row>
        <T v="caption" style={{ marginTop: 12, fontSize: 12 }}>
          Boost never overrides your
        </T>
        <View style={{ marginTop: 12, gap: 6, paddingLeft: 16 }}>
          {NEVER.map((n) => (
            <T key={n} v="caption" style={{ fontSize: 12 }}>
              — {n}
            </T>
          ))}
        </View>
      </View>
      <T v="body" style={{ marginTop: 16 }}>
        One-time purchase. Not a subscription.
      </T>
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900 },
  pack: { minHeight: 66, borderRadius: 16, backgroundColor: colors.base, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  info: { marginTop: 12, backgroundColor: colors.base, borderRadius: 16, padding: 16 },
  timer: { marginTop: 20, minHeight: 66, borderRadius: 12, backgroundColor: colors.secondary, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  clock: { fontFamily: fonts.heading, fontSize: 20, color: colors.grey900, fontVariant: ['tabular-nums'] },
  bolt: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
