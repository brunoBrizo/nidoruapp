create extension if not exists pgcrypto;

create table public.sound_assets (
  sound_id text primary key
    check (
      sound_id in (
        'light-rain',
        'heavy-rain',
        'rain-on-window',
        'thunderstorm',
        'ocean-waves',
        'forest',
        'river-stream',
        'wind',
        'brown-noise',
        'pink-noise',
        'fireplace-crackling',
        'cafe-ambience',
        '432hz-tone',
        'delta-wave-binaural'
      )
    ),
  category_id text not null
    check (category_id in ('rain', 'nature', 'noise', 'environment', 'tones')),
  default_volume numeric(4, 3) not null
    check (default_volume >= 0 and default_volume <= 1),
  audio_format text not null
    check (audio_format = 'aac-lc-m4a'),
  bundled_asset_path text not null
    check (bundled_asset_path ~ '^apps/mobile/assets/audio/sleep/[a-z0-9-]+\.m4a$'),
  minimum_duration_seconds integer not null
    check (minimum_duration_seconds >= 240),
  duration_seconds integer
    check (duration_seconds is null or duration_seconds >= minimum_duration_seconds),
  requires_network boolean not null default false,
  catalog_status text not null
    check (catalog_status in ('blocked_missing_licensed_audio', 'bundled_verified')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sound_asset_translations (
  sound_id text not null references public.sound_assets(sound_id) on delete cascade,
  locale text not null
    check (locale in ('en', 'es', 'pt-BR')),
  display_name text not null
    check (length(trim(display_name)) between 1 and 80),
  category_label text not null
    check (length(trim(category_label)) between 1 and 80),
  evidence_safe_note text
    check (evidence_safe_note is null or length(trim(evidence_safe_note)) between 1 and 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (sound_id, locale)
);

create table public.sound_mixes (
  id uuid not null default gen_random_uuid(),
  local_mix_id text not null
    check (local_mix_id ~ '^soundmix_[A-Za-z0-9_-]{8,64}$'),
  local_install_id text not null
    check (local_install_id ~ '^install_[A-Za-z0-9_-]{8,64}$'),
  user_id uuid not null,
  name text not null
    check (length(trim(name)) between 1 and 40)
    check (name !~ '[[:cntrl:]]'),
  timer_preference text not null
    check (timer_preference in ('20', '30', '45', '60', 'infinity')),
  layer_0_sound_id text
    check (
      layer_0_sound_id is null
      or layer_0_sound_id in (
        'light-rain',
        'heavy-rain',
        'rain-on-window',
        'thunderstorm',
        'ocean-waves',
        'forest',
        'river-stream',
        'wind',
        'brown-noise',
        'pink-noise',
        'fireplace-crackling',
        'cafe-ambience',
        '432hz-tone',
        'delta-wave-binaural'
      )
    ),
  layer_0_volume numeric(5, 2)
    check (layer_0_volume is null or (layer_0_volume >= 0 and layer_0_volume <= 100)),
  layer_1_sound_id text
    check (
      layer_1_sound_id is null
      or layer_1_sound_id in (
        'light-rain',
        'heavy-rain',
        'rain-on-window',
        'thunderstorm',
        'ocean-waves',
        'forest',
        'river-stream',
        'wind',
        'brown-noise',
        'pink-noise',
        'fireplace-crackling',
        'cafe-ambience',
        '432hz-tone',
        'delta-wave-binaural'
      )
    ),
  layer_1_volume numeric(5, 2)
    check (layer_1_volume is null or (layer_1_volume >= 0 and layer_1_volume <= 100)),
  layer_2_sound_id text
    check (
      layer_2_sound_id is null
      or layer_2_sound_id in (
        'light-rain',
        'heavy-rain',
        'rain-on-window',
        'thunderstorm',
        'ocean-waves',
        'forest',
        'river-stream',
        'wind',
        'brown-noise',
        'pink-noise',
        'fireplace-crackling',
        'cafe-ambience',
        '432hz-tone',
        'delta-wave-binaural'
      )
    ),
  layer_2_volume numeric(5, 2)
    check (layer_2_volume is null or (layer_2_volume >= 0 and layer_2_volume <= 100)),
  mix_created_at timestamptz not null,
  mix_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id),
  unique (user_id, local_mix_id),
  check (mix_updated_at >= mix_created_at),
  check ((layer_0_sound_id is null) = (layer_0_volume is null)),
  check ((layer_1_sound_id is null) = (layer_1_volume is null)),
  check ((layer_2_sound_id is null) = (layer_2_volume is null)),
  check (layer_1_sound_id is null or layer_0_sound_id is not null),
  check (layer_2_sound_id is null or layer_1_sound_id is not null),
  check (
    layer_0_sound_id is null
    or layer_1_sound_id is null
    or layer_0_sound_id <> layer_1_sound_id
  ),
  check (
    layer_0_sound_id is null
    or layer_2_sound_id is null
    or layer_0_sound_id <> layer_2_sound_id
  ),
  check (
    layer_1_sound_id is null
    or layer_2_sound_id is null
    or layer_1_sound_id <> layer_2_sound_id
  )
);

alter table public.sound_assets enable row level security;
alter table public.sound_asset_translations enable row level security;
alter table public.sound_mixes enable row level security;

revoke all on table public.sound_assets from anon, authenticated;
revoke all on table public.sound_asset_translations from anon, authenticated;
revoke all on table public.sound_mixes from anon, authenticated;

grant select on table public.sound_assets to anon, authenticated;
grant select on table public.sound_asset_translations to anon, authenticated;
grant select, insert, update on table public.sound_mixes to authenticated;

create index sound_assets_category_idx
  on public.sound_assets (category_id, sound_id)
  where is_active;

create index sound_asset_translations_locale_idx
  on public.sound_asset_translations (locale, sound_id);

create index sound_mixes_user_updated_idx
  on public.sound_mixes (user_id, mix_updated_at desc);

create policy "Active sound assets are readable"
  on public.sound_assets
  for select
  to anon, authenticated
  using (is_active);

create policy "Active sound asset translations are readable"
  on public.sound_asset_translations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.sound_assets
      where sound_assets.sound_id = sound_asset_translations.sound_id
        and sound_assets.is_active
    )
  );

create policy "Users can manage their own sound mixes"
  on public.sound_mixes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.sound_assets is
  'Read-only sound metadata for bundled and future remote catalog assets. Does not store private R2 bucket keys or signed URLs.';

comment on table public.sound_asset_translations is
  'Read-only localized labels for sound metadata using the app launch locales.';

comment on table public.sound_mixes is
  'User-owned saved sound mixes synced after post-value auth. RLS prevents cross-user reads and writes.';

comment on column public.sound_mixes.id is
  'Server ID returned to the mobile client after idempotent saved-mix upsert and stored locally as remote_mix_id.';
