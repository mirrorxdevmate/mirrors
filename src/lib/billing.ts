/**
 * In-app purchases through RevenueCat (App Store / Google Play billing — required by both stores for
 * digital goods). Prices come from the stores, so they're set in App Store Connect / Play Console.
 *
 * Product IDs to create in both stores (and attach to RevenueCat entitlements "plus" / "premium"):
 *   mirror_plus_monthly · mirror_plus_quarterly · mirror_plus_annual
 *   mirror_premium_monthly · mirror_premium_quarterly · mirror_premium_annual
 *   mirror_boost_1 · mirror_boost_3 · mirror_boost_5   (consumables)
 */
import { Platform } from 'react-native';
import Purchases, { PURCHASES_ERROR_CODE, type PurchasesStoreProduct } from 'react-native-purchases';

import { supabase } from '@/lib/supabase';

const KEY = Platform.select({ ios: process.env.EXPO_PUBLIC_RC_IOS_KEY, android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY }) ?? '';

/** True when real store billing is set up for this platform; otherwise the app uses the test checkout. */
export const billingEnabled = Platform.OS !== 'web' && KEY.length > 0;

export const productId = {
  plan: (plan: 'plus' | 'premium', billing: 'monthly' | 'quarterly' | 'annual') => `mirror_${plan}_${billing}`,
  boost: (count: number) => `mirror_boost_${count}`,
};

let configuredFor: string | null = null;

/** Call after sign-in so purchases are tied to the Supabase user id. */
export async function initBilling(userId: string) {
  if (!billingEnabled || configuredFor === userId) return;
  if (!configuredFor) Purchases.configure({ apiKey: KEY, appUserID: userId });
  else await Purchases.logIn(userId);
  configuredFor = userId;
}

const cache = new Map<string, PurchasesStoreProduct>();

export async function loadProducts(ids: string[]) {
  if (!billingEnabled) return {} as Record<string, PurchasesStoreProduct>;
  const missing = ids.filter((id) => !cache.has(id));
  if (missing.length) {
    const products = await Purchases.getProducts(missing).catch(() => [] as PurchasesStoreProduct[]);
    for (const p of products) cache.set(p.identifier.split(':')[0], p); // Android ids can be "id:base-plan"
  }
  return Object.fromEntries(ids.filter((id) => cache.has(id)).map((id) => [id, cache.get(id)!]));
}

/** Applies the user's store purchases on the server (plan, renewal date, boosts). */
export async function syncPurchases() {
  const { error } = await supabase.functions.invoke('revenuecat', { body: { action: 'sync' } });
  if (error) throw error;
}

/** Buys a product. Resolves 'cancelled' if the user backs out of the store sheet. */
export async function buy(id: string): Promise<'ok' | 'cancelled'> {
  const products = await loadProducts([id]);
  const product = products[id];
  if (!product) throw new Error('This item is not available in your store yet.');
  try {
    await Purchases.purchaseStoreProduct(product);
  } catch (e) {
    const err = e as { code?: string; userCancelled?: boolean | null };
    if (err.userCancelled || err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    throw e;
  }
  await syncPurchases();
  return 'ok';
}

export async function restore() {
  if (billingEnabled) await Purchases.restorePurchases();
  await syncPurchases().catch(() => {});
}

/** Opens the store's subscription management (cancel, change payment method). */
export async function manageSubscription() {
  if (billingEnabled) await Purchases.showManageSubscriptions();
}
