create table public.local_install_links (
  local_install_id text primary key not null
    check (local_install_id ~ '^install_[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null,
  auth_provider text not null
    check (auth_provider in ('anonymous', 'apple', 'google')),
  linked_at timestamptz not null,
  sync_status text not null default 'pending'
    check (sync_status in ('pending', 'succeeded', 'retry_pending')),
  last_sync_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.first_session_sync_records (
  local_session_id text not null
    check (local_session_id ~ '^session_[A-Za-z0-9_-]{8,64}$'),
  local_install_id text not null
    check (local_install_id ~ '^install_[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null,
  technique_id text not null
    check (
      technique_id in (
        '4-7-8-sleep',
        'box-breathing',
        'coherent-breathing',
        'physiological-sigh'
      )
    ),
  completed_at timestamptz not null,
  duration_seconds integer not null
    check (duration_seconds > 0 and duration_seconds <= 1800),
  completed_breath_cycles integer
    check (completed_breath_cycles is null or completed_breath_cycles >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_session_id)
);

create table public.post_session_reflection_sync_records (
  local_reflection_id text not null
    check (local_reflection_id ~ '^reflection_[A-Za-z0-9_-]{8,64}$'),
  local_session_id text not null
    check (local_session_id ~ '^session_[A-Za-z0-9_-]{8,64}$'),
  local_install_id text not null
    check (local_install_id ~ '^install_[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null,
  feeling text not null
    check (feeling in ('same', 'better', 'much_better')),
  reflected_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, local_reflection_id)
);

alter table public.local_install_links enable row level security;
alter table public.first_session_sync_records enable row level security;
alter table public.post_session_reflection_sync_records enable row level security;

grant select, insert, update on public.local_install_links to authenticated;
grant select, insert, update on public.first_session_sync_records to authenticated;
grant select, insert, update on public.post_session_reflection_sync_records to authenticated;

create index local_install_links_user_idx
  on public.local_install_links (user_id, linked_at desc);

create index first_session_sync_records_user_completed_idx
  on public.first_session_sync_records (user_id, completed_at desc);

create index post_session_reflection_sync_records_user_reflected_idx
  on public.post_session_reflection_sync_records (user_id, reflected_at desc);

create policy "Users can manage their own local install links"
  on public.local_install_links
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own first session sync records"
  on public.first_session_sync_records
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage their own reflection sync records"
  on public.post_session_reflection_sync_records
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.local_install_links is
  'User-owned mapping between local install IDs and Supabase users after post-value auth. RLS prevents cross-user reads and writes.';

comment on table public.first_session_sync_records is
  'User-owned first-session sync records created only after local completion and post-value account eligibility.';

comment on table public.post_session_reflection_sync_records is
  'User-owned post-session reflection sync records created after the reward moment.';
