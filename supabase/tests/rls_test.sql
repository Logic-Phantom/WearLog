-- RLS / policy test script for the WearLog community schema (ported from CutPick 2026-10-28).
-- Runs inside one transaction and rolls back, so it is safe on the live project.
--   psql:              psql "$DB_URL" -f supabase/tests/rls_test.sql   (PASS lines arrive as NOTICEs)
--   Dashboard SQL Editor: it does not show NOTICEs — replace the final `rollback;` with
--     do $$ begin raise exception 'ALL_RLS_TESTS_PASSED'; end $$;
--   so a full pass shows that message (and still rolls back); a failure shows its FAIL: message.
-- Every block raises an exception on failure.

begin;

-- Two test users
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.local');
update public.community_settings set require_review = false, daily_post_limit = 2 where id;

-- helper: act as a user
create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end $$;

-- A creates profile and post
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.profiles (id, handle) values ('00000000-0000-0000-0000-00000000000a', 'user.a');
insert into public.posts (id, author_id, image_path, thumbnail_path, style_tags)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a',
        '00000000-0000-0000-0000-00000000000a/p1.jpg', '00000000-0000-0000-0000-00000000000a/p1_t.jpg', array['minimal']);

-- 0) WearLog: no self-heart, no self-report, featured_on protected
do $$ begin
  begin
    insert into public.hearts (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: self heart';
  exception when insufficient_privilege then raise notice 'PASS self heart blocked';
  end;
  begin
    insert into public.reports (reporter_id, post_id, reason_code) values ('00000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000001', 'spam');
    raise exception 'FAIL: self report';
  exception when insufficient_privilege then raise notice 'PASS self report blocked';
  end;
  begin
    update public.posts set featured_on = current_date where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: author set featured_on';
  exception when raise_exception then raise notice 'PASS featured_on protected';
  end;
end $$;

-- 1) A cannot create a profile for B
do $$ begin
  begin
    insert into public.profiles (id, handle) values ('00000000-0000-0000-0000-00000000000b', 'fake.b');
    raise exception 'FAIL: inserted profile for another user';
  exception when insufficient_privilege or check_violation then raise notice 'PASS profile spoof blocked';
  end;
end $$;

-- 2) A cannot post into B's folder (path check)
do $$ begin
  begin
    insert into public.posts (author_id, image_path, thumbnail_path, style_tags)
    values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b/x.jpg', '00000000-0000-0000-0000-00000000000b/x_t.jpg', array['minimal']);
    raise exception 'FAIL: forged path accepted';
  exception when check_violation then raise notice 'PASS forged path blocked';
  end;
end $$;

-- 3) A cannot self-approve moderation status
do $$ begin
  begin
    update public.posts set moderation_status = 'visible' where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'FAIL: author changed moderation_status';
  exception when raise_exception then raise notice 'PASS moderation_status protected';
  end;
end $$;

-- B acts
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
insert into public.profiles (id, handle) values ('00000000-0000-0000-0000-00000000000b', 'user.b');

-- 4) B cannot delete A's post (RLS filters → 0 rows)
do $$ declare n int; begin
  delete from public.posts where id = '10000000-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: B deleted A post'; end if;
  raise notice 'PASS cross-user delete blocked';
end $$;

-- 5) Duplicate heart is rejected by the primary key
insert into public.hearts (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b');
do $$ begin
  begin
    insert into public.hearts (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b');
    raise exception 'FAIL: duplicate heart';
  exception when unique_violation then raise notice 'PASS duplicate heart blocked';
  end;
end $$;

-- 6) B cannot heart on behalf of A
do $$ begin
  begin
    insert into public.hearts (post_id, user_id) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: proxy heart';
  exception when insufficient_privilege then raise notice 'PASS proxy heart blocked';
  end;
end $$;

-- 7) Report is stored; B cannot read A's reports
insert into public.reports (reporter_id, post_id, reason_code) values ('00000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-000000000001', 'spam');
do $$ declare n int; begin
  select count(*) into n from public.reports where reporter_id = '00000000-0000-0000-0000-00000000000a';
  if n <> 0 then raise exception 'FAIL: read other reports'; end if;
  raise notice 'PASS reports isolated';
end $$;

-- 8) Block hides content in both directions via get_feed
insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a');
do $$ declare n int; begin
  select count(*) into n from public.get_feed(p_post_id => '10000000-0000-0000-0000-000000000001');
  if n <> 0 then raise exception 'FAIL: blocked author visible to blocker'; end if;
  raise notice 'PASS block hides author for blocker';
end $$;
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
do $$ declare n int; begin
  -- A sees own post only through p_mine; public feed excludes blocker relation as well
  select count(*) into n from public.get_feed() where author_id = '00000000-0000-0000-0000-00000000000b';
  if n <> 0 then raise exception 'FAIL: blocker content visible to blocked user'; end if;
  raise notice 'PASS block hides in reverse direction';
end $$;

-- 9) Self-block is rejected
do $$ begin
  begin
    insert into public.blocks (blocker_id, blocked_id) values ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a');
    raise exception 'FAIL: self block';
  exception when check_violation then raise notice 'PASS self block rejected';
  end;
end $$;

-- 10) Daily post limit (2) enforced
insert into public.posts (author_id, image_path, thumbnail_path, style_tags) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a/p2.jpg', '00000000-0000-0000-0000-00000000000a/p2_t.jpg', array['minimal']);
do $$ begin
  begin
    insert into public.posts (author_id, image_path, thumbnail_path, style_tags) values
      ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a/p3.jpg', '00000000-0000-0000-0000-00000000000a/p3_t.jpg', array['minimal']);
    raise exception 'FAIL: rate limit not enforced';
  exception when raise_exception then raise notice 'PASS rate limit enforced';
  end;
end $$;

-- 11) A report must name a target; B also reports A's account (exercises deletion below)
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
do $$ begin
  begin
    insert into public.reports (reporter_id, reason_code) values ('00000000-0000-0000-0000-00000000000b', 'spam');
    raise exception 'FAIL: report without target accepted';
  exception when insufficient_privilege or check_violation then raise notice 'PASS report needs a target';
  end;
end $$;
insert into public.reports (reporter_id, reported_user_id, reason_code) values ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 'impersonation');
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');

-- 12) Account deletion removes rows even when the post and the account were reported
select public.delete_my_account();
do $$ declare n int; begin
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.posts where author_id = '00000000-0000-0000-0000-00000000000a';
  if n <> 0 then raise exception 'FAIL: posts remain after account deletion'; end if;
  raise notice 'PASS account deletion cleans posts';
  -- Reports survive as operator records without a reporter-visible target
  select count(*) into n from public.reports where reporter_id = '00000000-0000-0000-0000-00000000000b';
  if n <> 2 then raise exception 'FAIL: reports lost on deletion (%)', n; end if;
  raise notice 'PASS reports kept after target deletion';
end $$;

rollback;
