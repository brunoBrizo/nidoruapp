begin;

select plan(12);

select has_table('public', 'wind_down_runs', 'wind-down runs sync table exists');

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.wind_down_runs'::regclass
  ),
  'wind-down runs has RLS enabled'
);

insert into public.wind_down_runs (
  local_run_id,
  local_install_id,
  user_id,
  routine_id,
  context_goal,
  local_breath_session_id,
  ambient_sound_id,
  started_at,
  completed_at,
  total_duration_seconds,
  completion_state
)
values
  (
    'winddown_owneraaaaaaa',
    'install_owneraaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'wind_down_sleep_starter',
    'fall_asleep_faster',
    'session_ownerwinddown',
    'light-rain',
    '2026-05-27T02:00:00Z',
    '2026-05-27T02:20:00Z',
    1200,
    'completed'
  ),
  (
    'winddown_otherbbbbbbb',
    'install_otherbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'wind_down_racing_thoughts',
    'calm_racing_thoughts',
    'session_otherwinddown',
    'pink-noise',
    '2026-05-27T03:00:00Z',
    '2026-05-27T03:12:00Z',
    720,
    'completed'
  );

set local role anon;

select throws_ok(
  $$ select local_run_id from public.wind_down_runs $$,
  '42501',
  null,
  'anon cannot read user-owned wind-down runs'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
  $$ select local_run_id from public.wind_down_runs order by local_run_id $$,
  $$ values ('winddown_owneraaaaaaa'::text) $$,
  'authenticated users can read only their own synced wind-down runs'
);

select lives_ok(
  $$
    insert into public.wind_down_runs (
      local_run_id,
      local_install_id,
      user_id,
      routine_id,
      context_goal,
      local_breath_session_id,
      ambient_sound_id,
      started_at,
      completed_at,
      total_duration_seconds,
      completion_state
    )
    values (
      'winddown_ownerinsert',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'wind_down_daily_calm',
      'wake_up_fewer_times',
      'session_ownerinsert',
      'brown-noise',
      '2026-05-27T04:00:00Z',
      '2026-05-27T04:10:00Z',
      600,
      'completed'
    )
  $$,
  'authenticated users can insert their own completed wind-down runs'
);

select lives_ok(
  $$
    insert into public.wind_down_runs (
      local_run_id,
      local_install_id,
      user_id,
      routine_id,
      context_goal,
      local_breath_session_id,
      ambient_sound_id,
      started_at,
      stopped_at,
      total_duration_seconds,
      completion_state,
      stop_reason
    )
    values (
      'winddown_ownerstopped',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'wind_down_racing_thoughts',
      'calm_racing_thoughts',
      'session_ownerstopped',
      'forest',
      '2026-05-27T05:00:00Z',
      '2026-05-27T05:08:00Z',
      480,
      'stopped',
      'user_stop'
    )
  $$,
  'authenticated users can insert their own stopped wind-down runs with stop reason'
);

select throws_ok(
  $$
    insert into public.wind_down_runs (
      local_run_id,
      local_install_id,
      user_id,
      routine_id,
      context_goal,
      ambient_sound_id,
      started_at,
      completed_at,
      total_duration_seconds,
      completion_state
    )
    values (
      'winddown_crossinsert',
      'install_owneraaaaaaaa',
      '22222222-2222-4222-8222-222222222222',
      'wind_down_sleep_starter',
      'fall_asleep_faster',
      'light-rain',
      '2026-05-27T04:00:00Z',
      '2026-05-27T04:10:00Z',
      600,
      'completed'
    )
  $$,
  '42501',
  null,
  'authenticated users cannot insert cross-user wind-down runs'
);

select throws_ok(
  $$
    insert into public.wind_down_runs (
      local_run_id,
      local_install_id,
      user_id,
      routine_id,
      context_goal,
      ambient_sound_id,
      started_at,
      completed_at,
      total_duration_seconds,
      completion_state
    )
    values (
      'winddown_clinicalbad',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'wind_down_sleep_starter',
      'panic_treatment',
      'light-rain',
      '2026-05-27T04:00:00Z',
      '2026-05-27T04:10:00Z',
      600,
      'completed'
    )
  $$,
  '23514',
  null,
  'wind-down sync rejects non-allowlisted clinical goal labels'
);

select lives_ok(
  $$
    update public.wind_down_runs
    set total_duration_seconds = 1210
    where local_run_id = 'winddown_owneraaaaaaa'
  $$,
  'authenticated users can update their own wind-down runs'
);

select throws_ok(
  $$
    update public.wind_down_runs
    set user_id = '22222222-2222-4222-8222-222222222222'
    where local_run_id = 'winddown_owneraaaaaaa'
  $$,
  '42501',
  null,
  'authenticated users cannot update a wind-down run into another owner'
);

select lives_ok(
  $$
    insert into public.wind_down_runs (
      local_run_id,
      local_install_id,
      user_id,
      routine_id,
      context_goal,
      ambient_sound_id,
      started_at,
      completed_at,
      total_duration_seconds,
      completion_state
    )
    values (
      'winddown_owneraaaaaaa',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'wind_down_sleep_starter',
      'fall_asleep_faster',
      'light-rain',
      '2026-05-27T02:00:00Z',
      '2026-05-27T02:21:00Z',
      1260,
      'completed'
    )
    on conflict (user_id, local_run_id) do update set
      completed_at = excluded.completed_at,
      total_duration_seconds = excluded.total_duration_seconds,
      updated_at = now()
  $$,
  'idempotent owner upsert uses user_id and local_run_id without duplicate rows'
);

select results_eq(
  $$ select count(*)::integer from public.wind_down_runs where local_run_id = 'winddown_owneraaaaaaa' $$,
  $$ values (1) $$,
  'idempotent owner upsert keeps a single remote Wind-Down row'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();

rollback;
