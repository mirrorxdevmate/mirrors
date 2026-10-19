// Demo phone sign-in (no SMS provider yet).
// POST { phone: "+971501234567", code: "123456" } → { access_token, refresh_token }
// Each phone number maps to exactly one account, so the same number always resumes the same profile.
// Swap for Supabase phone auth (Twilio / MessageBird) once an SMS provider is connected.
import { createClient } from 'npm:@supabase/supabase-js@2';

import { admin, caller, cors, json } from '../_shared/auth.ts';

const DEMO_CODE = Deno.env.get('DEMO_PHONE_CODE') ?? '123456';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { phone, code, mode } = await req.json();
    const digits = String(phone ?? '').replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) return json({ error: 'invalid_phone' }, 400);
    if (String(code ?? '') !== DEMO_CODE) return json({ error: 'invalid_code' }, 400);

    const db = admin();
    const e164 = '+' + digits;

    // Change the signed-in user's number (Account → Change phone number).
    if (mode === 'change') {
      const me = await caller(req);
      if (!me) return json({ error: 'unauthorized' }, 401);
      const { data: taken } = await db.from('profiles').select('id').eq('phone', e164).maybeSingle();
      if (taken && taken.id !== me.id) return json({ error: 'phone_taken' }, 409);
      await db.from('profiles').update({ phone: e164 }).eq('id', me.id);
      return json({ ok: true, phone: e164 });
    }

    // Existing account for this number?
    const { data: existing } = await db.from('profiles').select('id').eq('phone', e164).maybeSingle();
    let email: string;
    if (existing) {
      const { data, error } = await db.auth.admin.getUserById(existing.id);
      if (error || !data.user?.email) return json({ error: 'account_unavailable' }, 409);
      email = data.user.email;
    } else {
      email = `${digits}@phone.mirror.dating`;
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: { phone: e164 } });
      if (error && !/already/i.test(error.message)) throw error;
      const id = data.user?.id ?? (await db.from('profiles').select('id').eq('email', email).maybeSingle()).data?.id;
      if (id) await db.from('profiles').update({ phone: e164, email: '' }).eq('id', id);
    }

    // Mint a session without sending anything: generate a magic-link token and redeem it.
    const { data: link, error: linkErr } = await db.auth.admin.generateLink({ type: 'magiclink', email });
    if (linkErr) throw linkErr;
    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
    const { data: s, error: vErr } = await anon.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' });
    if (vErr || !s.session) throw vErr ?? new Error('no session');
    return json({ access_token: s.session.access_token, refresh_token: s.session.refresh_token });
  } catch (e) {
    console.error(e);
    return json({ error: 'send_failed' }, 500);
  }
});
