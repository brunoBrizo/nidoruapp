begin;

select plan(19);

select has_table('public', 'sound_assets', 'sound assets metadata table exists');
select has_table('public', 'sound_asset_translations', 'sound asset translations table exists');
select has_table('public', 'sound_mixes', 'sound mixes sync table exists');

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.sound_assets'::regclass
  ),
  'sound assets has RLS enabled'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.sound_asset_translations'::regclass
  ),
  'sound asset translations has RLS enabled'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.sound_mixes'::regclass
  ),
  'sound mixes has RLS enabled'
);

insert into public.sound_assets (
  sound_id,
  category_id,
  default_volume,
  audio_format,
  bundled_asset_path,
  minimum_duration_seconds,
  catalog_status,
  is_active
)
values
  (
    'light-rain',
    'rain',
    0.700,
    'aac-lc-m4a',
    'apps/mobile/assets/audio/sleep/light-rain.m4a',
    240,
    'blocked_missing_licensed_audio',
    true
  ),
  (
    'cafe-ambience',
    'environment',
    0.700,
    'aac-lc-m4a',
    'apps/mobile/assets/audio/sleep/cafe-ambience.m4a',
    240,
    'blocked_missing_licensed_audio',
    false
  );

insert into public.sound_asset_translations (
  sound_id,
  locale,
  display_name,
  category_label,
  evidence_safe_note
)
values
  (
    'light-rain',
    'en',
    'Light Rain',
    'Rain',
    null
  ),
  (
    'cafe-ambience',
    'en',
    'Cafe Ambience',
    'Environment',
    null
  );

insert into public.sound_mixes (
  local_mix_id,
  local_install_id,
  user_id,
  name,
  timer_preference,
  layer_0_sound_id,
  layer_0_volume,
  layer_1_sound_id,
  layer_1_volume,
  mix_created_at,
  mix_updated_at
)
values
  (
    'soundmix_owneraaaaaaa',
    'install_owneraaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Rain Hearth',
    '30',
    'light-rain',
    72,
    'brown-noise',
    58,
    '2026-05-28T12:00:00Z',
    '2026-05-28T12:05:00Z'
  ),
  (
    'soundmix_otherbbbbbbb',
    'install_otherbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Forest Stream',
    '45',
    'forest',
    64,
    'river-stream',
    50,
    '2026-05-28T13:00:00Z',
    '2026-05-28T13:05:00Z'
  );

set local role anon;

select results_eq(
  $$ select sound_id from public.sound_assets order by sound_id $$,
  $$ values ('light-rain'::text) $$,
  'anon can read only active sound asset metadata'
);

select results_eq(
  $$ select sound_id, display_name from public.sound_asset_translations order by sound_id $$,
  $$ values ('light-rain'::text, 'Light Rain'::text) $$,
  'anon can read only active sound asset translations'
);

select throws_ok(
  $$ select local_mix_id from public.sound_mixes $$,
  '42501',
  null,
  'anon cannot read user-owned sound mixes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select results_eq(
  $$ select local_mix_id from public.sound_mixes order by local_mix_id $$,
  $$ values ('soundmix_owneraaaaaaa'::text) $$,
  'authenticated users can read only their own sound mixes'
);

select lives_ok(
  $$
    insert into public.sound_mixes (
      local_mix_id,
      local_install_id,
      user_id,
      name,
      timer_preference,
      layer_0_sound_id,
      layer_0_volume,
      layer_1_sound_id,
      layer_1_volume,
      layer_2_sound_id,
      layer_2_volume,
      mix_created_at,
      mix_updated_at
    )
    values (
      'soundmix_ownerinsert',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Ocean Noise',
      '60',
      'ocean-waves',
      70,
      'pink-noise',
      44,
      'fireplace-crackling',
      30,
      '2026-05-28T14:00:00Z',
      '2026-05-28T14:05:00Z'
    )
  $$,
  'authenticated users can insert their own sound mixes'
);

select throws_ok(
  $$
    insert into public.sound_mixes (
      local_mix_id,
      local_install_id,
      user_id,
      name,
      timer_preference,
      layer_0_sound_id,
      layer_0_volume,
      mix_created_at,
      mix_updated_at
    )
    values (
      'soundmix_crossinsert',
      'install_owneraaaaaaaa',
      '22222222-2222-4222-8222-222222222222',
      'Cross User',
      '20',
      'light-rain',
      70,
      '2026-05-28T14:00:00Z',
      '2026-05-28T14:05:00Z'
    )
  $$,
  '42501',
  null,
  'authenticated users cannot insert cross-user sound mixes'
);

select throws_ok(
  $$
    insert into public.sound_mixes (
      local_mix_id,
      local_install_id,
      user_id,
      name,
      timer_preference,
      layer_0_sound_id,
      layer_0_volume,
      layer_1_sound_id,
      layer_1_volume,
      mix_created_at,
      mix_updated_at
    )
    values (
      'soundmix_duplicate',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Duplicate Layers',
      '20',
      'light-rain',
      70,
      'light-rain',
      60,
      '2026-05-28T14:00:00Z',
      '2026-05-28T14:05:00Z'
    )
  $$,
  '23514',
  null,
  'sound mix payload rejects duplicate sound layers'
);

select throws_ok(
  $$
    insert into public.sound_mixes (
      local_mix_id,
      local_install_id,
      user_id,
      name,
      timer_preference,
      layer_0_sound_id,
      mix_created_at,
      mix_updated_at
    )
    values (
      'soundmix_missingvolume',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Missing Volume',
      '20',
      'light-rain',
      '2026-05-28T14:00:00Z',
      '2026-05-28T14:05:00Z'
    )
  $$,
  '23514',
  null,
  'sound mix payload rejects layer sound without paired volume'
);

select throws_ok(
  $$
    insert into public.sound_mixes (
      local_mix_id,
      local_install_id,
      user_id,
      name,
      timer_preference,
      layer_0_sound_id,
      layer_0_volume,
      mix_created_at,
      mix_updated_at
    )
    values (
      'soundmix_badasset',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Bad Asset',
      '20',
      '432hz-tone',
      70,
      '2026-05-28T14:00:00Z',
      '2026-05-28T14:05:00Z'
    )
  $$,
  '23514',
  null,
  'sound mix payload rejects removed sound identifiers'
);

select lives_ok(
  $$
    update public.sound_mixes
    set name = 'Rain Hearth Updated',
        layer_0_volume = 80
    where local_mix_id = 'soundmix_owneraaaaaaa'
  $$,
  'authenticated users can update their own sound mixes'
);

select throws_ok(
  $$
    update public.sound_mixes
    set user_id = '22222222-2222-4222-8222-222222222222'
    where local_mix_id = 'soundmix_owneraaaaaaa'
  $$,
  '42501',
  null,
  'authenticated users cannot update a sound mix into another owner'
);

select lives_ok(
  $$
    insert into public.sound_mixes (
      local_mix_id,
      local_install_id,
      user_id,
      name,
      timer_preference,
      layer_0_sound_id,
      layer_0_volume,
      mix_created_at,
      mix_updated_at
    )
    values (
      'soundmix_owneraaaaaaa',
      'install_owneraaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Rain Hearth Upsert',
      '30',
      'light-rain',
      82,
      '2026-05-28T12:00:00Z',
      '2026-05-28T15:00:00Z'
    )
    on conflict (user_id, local_mix_id) do update set
      name = excluded.name,
      layer_0_volume = excluded.layer_0_volume,
      mix_updated_at = excluded.mix_updated_at,
      updated_at = now()
  $$,
  'idempotent owner upsert uses user_id and local_mix_id without duplicate rows'
);

select results_eq(
  $$ select count(*)::integer from public.sound_mixes where local_mix_id = 'soundmix_owneraaaaaaa' $$,
  $$ values (1) $$,
  'idempotent owner upsert keeps a single remote sound mix row'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);

select * from finish();

rollback;
