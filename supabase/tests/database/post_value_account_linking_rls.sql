begin;

select plan(9);

select has_table('public', 'local_install_links', 'local install links table exists');
select has_table('public', 'first_session_sync_records', 'first session sync table exists');
select has_table(
  'public',
  'post_session_reflection_sync_records',
  'post-session reflection sync table exists'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.local_install_links'::regclass
  ),
  'local install links has RLS enabled'
);

insert into public.local_install_links (
  local_install_id,
  user_id,
  auth_provider,
  linked_at,
  sync_status
)
values
  (
    'install_aaaaaaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'apple',
    '2026-05-20T01:06:00Z',
    'succeeded'
  ),
  (
    'install_bbbbbbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'google',
    '2026-05-20T01:07:00Z',
    'succeeded'
  );

insert into public.first_session_sync_records (
  local_session_id,
  local_install_id,
  user_id,
  technique_id,
  completed_at,
  duration_seconds,
  completed_breath_cycles
)
values
  (
    'session_aaaaaaaaaaaaaaaa',
    'install_aaaaaaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'coherent-breathing',
    '2026-05-20T01:04:00Z',
    240,
    18
  ),
  (
    'session_bbbbbbbbbbbbbbbb',
    'install_bbbbbbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'box-breathing',
    '2026-05-20T01:05:00Z',
    240,
    20
  );

set local role anon;

select is_empty(
  $$ select local_install_id from public.local_install_links $$,
  'anon cannot read install-to-user mappings'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
  $$ select local_install_id from public.local_install_links order by local_install_id $$,
  $$ values ('install_aaaaaaaaaaaaaaaa'::text) $$,
  'authenticated users can read only their own install mapping'
);

select results_eq(
  $$ select local_session_id from public.first_session_sync_records order by local_session_id $$,
  $$ values ('session_aaaaaaaaaaaaaaaa'::text) $$,
  'authenticated users can read only their own synced first sessions'
);

select throws_ok(
  $$
    insert into public.local_install_links (
      local_install_id,
      user_id,
      auth_provider,
      linked_at
    )
    values (
      'install_crossuser000000',
      '22222222-2222-4222-8222-222222222222',
      'apple',
      '2026-05-20T01:08:00Z'
    )
  $$,
  '42501',
  null,
  'authenticated users cannot insert cross-user mappings'
);

select throws_ok(
  $$
    update public.first_session_sync_records
    set user_id = '22222222-2222-4222-8222-222222222222'
    where local_session_id = 'session_aaaaaaaaaaaaaaaa'
  $$,
  '42501',
  null,
  'authenticated users cannot update synced records into another owner'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();

rollback;
