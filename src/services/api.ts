/**
 * Backend boundary. Every screen talks to Supabase only through these functions.
 *
 * Auth: Supabase email one-time code. While EXPO_PUBLIC_DEMO_AUTH=true the code is 123456 and the
 * user is signed in anonymously, so everything else (profiles, matching, chat…) is still real.
 * Payments: the `purchase` Edge Function grants plans in mock mode until RevenueCat is connected.
 */
import { decode } from 'base64-arraybuffer';

import { unregisterPush } from '@/lib/push';
import { DEMO_AUTH, supabase } from '@/lib/supabase';
import type { TypeTrait } from '@/store/useApp';
import { parseTypeLocally } from '@/utils/typeParse';

export const DEV_OTP = '123456';
export const OTP_TTL_MS = 10 * 60_000;
export const RESEND_SECONDS = 30;

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const fail = (e: { message?: string } | null, fallback = 'Something went wrong. Please try again.'): never => {
  const msg = e?.message ?? '';
  const code = /under_18/.test(msg) ? 'under_18' : /no_stars/.test(msg) ? 'no_stars' : /no_boosts/.test(msg) ? 'no_boosts' : /upgrade_required/.test(msg) ? 'upgrade_required' : 'error';
  throw new ApiError(code, code === 'error' ? fallback : msg);
};

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) fail(error);
  return data as T;
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    // Surface the function's own error code (e.g. "declined") when it sent one.
    const ctx = (error as { context?: Response }).context;
    const payload = ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
    throw new ApiError(payload?.error ?? 'error', payload?.error ?? error.message);
  }
  return data as T;
}

/* ───────────────────────── auth (email code) ───────────────────────── */
// Supabase emails a one-time code ({{ .Token }} in the Magic Link template). While EXPO_PUBLIC_DEMO_AUTH=true
// no email is sent: the code is 123456 and the user is signed in anonymously (testing only).

export async function sendOtp(email: string) {
  if (DEMO_AUTH) return { sentAt: Date.now() };
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    throw new ApiError(
      'send_failed',
      /rate|seconds/i.test(error.message) ? 'Too many attempts. Please wait a minute and try again.' : 'Check your connection or try again.',
    );
  }
  return { sentAt: Date.now() };
}

export async function verifyOtp(email: string, code: string, sentAt: number) {
  if (Date.now() - sentAt > OTP_TTL_MS) throw new ApiError('expired', 'That code has expired.');
  if (DEMO_AUTH) {
    if (code !== DEV_OTP) throw new ApiError('invalid', "That code doesn't look right. Try again.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously({ options: { data: { email } } });
      if (error) throw new ApiError('auth', 'Sign-in is not enabled on the server yet.');
    }
    return;
  }
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) {
    throw /expired/i.test(error.message)
      ? new ApiError('expired', 'That code has expired.')
      : new ApiError('invalid', "That code doesn't look right. Try again.");
  }
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new ApiError('invalid', 'Email or password is incorrect.');
}

export async function changeEmail(email: string) {
  if (DEMO_AUTH) return { sentAt: Date.now() };
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw new ApiError('send_failed', /registered|exists/i.test(error.message) ? 'That email is already in use.' : error.message);
  return { sentAt: Date.now() };
}

export async function verifyEmailChange(email: string, code: string) {
  if (DEMO_AUTH) {
    if (code !== DEV_OTP) throw new ApiError('invalid', "That code doesn't look right. Try again.");
    return;
  }
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email_change' });
  if (error) throw new ApiError('invalid', "That code doesn't look right. Try again.");
  await saveMyProfile({ email });
}

export async function signOut() {
  await unregisterPush(); // stop notifications to this device for the old account
  await supabase.auth.signOut();
}
export const currentUserId = async () => (await supabase.auth.getSession()).data.session?.user.id ?? null;

/* ───────────────────────── my account ───────────────────────── */

export type ProfileRow = Record<string, unknown> & { id: string };

export async function loadMyProfile(): Promise<ProfileRow | null> {
  const id = await currentUserId();
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) fail(error);
  return data as ProfileRow | null;
}

export async function saveMyProfile(patch: Record<string, unknown>) {
  const id = await currentUserId();
  if (!id || !Object.keys(patch).length) return;
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) fail(error);
}

export async function deleteAccount(reason: string) {
  await invoke('delete-account', { reason });
  await supabase.auth.signOut();
}

/* ───────────────────────── media ───────────────────────── */

export type Shot = { uri: string; base64?: string | null; mimeType?: string | null };

async function upload(bucket: 'photos' | 'verifications', shot: Shot) {
  const id = await currentUserId();
  if (!id) throw new ApiError('auth', 'Please sign in again.');
  if (!shot.base64) throw new ApiError('media', 'Could not read that photo.');
  const ext = shot.mimeType?.includes('png') ? 'png' : 'jpg';
  const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, decode(shot.base64), {
    contentType: shot.mimeType ?? 'image/jpeg',
    upsert: false,
  });
  if (error) fail(error, 'Upload failed. Check your connection and try again.');
  return path;
}

/** Uploads a profile photo and returns its public URL. */
export async function uploadPhoto(shot: Shot) {
  const path = await upload('photos', shot);
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

export async function removePhoto(url: string) {
  const marker = '/object/public/photos/';
  const i = url.indexOf(marker);
  if (i >= 0) await supabase.storage.from('photos').remove([url.slice(i + marker.length)]);
}

export async function submitVerification(kind: 'photo' | 'identity', shot: Shot) {
  const path = await upload('verifications', shot);
  return invoke<{ status: 'pending' | 'verified' }>('verify', { kind, path });
}

/* ───────────────────────── type ───────────────────────── */

export async function interpretType(text: string, interestedIn: string) {
  try {
    return await invoke<{ traits: TypeTrait[]; ageMin: number; ageMax: number }>('interpret-type', { text, interestedIn });
  } catch {
    // Function not deployed / offline: never block onboarding.
    return parseTypeLocally(text, interestedIn);
  }
}

/* ───────────────────────── people & matching ───────────────────────── */

export type Card = Record<string, unknown> & { id: string; name: string; photos: string[] };
export type Intros = {
  cards: Card[];
  seen: number;
  size: number;
  hours: number;
  batchStartedAt: string;
  resetAt: string;
  /** Verification is required before seeing anyone. */
  needsVerification?: boolean;
  banned?: boolean;
};

export const getIntroductions = () => rpc<Intros>('get_introductions');
export const decide = (target: string, kind: 'interested' | 'strong' | 'pass', reason?: string) =>
  rpc<{ matched: boolean; matchId?: string }>('decide', { p_target: target, p_kind: kind, p_reason: reason ?? null });
export const rewindLast = () => rpc<string | null>('rewind_last');
export const getCard = (target: string) => rpc<Card | null>('get_card', { p_target: target });
export const getLikes = () => rpc<{ count: number; unlocked: boolean; items: (Card | { photo: string })[] }>('get_likes');

export type MatchRow = { matchId: string; createdAt: string; card: Card; last: { body: string; fromMe: boolean; at: string } | null; unread: number };
export const getMatches = () => rpc<MatchRow[]>('get_matches');
export const endMatch = (target: string) => rpc<void>('end_match', { p_target: target });
export const blockUser = (target: string) => rpc<void>('block_user', { p_target: target });
export const unblockUser = (target: string) => rpc<void>('unblock_user', { p_target: target });
export const getBlocked = () => rpc<{ id: string; name: string; photo: string | null }[]>('get_blocked');
export const submitReport = (target: string, reason: string, details: string, alsoBlock: boolean) =>
  rpc<void>('report_user', { p_target: target, p_reason: reason, p_details: details, p_also_block: alsoBlock });

export async function submitFeedback(target: string, rating: 'good' | 'bad') {
  const id = await currentUserId();
  const { error } = await supabase.from('feedback').upsert({ user_id: id, target_id: target, rating });
  if (error) fail(error);
}

export const touchActivity = () => rpc<{ earned: boolean; streak: number; stars: number }>('touch_activity');
export const activateBoost = () => rpc<string>('activate_boost');
export const getStats = () => rpc<{ decisions: number; interested: number }>('get_stats');

/* ───────────────────────── chat ───────────────────────── */

export type ChatMessage = { id: string; match_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

export async function getMessages(matchId: string) {
  const { data, error } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at').limit(500);
  if (error) fail(error);
  return (data ?? []) as ChatMessage[];
}

export async function sendMessage(matchId: string, body: string) {
  const { data, error } = await supabase.from('messages').insert({ match_id: matchId, body }).select().single();
  if (error) fail(error, "Message not sent. You may no longer be connected.");
  return data as ChatMessage;
}

export const markRead = (matchId: string) => rpc<void>('mark_read', { p_match: matchId });

/** Live new messages. Pass a matchId to scope to one conversation. Returns an unsubscribe function. */
export function onMessages(onInsert: (m: ChatMessage) => void, matchId?: string) {
  const channel = supabase
    .channel(`messages-${matchId ?? 'all'}-${Math.random().toString(36).slice(2, 7)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', ...(matchId ? { filter: `match_id=eq.${matchId}` } : {}) },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/* ───────────────────────── payments ───────────────────────── */

export async function charge(item: { kind: 'plan'; plan: string; billing: string } | { kind: 'boost'; count: number }, method: string) {
  try {
    return await invoke<{ ok: true }>('purchase', { ...item, method });
  } catch (e) {
    throw e instanceof ApiError && e.code === 'declined' ? new ApiError('declined', "Your payment didn't go through.") : e;
  }
}
export const setSubscriptionCancelled = (cancelled: boolean) => invoke('purchase', { action: cancelled ? 'cancel' : 'resume' });
export const setPaymentMethod = (method: string) => invoke('purchase', { action: 'payment_method', method });

export async function restorePurchases() {
  // With RevenueCat this becomes Purchases.restorePurchases(); for now re-read the server state.
  return loadMyProfile();
}

export const PRICES = {
  plus: { monthly: 29.99, quarterly: 74.99, annual: 239.99 },
  premium: { monthly: 49.99, quarterly: 124.99, annual: 399.99 },
  boosts: { 1: 4.99, 3: 11.99, 5: 17.99 } as Record<number, number>,
  vat: 0.05,
};

/* ───────────────────────── admin / moderation (admins only; enforced on the server) ───────────────────────── */

export type AdminReport = {
  id: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string; email: string };
  reported: Card & { email: string; banned: boolean; reportCount: number };
};
export type AdminVerification = { id: string; kind: 'photo' | 'identity'; path: string; status: string; createdAt: string; user: Card & { email: string } };

export const adminOverview = () => rpc<{ openReports: number; pendingVerifications: number; banned: number; users: number }>('admin_overview');
export const adminReports = (status: 'open' | 'all' = 'open') => rpc<AdminReport[]>('admin_reports', { p_status: status });
export const adminResolveReport = (id: string, action: 'dismiss' | 'actioned' | 'ban') => rpc<void>('admin_resolve_report', { p_report: id, p_action: action });
export const adminSetBan = (userId: string, banned: boolean) => rpc<void>('admin_set_ban', { p_user: userId, p_banned: banned });
export const adminVerifications = () => rpc<AdminVerification[]>('admin_verifications', { p_status: 'pending' });
export const adminReviewVerification = (id: string, approve: boolean) => rpc<void>('admin_review_verification', { p_id: id, p_approve: approve });

/** Short-lived link to a private verification photo (admins only, via storage policy). */
export async function verificationImageUrl(path: string) {
  const { data, error } = await supabase.storage.from('verifications').createSignedUrl(path, 300);
  if (error) fail(error);
  return data!.signedUrl;
}
