import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { RadioDot } from '@/components/icons';
import { Button, Header, Screen, T } from '@/components/ui';
import { setPaymentMethod } from '@/services/api';
import { describe, money, priceOf, useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors } from '@/theme';

export default function PaymentMethod() {
  const { update } = useLocalSearchParams<{ update?: string }>();
  const item = useCheckout((s) => s.item);
  const method = useCheckout((s) => s.method);
  const setCheckout = useCheckout((s) => s.set);
  const cards = useApp((s) => s.cards);

  const options = [
    { id: 'Apple Pay', label: 'Apple Pay', icon: <FontAwesome5 name="apple-pay" size={20} color={colors.grey900} /> },
    { id: 'Google Pay', label: 'Google Pay', icon: <FontAwesome5 name="google-pay" size={20} color={colors.grey900} /> },
    ...cards.map((c) => ({
      id: `${c.brand} •••• ${c.last4}`,
      label: `${c.brand} •••• ${c.last4}`,
      sub: `Saved · expires ${c.exp}`,
      icon: c.brand === 'Visa' ? <FontAwesome5 name="cc-visa" size={20} color="#1A1F71" /> : <Feather name="credit-card" size={18} color={colors.grey900} />,
    })),
    { id: 'card', label: 'Credit / debit card', icon: <Feather name="credit-card" size={16} color={colors.grey900} /> },
    { id: 'Crypto', label: 'Crypto', sub: 'USDC · USDT · BTC · ETH', icon: <FontAwesome5 name="bitcoin" size={16} color={colors.amber} /> },
  ];

  return (
    <Screen
      scroll
      footer={
        <Button
          title={update ? 'Save' : 'Continue'}
          onPress={() => {
            if (update) {
              useApp.getState().set({ paymentMethod: method });
              setPaymentMethod(method).catch(() => {});
              router.back();
            } else router.push('/upgrade/review');
          }}
        />
      }>
      <Header title="Payment method" />
      {item && !update ? (
        <T v="body" color={colors.grey700} style={{ marginTop: 16 }}>
          {describe(item)} · {money(priceOf(item))}
        </T>
      ) : null}
      <View style={st.group}>
        {options.map((o, i) => {
          const on = method === o.id;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => (o.id === 'card' ? router.push({ pathname: '/upgrade/add-card', params: update ? { update } : {} }) : setCheckout({ method: o.id }))}
              style={[st.row, i < options.length - 1 && st.sep, on && { backgroundColor: colors.secondary }]}>
              <RadioDot on={on} />
              <View style={{ width: 24, alignItems: 'center' }}>{o.icon}</View>
              <View style={{ flex: 1 }}>
                <T v="body">{o.label}</T>
                {'sub' in o && o.sub ? (
                  <T v="caption" color={colors.grey600} style={{ fontSize: 10, lineHeight: 14 }}>
                    {o.sub}
                  </T>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <T v="body" color={colors.grey700} style={{ marginTop: 16, paddingHorizontal: 16 }}>
        Crypto payments are one-time. Subscriptions paid in crypto do not auto-renew — we&apos;ll remind you before it ends.
      </T>
    </Screen>
  );
}

const st = StyleSheet.create({
  group: { marginTop: 16, backgroundColor: colors.base, borderRadius: 16, overflow: 'hidden' },
  row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  sep: { borderBottomWidth: 1, borderBottomColor: colors.grey400 },
});
