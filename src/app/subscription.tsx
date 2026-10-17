import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { Dialog, Sheet } from '@/components/overlays';
import { Banner, Button, Card, Header, ListRow, Row, Screen, T } from '@/components/ui';
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
        <Header title="Manage Subscription" />
        <T v="body" color={colors.grey700}>
          You&apos;re on the Free plan.
        </T>
        <Button title="See plans" style={{ marginTop: 16 }} onPress={() => router.replace('/upgrade')} />
      </Screen>
    );

  const label = PLAN_LABEL[s.plan];
  const price = PRICES[s.plan][s.billing];
  const until = fmtDate(s.renewsAt);

  return (
    <Screen scroll>
      <Header title="Manage Subscription" />
      {s.cancelled ? <Banner text={`You'll keep ${label} until ${until}, then move back to the free plan.`} /> : null}
      <Card style={{ paddingVertical: 0 }}>
        <ListRow label="Current plan" value={label} />
        <ListRow label="Billing cycle" value={store ? BILLING_LABEL[s.billing] : `${BILLING_LABEL[s.billing]} · ${money(price)}`} />
        <ListRow label={s.cancelled ? 'Ends on' : 'Next renewal'} value={until} />
        <ListRow label="Payment method" value={s.paymentMethod} last />
      </Card>
      <Card style={{ paddingVertical: 0, marginTop: 12 }}>
        <ListRow label="Change plan" onPress={() => router.push('/upgrade/plans')} />
        <ListRow
          label="Update payment method"
          onPress={() => {
            if (store) return manageSubscription(); // the store owns the payment method
            useCheckout.getState().set({ method: s.paymentMethod });
            router.push({ pathname: '/upgrade/payment', params: { update: '1' } });
          }}
        />
        <ListRow label="Billing history" onPress={() => setHistory(true)} />
        <ListRow
          label={restoring ? 'Restoring…' : 'Restore purchases'}
          last
          onPress={async () => {
            setRestoring(true);
            await (store || billingEnabledHere ? restore() : restorePurchases()).catch(() => {});
            await s.refreshAccount().catch(() => {});
            setRestoring(false);
            Alert.alert('Purchases restored', 'Your subscription is up to date.');
          }}
        />
      </Card>
      {s.cancelled ? (
        <Button
          title={`Resume ${label}`}
          style={{ marginTop: 20 }}
          onPress={async () => {
            if (store) return manageSubscription();
            await setSubscriptionCancelled(false).catch(() => {});
            s.refreshAccount();
          }}
        />
      ) : (
        <>
          <Button title="Cancel subscription" variant="outline" style={{ marginTop: 20 }} onPress={() => (store ? manageSubscription() : setCancel(true))} />
          <T v="caption" color={colors.grey600} center style={{ marginTop: 8 }}>
            Cancelling keeps your {label} features until {until}. Nothing is deleted.
          </T>
        </>
      )}
      <Dialog
        visible={cancel}
        title={`Cancel ${label}?`}
        message={`You'll keep ${label} until ${until}, then move back to the free plan. You won't be charged again.`}
        primary={{ label: `Keep ${label}`, onPress: () => setCancel(false) }}
        secondary={{
          label: 'Cancel subscription',
          onPress: () => {
            setSubscriptionCancelled(true).then(() => s.refreshAccount()).catch(() => {});
            setCancel(false);
          },
        }}
        onClose={() => setCancel(false)}
      />
      <Sheet visible={history} onClose={() => setHistory(false)} title="Billing history">
        <Row style={{ paddingVertical: 12 }}>
          <T v="body" style={{ flex: 1 }}>
            {label} · {BILLING_LABEL[s.billing]}
          </T>
          <T v="bodyM">{money(price * (1 + PRICES.vat))}</T>
        </Row>
        <T v="caption" color={colors.grey600}>
          Receipts are also sent to your account email.
        </T>
      </Sheet>
    </Screen>
  );
}
