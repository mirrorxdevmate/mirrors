// Applies purchases and subscription changes to the caller's profile.
// TEMPORARY: until RevenueCat is connected this trusts the client (MOCK_PAYMENTS, on by default).
// For release set MOCK_PAYMENTS=false and grant entitlements from the RevenueCat webhook instead.
import { admin, caller, cors, json } from '../_shared/auth.ts';

const PRICES: Record<string, Record<string, number>> = {
  plus: { monthly: 29.99, quarterly: 74.99, annual: 239.99 },
  premium: { monthly: 49.99, quarterly: 124.99, annual: 399.99 },
};
const BOOSTS: Record<number, number> = { 1: 4.99, 3: 11.99, 5: 17.99 };
const MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, annual: 12 };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await caller(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  const db = admin();

  if (body.action === 'cancel' || body.action === 'resume') {
    await db.from('profiles').update({ plan_cancelled: body.action === 'cancel' }).eq('id', user.id);
    return json({ ok: true });
  }
  if (body.action === 'payment_method') {
    await db.from('profiles').update({ payment_method: String(body.method ?? '').slice(0, 60) }).eq('id', user.id);
    return json({ ok: true });
  }

  if (Deno.env.get('MOCK_PAYMENTS') === 'false') return json({ error: 'use_store_billing' }, 400);
  const method = String(body.method ?? '');
  if (method.endsWith('0002')) return json({ error: 'declined' }, 402);

  if (body.kind === 'plan') {
    const price = PRICES[body.plan]?.[body.billing];
    if (!price) return json({ error: 'bad_plan' }, 400);
    const renews = new Date();
    renews.setMonth(renews.getMonth() + MONTHS[body.billing]);
    await db.from('profiles').update({
      plan: body.plan, billing: body.billing, plan_renews_at: renews.toISOString(), plan_cancelled: false, payment_method: method,
    }).eq('id', user.id);
    await db.from('purchases').insert({ user_id: user.id, product: `${body.plan}_${body.billing}`, amount: price, provider: 'mock' });
    return json({ ok: true, renewsAt: renews.toISOString() });
  }

  if (body.kind === 'boost') {
    const count = Number(body.count);
    if (!BOOSTS[count]) return json({ error: 'bad_pack' }, 400);
    const { data: p } = await db.from('profiles').select('boosts').eq('id', user.id).single();
    await db.from('profiles').update({ boosts: (p?.boosts ?? 0) + count }).eq('id', user.id);
    await db.from('purchases').insert({ user_id: user.id, product: `boost_${count}`, amount: BOOSTS[count], provider: 'mock' });
    return json({ ok: true });
  }
  return json({ error: 'bad_request' }, 400);
});
