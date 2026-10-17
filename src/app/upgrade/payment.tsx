import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import { Button, Header, Row, Screen, T } from '@/components/ui';
import { setPaymentMethod } from '@/services/api';
import { describe, money, priceOf, useCheckout } from '@/store/checkout';
import { useApp } from '@/store/useApp';
import { colors, radius } from '@/theme';

export default function PaymentMethod() {
  const { update } = useLocalSearchParams<{ update?: string }>();
  const item = useCheckout((s) => s.item);
  const method = useCheckout((s) => s.method);
  const setCheckout = useCheckout((s) => s.set);
  const cards = useApp((s) => s.cards);

  const wallet = Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay';
  const options = [
    { id: wallet, label: wallet, icon: <FontAwesome5 name={Platform.OS === 'android' ? 'google-pay' : 'apple-pay'} size={22} color={colors.grey900} /> },
    ...cards.map((c) => ({ id: `${c.brand} •••• ${c.last4}`, label: `${c.brand} •••• ${c.last4}`, sub: `Saved · expires ${c.exp}`, icon: <Feather name="credit-card" size={18} color={colors.grey900} /> })),
    { id: 'Crypto', label: 'Crypto', sub: 'USDC · USDT · BTC · ETH', icon: <FontAwesome5 name="bitcoin" size={18} color={colors.grey900} /> },
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
        <T v="bodyM" color={colors.grey700} style={{ marginBottom: 16 }}>
          {describe(item)} · {money(priceOf(item))}
        </T>
      ) : null}
      {options.map((o) => {
        const on = method === o.id;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => setCheckout({ method: o.id })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md, marginBottom: 10, backgroundColor: on ? colors.secondary : colors.base, borderWidth: on ? 1.5 : 0, borderColor: colors.primary }}>
            <View style={{ width: 28, alignItems: 'center' }}>{o.icon}</View>
            <View style={{ flex: 1 }}>
              <T v="bodyM">{o.label}</T>
              {'sub' in o && o.sub ? (
                <T v="caption" color={colors.grey600}>
                  {o.sub}
                </T>
              ) : null}
            </View>
            <Feather name={on ? 'check-circle' : 'circle'} size={20} color={on ? colors.primary : colors.grey500} />
          </Pressable>
        );
      })}
      <Pressable onPress={() => router.push({ pathname: '/upgrade/add-card', params: update ? { update } : {} })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.grey400 }}>
        <Feather name="plus" size={18} color={colors.grey900} />
        <T v="bodyM">Credit / debit card</T>
      </Pressable>
      {method === 'Crypto' ? (
        <Row style={{ marginTop: 14, alignItems: 'flex-start' }}>
          <Feather name="info" size={14} color={colors.grey600} style={{ marginTop: 2 }} />
          <T v="caption" color={colors.grey700} style={{ flex: 1 }}>
            Crypto payments are one-time. Subscriptions paid in crypto do not auto-renew — we&apos;ll remind you before it ends.
          </T>
        </Row>
      ) : null}
    </Screen>
  );
}
