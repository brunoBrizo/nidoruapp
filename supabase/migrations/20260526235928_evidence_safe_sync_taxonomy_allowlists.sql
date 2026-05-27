alter table public.first_session_sync_records
  drop constraint if exists first_session_sync_records_technique_id_check;

alter table public.first_session_sync_records
  add constraint first_session_sync_records_technique_id_check
  check (
    technique_id in (
      '4-7-8-sleep',
      'box-breathing',
      'coherent-breathing',
      'diaphragmatic-breathing',
      'physiological-sigh'
    )
  );

alter table public.breath_sessions
  drop constraint if exists breath_sessions_source_check;

alter table public.breath_sessions
  add constraint breath_sessions_source_check
  check (
    source in ('breathe_tab', 'first_session', 'morning_check_in', 'rescue_me', 'wind_down')
  );

update public.breath_sessions
set plan_id = null
where plan_id is not null;

alter table public.breath_sessions
  drop constraint if exists breath_sessions_plan_id_check;

alter table public.breath_sessions
  add constraint breath_sessions_plan_id_check
  check (plan_id is null);

comment on column public.breath_sessions.plan_id is
  'Deprecated compatibility column. Mobile sync redacts plan IDs because plan taxonomy can reveal health-adjacent onboarding intent.';
