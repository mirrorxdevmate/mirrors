import { Platform } from 'react-native';
import { create } from 'zustand';

import { PRICES } from '@/services/api';
import { useApp, type Billing, type Plan } from './useApp';

export type CheckoutItem = { kind: 'plan'; plan: Exclude<Plan, 'free'>; billing: Billing } | { kind: 'boost'; count: number };

/** In-memory state for one purchase (plan or boost) as it moves through payment → review → processing. */
export const useCheckout = create<{
  item: CheckoutItem | null;
  method: string;
  then: string | null;
  set: (p: Partial<{ item: CheckoutItem | null; method: string; then: string | null }>) => void;
}>((set) => ({
  item: null,
  method: Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay',
  then: null,
  set: (p) => set(p),
}));

export const PLAN_LABEL = { plus: 'Mirror+', premium: 'Premium' } as const;
export const BILLING_LABEL: Record<Billing, string> = { monthly: 'Monthly', quarterly: '3 months', annual: 'Annual' };
export const MONTHS: Record<Billing, number> = { monthly: 1, quarterly: 3, annual: 12 };

/** Members get Boosts cheaper: Mirror+ 10% off, Premium 20% off. */
export const boostDiscount = (plan: Plan) => (plan === 'premium' ? 0.8 : plan === 'plus' ? 0.9 : 1);

export function priceOf(item: CheckoutItem) {
  return item.kind === 'plan' ? PRICES[item.plan][item.billing] : PRICES.boosts[item.count] * boostDiscount(useApp.getState().plan);
}
export function describe(item: CheckoutItem) {
  return item.kind === 'plan' ? `${PLAN_LABEL[item.plan]} · ${BILLING_LABEL[item.billing]}` : `${item.count} Boost${item.count > 1 ? 's' : ''}`;
}
export const money = (n: number) => `$${n.toFixed(2)}`;

export const FEATURES = {
  plus: ['Faster refresh', 'Larger curated batches', 'Advanced Type Controls', 'Global Discovery', "See Who's Interested", 'Rewind access'],
  premium: ['Everything in Mirror+', 'Even faster refresh', 'Deeper Why You Two?', 'Your Pattern+', 'Travel Mode · Incognito', 'Generous Rewind access'],
};
