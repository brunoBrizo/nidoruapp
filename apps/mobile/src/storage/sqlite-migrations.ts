export type SQLiteMigration = {
  readonly id: string;
  readonly sql: string;
};

export type SQLiteMigrationDatabase = {
  execAsync(source: string): Promise<void>;
  getAllAsync<Row>(source: string): Promise<Row[]>;
};

export type SQLiteMigrationResult = {
  readonly appliedMigrationIds: string[];
};

const migrationIdPattern = /^\d{4}_[a-z0-9_]+$/;

export const sqliteMigrations = [
  {
    id: "0001_local_foundation",
    sql: `
      CREATE TABLE local_database_metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    id: "0002_feature_02_onboarding_first_session",
    sql: `
      CREATE TABLE local_install_identity (
        local_install_id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        CHECK (substr(local_install_id, 1, 8) = 'install_'),
        CHECK (length(local_install_id) BETWEEN 16 AND 72)
      );

      CREATE TABLE onboarding_responses (
        local_install_id TEXT PRIMARY KEY NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('draft', 'completed')),
        started_at TEXT NOT NULL,
        completed_at TEXT,
        goal TEXT NOT NULL CHECK (goal IN ('sleep', 'anxiety', 'stress', 'curiosity')),
        sleep_baseline INTEGER NOT NULL CHECK (sleep_baseline BETWEEN 1 AND 5),
        wind_down_minutes_after_midnight INTEGER NOT NULL CHECK (wind_down_minutes_after_midnight BETWEEN 0 AND 1439),
        breathwork_familiarity TEXT NOT NULL CHECK (breathwork_familiarity IN ('yes', 'new_to_me')),
        display_name TEXT CHECK (display_name IS NULL OR length(display_name) <= 40),
        recommended_plan_id TEXT NOT NULL CHECK (recommended_plan_id IN ('sleep_focused', 'anxiety_relief', 'stress_reset', 'general_wellness')),
        recommended_technique_id TEXT NOT NULL CHECK (recommended_technique_id IN ('4-7-8-sleep', 'box-breathing', 'coherent-breathing', 'physiological-sigh')),
        first_session_duration_seconds INTEGER NOT NULL CHECK (first_session_duration_seconds > 0 AND first_session_duration_seconds <= 1800),
        updated_at TEXT NOT NULL,
        CHECK (status != 'completed' OR completed_at IS NOT NULL)
      );

      CREATE TABLE first_breath_demo_events (
        event_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        event_type TEXT NOT NULL CHECK (event_type IN ('started', 'completed')),
        occurred_at TEXT NOT NULL,
        elapsed_seconds INTEGER NOT NULL CHECK (elapsed_seconds BETWEEN 0 AND 30)
      );

      CREATE TABLE first_session_records (
        session_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK (status IN ('draft', 'completed', 'abandoned')),
        plan_id TEXT NOT NULL CHECK (plan_id IN ('sleep_focused', 'anxiety_relief', 'stress_reset', 'general_wellness')),
        technique_id TEXT NOT NULL CHECK (technique_id IN ('4-7-8-sleep', 'box-breathing', 'coherent-breathing', 'physiological-sigh')),
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 1800),
        completed_breath_cycles INTEGER CHECK (completed_breath_cycles IS NULL OR completed_breath_cycles >= 0),
        completion_persisted_at TEXT,
        CHECK (status != 'completed' OR (completed_at IS NOT NULL AND completion_persisted_at IS NOT NULL))
      );

      CREATE TABLE post_session_reflections (
        reflection_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        session_id TEXT NOT NULL REFERENCES first_session_records(session_id) ON DELETE CASCADE,
        reflected_at TEXT NOT NULL,
        feeling TEXT NOT NULL CHECK (feeling IN ('same', 'better', 'much_better')),
        UNIQUE (session_id)
      );

      CREATE TABLE notification_gate_state (
        local_install_id TEXT PRIMARY KEY NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        first_active_day TEXT NOT NULL,
        completed_session_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_session_count >= 0),
        permission_state TEXT NOT NULL DEFAULT 'not_shown' CHECK (permission_state IN ('not_shown', 'shown', 'declined', 'accepted')),
        shown_at TEXT,
        declined_at TEXT,
        accepted_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE local_event_queue (
        event_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        event_name TEXT NOT NULL CHECK (
          event_name IN (
            'onboarding_started',
            'onboarding_completed',
            'first_breath_started',
            'first_breath_completed',
            'first_session_started',
            'first_session_completed',
            'breath_session_started',
            'breath_session_completed',
            'notification_permission_prompted',
            'notification_permission_accepted'
          )
        ),
        record_type TEXT NOT NULL CHECK (
          record_type IN (
            'onboarding_response',
            'first_breath_demo_event',
            'first_session_record',
            'post_session_reflection',
            'notification_gate_state'
          )
        ),
        record_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
        attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
        next_attempt_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX first_breath_demo_events_install_idx
        ON first_breath_demo_events (local_install_id, occurred_at);

      CREATE INDEX first_session_records_install_status_idx
        ON first_session_records (local_install_id, status, started_at);

      CREATE INDEX local_event_queue_status_idx
        ON local_event_queue (status, next_attempt_at, created_at);
    `,
  },
  {
    id: "0003_first_session_recovery_progress",
    sql: `
      ALTER TABLE first_session_records
        ADD COLUMN elapsed_ms INTEGER CHECK (elapsed_ms IS NULL OR elapsed_ms >= 0);

      ALTER TABLE first_session_records
        ADD COLUMN remaining_ms INTEGER CHECK (remaining_ms IS NULL OR remaining_ms >= 0);

      ALTER TABLE first_session_records
        ADD COLUMN current_phase TEXT CHECK (
          current_phase IS NULL OR current_phase IN ('inhale', 'hold', 'second-inhale', 'exhale')
        );

      ALTER TABLE first_session_records
        ADD COLUMN abandoned_at TEXT;

      ALTER TABLE first_session_records
        ADD COLUMN updated_at TEXT;

      CREATE INDEX first_session_records_recovery_idx
        ON first_session_records (local_install_id, status, updated_at);
    `,
  },
  {
    id: "0004_post_value_account_linking_paywall",
    sql: `
      ALTER TABLE onboarding_responses
        ADD COLUMN user_id TEXT CHECK (user_id IS NULL OR length(user_id) = 36);

      ALTER TABLE first_session_records
        ADD COLUMN user_id TEXT CHECK (user_id IS NULL OR length(user_id) = 36);

      ALTER TABLE post_session_reflections
        ADD COLUMN user_id TEXT CHECK (user_id IS NULL OR length(user_id) = 36);

      CREATE TABLE local_account_links (
        local_install_id TEXT PRIMARY KEY NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        user_id TEXT NOT NULL CHECK (length(user_id) = 36),
        provider TEXT NOT NULL CHECK (provider IN ('anonymous', 'apple', 'google')),
        linked_at TEXT NOT NULL,
        sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'succeeded', 'retry_pending')),
        last_sync_attempt_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE local_account_link_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        user_id TEXT CHECK (user_id IS NULL OR length(user_id) = 36),
        provider TEXT NOT NULL CHECK (provider IN ('anonymous', 'apple', 'google')),
        stage TEXT NOT NULL CHECK (stage IN ('auth_failed', 'sync_failed')),
        status TEXT NOT NULL CHECK (status IN ('retry_pending', 'resolved')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX first_session_records_user_idx
        ON first_session_records (user_id, completed_at);

      CREATE INDEX post_session_reflections_user_idx
        ON post_session_reflections (user_id, reflected_at);

      CREATE INDEX local_account_link_attempts_retry_idx
        ON local_account_link_attempts (status, created_at);
    `,
  },
  {
    id: "0005_generic_breath_session_persistence",
    sql: `
      CREATE TABLE breath_session_records (
        session_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        source TEXT NOT NULL CHECK (source IN ('breathe_tab', 'first_session', 'morning_check_in', 'rescue_me')),
        plan_id TEXT CHECK (plan_id IS NULL OR plan_id IN ('sleep_focused', 'anxiety_relief', 'stress_reset', 'general_wellness')),
        technique_id TEXT NOT NULL CHECK (technique_id IN ('4-7-8-sleep', 'box-breathing', 'coherent-breathing', 'diaphragmatic-breathing', 'physiological-sigh')),
        audio_cue_mode_id TEXT CHECK (audio_cue_mode_id IS NULL OR audio_cue_mode_id IN ('none', 'gentle-bell', 'soft-whoosh', 'nature-ambient')),
        status TEXT NOT NULL CHECK (status IN ('started', 'draft', 'completed', 'abandoned')),
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 1800),
        completed_breath_cycles INTEGER NOT NULL DEFAULT 0 CHECK (completed_breath_cycles >= 0),
        completion_persisted_at TEXT,
        elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
        remaining_ms INTEGER NOT NULL DEFAULT 0 CHECK (remaining_ms >= 0),
        current_phase TEXT CHECK (
          current_phase IS NULL OR current_phase IN ('inhale', 'hold', 'second-inhale', 'exhale')
        ),
        abandoned_at TEXT,
        stop_reason TEXT CHECK (
          stop_reason IS NULL OR stop_reason IN ('app_backgrounded', 'interrupted', 'unknown', 'user_ended')
        ),
        updated_at TEXT NOT NULL,
        CHECK (substr(session_id, 1, 8) = 'session_'),
        CHECK (length(session_id) BETWEEN 16 AND 72),
        CHECK (elapsed_ms <= duration_seconds * 1000),
        CHECK (remaining_ms <= duration_seconds * 1000),
        CHECK (elapsed_ms + remaining_ms <= duration_seconds * 1000),
        CHECK (status != 'completed' OR (
          completed_at IS NOT NULL
          AND completion_persisted_at IS NOT NULL
          AND remaining_ms = 0
        )),
        CHECK (status != 'abandoned' OR abandoned_at IS NOT NULL),
        CHECK (status != 'abandoned' OR stop_reason IS NOT NULL)
      );

      CREATE INDEX breath_session_records_install_status_idx
        ON breath_session_records (local_install_id, status, started_at);

      CREATE INDEX breath_session_records_recovery_idx
        ON breath_session_records (local_install_id, status, remaining_ms, updated_at);

      CREATE INDEX breath_session_records_completion_resume_idx
        ON breath_session_records (local_install_id, status, completed_at);

      CREATE TABLE local_event_queue_next (
        event_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        event_name TEXT NOT NULL CHECK (
          event_name IN (
            'onboarding_started',
            'onboarding_completed',
            'first_breath_started',
            'first_breath_completed',
            'first_session_started',
            'first_session_completed',
            'breath_session_started',
            'breath_session_completed',
            'notification_permission_prompted',
            'notification_permission_accepted'
          )
        ),
        record_type TEXT NOT NULL CHECK (
          record_type IN (
            'onboarding_response',
            'first_breath_demo_event',
            'first_session_record',
            'breath_session_record',
            'post_session_reflection',
            'notification_gate_state'
          )
        ),
        record_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
        attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
        next_attempt_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO local_event_queue_next (
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        status,
        attempt_count,
        next_attempt_at,
        created_at,
        updated_at
      )
      SELECT
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        status,
        attempt_count,
        next_attempt_at,
        created_at,
        updated_at
      FROM local_event_queue;

      DROP TABLE local_event_queue;

      ALTER TABLE local_event_queue_next RENAME TO local_event_queue;

      CREATE INDEX local_event_queue_status_idx
        ON local_event_queue (status, next_attempt_at, created_at);
    `,
  },
  {
    id: "0006_wind_down_local_persistence",
    sql: `
      CREATE TABLE wind_down_context_preferences (
        local_install_id TEXT PRIMARY KEY NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        context_goal TEXT NOT NULL CHECK (
          context_goal IN ('fall_asleep_faster', 'calm_racing_thoughts', 'wake_up_fewer_times')
        ),
        routine_id TEXT NOT NULL CHECK (
          routine_id IN ('wind_down_sleep_starter', 'wind_down_racing_thoughts', 'wind_down_daily_calm')
        ),
        selected_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE wind_down_runs (
        run_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        routine_id TEXT NOT NULL CHECK (
          routine_id IN ('wind_down_sleep_starter', 'wind_down_racing_thoughts', 'wind_down_daily_calm')
        ),
        context_goal TEXT NOT NULL CHECK (
          context_goal IN ('fall_asleep_faster', 'calm_racing_thoughts', 'wake_up_fewer_times')
        ),
        breath_session_id TEXT CHECK (
          breath_session_id IS NULL OR (
            substr(breath_session_id, 1, 8) = 'session_'
            AND length(breath_session_id) BETWEEN 16 AND 72
          )
        ),
        ambient_sound_id TEXT NOT NULL CHECK (
          ambient_sound_id IN (
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
            'fan',
            '432hz-tone',
            'delta-wave-binaural'
          )
        ),
        status TEXT NOT NULL CHECK (
          status IN (
            'started',
            'breath_completed',
            'body_cue_completed',
            'ambient_playing',
            'completed',
            'stopped'
          )
        ),
        stop_reason TEXT CHECK (
          stop_reason IS NULL OR stop_reason IN (
            'user_stop',
            'app_backgrounded_after_main_exercise',
            'interrupted',
            'timer_ended',
            'unknown'
          )
        ),
        recovery_state TEXT NOT NULL CHECK (
          recovery_state IN (
            'quick_context',
            'active_winddown',
            'no_hold_fallback',
            'daily_calm',
            'transition_card',
            'body_cue',
            'ambient_handoff',
            'dimmed_idle',
            'tap_to_wake',
            'audio_interruption',
            'completion',
            'partial_stop',
            'background_recovery'
          )
        ),
        started_at TEXT NOT NULL,
        breathwork_started_at TEXT,
        breathwork_completed_at TEXT,
        body_cue_started_at TEXT,
        body_cue_completed_at TEXT,
        ambient_started_at TEXT,
        ambient_completed_at TEXT,
        completed_at TEXT,
        stopped_at TEXT,
        total_duration_seconds INTEGER CHECK (
          total_duration_seconds IS NULL OR (
            total_duration_seconds >= 0
            AND total_duration_seconds <= 28800
          )
        ),
        updated_at TEXT NOT NULL,
        CHECK (substr(run_id, 1, 9) = 'winddown_'),
        CHECK (length(run_id) BETWEEN 17 AND 73),
        CHECK (status != 'breath_completed' OR breathwork_completed_at IS NOT NULL),
        CHECK (status != 'body_cue_completed' OR body_cue_completed_at IS NOT NULL),
        CHECK (status != 'ambient_playing' OR ambient_started_at IS NOT NULL),
        CHECK (status != 'completed' OR (
          completed_at IS NOT NULL
          AND ambient_completed_at IS NOT NULL
          AND total_duration_seconds IS NOT NULL
        )),
        CHECK (status != 'stopped' OR (
          stopped_at IS NOT NULL
          AND stop_reason IS NOT NULL
          AND total_duration_seconds IS NOT NULL
        )),
        CHECK (status = 'stopped' OR stop_reason IS NULL)
      );

      CREATE UNIQUE INDEX wind_down_runs_breath_session_idx
        ON wind_down_runs (breath_session_id)
        WHERE breath_session_id IS NOT NULL;

      CREATE INDEX wind_down_runs_recovery_idx
        ON wind_down_runs (local_install_id, status, updated_at);

      CREATE TABLE breath_session_records_next (
        session_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        source TEXT NOT NULL CHECK (
          source IN ('breathe_tab', 'first_session', 'morning_check_in', 'rescue_me', 'wind_down')
        ),
        wind_down_run_id TEXT REFERENCES wind_down_runs(run_id) ON DELETE SET NULL,
        plan_id TEXT CHECK (plan_id IS NULL OR plan_id IN ('sleep_focused', 'anxiety_relief', 'stress_reset', 'general_wellness')),
        technique_id TEXT NOT NULL CHECK (technique_id IN ('4-7-8-sleep', 'box-breathing', 'coherent-breathing', 'diaphragmatic-breathing', 'physiological-sigh')),
        audio_cue_mode_id TEXT CHECK (audio_cue_mode_id IS NULL OR audio_cue_mode_id IN ('none', 'gentle-bell', 'soft-whoosh', 'nature-ambient')),
        status TEXT NOT NULL CHECK (status IN ('started', 'draft', 'completed', 'abandoned')),
        started_at TEXT NOT NULL,
        completed_at TEXT,
        duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 1800),
        completed_breath_cycles INTEGER NOT NULL DEFAULT 0 CHECK (completed_breath_cycles >= 0),
        completion_persisted_at TEXT,
        elapsed_ms INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
        remaining_ms INTEGER NOT NULL DEFAULT 0 CHECK (remaining_ms >= 0),
        current_phase TEXT CHECK (
          current_phase IS NULL OR current_phase IN ('inhale', 'hold', 'second-inhale', 'exhale')
        ),
        abandoned_at TEXT,
        stop_reason TEXT CHECK (
          stop_reason IS NULL OR stop_reason IN ('app_backgrounded', 'interrupted', 'unknown', 'user_ended')
        ),
        updated_at TEXT NOT NULL,
        CHECK (substr(session_id, 1, 8) = 'session_'),
        CHECK (length(session_id) BETWEEN 16 AND 72),
        CHECK (elapsed_ms <= duration_seconds * 1000),
        CHECK (remaining_ms <= duration_seconds * 1000),
        CHECK (elapsed_ms + remaining_ms <= duration_seconds * 1000),
        CHECK (status != 'completed' OR (
          completed_at IS NOT NULL
          AND completion_persisted_at IS NOT NULL
          AND remaining_ms = 0
        )),
        CHECK (status != 'abandoned' OR abandoned_at IS NOT NULL),
        CHECK (status != 'abandoned' OR stop_reason IS NOT NULL)
      );

      INSERT INTO breath_session_records_next (
        session_id,
        local_install_id,
        source,
        wind_down_run_id,
        plan_id,
        technique_id,
        audio_cue_mode_id,
        status,
        started_at,
        completed_at,
        duration_seconds,
        completed_breath_cycles,
        completion_persisted_at,
        elapsed_ms,
        remaining_ms,
        current_phase,
        abandoned_at,
        stop_reason,
        updated_at
      )
      SELECT
        session_id,
        local_install_id,
        source,
        NULL,
        plan_id,
        technique_id,
        audio_cue_mode_id,
        status,
        started_at,
        completed_at,
        duration_seconds,
        completed_breath_cycles,
        completion_persisted_at,
        elapsed_ms,
        remaining_ms,
        current_phase,
        abandoned_at,
        stop_reason,
        updated_at
      FROM breath_session_records;

      DROP TABLE breath_session_records;

      ALTER TABLE breath_session_records_next RENAME TO breath_session_records;

      CREATE INDEX breath_session_records_install_status_idx
        ON breath_session_records (local_install_id, status, started_at);

      CREATE INDEX breath_session_records_recovery_idx
        ON breath_session_records (local_install_id, status, remaining_ms, updated_at);

      CREATE INDEX breath_session_records_completion_resume_idx
        ON breath_session_records (local_install_id, status, completed_at);

      CREATE INDEX breath_session_records_wind_down_run_idx
        ON breath_session_records (wind_down_run_id);

      CREATE TABLE local_event_queue_next (
        event_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        event_name TEXT NOT NULL CHECK (
          event_name IN (
            'onboarding_started',
            'onboarding_completed',
            'first_breath_started',
            'first_breath_completed',
            'first_session_started',
            'first_session_completed',
            'breath_session_started',
            'breath_session_completed',
            'notification_permission_prompted',
            'notification_permission_accepted',
            'wind_down_started',
            'wind_down_completed',
            'audio_started',
            'audio_failed',
            'sync_failed'
          )
        ),
        record_type TEXT NOT NULL CHECK (
          record_type IN (
            'onboarding_response',
            'first_breath_demo_event',
            'first_session_record',
            'breath_session_record',
            'post_session_reflection',
            'notification_gate_state',
            'wind_down_run'
          )
        ),
        record_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed')),
        attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
        next_attempt_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO local_event_queue_next (
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        status,
        attempt_count,
        next_attempt_at,
        created_at,
        updated_at
      )
      SELECT
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        status,
        attempt_count,
        next_attempt_at,
        created_at,
        updated_at
      FROM local_event_queue;

      DROP TABLE local_event_queue;

      ALTER TABLE local_event_queue_next RENAME TO local_event_queue;

      CREATE INDEX local_event_queue_status_idx
        ON local_event_queue (status, next_attempt_at, created_at);
    `,
  },
  {
    id: "0007_sound_mixer_saved_mix_persistence",
    sql: `
      CREATE TABLE sound_mixer_saved_mixes (
        mix_id TEXT PRIMARY KEY NOT NULL,
        local_install_id TEXT NOT NULL REFERENCES local_install_identity(local_install_id) ON DELETE CASCADE,
        name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
        timer_preference TEXT NOT NULL CHECK (timer_preference IN ('20', '30', '45', '60', 'infinity')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK (substr(mix_id, 1, 9) = 'soundmix_'),
        CHECK (length(mix_id) BETWEEN 17 AND 73),
        CHECK (updated_at >= created_at)
      );

      CREATE TABLE sound_mixer_saved_mix_layers (
        mix_id TEXT NOT NULL REFERENCES sound_mixer_saved_mixes(mix_id) ON DELETE CASCADE,
        layer_position INTEGER NOT NULL CHECK (layer_position BETWEEN 0 AND 2),
        sound_id TEXT NOT NULL CHECK (
          sound_id IN (
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
            'fan',
            '432hz-tone',
            'delta-wave-binaural'
          )
        ),
        volume REAL NOT NULL CHECK (volume >= 0 AND volume <= 100),
        PRIMARY KEY (mix_id, sound_id),
        UNIQUE (mix_id, layer_position)
      );

      CREATE INDEX sound_mixer_saved_mixes_install_updated_idx
        ON sound_mixer_saved_mixes (local_install_id, updated_at);

      CREATE TRIGGER sound_mixer_saved_mixes_max_3_insert
      BEFORE INSERT ON sound_mixer_saved_mixes
      WHEN (
        SELECT COUNT(*)
        FROM sound_mixer_saved_mixes
        WHERE local_install_id = NEW.local_install_id
      ) >= 3
      BEGIN
        SELECT RAISE(ABORT, 'Sound mixer supports up to 3 saved mixes.');
      END;

      CREATE TRIGGER sound_mixer_saved_mix_layers_max_3_insert
      BEFORE INSERT ON sound_mixer_saved_mix_layers
      WHEN (
        SELECT COUNT(*)
        FROM sound_mixer_saved_mix_layers
        WHERE mix_id = NEW.mix_id
      ) >= 3
      BEGIN
        SELECT RAISE(ABORT, 'Sound mixer supports at most 3 active layers.');
      END;
    `,
  },
  {
    id: "0008_sound_mixer_saved_mix_remote_mapping",
    sql: `
      ALTER TABLE sound_mixer_saved_mixes
        ADD COLUMN remote_mix_id TEXT
          CHECK (
            remote_mix_id IS NULL
            OR remote_mix_id GLOB '????????-????-????-????-????????????'
          );

      ALTER TABLE sound_mixer_saved_mixes
        ADD COLUMN remote_synced_at TEXT
          CHECK (remote_synced_at IS NULL OR remote_mix_id IS NOT NULL);

      CREATE UNIQUE INDEX sound_mixer_saved_mixes_remote_mix_id_idx
        ON sound_mixer_saved_mixes (remote_mix_id)
        WHERE remote_mix_id IS NOT NULL;
    `,
  },
] as const satisfies readonly SQLiteMigration[];

export async function runSqliteMigrations(
  database: SQLiteMigrationDatabase,
  migrations: readonly SQLiteMigration[] = sqliteMigrations,
): Promise<SQLiteMigrationResult> {
  validateMigrations(migrations);

  await database.execAsync("PRAGMA foreign_keys = ON;");
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS local_schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const appliedRows = await database.getAllAsync<{ id: string }>(
    "SELECT id FROM local_schema_migrations ORDER BY id;",
  );
  const appliedMigrationIds = new Set(appliedRows.map((row) => row.id));
  const nextAppliedMigrationIds: string[] = [];

  for (const migration of migrations) {
    if (appliedMigrationIds.has(migration.id)) {
      continue;
    }

    await applyMigration(database, migration);
    nextAppliedMigrationIds.push(migration.id);
  }

  return { appliedMigrationIds: nextAppliedMigrationIds };
}

function validateMigrations(migrations: readonly SQLiteMigration[]): void {
  const seenMigrationIds = new Set<string>();
  let previousMigrationId = "";

  for (const migration of migrations) {
    if (!migrationIdPattern.test(migration.id)) {
      throw new Error(`Invalid SQLite migration id: ${migration.id}`);
    }

    if (seenMigrationIds.has(migration.id)) {
      throw new Error(`Duplicate SQLite migration id: ${migration.id}`);
    }

    if (migration.id <= previousMigrationId) {
      throw new Error(`SQLite migrations must be sorted by id: ${migration.id}`);
    }

    if (migration.sql.trim().length === 0) {
      throw new Error(`SQLite migration ${migration.id} has empty SQL`);
    }

    seenMigrationIds.add(migration.id);
    previousMigrationId = migration.id;
  }
}

async function applyMigration(
  database: SQLiteMigrationDatabase,
  migration: SQLiteMigration,
): Promise<void> {
  try {
    await database.execAsync(`
      BEGIN IMMEDIATE;
      ${migration.sql}
      INSERT INTO local_schema_migrations (id)
      VALUES ('${migration.id}');
      COMMIT;
    `);
  } catch (error) {
    await database.execAsync("ROLLBACK;").catch(() => undefined);

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to apply SQLite migration ${migration.id}: ${message}`);
  }
}
