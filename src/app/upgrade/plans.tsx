import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Header, LinkButton, Row, Screen, Segmented, T } from '@/components/ui';
import { billingEnabled, buy, loadProducts, productId } from '@/lib/billing';
import { PRICES } from '@/services/api';
import { FEATURES, MONTHS, money, useCheckout } from '@/store/checkout';
import { useApp, type Billing } from '@/store/useApp';
import { colors, fonts } from '@/theme';

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
      <Header title="Upgrade" big={false} />
      <Text style={st.h1}>Choose your plan</Text>
      <T v="body" color={colors.grey700} style={{ marginTop: 16, marginBottom: 16 }}>
        Cancel anytime. No hidden charges.
      </T>
      <Segmented
        compact
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
            style={[st.card, on && { backgroundColor: colors.secondary }]}>
            <Row>
              <Text style={[st.cardTitle, { flex: 1 }]}>{k === 'plus' ? 'Mirror+' : 'Premium'}</Text>
              {current === k ? (
                <T v="captionM" color={colors.primary}>
                  Current
                </T>
              ) : on ? (
                <View style={st.checkOn}>
                  <Feather name="check" size={10} color={colors.white} />
                </View>
              ) : (
                <Feather name="check-circle" size={16} color={colors.grey800} />
              )}
            </Row>
            <T v="bodyL" color={colors.grey800} style={{ marginTop: 16, lineHeight: 20 }}>
              {storePrices[productId.plan(k, billing)] ? `${storePrices[productId.plan(k, billing)]} / ${billing === 'monthly' ? 'month' : billing === 'annual' ? 'year' : '3 months'}` : `${money(per)} / month`}
            </T>
            {billing !== 'monthly' && !storePrices[productId.plan(k, billing)] ? (
              <T v="caption" color={colors.grey600}>
                {money(total)} billed every {billing === 'annual' ? '12 months' : '3 months'}
              </T>
            ) : null}
            <View style={{ marginTop: 16 }}>
              {FEATURES[k].map((f) => (
                <T key={f} v="bodyL" color={colors.grey800} style={{ lineHeight: 24 }}>
                  {'  •  — '}
                  {f}
                </T>
              ))}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  h1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 28, color: colors.grey900, marginTop: 16 },
  card: { backgroundColor: colors.base, borderRadius: 16, padding: 16, paddingTop: 20, paddingBottom: 20, marginBottom: 16 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, color: colors.grey900 },
  checkOn: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
