begin;

select plan(3);

select has_schema('app_private', 'private helper schema exists');

select is(
  (
    select count(*)::integer
    from pg_event_trigger
    where evtname = 'enable_public_table_rls'
  ),
  1,
  'public table RLS guard is installed'
);

create table public.rls_guard_test (
  id bigint primary key generated always as identity,
  user_id uuid
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.rls_guard_test'::regclass
  ),
  'new public tables get RLS enabled'
);

select * from finish();

rollback;
