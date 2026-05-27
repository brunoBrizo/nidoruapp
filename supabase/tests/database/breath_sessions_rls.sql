begin;

select plan(10);

select has_table('public', 'breath_sessions', 'generic breath sessions table exists');

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.breath_sessions'::regclass
  ),
  'generic breath sessions has RLS enabled'
);

insert into public.breath_sessions (
  local_session_id,
  local_install_id,
  user_id,
  source,
  technique_id,
  audio_cue_mode_id,
  started_at,
  completed_at,
  completion_persisted_at,
  duration_seconds,
  completed_breath_cycles
)
values
  (
    'session_owneraaaaaaa',
    'install_owneraaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'breathe_tab',
    'coherent-breathing',
    'gentle-bell',
    '2026-05-20T01:00:00Z',
    '2026-05-20T01:04:00Z',
    '2026-05-20T01:04:01Z',
    240,
    18
  ),
  (
    'session_otherbbbbbbb',
    'install_otherbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'rescue_me',
    '4-7-8-sleep',
    'none',
    '2026-05-20T01:05:00Z',
    '2026-05-20T01:10:00Z',
    '2026-05-20T01:10:01Z',
    300,
    16
  );

set local role anon;

select throws_ok(
  $$ select local_session_id from public.breath_sessions $$,
  '42501',
  null,
  'anon cannot read user-owned breath sessions'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
  $$ select local_session_id from public.breath_sessions order by local_session_id $$,
  $$ values ('session_owneraaaaaaa'::text) $$,
  'authenticated users can read only their own synced breath sessions'
);

select lives_ok(
  $$
    insert into public.breath_sessions (
      local_session_id,
      local_install_id,
      user_id,
      source,
      technique_id,
      audio_cue_mode_id,
      started_at,
      completed_at,
      completion_persisted_at,
      duration_seconds,
      completed_breath_cycles
    )
    values (
      'session_ownerinsert0',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'morning_check_in',
      'diaphragmatic-breathing',
      'soft-whoosh',
      '2026-05-20T01:11:00Z',
      '2026-05-20T01:15:00Z',
      '2026-05-20T01:15:01Z',
      240,
      12
    )
  $$,
  'authenticated users can insert their own breath sessions'
);

select lives_ok(
  $$
    insert into public.breath_sessions (
      local_session_id,
      local_install_id,
      user_id,
      source,
      technique_id,
      audio_cue_mode_id,
      started_at,
      completed_at,
      completion_persisted_at,
      duration_seconds,
      completed_breath_cycles
    )
    values (
      'session_ownerwinddown',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'wind_down',
      'coherent-breathing',
      'nature-ambient',
      '2026-05-20T01:16:00Z',
      '2026-05-20T01:26:00Z',
      '2026-05-20T01:26:01Z',
      600,
      54
    )
  $$,
  'authenticated users can insert their own wind-down breath sessions'
);

select throws_ok(
  $$
    insert into public.breath_sessions (
      local_session_id,
      local_install_id,
      user_id,
      source,
      plan_id,
      technique_id,
      audio_cue_mode_id,
      started_at,
      completed_at,
      completion_persisted_at,
      duration_seconds,
      completed_breath_cycles
    )
    values (
      'session_ownerplanbad',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'breathe_tab',
      'anxiety_relief',
      'box-breathing',
      'none',
      '2026-05-20T01:27:00Z',
      '2026-05-20T01:31:00Z',
      '2026-05-20T01:31:01Z',
      240,
      15
    )
  $$,
  '23514',
  null,
  'generic breath-session sync rejects health-adjacent plan taxonomy'
);

select throws_ok(
  $$
    insert into public.breath_sessions (
      local_session_id,
      local_install_id,
      user_id,
      source,
      technique_id,
      audio_cue_mode_id,
      started_at,
      completed_at,
      completion_persisted_at,
      duration_seconds,
      completed_breath_cycles
    )
    values (
      'session_crossinsert',
      'install_owneraaaaaaaa',
      '22222222-2222-4222-8222-222222222222',
      'breathe_tab',
      'box-breathing',
      'nature-ambient',
      '2026-05-20T01:11:00Z',
      '2026-05-20T01:15:00Z',
      '2026-05-20T01:15:01Z',
      240,
      12
    )
  $$,
  '42501',
  null,
  'authenticated users cannot insert cross-user breath sessions'
);

select lives_ok(
  $$
    update public.breath_sessions
    set completed_breath_cycles = 19
    where local_session_id = 'session_owneraaaaaaa'
  $$,
  'authenticated users can update their own breath sessions'
);

select throws_ok(
  $$
    update public.breath_sessions
    set user_id = '22222222-2222-4222-8222-222222222222'
    where local_session_id = 'session_owneraaaaaaa'
  $$,
  '42501',
  null,
  'authenticated users cannot update a breath session into another owner'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();

rollback;
