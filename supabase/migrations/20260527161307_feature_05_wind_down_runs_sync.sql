create table public.wind_down_runs (
  local_run_id text not null
    check (local_run_id ~ '^winddown_[A-Za-z0-9_-]{8,64}$'),
  local_install_id text not null
    check (local_install_id ~ '^install_[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null,
  routine_id text not null
    check (
      routine_id in (
        'wind_down_sleep_starter',
        'wind_down_racing_thoughts',
        'wind_down_daily_calm'
      )
    ),
  context_goal text not null
    check (
      context_goal in (
        'fall_asleep_faster',
        'calm_racing_thoughts',
        'wake_up_fewer_times'
      )
    ),
  local_breath_session_id text
    check (
      local_breath_session_id is null
      or local_breath_session_id ~ '^session_[A-Za-z0-9_-]{8,64}$'
    ),
  ambient_sound_id text not null
    check (
      ambient_sound_id in (
        'light-rain',
        'heavy-rain',
        'rain-on-window',
        'thunderstorm',
        'ocean-waves',
        'forest',
        'river-stream',
        'wind',
        'white-noise',
        'brown-noise',
        'pink-noise',
        'fireplace-crackling',
        'cafe-ambience',
        'fan',
        '432hz-tone',
        'delta-wave-binaural'
      )
    ),
  started_at timestamptz not null,
  completed_at timestamptz,
  stopped_at timestamptz,
  total_duration_seconds integer not null
    check (total_duration_seconds >= 0 and total_duration_seconds <= 28800),
  completion_state text not null
    check (completion_state in ('completed', 'stopped')),
  stop_reason text
    check (
      stop_reason is null
      or stop_reason in (
        'user_stop',
        'app_backgrounded_after_main_exercise',
        'interrupted',
        'timer_ended',
        'unknown'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_run_id),
  check (
    completion_state != 'completed'
    or (completed_at is not null and stopped_at is null and stop_reason is null)
  ),
  check (
    completion_state != 'stopped'
    or (stopped_at is not null and stop_reason is not null and completed_at is null)
  )
);

alter table public.wind_down_runs enable row level security;

revoke all on table public.wind_down_runs from anon;
grant select, insert, update on table public.wind_down_runs to authenticated;

create index wind_down_runs_user_started_idx
  on public.wind_down_runs (user_id, started_at desc);

create index wind_down_runs_user_completion_state_idx
  on public.wind_down_runs (user_id, completion_state, started_at desc);

create policy "Users can manage their own wind-down runs"
  on public.wind_down_runs
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.wind_down_runs is
  'User-owned terminal Wind-Down run sync rows created only after local completion or stop and post-value auth. RLS prevents cross-user reads and writes.';

comment on column public.wind_down_runs.routine_id is
  'Internal Wind-Down routine taxonomy for user-owned sync and future insights. Not public copy or a clinical claim.';

comment on column public.wind_down_runs.context_goal is
  'Internal Wind-Down goal taxonomy for user-owned sync and future insights. Do not expose as public clinical labels.';

comment on column public.wind_down_runs.ambient_sound_id is
  'Internal bundled ambient sound identifier for user-owned routine history; not evidence of sound-frequency efficacy.';
