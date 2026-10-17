-- Email sign-in, required verification, admin moderation, push notifications, store purchases.

-- ───────────────────────── email on sign-up ─────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, phone, email) values (new.id, new.phone, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$;

-- Keep profiles.email in sync when the sign-in email changes.
create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ───────────────────────── roles & bans ─────────────────────────
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists banned_at timestamptz;
-- (column grants from the core migration don't include these, so clients can't set them)

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_banned(u uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select banned_at is not null from public.profiles where id = u), false);
$$;

-- Banned users can't message anyone.
drop policy if exists "send in active matches" on public.messages;
create policy "send in active matches" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and not public.is_banned((select auth.uid()))
  and exists (
    select 1 from public.matches m
    where m.id = match_id and m.ended_at is null and (select auth.uid()) in (m.user_a, m.user_b)
      and not public.is_blocked(m.user_a, m.user_b)
  )
);

-- Admins can view verification photos (to approve them) — nobody else can see other users' files.
create policy "admins read verifications" on storage.objects for select to authenticated
  using (bucket_id = 'verifications' and public.is_admin());

-- ───────────────────────── introductions: verified, unbanned people only ─────────────────────────
create or replace function public.get_introductions() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  b record;
  used int;
  amin int;
  amax int;
  stretch int;
  city_filter text;
  cards jsonb;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then raise exception 'no_profile'; end if;
  if me.banned_at is not null then return jsonb_build_object('banned', true, 'cards', '[]'::jsonb); end if;
  -- Verification is required: both checks must at least be submitted before seeing anyone.
  if me.photo_status in ('none', 'rejected') or me.id_status in ('none', 'rejected') then
    return jsonb_build_object('needsVerification', true, 'photo', me.photo_status, 'identity', me.id_status, 'cards', '[]'::jsonb);
  end if;
  select * into b from public.plan_batch(me.plan);

  if now() >= me.batch_started_at + make_interval(hours => b.hours) then
    update public.profiles set batch_started_at = now() where id = me.id returning * into me;
  end if;

  select count(*) into used from public.decisions where user_id = me.id and created_at >= me.batch_started_at;

  amin := coalesce((me.type_prefs ->> 'ageMin')::int, 18);
  amax := coalesce((me.type_prefs ->> 'ageMax')::int, 99);
  stretch := case coalesce(me.type_prefs -> 'flexibility' ->> 'age', 'Preference')
               when 'Flexible' then 5 when 'Preference' then 3 else 0 end;
  city_filter := case
    when me.plan = 'premium' and me.settings -> 'travel' ->> 'city' is not null then split_part(me.settings -> 'travel' ->> 'city', ',', 1)
    when me.plan in ('plus', 'premium') and me.settings ->> 'discoveryCity' is not null then split_part(me.settings ->> 'discoveryCity', ',', 1)
    else null end;

  select coalesce(jsonb_agg(c.card order by c.score desc), '[]'::jsonb) into cards
  from (
    select public.card_json(p) || jsonb_build_object('outsideRange', x.a not between amin and amax, 'distanceKm', null) as card,
           (case when p.boost_ends_at > now() then 100 else 0 end)
           + cardinality(array(select unnest(p.hobbies) intersect select unnest(me.hobbies))) * 2
           + (case when p.intent = me.intent then 5 else 0 end)
           + (case when split_part(p.city, ',', 1) = split_part(me.city, ',', 1) then 3 else 0 end)
           + (case when x.a between amin and amax then 4 else 0 end)
           + random() as score
    from public.profiles p
    cross join lateral (select coalesce(date_part('year', age(p.birthday))::int, 0) as a) x
    where p.id <> me.id
      and p.stage = 'home'
      and not p.paused
      and p.banned_at is null
      and p.photo_status = 'verified' and p.id_status = 'verified'
      and coalesce((p.settings ->> 'discoveryVisible')::boolean, true)
      and (me.interested_in in ('', 'Everyone') or lower(p.gender) = lower(me.interested_in))
      and (p.interested_in in ('', 'Everyone') or lower(p.interested_in) = lower(me.gender))
      and x.a between amin - stretch and amax + stretch
      and (city_filter is null or split_part(p.city, ',', 1) ilike city_filter)
      and not exists (select 1 from public.decisions d where d.user_id = me.id and d.target_id = p.id)
      and not exists (select 1 from public.matches m where m.user_a = least(me.id, p.id) and m.user_b = greatest(me.id, p.id))
      and not public.is_blocked(me.id, p.id)
      and (
        not (p.plan = 'premium' and coalesce((p.settings ->> 'incognito')::boolean, false))
        or exists (select 1 from public.decisions d where d.user_id = p.id and d.target_id = me.id and d.kind <> 'pass')
      )
    order by score desc
    limit greatest(0, b.size - used)
  ) c;

  return jsonb_build_object(
    'cards', cards, 'seen', used, 'size', b.size, 'hours', b.hours,
    'batchStartedAt', me.batch_started_at, 'resetAt', me.batch_started_at + make_interval(hours => b.hours)
  );
end $$;

-- Banned users can't act.
create or replace function public.decide(p_target uuid, p_kind text, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  mid uuid;
begin
  if me is null then raise exception 'not_authenticated'; end if;
  if public.is_banned(me) then raise exception 'banned'; end if;
  if p_kind not in ('interested', 'strong', 'pass') then raise exception 'bad_kind'; end if;
  if public.is_blocked(me, p_target) then raise exception 'blocked'; end if;
  if p_kind = 'strong' then
    update public.profiles set stars = stars - 1 where id = me and stars > 0;
    if not found then raise exception 'no_stars'; end if;
  end if;
  insert into public.decisions (user_id, target_id, kind, reason)
  values (me, p_target, p_kind, nullif(p_reason, ''))
  on conflict (user_id, target_id) do update set kind = excluded.kind, reason = excluded.reason, created_at = now();
  if p_kind <> 'pass' and exists (
    select 1 from public.decisions where user_id = p_target and target_id = me and kind in ('interested', 'strong')
  ) and not public.is_banned(p_target) then
    insert into public.matches (user_a, user_b) values (least(me, p_target), greatest(me, p_target))
    on conflict (user_a, user_b) do nothing;
    select id into mid from public.matches where user_a = least(me, p_target) and user_b = greatest(me, p_target) and ended_at is null;
    if mid is not null then return jsonb_build_object('matched', true, 'matchId', mid); end if;
  end if;
  return jsonb_build_object('matched', false);
end $$;

-- ───────────────────────── admin / moderation ─────────────────────────
create or replace function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'openReports', (select count(*) from public.reports where status in ('open', 'reviewing')),
    'pendingVerifications', (select count(*) from public.verifications where status = 'pending'),
    'banned', (select count(*) from public.profiles where banned_at is not null),
    'users', (select count(*) from public.profiles where not is_demo)
  );
end $$;

create or replace function public.admin_reports(p_status text default 'open') returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'reason', r.reason, 'details', r.details, 'status', r.status, 'createdAt', r.created_at,
      'reporter', jsonb_build_object('id', a.id, 'name', a.first_name, 'email', a.email),
      'reported', public.card_json(b) || jsonb_build_object('email', b.email, 'banned', b.banned_at is not null,
        'reportCount', (select count(*) from public.reports x where x.reported = b.id))
    ) order by r.created_at desc)
    from public.reports r
    join public.profiles a on a.id = r.reporter
    join public.profiles b on b.id = r.reported
    where p_status = 'all' or r.status = p_status or (p_status = 'open' and r.status = 'reviewing')
  ), '[]'::jsonb);
end $$;

-- action: 'dismiss' | 'actioned' (warned / no ban) | 'ban'
create or replace function public.admin_resolve_report(p_report uuid, p_action text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select reported into target from public.reports where id = p_report;
  if target is null then raise exception 'not_found'; end if;
  update public.reports set status = case p_action when 'dismiss' then 'dismissed' else 'actioned' end where id = p_report;
  if p_action = 'ban' then
    update public.profiles set banned_at = now() where id = target;
    update public.matches set ended_at = now(), ended_by = auth.uid() where (user_a = target or user_b = target) and ended_at is null;
    update public.reports set status = 'actioned' where reported = target and status in ('open', 'reviewing');
  end if;
end $$;

create or replace function public.admin_set_ban(p_user uuid, p_banned boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.profiles set banned_at = case when p_banned then now() else null end where id = p_user;
end $$;

create or replace function public.admin_verifications(p_status text default 'pending') returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id, 'kind', v.kind, 'path', v.path, 'status', v.status, 'createdAt', v.created_at,
      'user', public.card_json(p) || jsonb_build_object('email', p.email)
    ) order by v.created_at)
    from public.verifications v join public.profiles p on p.id = v.user_id
    where v.status = p_status
  ), '[]'::jsonb);
end $$;

create or replace function public.admin_review_verification(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v public.verifications;
  st text := case when p_approve then 'verified' else 'rejected' end;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.verifications set status = st, reviewed_at = now() where id = p_id returning * into v;
  if v.id is null then raise exception 'not_found'; end if;
  if v.kind = 'photo' then update public.profiles set photo_status = st where id = v.user_id;
  else update public.profiles set id_status = st where id = v.user_id; end if;
end $$;

-- ───────────────────────── push notifications ─────────────────────────
create extension if not exists pg_net with schema extensions;

create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null default '',
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
create policy "manage own push tokens" on public.push_tokens for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.push_tokens to authenticated;

-- Sends an Expo push to every device of a user (respecting their notification settings).
create or replace function public.push_to_user(p_user uuid, p_title text, p_body text, p_data jsonb default '{}', p_setting text default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  msgs jsonb;
begin
  if p_setting is not null and exists (
    select 1 from public.profiles where id = p_user and coalesce((settings ->> p_setting)::boolean, true) = false
  ) then return; end if;
  select jsonb_agg(jsonb_build_object('to', t.token, 'title', p_title, 'body', p_body, 'data', p_data, 'sound', 'default'))
    into msgs from public.push_tokens t where t.user_id = p_user;
  if msgs is null then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := msgs,
    headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
  );
exception when others then
  -- Notifications must never break the action that triggered them.
  raise warning 'push failed: %', sqlerrm;
end $$;

create or replace function public.push_to_admins(p_title text, p_body text, p_data jsonb default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare
  a uuid;
begin
  for a in select id from public.profiles where is_admin loop
    perform public.push_to_user(a, p_title, p_body, p_data);
  end loop;
end $$;

create or replace function public.notify_new_match() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  na text := (select first_name from public.profiles where id = new.user_a);
  nb text := (select first_name from public.profiles where id = new.user_b);
begin
  perform public.push_to_user(new.user_a, 'You both chose to meet', 'Say hello to ' || coalesce(nb, 'your match') || '.', jsonb_build_object('url', '/match/' || new.user_b), 'notifMatches');
  perform public.push_to_user(new.user_b, 'You both chose to meet', 'Say hello to ' || coalesce(na, 'your match') || '.', jsonb_build_object('url', '/match/' || new.user_a), 'notifMatches');
  return new;
end $$;
create trigger notify_new_match after insert on public.matches for each row execute function public.notify_new_match();

create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  recipient uuid;
  sender_name text := (select first_name from public.profiles where id = new.sender_id);
begin
  select case when m.user_a = new.sender_id then m.user_b else m.user_a end into recipient from public.matches m where m.id = new.match_id;
  perform public.push_to_user(recipient, coalesce(sender_name, 'New message'), left(new.body, 120), jsonb_build_object('url', '/chat/' || new.sender_id), 'notifMessages');
  return new;
end $$;
create trigger notify_new_message after insert on public.messages for each row execute function public.notify_new_message();

create or replace function public.notify_admins_report() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.push_to_admins('New report: ' || new.reason, coalesce(nullif(left(new.details, 100), ''), 'Tap to review.'), '{"url": "/admin/reports"}');
  return new;
end $$;
create trigger notify_admins_report after insert on public.reports for each row execute function public.notify_admins_report();

create or replace function public.notify_verification() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.push_to_admins('Verification to review', 'A new ' || new.kind || ' check is waiting.', '{"url": "/admin/verifications"}');
  elsif tg_op = 'UPDATE' and new.status <> old.status and new.status in ('verified', 'rejected') then
    perform public.push_to_user(new.user_id,
      case new.status when 'verified' then 'You''re verified' else 'Verification needs another try' end,
      case new.status when 'verified' then 'Your ' || new.kind || ' check was approved.' else 'Please submit your ' || new.kind || ' check again.' end,
      '{"url": "/settings/verification"}', 'notifSafety');
  end if;
  return new;
end $$;
create trigger notify_verification after insert or update on public.verifications for each row execute function public.notify_verification();

-- ───────────────────────── store purchases (RevenueCat) ─────────────────────────
alter table public.purchases add column if not exists external_id text;
create unique index if not exists purchases_external_idx on public.purchases (provider, external_id) where external_id is not null;

-- ───────────────────────── permissions ─────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'admin_overview()', 'admin_reports(text)', 'admin_resolve_report(uuid, text)', 'admin_set_ban(uuid, boolean)',
    'admin_verifications(text)', 'admin_review_verification(uuid, boolean)', 'get_introductions()', 'decide(uuid, text, text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke execute on function public.is_admin() from public, anon;
  grant execute on function public.is_admin() to authenticated; -- used by a storage policy
  revoke execute on function public.is_banned(uuid) from public, anon;
  grant execute on function public.is_banned(uuid) to authenticated; -- used by the messages policy
  foreach f in array array[
    'push_to_user(uuid, text, text, jsonb, text)', 'push_to_admins(text, text, jsonb)', 'notify_new_match()',
    'notify_new_message()', 'notify_admins_report()', 'notify_verification()', 'handle_user_email_change()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;
