import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, Header, Row, Screen, T } from '@/components/ui';
import { PRICES } from '@/services/api';
import { BILLING_LABEL, MONTHS, PLAN_LABEL, money, priceOf, useCheckout } from '@/store/checkout';
import { colors } from '@/theme';
import { fmtDate } from '@/utils/date';

export default function ReviewPurchase() {
  const item = useCheckout((s) => s.item);
  const method = useCheckout((s) => s.method);
  if (!item) return null;
  const subtotal = priceOf(item);
  const vat = subtotal * PRICES.vat;
  const renew = new Date();
  if (item.kind === 'plan') renew.setMonth(renew.getMonth() + MONTHS[item.billing]);
  const crypto = method === 'Crypto';

  const rows: [string, string][] =
    item.kind === 'plan'
      ? [
          ['Plan', PLAN_LABEL[item.plan]],
          ['Billing period', BILLING_LABEL[item.billing]],
        ]
      : [['Item', `${item.count} Profile Boost${item.count > 1 ? 's' : ''}`]];

  return (
    <Screen
      scroll
      footer={
        <>
          <Button title="Confirm & Pay" onPress={() => router.replace('/upgrade/processing')} />
          <T v="caption" color={colors.grey600} center style={{ marginTop: 6 }}>
            {item.kind === 'plan' ? 'Manage or cancel anytime in Settings.' : 'One-time purchase. Not a subscription.'}
          </T>
        </>
      }>
      <Header title="Review purchase" />
      <Card style={{ gap: 12 }}>
        {rows.map(([k, v]) => (
          <Line key={k} k={k} v={v} />
        ))}
        <View style={{ height: 1, backgroundColor: colors.grey300 }} />
        <Line k="Subtotal" v={money(subtotal)} />
        <Line k={`VAT (${PRICES.vat * 100}%)`} v={money(vat)} />
        <Line k="Total" v={money(subtotal + vat)} bold />
        <View style={{ height: 1, backgroundColor: colors.grey300 }} />
        {item.kind === 'plan' ? <Line k={crypto ? 'Ends on' : 'Renews on'} v={fmtDate(renew.getTime())} /> : null}
        <Line k="Payment method" v={method} onPress={() => router.push('/upgrade/payment')} />
      </Card>
      {item.kind === 'plan' ? (
        <T v="caption" color={colors.grey700} style={{ marginTop: 12 }}>
          {crypto
            ? "Crypto payments are one-time and don't auto-renew. We'll remind you before your plan ends."
            : 'Your subscription renews automatically unless cancelled before the next billing date.'}
        </T>
      ) : null}
    </Screen>
  );
}

function Line({ k, v, bold, onPress }: { k: string; v: string; bold?: boolean; onPress?: () => void }) {
  return (
    <Row>
      <T v={bold ? 'bodyS' : 'body'} color={bold ? colors.grey900 : colors.grey700} style={{ flex: 1 }}>
        {k}
      </T>
      <T v={bold ? 'bodyS' : 'bodyM'} onPress={onPress} style={onPress ? { textDecorationLine: 'underline' } : undefined}>
        {v}
      </T>
    </Row>
  );
}
