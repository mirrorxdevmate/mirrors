import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Header, LinkButton, Row, Screen, Segmented, T, Title } from '@/components/ui';
import { billingEnabled, buy, loadProducts, productId } from '@/lib/billing';
import { PRICES } from '@/services/api';
import { FEATURES, MONTHS, money, useCheckout } from '@/store/checkout';
import { useApp, type Billing } from '@/store/useApp';
import { colors, radius } from '@/theme';

export default function Plans() {
  const params = useLocalSearchParams<{ plan?: 'plus' | 'premium'; then?: string }>();
  const current = useApp((s) => s.plan);
  const currentBilling = useApp((s) => s.billing);
  const [billing, setBilling] = useState<Billing>('monthly');
  const [pick, setPick] = useState<'plus' | 'premium' | null>(params.plan ?? null);
  const setCheckout = useCheckout((s) => s.set);

  const [busy, setBusy] = useState(false);
  const [storePrices, setStorePrices] = useState<Record<string, string>>({});

  useEffect(() => setCheckout({ then: params.then ?? null }), [params.then, setCheckout]);

  // Real prices (local currency) from the App Store / Google Play when billing is set up.
  useEffect(() => {
    if (!billingEnabled) return;
    const ids = (['plus', 'premium'] as const).flatMap((p) => (['monthly', 'quarterly', 'annual'] as const).map((b) => productId.plan(p, b)));
    loadProducts(ids).then((ps) => setStorePrices(Object.fromEntries(Object.entries(ps).map(([id, p]) => [id, p.priceString]))));
  }, []);

  const continueToPay = async () => {
    if (!pick) return;
    setCheckout({ item: { kind: 'plan', plan: pick, billing } });
    if (!billingEnabled) return router.push('/upgrade/payment'); // test checkout (no store keys yet)
    setBusy(true);
    try {
      const r = await buy(productId.plan(pick, billing));
      if (r === 'ok') {
        await useApp.getState().refreshAccount().catch(() => {});
        router.replace('/upgrade/success');
      }
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button
            title="Continue"
            loading={busy}
            disabled={!pick || (pick === current && billing === currentBilling)}
            onPress={continueToPay}
          />
          <LinkButton title="Not now" onPress={() => router.back()} />
        </>
      }>
      <Header title="Upgrade" />
      <Title sub="Cancel anytime. No hidden charges.">Choose your plan</Title>
      <Segmented
        value={billing}
        onChange={setBilling}
        options={[
          { label: 'Monthly', value: 'monthly' },
          { label: '3 months', value: 'quarterly' },
          { label: 'Annual', value: 'annual' },
        ]}
      />
      <View style={{ height: 16 }} />
      {(['plus', 'premium'] as const).map((k) => {
        const total = PRICES[k][billing];
        const per = total / MONTHS[billing];
        const on = pick === k;
        return (
          <Pressable
            key={k}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => setPick(k)}
            style={{ backgroundColor: on ? colors.secondary : colors.base, borderRadius: radius.md, padding: 16, marginBottom: 12, borderWidth: on ? 1.5 : 0, borderColor: colors.primary }}>
            <Row>
              <T v="h3" style={{ flex: 1 }}>
                {k === 'plus' ? 'Mirror+' : 'Premium'}
              </T>
              {current === k ? (
                <T v="captionM" color={colors.primary}>
                  Current
                </T>
              ) : (
                <Feather name={on ? 'check-circle' : 'circle'} size={20} color={on ? colors.primary : colors.grey500} />
              )}
            </Row>
            <T v="bodyLM" style={{ marginTop: 6 }}>
              {storePrices[productId.plan(k, billing)] ? `${storePrices[productId.plan(k, billing)]} / ${billing === 'monthly' ? 'month' : billing === 'annual' ? 'year' : '3 months'}` : `${money(per)} / month`}
            </T>
            {billing !== 'monthly' && !storePrices[productId.plan(k, billing)] ? (
              <T v="caption" color={colors.grey600}>
                {money(total)} billed every {billing === 'annual' ? '12 months' : '3 months'}
              </T>
            ) : null}
            <View style={{ marginTop: 10, gap: 4 }}>
              {FEATURES[k].map((f) => (
                <T key={f} v="body" color={colors.grey800}>
                  — {f}
                </T>
              ))}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}
