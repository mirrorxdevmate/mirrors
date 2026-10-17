// Permanently deletes the caller: storage files, then the auth user (profile + all rows cascade).
import { admin, caller, cors, json } from '../_shared/auth.ts';

async function removeFolder(bucket: string, folder: string) {
  const db = admin();
  const { data } = await db.storage.from(bucket).list(folder, { limit: 1000 });
  if (data?.length) await db.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const user = await caller(req);
  if (!user) return json({ error: 'unauthorized' }, 401);
  const { reason = '' } = await req.json().catch(() => ({}));
  console.log('account deleted', { reason: String(reason).slice(0, 100) });
  await removeFolder('photos', user.id);
  await removeFolder('verifications', user.id);
  const { error } = await admin().auth.admin.deleteUser(user.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
});
