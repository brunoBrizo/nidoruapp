create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;
grant usage on schema app_private to postgres, service_role;

comment on schema app_private is
  'Private Supabase helper schema for security-definer functions, triggers, and server-only database utilities. Do not expose through the Data API.';

create or replace function app_private.enable_rls_for_public_tables()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  command record;
begin
  for command in
    select *
    from pg_event_trigger_ddl_commands()
  loop
    if command.schema_name = 'public' and command.object_type = 'table' then
      execute format('alter table %s enable row level security', command.object_identity);
    end if;
  end loop;
end;
$$;

comment on function app_private.enable_rls_for_public_tables() is
  'Enables RLS automatically for newly created public tables. Migrations must still add explicit grants, policies, and indexes.';

drop event trigger if exists enable_public_table_rls;

create event trigger enable_public_table_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function app_private.enable_rls_for_public_tables();
