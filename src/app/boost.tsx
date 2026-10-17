import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Badge, Button, Card, Header, Row, Screen, T, Title } from '@/components/ui';
import { billingEnabled, buy, loadProducts, productId } from '@/lib/billing';
import { activateBoost, PRICES } from '@/services/api';
import { boostDiscount, money, useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';
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
        <Header title="Profile Boost" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="lightning-bolt" size={48} color={colors.primary} />
          </View>
          <T v="h2" center style={{ marginTop: 20 }}>
            You&apos;re in the spotlight
          </T>
          <T v="body" center color={colors.grey700} style={{ marginTop: 8 }}>
            Your Boost is active. More compatible people can discover your profile right now.
          </T>
          <T v="h1" style={{ marginTop: 24, fontVariant: ['tabular-nums'] }}>
            {countdown(endsAt! - now).clock}
          </T>
          <T v="caption" color={colors.grey600}>
            Remaining
          </T>
          <T v="caption" color={colors.grey600} style={{ marginTop: 16 }}>
            Boosts remaining: {boosts}
          </T>
        </View>
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
          <Button
            title="Review purchase"
            variant={boosts > 0 ? 'secondary' : 'primary'}
            loading={busy}
            onPress={purchase}
          />
          <T v="caption" color={colors.grey600} center style={{ marginTop: 4 }}>
            One-time purchase. Not a subscription.
          </T>
        </>
      }>
      <Header title="Profile Boost" />
      <Title sub="Mirror will consider your profile more often for people you're already compatible with.">{'Be seen by the right people'}</Title>
      <Row gap={10}>
        {PACKS.map((n) => {
          const on = pack === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setPack(n)}
              style={{ flex: 1, padding: 14, borderRadius: radius.md, backgroundColor: on ? colors.secondary : colors.base, borderWidth: on ? 1.5 : 0, borderColor: colors.primary, alignItems: 'center' }}>
              <T v="h3">{n}</T>
              <T v="caption" color={colors.grey700}>
                Boost{n > 1 ? 's' : ''}
              </T>
              <T v="bodyS" style={{ marginTop: 8 }}>
                {storePrices[n] ?? money(PRICES.boosts[n] * discount)}
              </T>
              <T v="caption" color={colors.grey600}>
                30 min each
              </T>
            </Pressable>
          );
        })}
      </Row>
      {plan !== 'free' ? (
        <Row style={{ marginTop: 10 }}>
          <Badge kind={plan === 'plus' ? 'plus' : 'premium'} />
          <T v="caption" color={colors.grey700}>
            Member pricing applied
          </T>
        </Row>
      ) : null}
      <Card style={{ marginTop: 16 }}>
        <T v="bodyS">More visibility, same standards.</T>
        <T v="body" color={colors.grey700} style={{ marginTop: 6 }}>
          Boost never overrides your:
        </T>
        {NEVER.map((n) => (
          <T key={n} v="body" color={colors.grey800} style={{ marginTop: 2 }}>
            — {n}
          </T>
        ))}
      </Card>
    </Screen>
  );
}
