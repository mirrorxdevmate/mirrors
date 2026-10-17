-- DEMO MODE — sample people so a brand-new app isn't empty while testing.
-- Turn off before launch:   update public.app_config set value = 'false' where key = 'demo_mode';
-- Remove demo people:        delete from auth.users where id in (select id from public.profiles where is_demo);

create or replace function public.demo_on() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select value = 'true'::jsonb from public.app_config where key = 'demo_mode'), false);
$$;

-- Seed demo accounts (auth user → profile row via handle_new_user trigger).
do $$
declare
  d record;
  uid uuid;
begin
  for d in
    select * from (values
      ('michael', 'Michael', 'Man',   'Woman', date '1993-03-10', 'Co-founder',         188, 'Muslim',    '{Middle Eastern / North African}', true,  '{Gym,Cooking,Travel,"Trying new things"}', '{1507003211169-0a1dd7228f2d,1500648767791-00dcc994a43e}'),
      ('daniel',  'Daniel',  'Man',   'Woman', date '1990-07-22', 'Product designer',   182, 'Christian', '{White / European}',              true,  '{Hiking,Photography,Music}',               '{1506794778202-cad84cf45f1d,1522075469751-3a6694fb2f61}'),
      ('omar',    'Omar',    'Man',   'Woman', date '1983-01-15', 'Engineer',           180, 'Muslim',    '{Middle Eastern / North African}', false, '{Sports,Travel,Food}',                     '{1539571696357-5a69c17a67c6}'),
      ('james',   'James',   'Man',   'Woman', date '1988-05-02', 'Investment analyst', 185, 'Christian', '{White / European}',              false, '{Fitness,Reading,Travel}',                 '{1519085360753-af0119f7cbe7}'),
      ('karim',   'Karim',   'Man',   'Woman', date '1991-11-30', 'Architect',          178, 'Muslim',    '{Middle Eastern / North African}', true,  '{Art,Travel,Cooking}',                     '{1500648767791-00dcc994a43e}'),
      ('esther',  'Esther',  'Woman', 'Man',   date '1993-04-18', 'Architect',          168, 'Christian', '{Black / African}',               false, '{Travel,Reading,Art}',                     '{1544005313-94ddf0286df2,1517841905240-472988babdf9}'),
      ('sara',    'Sara',    'Woman', 'Man',   date '1995-02-09', 'Physician',          165, 'Muslim',    '{Middle Eastern / North African}', true,  '{Reading,Wellness,Cooking}',               '{1494790108377-be9c29b29330,1438761681033-6461ffad8d80}'),
      ('lina',    'Lina',    'Woman', 'Man',   date '1996-09-12', 'Marketing lead',     170, 'Prefer not to say', '{Middle Eastern / North African}', true, '{Art,Fashion,Movies}',               '{1534528741775-53994a69daeb,1529626455594-4ff0802cfb7e}'),
      ('maya',    'Maya',    'Woman', 'Man',   date '1994-06-25', 'Teacher',            163, 'Hindu',     '{South Asian}',                   false, '{Music,Cooking,Socializing}',              '{1488426862026-3ee34a7d66df,1524504388940-b1c1722653e1}'),
      ('amara',   'Amara',   'Woman', 'Man',   date '1992-12-03', 'Lawyer',             172, 'Christian', '{Black / African}',               true,  '{Travel,Fitness,Music}',                   '{1531123897727-8f129e1688ce}')
    ) as t(slug, name, gender, wants, born, job, height, faith, culture, likes_back, hobbies, photos)
  loop
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
            'demo+' || d.slug || '@mirror.invalid', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', '{"demo":true}', now(), now(), '', '', '', '');

    update public.profiles set
      is_demo = true, first_name = d.name, gender = d.gender, interested_in = d.wants, birthday = d.born,
      profession = d.job, height_cm = d.height, faith = d.faith, culture = d.culture::text[], hobbies = d.hobbies::text[],
      city = 'Dubai, UAE', location_mode = 'manual', intent = 'Serious relationship',
      intent_detail = 'Building toward marriage.', relationship_status = 'Single',
      children = 'Don''t have children, but want them', education = 'Bachelor''s',
      about = 'Hi, I''m here to meet someone genuine and see where it goes. I value honest conversations and building a life with the right person.',
      lifestyle = '{"drinking":"Socially","smoking":"Never","pets":"No pets","exercise":"Sometimes","social":"Balanced"}',
      type_prefs = '{"ageMin":25,"ageMax":45,"mattersMost":["Family goals","Communication","Shared values"]}',
      settings = jsonb_build_object('demoLikesBack', d.likes_back),
      photos = array(select 'https://images.unsplash.com/photo-' || x || '?w=900&q=80&auto=format&fit=crop' from unnest(d.photos::text[]) x),
      photo_status = 'verified', id_status = 'verified', stage = 'home'
    where id = uid;
  end loop;
end $$;

-- When a real user finishes onboarding, some demo people "like" them, so matching can be tested end to end.
create or replace function public.demo_likes_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.stage = 'home' and old.stage <> 'home' and not new.is_demo and public.demo_on() then
    insert into public.decisions (user_id, target_id, kind)
    select d.id, new.id, 'interested' from public.profiles d
    where d.is_demo and coalesce((d.settings ->> 'demoLikesBack')::boolean, false)
      and (new.interested_in in ('', 'Everyone') or lower(d.gender) = lower(new.interested_in))
      and (d.interested_in in ('', 'Everyone') or lower(d.interested_in) = lower(new.gender))
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger demo_likes_new_user after update of stage on public.profiles
  for each row execute function public.demo_likes_new_user();

-- Demo people reply to messages so chat can be tested alone.
create or replace function public.demo_auto_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  other uuid;
  n int;
  replies text[] := array[
    'Sunday lunches, mostly. You?',
    'That''s lovely. What''s something you''re looking forward to this month?',
    'Ha, I like that. Tell me more.',
    'I''m doing good — how''s your weekend going?',
    'Honestly, a good conversation over coffee is hard to beat.'
  ];
begin
  if not public.demo_on() then return new; end if;
  select case when m.user_a = new.sender_id then m.user_b else m.user_a end into other
  from public.matches m where m.id = new.match_id;
  if other is null or not exists (select 1 from public.profiles where id = other and is_demo) then return new; end if;
  select count(*) into n from public.messages where match_id = new.match_id and sender_id = new.sender_id;
  insert into public.messages (match_id, sender_id, body, created_at)
  values (new.match_id, other, replies[1 + ((n - 1) % array_length(replies, 1))], now() + interval '2 seconds');
  return new;
end $$;
create trigger demo_auto_reply after insert on public.messages
  for each row when (pg_trigger_depth() < 1) execute function public.demo_auto_reply();

revoke execute on function public.demo_on() from public, anon, authenticated;
revoke execute on function public.demo_likes_new_user() from public, anon, authenticated;
revoke execute on function public.demo_auto_reply() from public, anon, authenticated;
