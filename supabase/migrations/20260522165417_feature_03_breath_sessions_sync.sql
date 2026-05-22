create table public.breath_sessions (
  local_session_id text not null
    check (local_session_id ~ '^session_[A-Za-z0-9_-]{8,64}$'),
  local_install_id text not null
    check (local_install_id ~ '^install_[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null,
  source text not null
    check (source in ('breathe_tab', 'first_session', 'morning_check_in', 'rescue_me')),
  plan_id text
    check (
      plan_id is null
      or plan_id in ('sleep_focused', 'anxiety_relief', 'stress_reset', 'general_wellness')
    ),
  technique_id text not null
    check (
      technique_id in (
        '4-7-8-sleep',
        'box-breathing',
        'coherent-breathing',
        'diaphragmatic-breathing',
        'physiological-sigh'
      )
    ),
  audio_cue_mode_id text
    check (
      audio_cue_mode_id is null
      or audio_cue_mode_id in ('none', 'gentle-bell', 'soft-whoosh', 'nature-ambient')
    ),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  completion_persisted_at timestamptz not null,
  duration_seconds integer not null
    check (duration_seconds > 0 and duration_seconds <= 1800),
  completed_breath_cycles integer not null
    check (completed_breath_cycles >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_session_id)
);

alter table public.breath_sessions enable row level security;

revoke all on table public.breath_sessions from anon;
grant select, insert, update on table public.breath_sessions to authenticated;

create index breath_sessions_user_completed_idx
  on public.breath_sessions (user_id, completed_at desc);

create policy "Users can manage their own breath sessions"
  on public.breath_sessions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.breath_sessions is
  'User-owned completed generic breath-session rows synced only after local completion and post-value auth. RLS prevents cross-user reads and writes.';
