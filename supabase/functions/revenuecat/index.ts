// Applies App Store / Google Play purchases (via RevenueCat) to profiles.
//  • RevenueCat webhook: POST with `Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH>` → syncs event.app_user_id
//  • The app: POST { action: 'sync' } with the user's JWT → syncs the caller
// Secrets: REVENUECAT_SECRET_KEY (RevenueCat → API keys → secret, v1), REVENUECAT_WEBHOOK_AUTH (any long random string).
import { admin, caller, cors, json } from '../_shared/auth.ts';

const BOOST = /^mirror_boost_(\d+)$/;
const PRICES: Record<string, number> = {}; // amounts are informational; the stores are the source of truth

async function sync(userId: string) {
  const key = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!key) throw new Error('REVENUECAT_SECRET_KEY not set');
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`revenuecat ${res.status}`);
  const { subscriber } = await res.json();
  const now = Date.now();
  const active = (e?: { expires_date: string | null }) => !!e && (!e.expires_date || Date.parse(e.expires_date) > now);
  const ents = subscriber?.entitlements ?? {};
  const plan = active(ents.premium) ? 'premium' : active(ents.plus) ? 'plus' : 'free';
  const ent = plan === 'premium' ? ents.premium : plan === 'plus' ? ents.plus : null;
  const productId: string = ent?.product_identifier ?? '';
  const sub = productId ? subscriber.subscriptions?.[productId] ?? subscriber.subscriptions?.[productId.split(':')[0]] : null;
  const billing = /annual/.test(productId) ? 'annual' : /quarter/.test(productId) ? 'quarterly' : 'monthly';
  const store = sub?.store === 'play_store' ? 'Google Play' : sub?.store === 'app_store' ? 'App Store' : '';

  const db = admin();
  const update: Record<string, unknown> = { plan };
  if (plan !== 'free') {
    Object.assign(update, {
      billing,
      plan_renews_at: ent?.expires_date ?? null,
      plan_cancelled: !!(sub?.unsubscribe_detected_at || sub?.billing_issues_detected_at),
      payment_method: store,
    });
  }
  await db.from('profiles').update(update).eq('id', userId);

  // Consumable boosts: credit each store transaction exactly once.
  let added = 0;
  for (const [pid, txs] of Object.entries(subscriber?.non_subscriptions ?? {}) as [string, { id: string }[]][]) {
    const m = pid.match(BOOST);
    if (!m) continue;
    for (const tx of txs) {
      const { error } = await db.from('purchases').insert({
        user_id: userId, product: pid, amount: PRICES[pid] ?? 0, provider: 'revenuecat', external_id: tx.id,
      });
      if (!error) added += Number(m[1]); // unique (provider, external_id) rejects duplicates
    }
  }
  if (added) {
    const { data } = await db.from('profiles').select('boosts').eq('id', userId).single();
    await db.from('profiles').update({ boosts: (data?.boosts ?? 0) + added }).eq('id', userId);
  }
  return { plan, boostsAdded: added };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const hook = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
    if (hook && req.headers.get('Authorization') === `Bearer ${hook}`) {
      const { event } = await req.json();
      const ids = [event?.app_user_id, ...(event?.transferred_to ?? [])].filter((x: string) => x && !x.startsWith('$RCAnonymousID'));
      for (const id of ids) await sync(id);
      return json({ ok: true });
    }
    const user = await caller(req);
    if (!user) return json({ error: 'unauthorized' }, 401);
    return json(await sync(user.id));
  } catch (e) {
    console.error(e);
    return json({ error: String(e instanceof Error ? e.message : e) }, 500);
  }
});
