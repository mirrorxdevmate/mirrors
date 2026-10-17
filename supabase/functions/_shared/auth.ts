import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Admin client (bypasses RLS). Only ever used inside Edge Functions. */
export function admin(): SupabaseClient {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('MIRROR_SECRET_KEY');
  if (!key) throw new Error('Missing service key');
  return createClient(Deno.env.get('SUPABASE_URL')!, key, { auth: { persistSession: false } });
}

/** Resolves the calling user from their JWT, or returns null. */
export async function caller(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data } = await admin().auth.getUser(token);
  return data.user ?? null;
}
