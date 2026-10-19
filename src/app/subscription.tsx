import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ChevronLeft } from '@/components/icons';
import { Sheet } from '@/components/overlays';
import { Button, Header, Row, Screen, T } from '@/components/ui';
import { billingEnabled, manageSubscription, restore } from '@/lib/billing';
import { PRICES, restorePurchases, setSubscriptionCancelled } from '@/services/api';
import { BILLING_LABEL, PLAN_LABEL, money, useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';
import { fmtDate } from '@/utils/date';

export default function ManageSubscription() {
  const s = useApp();
  const [cancel, setCancel] = useState(false);
  // Store subscriptions (App Store / Google Play) are cancelled and paid for in the store itself.
  const store = s.paymentMethod === 'App Store' || s.paymentMethod === 'Google Play';
  const billingEnabledHere = billingEnabled;
  const [history, setHistory] = useState(false);
  const [restoring, setRestoring] = useState(false);

  if (s.plan === 'free')
    return (
      <Screen>
        <Header title="Manage Subscription" spaced />
        <T v="body" color={colors.grey700}>
          You&apos;re on the Free plan.
        </T>
        <Button title="See plans" style={{ marginTop: 16 }} onPress={() => router.replace('/upgrade')} />
      </Screen>
    );

  const label = PLAN_LABEL[s.plan];
  const price = PRICES[s.plan][s.billing];
  const until = fmtDate(s.renewsAt);

  const actions = [
    { label: 'Change plan', onPress: () => router.push('/upgrade/plans') },
    {
      label: 'Update payment method',
      onPress: () => {
        if (store) return manageSubscription(); // the store owns the payment method
        useCheckout.getState().set({ method: s.paymentMethod });
        router.push({ pathname: '/upgrade/payment', params: { update: '1' } });
      },
    },
    { label: 'Billing history', onPress: () => setHistory(true) },
    {
      label: restoring ? 'Restoring…' : 'Restore purchases',
      onPress: async () => {
        setRestoring(true);
        await (store || billingEnabledHere ? restore() : restorePurchases()).catch(() => {});
        await s.refreshAccount().catch(() => {});
        setRestoring(false);
        Alert.alert('Purchases restored', 'Your subscription is up to date.');
      },
    },
    s.cancelled
      ? {
          label: `Resume ${label}`,
          onPress: async () => {
            if (store) return manageSubscription();
            await setSubscriptionCancelled(false).catch(() => {});
            s.refreshAccount();
          },
        }
      : { label: 'Cancel subscription', onPress: () => (store ? manageSubscription() : setCancel(true)) },
  ];

  return (
    <Screen scroll>
      <Header title="Manage Subscription" spaced />
      <View style={st.card}>
        <Info k="Current plan" v={label} />
        <Info k="Billing cycle" v={store ? BILLING_LABEL[s.billing] : `${BILLING_LABEL[s.billing]} · ${money(price)}`} />
        <Info k={s.cancelled ? 'Ends on' : 'Next renewal'} v={until} />
        <Info k="Payment method" v={s.paymentMethod || '—'} />
      </View>
      <View style={[st.card, { marginTop: 16, paddingVertical: 8 }]}>
        {actions.map((a, i) => (
          <Pressable key={a.label} accessibilityRole="button" onPress={a.onPress} style={({ pressed }) => [st.action, i < actions.length - 1 && st.sep, pressed && { opacity: 0.6 }]}>
            <T v="caption" color={colors.grey700} style={{ flex: 1, fontSize: 12 }}>
              {a.label}
            </T>
            <View style={{ transform: [{ scaleX: -1 }] }}>
              <ChevronLeft />
            </View>
          </Pressable>
        ))}
      </View>
      <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
        {s.cancelled ? `You'll keep ${label} until ${until}, then move back to the free plan.` : `Cancelling keeps your ${label} features until ${until}. Nothing is deleted.`}
      </T>
      <Sheet visible={cancel} onClose={() => setCancel(false)} title={`Cancel ${label}?`}>
        <T v="body" color={colors.grey700}>
          {`You'll keep ${label} until ${until}, then move back to the free plan. You won't be charged again.`}
        </T>
        <View style={{ gap: 14, marginTop: 50, marginBottom: 8 }}>
          <Button
            title="Cancel subscription"
            variant="outline"
            onPress={() => {
              setSubscriptionCancelled(true).then(() => s.refreshAccount()).catch(() => {});
              setCancel(false);
            }}
          />
          <Button title={`Keep ${label}`} onPress={() => setCancel(false)} />
        </View>
      </Sheet>
      <Sheet visible={history} onClose={() => setHistory(false)} title="Billing history">
        <Row style={{ paddingVertical: 12 }}>
          <T v="body" style={{ flex: 1 }}>
            {label} · {BILLING_LABEL[s.billing]}
          </T>
          <T v="bodyM">{money(price * (1 + PRICES.vat))}</T>
        </Row>
        <T v="caption" color={colors.grey600} style={{ marginBottom: 12 }}>
          Receipts are also sent to your account email.
        </T>
      </Sheet>
    </Screen>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <Row style={{ minHeight: 23 }}>
      <T v="caption" color={colors.grey700} style={{ flex: 1, fontSize: 12 }}>
        {k}
      </T>
      <T v="body">{v}</T>
    </Row>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  action: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  sep: { borderBottomWidth: 1, borderBottomColor: colors.grey400 },
});
