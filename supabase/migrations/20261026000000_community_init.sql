-- WearLog community schema: "오늘의 베스트 착장" (comment-free, heart-only).
-- Ported from CutPick and adapted; includes CutPick's later fixes (reports survive target deletion).
-- require_review defaults to TRUE: approve-before-publish until an operator runs daily moderation
-- (prompt §3.10, docs/COMMUNITY_SAFETY.md).
-- Apply with: supabase db push   (or paste into the SQL editor of a Free project)
-- Every table has RLS enabled. The service_role key is NEVER shipped in the app.

-- ---------------------------------------------------------------------------
-- Settings (operator-controlled, fail-closed switches)
-- ---------------------------------------------------------------------------
create table if not exists public.community_settings (
  id boolean primary key default true check (id),
  uploads_enabled boolean not null default true,
  -- New posts start as 'pending' until an operator approves them (closed beta default).
  require_review boolean not null default true,
  daily_post_limit int not null default 5 check (daily_post_limit between 0 and 100),
  -- Uploads stop before the Free plan storage quota is reached (bytes). Tune per docs/COSTS_AND_DISTRIBUTION.md.
  max_storage_bytes bigint not null default 800000000,
  auto_hide_report_threshold int not null default 3 check (auto_hide_report_threshold >= 1)
);
insert into public.community_settings (id) values (true) on conflict do nothing;
alter table public.community_settings enable row level security;
-- No policies: only the dashboard/service role can read or change settings.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_.]{3,20}$'),
  display_name text check (display_name is null or char_length(display_name) <= 30),
  avatar_path text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles are publicly readable" on public.profiles
  for select to anon, authenticated using (true);
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  image_path text not null,
  thumbnail_path text not null,
  title text check (title is null or char_length(title) <= 40),
  style_tags text[] not null default '{}'
    check (cardinality(style_tags) <= 3
       and style_tags <@ array['street','cityboy','minimal','gorpcore','casual','classic','workwear','sporty']::text[]),
  occasion text check (occasion is null or occasion in ('daily','work','date','travel','outdoor','special')),
  -- Coarse, user-approved text only (e.g. '비 오는 날 · 12°C'). Never coordinates.
  weather_summary text check (weather_summary is null or char_length(weather_summary) <= 40),
  -- Operator curation for "오늘의 베스트 착장" (a date, not a rank). Only privileged roles set it.
  featured_on date,
  visibility text not null default 'public' check (visibility in ('public','private')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','visible','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Upload paths must live in the author's own folder.
  check (split_part(image_path, '/', 1) = author_id::text and split_part(thumbnail_path, '/', 1) = author_id::text)
);
create index if not exists idx_posts_feed on public.posts (moderation_status, visibility, created_at desc);
create index if not exists idx_posts_author on public.posts (author_id, created_at desc);
create index if not exists idx_posts_featured on public.posts (featured_on desc) where featured_on is not null;
alter table public.posts enable row level security;

create policy "visible public posts are readable" on public.posts
  for select to anon, authenticated
  using ((moderation_status = 'visible' and visibility = 'public') or author_id = auth.uid());
create policy "authors insert own posts" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
-- Authors may only toggle visibility; moderation_status is protected by the trigger below.
create policy "authors update own posts" on public.posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete own posts" on public.posts
  for delete to authenticated using (author_id = auth.uid());

create or replace function public.posts_before_insert()
returns trigger language plpgsql security definer set search_path = public, storage as $$
declare
  s public.community_settings;
  recent int;
  used bigint;
begin
  select * into s from public.community_settings where id;
  if not s.uploads_enabled then
    raise exception 'uploads_disabled' using errcode = 'P0001';
  end if;
  select count(*) into recent from public.posts where author_id = new.author_id and created_at > now() - interval '24 hours';
  if recent >= s.daily_post_limit then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  select coalesce(sum((metadata->>'size')::bigint), 0) into used from storage.objects where bucket_id = 'outfit-images';
  if used >= s.max_storage_bytes then
    raise exception 'quota_exceeded' using errcode = 'P0001';
  end if;
  new.moderation_status := case when s.require_review then 'pending' else 'visible' end;
  new.featured_on := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_posts_before_insert on public.posts;
create trigger trg_posts_before_insert before insert on public.posts
  for each row execute function public.posts_before_insert();

create or replace function public.posts_before_update()
returns trigger language plpgsql as $$
begin
  -- Only privileged roles (dashboard / service role) may change moderation or ownership fields.
  if current_user in ('authenticated', 'anon') then
    if new.moderation_status is distinct from old.moderation_status
       or new.featured_on is distinct from old.featured_on
       or new.author_id <> old.author_id
       or new.image_path <> old.image_path
       or new.thumbnail_path <> old.thumbnail_path then
      raise exception 'forbidden_update' using errcode = 'P0001';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_posts_before_update on public.posts;
create trigger trg_posts_before_update before update on public.posts
  for each row execute function public.posts_before_update();

-- ---------------------------------------------------------------------------
-- Hearts. Primary key (post_id, user_id) prevents duplicate hearts.
-- ---------------------------------------------------------------------------
create table if not exists public.hearts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_hearts_user on public.hearts (user_id);
alter table public.hearts enable row level security;

-- Users can only see / write their own heart rows; counts come from get_feed().
create policy "users read own hearts" on public.hearts
  for select to authenticated using (user_id = auth.uid());
create policy "users heart visible posts" on public.hearts
  for insert to authenticated with check (
    user_id = auth.uid()
    -- no hearting your own post
    and not exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
    and exists (select 1 from public.posts p where p.id = post_id and p.moderation_status = 'visible' and p.visibility = 'public')
  );
create policy "users remove own hearts" on public.hearts
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason_code text not null check (reason_code in ('spam','harassment','sexual','impersonation','copyright','privacy','other')),
  status text not null default 'open' check (status in ('open','reviewing','resolved','rejected')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
  -- No table CHECK on targets: FKs are ON DELETE SET NULL, and a CHECK would block deleting a
  -- reported post/account (CutPick bug 2026-10-23). "Must name a target" lives in the insert policy.
);
create index if not exists idx_reports_status on public.reports (status, created_at);
create unique index if not exists uq_report_once_post on public.reports (reporter_id, post_id) where post_id is not null;
create unique index if not exists uq_report_once_user on public.reports (reporter_id, reported_user_id) where post_id is null;
alter table public.reports enable row level security;

create policy "users file reports" on public.reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid() and status = 'open'
    and (post_id is not null or reported_user_id is not null)
    -- no reporting yourself or your own post
    and (reported_user_id is null or reported_user_id <> auth.uid())
    and (post_id is null or not exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
  );
create policy "users see own reports" on public.reports
  for select to authenticated using (reporter_id = auth.uid());
-- No update/delete policies: operators handle reports via the dashboard.

create or replace function public.reports_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  threshold int;
  n int;
begin
  if new.post_id is null then return new; end if;
  select auto_hide_report_threshold into threshold from public.community_settings where id;
  select count(distinct reporter_id) into n from public.reports where post_id = new.post_id and status in ('open','reviewing');
  if n >= threshold then
    update public.posts set moderation_status = 'hidden' where id = new.post_id and moderation_status = 'visible';
  end if;
  return new;
end $$;
drop trigger if exists trg_reports_after_insert on public.reports;
create trigger trg_reports_after_insert after insert on public.reports
  for each row execute function public.reports_after_insert();

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;

create policy "users read own blocks" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());
create policy "users create own blocks" on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid());
create policy "users delete own blocks" on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Feed RPC: like counts computed server-side; blocks hidden in BOTH directions.
-- SECURITY DEFINER is required to evaluate blocks created by the other user,
-- so the function re-applies visibility rules explicitly.
-- ---------------------------------------------------------------------------
create or replace function public.get_feed(
  p_featured boolean default false,
  p_style text default null,
  p_before timestamptz default null,
  p_limit int default 20,
  p_post_id uuid default null,
  p_mine boolean default false
)
returns table (
  id uuid, author_id uuid, author_handle text, image_path text, thumbnail_path text,
  title text, style_tags text[], occasion text, weather_summary text, featured_on date,
  created_at timestamptz, heart_count bigint, hearted_by_me boolean, moderation_status text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.author_id, pr.handle, p.image_path, p.thumbnail_path,
         p.title, p.style_tags, p.occasion, p.weather_summary, p.featured_on, p.created_at,
         (select count(*) from public.hearts h where h.post_id = p.id) as heart_count,
         exists (select 1 from public.hearts h where h.post_id = p.id and h.user_id = auth.uid()) as hearted_by_me,
         p.moderation_status
  from public.posts p
  join public.profiles pr on pr.id = p.author_id
  where
    (
      (p_mine and auth.uid() is not null and p.author_id = auth.uid())
      or (not p_mine and p.moderation_status = 'visible' and p.visibility = 'public')
    )
    and (p_post_id is null or p.id = p_post_id)
    -- "오늘의 베스트 착장": operator-curated for today (KST). Ordered by time, never by hearts.
    and (not p_featured or p.featured_on = (now() at time zone 'Asia/Seoul')::date)
    and (p_style is null or p_style = any(p.style_tags))
    and (p_before is null or p.created_at < p_before)
    and not exists (
      select 1 from public.blocks b
      where auth.uid() is not null
        and ((b.blocker_id = auth.uid() and b.blocked_id = p.author_id)
          or (b.blocker_id = p.author_id and b.blocked_id = auth.uid()))
    )
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;
revoke all on function public.get_feed(boolean, text, timestamptz, int, uuid, boolean) from public;
grant execute on function public.get_feed(boolean, text, timestamptz, int, uuid, boolean) to anon, authenticated;

-- Blocked list with handles (only the caller's own blocks).
create or replace function public.get_my_blocks()
returns table (blocked_id uuid, handle text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.blocked_id, pr.handle, b.created_at
  from public.blocks b left join public.profiles pr on pr.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;
revoke all on function public.get_my_blocks() from public;
grant execute on function public.get_my_blocks() to authenticated;

-- ---------------------------------------------------------------------------
-- Account deletion. Client removes its storage folder first (storage API),
-- then calls this to delete rows and the auth user.
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;
  delete from public.hearts where user_id = uid;
  delete from public.blocks where blocker_id = uid or blocked_id = uid;
  update public.reports set reporter_id = null where reporter_id = uid;
  delete from public.posts where author_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket: JPEG only, size-limited, public read, owner-folder writes.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('outfit-images', 'outfit-images', true, 2097152, array['image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "owners upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'outfit-images' and (storage.foldername(name))[1] = auth.uid()::text and lower(storage.extension(name)) = 'jpg');
create policy "owners delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'outfit-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners list own files" on storage.objects
  for select to authenticated
  using (bucket_id = 'outfit-images' and (storage.foldername(name))[1] = auth.uid()::text);
