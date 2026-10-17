-- Mirror core schema.
-- Privacy model: users can only read/write their OWN profile row. Other people are only ever
-- seen through SECURITY DEFINER functions that return a sanitised "card" (no phone, email,
-- exact birthday, settings or hidden fields).

create extension if not exists pgcrypto;

-- ───────────────────────── config ─────────────────────────
create table public.app_config (key text primary key, value jsonb not null);
alter table public.app_config enable row level security; -- service role only
insert into public.app_config values ('demo_mode', 'true'::jsonb);

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  email text not null default '',
  first_name text not null default '',
  birthday date,
  gender text not null default '',
  gender_custom text not null default '',
  interested_in text not null default '',
  city text not null default '',
  location_mode text not null default '',
  photos text[] not null default '{}',
  intent text not null default '',
  intent_detail text not null default '',
  relationship_status text not null default '',
  children text not null default '',
  lifestyle jsonb not null default '{}',
  hobbies text[] not null default '{}',
  faith text not null default '',
  height_cm int not null default 170 check (height_cm between 100 and 250),
  height_unit text not null default 'cm',
  education text not null default '',
  profession text not null default '',
  culture text[] not null default '{}',
  about text not null default '' check (char_length(about) <= 500),
  visibility jsonb not null default '{"faith":{"show":true,"match":true},"children":{"show":true,"match":true},"culture":{"show":true,"match":true}}',
  type_prefs jsonb not null default '{}',
  settings jsonb not null default '{}',
  stage text not null default 'basics' check (stage in ('basics', 'details', 'type', 'verify', 'home')),
  paused boolean not null default false,
  -- server-managed (not writable by the client, see column grants below)
  plan text not null default 'free' check (plan in ('free', 'plus', 'premium')),
  billing text not null default 'monthly',
  plan_renews_at timestamptz,
  plan_cancelled boolean not null default false,
  payment_method text not null default '',
  photo_status text not null default 'none' check (photo_status in ('none', 'pending', 'verified', 'rejected')),
  id_status text not null default 'none' check (id_status in ('none', 'pending', 'verified', 'rejected')),
  boosts int not null default 0 check (boosts >= 0),
  boost_ends_at timestamptz,
  stars int not null default 0 check (stars >= 0),
  streak_days int not null default 0,
  last_active_day date,
  batch_started_at timestamptz not null default now(),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_discovery_idx on public.profiles (stage, gender) where not paused;

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (
  email, first_name, birthday, gender, gender_custom, interested_in, city, location_mode, photos, intent,
  intent_detail, relationship_status, children, lifestyle, hobbies, faith, height_cm, height_unit, education,
  profession, culture, about, visibility, type_prefs, settings, stage, paused
) on public.profiles to authenticated;

-- 18+ guard and updated_at
create or replace function public.profiles_before_write() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.birthday is not null and new.birthday > (current_date - interval '18 years') then
    raise exception 'under_18' using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_before_write before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

-- Every new auth user gets a profile row.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── relationships ─────────────────────────
create table public.decisions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('interested', 'strong', 'pass')),
  reason text,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id),
  check (user_id <> target_id)
);
create index decisions_target_idx on public.decisions (target_id, kind);
alter table public.decisions enable row level security;
create policy "read own decisions" on public.decisions for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.decisions from anon, authenticated;

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid,
  unique (user_a, user_b),
  check (user_a < user_b)
);
create index matches_b_idx on public.matches (user_b);
alter table public.matches enable row level security;
create policy "read own matches" on public.matches for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));
revoke insert, update, delete on public.matches from anon, authenticated;

create table public.blocks (
  blocker uuid not null references public.profiles (id) on delete cascade,
  blocked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
create index blocks_blocked_idx on public.blocks (blocked);
alter table public.blocks enable row level security;
create policy "read own blocks" on public.blocks for select to authenticated using (blocker = (select auth.uid()));
revoke insert, update, delete on public.blocks from anon, authenticated;

create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a));
$$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index messages_match_idx on public.messages (match_id, created_at);
alter table public.messages enable row level security;
create policy "read messages in my matches" on public.messages for select to authenticated using (
  exists (select 1 from public.matches m where m.id = match_id and (select auth.uid()) in (m.user_a, m.user_b))
);
create policy "send in active matches" on public.messages for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.matches m
    where m.id = match_id and m.ended_at is null and (select auth.uid()) in (m.user_a, m.user_b)
      and not public.is_blocked(m.user_a, m.user_b)
  )
);
revoke update, delete on public.messages from anon, authenticated;
grant select, insert on public.messages to authenticated;
alter publication supabase_realtime add table public.messages;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter uuid not null references public.profiles (id) on delete cascade,
  reported uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now()
);
create index reports_status_idx on public.reports (status, created_at);
alter table public.reports enable row level security;
create policy "read own reports" on public.reports for select to authenticated using (reporter = (select auth.uid()));
revoke insert, update, delete on public.reports from anon, authenticated;

create table public.feedback (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  rating text not null check (rating in ('good', 'bad')),
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);
alter table public.feedback enable row level security;
create policy "write own feedback" on public.feedback for insert to authenticated with check (user_id = (select auth.uid()));
create policy "update own feedback" on public.feedback for update to authenticated using (user_id = (select auth.uid()));
create policy "read own feedback" on public.feedback for select to authenticated using (user_id = (select auth.uid()));

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('photo', 'identity')),
  path text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
alter table public.verifications enable row level security;
create policy "read own verifications" on public.verifications for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.verifications from anon, authenticated;

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product text not null,
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  provider text not null,
  created_at timestamptz not null default now()
);
alter table public.purchases enable row level security;
create policy "read own purchases" on public.purchases for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete on public.purchases from anon, authenticated;

-- Explicit read grants (row access is still limited by the RLS policies above).
grant select on public.decisions, public.matches, public.blocks, public.reports, public.verifications, public.purchases to authenticated;
grant select, insert, update on public.feedback to authenticated;
revoke all on public.app_config from anon, authenticated;

-- ───────────────────────── storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', true, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('verifications', 'verifications', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "update own photos" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "upload own verification" on storage.objects for insert to authenticated
  with check (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "read own verification" on storage.objects for select to authenticated
  using (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
