import {
  runSqliteMigrations,
  sqliteMigrations,
  type SQLiteMigrationDatabase,
} from "../src/storage/sqlite-migrations.ts";

function assertEquals<T>(actual: T, expected: T): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertRejects(action: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    assertCondition(
      pattern.test(message),
      `Expected rejection matching ${pattern}, received ${message}`,
    );
    return;
  }

  throw new Error(`Expected rejection matching ${pattern}`);
}

class SqliteCliDatabase implements SQLiteMigrationDatabase {
  constructor(private readonly databasePath: string) {}

  async execAsync(source: string): Promise<void> {
    await runSqlite(this.databasePath, source);
  }

  async getAllAsync<Row>(source: string): Promise<Row[]> {
    const output = await runSqlite(this.databasePath, `.mode json\n${source}`);

    if (output.trim().length === 0) {
      return [];
    }

    return JSON.parse(output) as Row[];
  }
}

async function createDatabase(): Promise<{
  database: SqliteCliDatabase;
  cleanup: () => Promise<void>;
}> {
  const tempDirectory = await Deno.makeTempDir({ prefix: "nidoru-sqlite-migrations-" });
  const databasePath = `${tempDirectory}/test.db`;

  return {
    database: new SqliteCliDatabase(databasePath),
    cleanup: () => Deno.remove(tempDirectory, { recursive: true }),
  };
}

async function runSqlite(databasePath: string, source: string): Promise<string> {
  const command = new Deno.Command("sqlite3", {
    args: [databasePath],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });
  const child = command.spawn();
  const writer = child.stdin.getWriter();

  await writer.write(new TextEncoder().encode(source));
  await writer.close();

  const output = await child.output();
  const stderr = new TextDecoder().decode(output.stderr);

  if (!output.success) {
    throw new Error(stderr.trim());
  }

  return new TextDecoder().decode(output.stdout);
}

Deno.test("applies local SQLite migrations from an empty database", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    const result = await runSqliteMigrations(database);
    const appliedRows = await database.getAllAsync<{ id: string }>(
      "SELECT id FROM local_schema_migrations ORDER BY id;",
    );
    const foundationTables = await database.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'local_%' ORDER BY name;",
    );

    assertEquals(
      result.appliedMigrationIds,
      sqliteMigrations.map((migration) => migration.id),
    );
    assertEquals(
      appliedRows.map((row) => row.id),
      sqliteMigrations.map((migration) => migration.id),
    );
    assertEquals(
      foundationTables.map((row) => row.name),
      [
        "local_account_link_attempts",
        "local_account_links",
        "local_database_metadata",
        "local_event_queue",
        "local_install_identity",
        "local_schema_migrations",
      ],
    );
  } finally {
    await cleanup();
  }
});

Deno.test("supports Feature 02 local-first onboarding and first-session records", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await runSqliteMigrations(database);
    await database.execAsync(`
      INSERT INTO local_install_identity (local_install_id, created_at, last_seen_at)
      VALUES ('install_0123456789abcdef', '2026-05-18T02:00:00.000Z', '2026-05-18T02:00:00.000Z');

      INSERT INTO onboarding_responses (
        local_install_id,
        status,
        started_at,
        completed_at,
        goal,
        sleep_baseline,
        wind_down_minutes_after_midnight,
        breathwork_familiarity,
        display_name,
        recommended_plan_id,
        recommended_technique_id,
        first_session_duration_seconds,
        updated_at
      )
      VALUES (
        'install_0123456789abcdef',
        'completed',
        '2026-05-18T02:00:00.000Z',
        '2026-05-18T02:02:00.000Z',
        'curiosity',
        3,
        1350,
        'new_to_me',
        'Bruno',
        'general_wellness',
        'coherent-breathing',
        240,
        '2026-05-18T02:02:00.000Z'
      );

      INSERT INTO first_breath_demo_events (
        event_id,
        local_install_id,
        event_type,
        occurred_at,
        elapsed_seconds
      )
      VALUES (
        'event_0123456789abcdef',
        'install_0123456789abcdef',
        'completed',
        '2026-05-18T02:00:30.000Z',
        30
      );

      INSERT INTO first_session_records (
        session_id,
        local_install_id,
        status,
        plan_id,
        technique_id,
        started_at,
        completed_at,
        duration_seconds,
        completed_breath_cycles,
        completion_persisted_at
      )
      VALUES (
        'session_0123456789abcdef',
        'install_0123456789abcdef',
        'completed',
        'general_wellness',
        'coherent-breathing',
        '2026-05-18T02:03:00.000Z',
        '2026-05-18T02:07:00.000Z',
        240,
        24,
        '2026-05-18T02:07:01.000Z'
      );

      INSERT INTO post_session_reflections (
        reflection_id,
        local_install_id,
        session_id,
        reflected_at,
        feeling
      )
      VALUES (
        'reflection_0123456789abcdef',
        'install_0123456789abcdef',
        'session_0123456789abcdef',
        '2026-05-18T02:08:00.000Z',
        'better'
      );

      INSERT INTO notification_gate_state (
        local_install_id,
        first_active_day,
        completed_session_count,
        permission_state,
        updated_at
      )
      VALUES (
        'install_0123456789abcdef',
        '2026-05-18',
        2,
        'not_shown',
        '2026-05-20T02:00:00.000Z'
      );

      INSERT INTO local_event_queue (
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        status,
        created_at,
        updated_at
      )
      VALUES (
        'queue_0123456789abcdef',
        'install_0123456789abcdef',
        'first_session_completed',
        'first_session_record',
        'session_0123456789abcdef',
        '{"sessionId":"session_0123456789abcdef"}',
        'pending',
        '2026-05-18T02:07:02.000Z',
        '2026-05-18T02:07:02.000Z'
      );
    `);

    const recoveredSessionRows = await database.getAllAsync<{
      session_id: string;
      status: string;
      completion_persisted_at: string;
    }>(
      "SELECT session_id, status, completion_persisted_at FROM first_session_records WHERE status = 'completed';",
    );
    const pendingQueueRows = await database.getAllAsync<{ event_name: string }>(
      "SELECT event_name FROM local_event_queue WHERE status = 'pending';",
    );

    assertEquals(recoveredSessionRows, [
      {
        session_id: "session_0123456789abcdef",
        status: "completed",
        completion_persisted_at: "2026-05-18T02:07:01.000Z",
      },
    ]);
    assertEquals(pendingQueueRows, [{ event_name: "first_session_completed" }]);
  } finally {
    await cleanup();
  }
});

Deno.test(
  "supports generic breath-session records with strict local-only constraints",
  async () => {
    const { database, cleanup } = await createDatabase();

    try {
      await runSqliteMigrations(database);
      await database.execAsync(`
      INSERT INTO local_install_identity (local_install_id, created_at, last_seen_at)
      VALUES ('install_0123456789abcdef', '2026-05-21T01:00:00.000Z', '2026-05-21T01:00:00.000Z');

      INSERT INTO breath_session_records (
        session_id,
        local_install_id,
        source,
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
      VALUES (
        'session_generic123456',
        'install_0123456789abcdef',
        'breathe_tab',
        NULL,
        'coherent-breathing',
        'gentle-bell',
        'draft',
        '2026-05-21T01:00:00.000Z',
        NULL,
        300,
        10,
        NULL,
        120000,
        180000,
        'exhale',
        NULL,
        NULL,
        '2026-05-21T01:02:00.000Z'
      );

      INSERT INTO local_event_queue (
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        created_at,
        updated_at
      )
      VALUES (
        'event_breath_started',
        'install_0123456789abcdef',
        'breath_session_started',
        'breath_session_record',
        'session_generic123456',
        '{}',
        '2026-05-21T01:00:00.000Z',
        '2026-05-21T01:00:00.000Z'
      );
    `);

      const sessionRows = await database.getAllAsync<{
        local_install_id: string;
        payload_json: string;
        source: string;
        status: string;
        technique_id: string;
      }>(`
      SELECT
        breath_session_records.local_install_id,
        local_event_queue.payload_json,
        breath_session_records.source,
        breath_session_records.status,
        breath_session_records.technique_id
      FROM breath_session_records
      INNER JOIN local_event_queue
        ON local_event_queue.record_id = breath_session_records.session_id
      WHERE breath_session_records.session_id = 'session_generic123456';
    `);
      const indexRows = await database.getAllAsync<{ name: string }>(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'index'
        AND tbl_name = 'breath_session_records'
      ORDER BY name;
    `);

      assertEquals(sessionRows, [
        {
          local_install_id: "install_0123456789abcdef",
          payload_json: "{}",
          source: "breathe_tab",
          status: "draft",
          technique_id: "coherent-breathing",
        },
      ]);
      assertEquals(
        indexRows.map((row) => row.name),
        [
          "breath_session_records_completion_resume_idx",
          "breath_session_records_install_status_idx",
          "breath_session_records_recovery_idx",
          "breath_session_records_wind_down_run_idx",
          "sqlite_autoindex_breath_session_records_1",
        ],
      );

      await assertRejects(
        () =>
          database.execAsync(`
          INSERT INTO breath_session_records (
            session_id,
            local_install_id,
            source,
            technique_id,
            status,
            started_at,
            duration_seconds,
            elapsed_ms,
            remaining_ms,
            current_phase,
            updated_at
          )
          VALUES (
            'session_invalidtech',
            'install_0123456789abcdef',
            'breathe_tab',
            'unvalidated-breath',
            'draft',
            '2026-05-21T01:00:00.000Z',
            300,
            0,
            300000,
            'inhale',
            '2026-05-21T01:00:00.000Z'
          );
        `),
        /CHECK constraint failed/,
      );
      await assertRejects(
        () =>
          database.execAsync(`
          INSERT INTO breath_session_records (
            session_id,
            local_install_id,
            source,
            technique_id,
            status,
            started_at,
            duration_seconds,
            elapsed_ms,
            remaining_ms,
            current_phase,
            updated_at
          )
          VALUES (
            'session_invalidphase',
            'install_0123456789abcdef',
            'breathe_tab',
            'coherent-breathing',
            'draft',
            '2026-05-21T01:00:00.000Z',
            300,
            0,
            300000,
            'sleepy',
            '2026-05-21T01:00:00.000Z'
          );
        `),
        /CHECK constraint failed/,
      );
      await assertRejects(
        () =>
          database.execAsync(`
          PRAGMA foreign_keys = ON;
          INSERT INTO breath_session_records (
            session_id,
            local_install_id,
            source,
            technique_id,
            status,
            started_at,
            duration_seconds,
            elapsed_ms,
            remaining_ms,
            current_phase,
            updated_at
          )
          VALUES (
            'session_missinginstall',
            'install_missing123456',
            'breathe_tab',
            'coherent-breathing',
            'draft',
            '2026-05-21T01:00:00.000Z',
            300,
            0,
            300000,
            'inhale',
            '2026-05-21T01:00:00.000Z'
          );
        `),
        /FOREIGN KEY constraint failed/,
      );
    } finally {
      await cleanup();
    }
  },
);

Deno.test("supports Wind-Down local persistence and strict recovery constraints", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await runSqliteMigrations(database);
    await database.execAsync(`
      PRAGMA foreign_keys = ON;

      INSERT INTO local_install_identity (local_install_id, created_at, last_seen_at)
      VALUES ('install_0123456789abcdef', '2026-05-25T01:00:00.000Z', '2026-05-25T01:00:00.000Z');

      INSERT INTO wind_down_context_preferences (
        local_install_id,
        context_goal,
        routine_id,
        selected_at,
        updated_at
      )
      VALUES (
        'install_0123456789abcdef',
        'fall_asleep_faster',
        'wind_down_sleep_starter',
        '2026-05-25T01:00:00.000Z',
        '2026-05-25T01:00:00.000Z'
      );

      INSERT INTO wind_down_runs (
        run_id,
        local_install_id,
        routine_id,
        context_goal,
        breath_session_id,
        ambient_sound_id,
        status,
        recovery_state,
        started_at,
        breathwork_started_at,
        breathwork_completed_at,
        body_cue_started_at,
        stopped_at,
        stop_reason,
        total_duration_seconds,
        updated_at
      )
      VALUES (
        'winddown_0123456789abcdef',
        'install_0123456789abcdef',
        'wind_down_sleep_starter',
        'fall_asleep_faster',
        'session_winddown123456',
        'light-rain',
        'stopped',
        'partial_stop',
        '2026-05-25T01:00:00.000Z',
        '2026-05-25T01:00:00.000Z',
        '2026-05-25T01:05:00.000Z',
        '2026-05-25T01:05:05.000Z',
        '2026-05-25T01:06:20.000Z',
        'user_stop',
        380,
        '2026-05-25T01:06:20.000Z'
      );

      INSERT INTO breath_session_records (
        session_id,
        local_install_id,
        source,
        wind_down_run_id,
        technique_id,
        status,
        started_at,
        completed_at,
        duration_seconds,
        completed_breath_cycles,
        completion_persisted_at,
        elapsed_ms,
        remaining_ms,
        current_phase,
        updated_at
      )
      VALUES (
        'session_winddown123456',
        'install_0123456789abcdef',
        'wind_down',
        'winddown_0123456789abcdef',
        '4-7-8-sleep',
        'completed',
        '2026-05-25T01:00:00.000Z',
        '2026-05-25T01:05:00.000Z',
        300,
        20,
        '2026-05-25T01:05:00.500Z',
        300000,
        0,
        'exhale',
        '2026-05-25T01:05:00.500Z'
      );

      INSERT INTO local_event_queue (
        event_id,
        local_install_id,
        event_name,
        record_type,
        record_id,
        payload_json,
        created_at,
        updated_at
      )
      VALUES
        (
          'event_wind_down_started',
          'install_0123456789abcdef',
          'wind_down_started',
          'wind_down_run',
          'winddown_0123456789abcdef',
          '{}',
          '2026-05-25T01:00:00.000Z',
          '2026-05-25T01:00:00.000Z'
        ),
        (
          'event_audio_started',
          'install_0123456789abcdef',
          'audio_started',
          'wind_down_run',
          'winddown_0123456789abcdef',
          '{}',
          '2026-05-25T01:05:01.000Z',
          '2026-05-25T01:05:01.000Z'
        );
    `);

    const runRows = await database.getAllAsync<{
      context_goal: string;
      event_count: number;
      source: string;
      status: string;
      wind_down_run_id: string;
    }>(`
      SELECT
        wind_down_runs.context_goal,
        COUNT(local_event_queue.event_id) AS event_count,
        breath_session_records.source,
        wind_down_runs.status,
        breath_session_records.wind_down_run_id
      FROM wind_down_runs
      INNER JOIN breath_session_records
        ON breath_session_records.wind_down_run_id = wind_down_runs.run_id
      INNER JOIN local_event_queue
        ON local_event_queue.record_id = wind_down_runs.run_id
      WHERE wind_down_runs.run_id = 'winddown_0123456789abcdef'
      GROUP BY
        wind_down_runs.context_goal,
        breath_session_records.source,
        wind_down_runs.status,
        breath_session_records.wind_down_run_id;
    `);

    assertEquals(runRows, [
      {
        context_goal: "fall_asleep_faster",
        event_count: 2,
        source: "wind_down",
        status: "stopped",
        wind_down_run_id: "winddown_0123456789abcdef",
      },
    ]);

    await assertRejects(
      () =>
        database.execAsync(`
          INSERT INTO wind_down_runs (
            run_id,
            local_install_id,
            routine_id,
            context_goal,
            ambient_sound_id,
            status,
            recovery_state,
            started_at,
            updated_at
          )
          VALUES (
            'winddown_invalidroutine',
            'install_0123456789abcdef',
            'wind_down_sleep_marketplace',
            'fall_asleep_faster',
            'light-rain',
            'started',
            'active_winddown',
            '2026-05-25T01:00:00.000Z',
            '2026-05-25T01:00:00.000Z'
          );
        `),
      /CHECK constraint failed/,
    );
    await assertRejects(
      () =>
        database.execAsync(`
          INSERT INTO wind_down_runs (
            run_id,
            local_install_id,
            routine_id,
            context_goal,
            ambient_sound_id,
            status,
            recovery_state,
            started_at,
            updated_at
          )
          VALUES (
            'winddown_invalidgoal',
            'install_0123456789abcdef',
            'wind_down_sleep_starter',
            'write_sleep_notes',
            'light-rain',
            'started',
            'active_winddown',
            '2026-05-25T01:00:00.000Z',
            '2026-05-25T01:00:00.000Z'
          );
        `),
      /CHECK constraint failed/,
    );
    await assertRejects(
      () =>
        database.execAsync(`
          INSERT INTO wind_down_runs (
            run_id,
            local_install_id,
            routine_id,
            context_goal,
            ambient_sound_id,
            status,
            recovery_state,
            started_at,
            updated_at
          )
          VALUES (
            'winddown_invalidstatus',
            'install_0123456789abcdef',
            'wind_down_sleep_starter',
            'fall_asleep_faster',
            'light-rain',
            'upsell_ready',
            'active_winddown',
            '2026-05-25T01:00:00.000Z',
            '2026-05-25T01:00:00.000Z'
          );
        `),
      /CHECK constraint failed/,
    );
    await assertRejects(
      () =>
        database.execAsync(`
          INSERT INTO wind_down_runs (
            run_id,
            local_install_id,
            routine_id,
            context_goal,
            ambient_sound_id,
            status,
            recovery_state,
            started_at,
            stopped_at,
            stop_reason,
            total_duration_seconds,
            updated_at
          )
          VALUES (
            'winddown_negativeduration',
            'install_0123456789abcdef',
            'wind_down_sleep_starter',
            'fall_asleep_faster',
            'light-rain',
            'stopped',
            'partial_stop',
            '2026-05-25T01:00:00.000Z',
            '2026-05-25T01:01:00.000Z',
            'user_stop',
            -1,
            '2026-05-25T01:01:00.000Z'
          );
        `),
      /CHECK constraint failed/,
    );
    await assertRejects(
      () =>
        database.execAsync(`
          INSERT INTO wind_down_runs (
            run_id,
            local_install_id,
            routine_id,
            context_goal,
            ambient_sound_id,
            status,
            recovery_state,
            started_at,
            total_duration_seconds,
            updated_at
          )
          VALUES (
            'winddown_missingterminal',
            'install_0123456789abcdef',
            'wind_down_sleep_starter',
            'fall_asleep_faster',
            'light-rain',
            'completed',
            'completion',
            '2026-05-25T01:00:00.000Z',
            1800,
            '2026-05-25T01:30:00.000Z'
          );
        `),
      /CHECK constraint failed/,
    );
  } finally {
    await cleanup();
  }
});

Deno.test("does not reapply migrations that already ran", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await runSqliteMigrations(database);
    const result = await runSqliteMigrations(database);
    const appliedRows = await database.getAllAsync<{ id: string }>(
      "SELECT id FROM local_schema_migrations ORDER BY id;",
    );

    assertEquals(result.appliedMigrationIds, []);
    assertEquals(appliedRows.length, sqliteMigrations.length);
  } finally {
    await cleanup();
  }
});

Deno.test("rejects malformed migration definitions before applying them", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await assertRejects(
      () =>
        runSqliteMigrations(database, [
          { id: "0001_foundation", sql: "CREATE TABLE first_table (id TEXT PRIMARY KEY);" },
          { id: "0001_foundation", sql: "CREATE TABLE second_table (id TEXT PRIMARY KEY);" },
        ]),
      /Duplicate SQLite migration id: 0001_foundation/,
    );
  } finally {
    await cleanup();
  }
});

Deno.test("fails when SQLite cannot apply a migration from a clean database", async () => {
  const { database, cleanup } = await createDatabase();

  try {
    await assertRejects(
      () => runSqliteMigrations(database, [{ id: "0001_broken", sql: "CREATE TABLE broken (" }]),
      /Failed to apply SQLite migration 0001_broken/,
    );

    const appliedRows = await database.getAllAsync<{ id: string }>(
      "SELECT id FROM local_schema_migrations ORDER BY id;",
    );

    assertEquals(appliedRows, []);
  } finally {
    await cleanup();
  }
});
