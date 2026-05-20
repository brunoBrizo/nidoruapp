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
