-- Server-side app logic. All functions run as SECURITY DEFINER with an empty search_path and
-- check auth.uid() themselves, so plan limits, matching and privacy can't be bypassed by a client.

-- Sanitised public card for one profile (respects the owner's visibility choices).
create or replace function public.card_json(p public.profiles) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id,
    'name', p.first_name,
    'age', coalesce(date_part('year', age(p.birthday))::int, 0),
    'gender', case lower(p.gender) when 'man' then 'man' when 'woman' then 'woman' else 'other' end,
    'verified', p.photo_status = 'verified',
    'idVerified', p.id_status = 'verified',
    'city', split_part(p.city, ',', 1),
    'heightCm', p.height_cm,
    'profession', p.profession,
    'intent', p.intent,
    'drinking', coalesce(p.lifestyle ->> 'drinking', ''),
    'smoking', coalesce(p.lifestyle ->> 'smoking', ''),
    'pets', coalesce(p.lifestyle ->> 'pets', ''),
    'exercise', coalesce(p.lifestyle ->> 'exercise', ''),
    'social', coalesce(p.lifestyle ->> 'social', ''),
    'children', case when coalesce((p.visibility -> 'children' ->> 'show')::boolean, true) then p.children else '' end,
    'faith', case when coalesce((p.visibility -> 'faith' ->> 'show')::boolean, true) then p.faith else '' end,
    'culture', case when coalesce((p.visibility -> 'culture' ->> 'show')::boolean, true) then array_to_string(p.culture, ', ') else '' end,
    'education', p.education,
    'about', coalesce(nullif(p.about, ''), p.intent_detail),
    'values', coalesce(p.type_prefs -> 'mattersMost', '[]'::jsonb),
    'hobbies', to_jsonb(p.hobbies),
    'photos', to_jsonb(p.photos),
    'boosted', coalesce(p.boost_ends_at > now(), false),
    'travel', case when p.plan = 'premium' then p.settings -> 'travel' else null end,
    -- Pattern notice: 2+ different people reported this person in the last 30 days.
    'patternFlag', (select count(distinct r.reporter) >= 2 from public.reports r
                    where r.reported = p.id and r.created_at > now() - interval '30 days')
  );
$$;

create or replace function public.plan_batch(plan text, out size int, out hours int)
language sql immutable set search_path = '' as $$
  select case plan when 'premium' then 40 when 'plus' then 30 else 20 end,
         case plan when 'premium' then 5 when 'plus' then 8 else 24 end;
$$;

-- ───────────────────────── introductions ─────────────────────────
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
  select * into b from public.plan_batch(me.plan);

  if now() >= me.batch_started_at + make_interval(hours => b.hours) then
    update public.profiles set batch_started_at = now() where id = me.id returning * into me;
  end if;

  select count(*) into used from public.decisions where user_id = me.id and created_at >= me.batch_started_at;

  amin := coalesce((me.type_prefs ->> 'ageMin')::int, 18);
  amax := coalesce((me.type_prefs ->> 'ageMax')::int, 99);
  -- "Flexible"/"Preference" ages may stretch a little; "Important"/"Deal-breaker" are strict.
  stretch := case coalesce(me.type_prefs -> 'flexibility' ->> 'age', 'Preference')
               when 'Flexible' then 5 when 'Preference' then 3 else 0 end;
  city_filter := case
    when me.plan = 'premium' and me.settings -> 'travel' ->> 'city' is not null then split_part(me.settings -> 'travel' ->> 'city', ',', 1)
    when me.plan in ('plus', 'premium') and me.settings ->> 'discoveryCity' is not null then split_part(me.settings ->> 'discoveryCity', ',', 1)
    else null end;

  select coalesce(jsonb_agg(c.card order by c.score desc), '[]'::jsonb) into cards
  from (
    select public.card_json(p) || jsonb_build_object(
             'outsideRange', x.a not between amin and amax,
             'distanceKm', null
           ) as card,
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
      and coalesce((p.settings ->> 'discoveryVisible')::boolean, true)
      and (me.interested_in in ('', 'Everyone') or lower(p.gender) = lower(me.interested_in))
      and (p.interested_in in ('', 'Everyone') or lower(p.interested_in) = lower(me.gender))
      and x.a between amin - stretch and amax + stretch
      and (city_filter is null or split_part(p.city, ',', 1) ilike city_filter)
      and not exists (select 1 from public.decisions d where d.user_id = me.id and d.target_id = p.id)
      and not exists (select 1 from public.matches m where m.user_a = least(me.id, p.id) and m.user_b = greatest(me.id, p.id))
      and not public.is_blocked(me.id, p.id)
      -- Incognito (Premium): only visible to people they've shown interest in.
      and (
        not (p.plan = 'premium' and coalesce((p.settings ->> 'incognito')::boolean, false))
        or exists (select 1 from public.decisions d where d.user_id = p.id and d.target_id = me.id and d.kind <> 'pass')
      )
    order by score desc
    limit greatest(0, b.size - used)
  ) c;

  return jsonb_build_object(
    'cards', cards,
    'seen', used,
    'size', b.size,
    'hours', b.hours,
    'batchStartedAt', me.batch_started_at,
    'resetAt', me.batch_started_at + make_interval(hours => b.hours)
  );
end $$;

-- Interested / strong interest / pass. Returns { matched, matchId }.
create or replace function public.decide(p_target uuid, p_kind text, p_reason text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  mid uuid;
begin
  if me is null then raise exception 'not_authenticated'; end if;
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
  ) then
    insert into public.matches (user_a, user_b) values (least(me, p_target), greatest(me, p_target))
    on conflict (user_a, user_b) do nothing;
    select id into mid from public.matches where user_a = least(me, p_target) and user_b = greatest(me, p_target) and ended_at is null;
    if mid is not null then return jsonb_build_object('matched', true, 'matchId', mid); end if;
  end if;
  return jsonb_build_object('matched', false);
end $$;

-- Rewind (Mirror+ / Premium): undo the most recent pass in the current batch.
create or replace function public.rewind_last() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  t uuid;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.plan = 'free' then raise exception 'upgrade_required'; end if;
  select target_id into t from public.decisions
   where user_id = me.id and kind = 'pass' and created_at >= me.batch_started_at
   order by created_at desc limit 1;
  if t is null then return null; end if;
  delete from public.decisions where user_id = me.id and target_id = t;
  return t;
end $$;

-- ───────────────────────── people ─────────────────────────
create or replace function public.get_card(p_target uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  p public.profiles;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if public.is_blocked(auth.uid(), p_target) then return null; end if;
  select * into p from public.profiles where id = p_target;
  if p.id is null then return null; end if;
  return public.card_json(p);
end $$;

-- People interested in me. Free plans only get a count and a (to-be-blurred) preview photo.
create or replace function public.get_likes() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  total int;
  cards jsonb;
begin
  select * into me from public.profiles where id = auth.uid();
  with likers as (
    select d.user_id as id, d.created_at as liked_at from public.decisions d
    join public.profiles lp on lp.id = d.user_id
    where d.target_id = me.id and d.kind in ('interested', 'strong') and lp.stage = 'home'
      and not exists (select 1 from public.decisions mine where mine.user_id = me.id and mine.target_id = d.user_id)
      and not public.is_blocked(me.id, d.user_id)
  )
  select count(*),
         case when me.plan = 'free'
           then coalesce(jsonb_agg(jsonb_build_object('photo', p.photos[1]) order by l.liked_at desc), '[]'::jsonb)
           else coalesce(jsonb_agg(public.card_json(p) order by l.liked_at desc), '[]'::jsonb) end
    into total, cards
  from likers l join public.profiles p on p.id = l.id;
  return jsonb_build_object('count', total, 'unlocked', me.plan <> 'free', 'items', cards);
end $$;

create or replace function public.get_matches() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  return coalesce((
    select jsonb_agg(row_data order by sort_at desc)
    from (
      select jsonb_build_object(
               'matchId', m.id,
               'createdAt', m.created_at,
               'card', public.card_json(p),
               'last', (select jsonb_build_object('body', x.body, 'fromMe', x.sender_id = me, 'at', x.created_at)
                          from public.messages x where x.match_id = m.id order by x.created_at desc limit 1),
               'unread', (select count(*) from public.messages x where x.match_id = m.id and x.sender_id <> me and x.read_at is null)
             ) as row_data,
             coalesce((select max(x.created_at) from public.messages x where x.match_id = m.id), m.created_at) as sort_at
      from public.matches m
      join public.profiles p on p.id = case when m.user_a = me then m.user_b else m.user_a end
      where me in (m.user_a, m.user_b) and m.ended_at is null and not public.is_blocked(m.user_a, m.user_b)
    ) t
  ), '[]'::jsonb);
end $$;

create or replace function public.mark_read(p_match uuid) returns void
language sql security definer set search_path = '' as $$
  update public.messages set read_at = now()
  where match_id = p_match and sender_id <> auth.uid() and read_at is null
    and exists (select 1 from public.matches m where m.id = p_match and auth.uid() in (m.user_a, m.user_b));
$$;

create or replace function public.end_match(p_target uuid) returns void
language sql security definer set search_path = '' as $$
  update public.matches set ended_at = now(), ended_by = auth.uid()
  where user_a = least(auth.uid(), p_target) and user_b = greatest(auth.uid(), p_target) and ended_at is null;
$$;

create or replace function public.block_user(p_target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or p_target = auth.uid() then raise exception 'bad_target'; end if;
  insert into public.blocks (blocker, blocked) values (auth.uid(), p_target) on conflict do nothing;
  perform public.end_match(p_target);
end $$;

create or replace function public.unblock_user(p_target uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.blocks where blocker = auth.uid() and blocked = p_target;
$$;

create or replace function public.get_blocked() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.first_name, 'photo', p.photos[1]) order by b.created_at desc), '[]'::jsonb)
  from public.blocks b join public.profiles p on p.id = b.blocked
  where b.blocker = auth.uid();
$$;

create or replace function public.report_user(p_target uuid, p_reason text, p_details text default '', p_also_block boolean default false)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.reports (reporter, reported, reason, details)
  values (auth.uid(), p_target, left(p_reason, 100), left(coalesce(p_details, ''), 1000));
  if p_also_block then perform public.block_user(p_target); end if;
end $$;

-- ───────────────────────── engagement ─────────────────────────
-- Daily activity streak; every 7th consecutive day earns a Star. Returns { earned, streak, stars }.
create or replace function public.touch_activity() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  streak int;
  earned boolean := false;
begin
  select * into me from public.profiles where id = auth.uid() for update;
  if me.last_active_day = current_date then
    return jsonb_build_object('earned', false, 'streak', me.streak_days, 'stars', me.stars);
  end if;
  streak := case when me.last_active_day = current_date - 1 then me.streak_days + 1 else 1 end;
  earned := streak % 7 = 0;
  update public.profiles
     set last_active_day = current_date, streak_days = streak, stars = stars + (case when earned then 1 else 0 end)
   where id = me.id returning * into me;
  return jsonb_build_object('earned', earned, 'streak', me.streak_days, 'stars', me.stars);
end $$;

create or replace function public.activate_boost() returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  ends timestamptz;
begin
  update public.profiles set boosts = boosts - 1, boost_ends_at = now() + interval '30 minutes'
  where id = auth.uid() and boosts > 0 and (boost_ends_at is null or boost_ends_at < now())
  returning boost_ends_at into ends;
  if ends is null then raise exception 'no_boosts'; end if;
  return ends;
end $$;

create or replace function public.get_stats() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'decisions', (select count(*) from public.decisions where user_id = auth.uid()),
    'interested', (select count(*) from public.decisions where user_id = auth.uid() and kind <> 'pass')
  );
$$;

-- ───────────────────────── permissions ─────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'get_introductions()', 'decide(uuid, text, text)', 'rewind_last()', 'get_card(uuid)', 'get_likes()',
    'get_matches()', 'mark_read(uuid)', 'end_match(uuid)', 'block_user(uuid)', 'unblock_user(uuid)',
    'get_blocked()', 'report_user(uuid, text, text, boolean)', 'touch_activity()', 'activate_boost()', 'get_stats()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  revoke execute on function public.is_blocked(uuid, uuid) from public, anon;
  grant execute on function public.is_blocked(uuid, uuid) to authenticated; -- used by the messages insert policy
  revoke execute on function public.card_json(public.profiles) from public, anon, authenticated;
  revoke execute on function public.handle_new_user() from public, anon, authenticated;
end $$;
