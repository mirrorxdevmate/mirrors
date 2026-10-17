// Records a photo / ID verification upload. Status stays "pending" until reviewed
// (or a vendor such as Persona calls back). VERIFICATION_AUTO_APPROVE=true approves instantly (testing only).
import { admin, caller, cors, json } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await caller(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const { kind, path } = await req.json().catch(() => ({}));
  if (!['photo', 'identity'].includes(kind) || typeof path !== 'string' || !path.startsWith(`${user.id}/`)) {
    return json({ error: 'bad_request' }, 400);
  }
  const status = Deno.env.get('VERIFICATION_AUTO_APPROVE') === 'true' ? 'verified' : 'pending';
  const db = admin();
  await db.from('verifications').insert({ user_id: user.id, kind, path, status, reviewed_at: status === 'verified' ? new Date().toISOString() : null });
  await db.from('profiles').update(kind === 'photo' ? { photo_status: status } : { id_status: status }).eq('id', user.id);
  return json({ status });
});
