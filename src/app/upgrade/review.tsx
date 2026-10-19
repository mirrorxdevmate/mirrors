import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Header, Row, Screen, T } from '@/components/ui';
import { PRICES } from '@/services/api';
import { BILLING_LABEL, MONTHS, PLAN_LABEL, money, priceOf, useCheckout } from '@/store/checkout';
import { colors, fonts } from '@/theme';
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
          <T v="body" color={colors.grey700} center>
            {item.kind === 'plan' ? 'Manage or cancel anytime in Settings.' : 'One-time purchase. Not a subscription.'}
          </T>
        </>
      }>
      <Header title="Review purchase" />
      <View style={[st.card, { marginTop: 24 }]}>
        {rows.map(([k, v]) => (
          <Line key={k} k={k} v={v} />
        ))}
        <View style={st.rule} />
        <Line k="Subtotal" v={money(subtotal)} />
        <Line k={`VAT (${PRICES.vat * 100}%)`} v={money(vat)} />
        <View style={st.rule} />
        <Line k="Total" v={money(subtotal + vat)} bold />
      </View>
      <View style={[st.card, { marginTop: 16 }]}>
        {item.kind === 'plan' ? <Line k={crypto ? 'Ends on' : 'Renews on'} v={fmtDate(renew.getTime())} /> : null}
        <Line k="Payment method" v={method} onPress={() => router.push('/upgrade/payment')} />
      </View>
      {item.kind === 'plan' ? (
        <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
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
    <Row style={{ minHeight: 24 }}>
      <Text style={[st.k, bold && st.bold]}>{k}</Text>
      <Text style={[st.v, bold && st.bold, onPress && { textDecorationLine: 'underline' }]} onPress={onPress}>
        {v}
      </Text>
    </Row>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: colors.base, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  rule: { height: 1, backgroundColor: colors.grey400, marginVertical: 8 },
  k: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 20, color: colors.grey700 },
  v: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.grey900 },
  bold: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.grey900 },
});
