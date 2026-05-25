import type { WindDownRoutineId } from "@nidoru/domain";
import {
  localInstallIdSchema,
  rememberedWindDownContextChoiceSchema,
  windDownCompletionSchema,
  windDownRunRecordSchema,
  windDownRunStartSchema,
  windDownStepProgressSchema,
  windDownStopSchema,
} from "@nidoru/validation";
import type {
  RememberedWindDownContextChoice,
  WindDownCompletion,
  WindDownRunRecord,
  WindDownRunStart,
  WindDownStepProgress,
  WindDownStop,
} from "@nidoru/validation";

export type WindDownLocalPersistenceBindValue = string | number | null;

export type WindDownLocalPersistenceDatabase = {
  getFirstAsync<Row>(
    source: string,
    params?: readonly WindDownLocalPersistenceBindValue[],
  ): Promise<Row | null>;
  runAsync(source: string, params?: readonly WindDownLocalPersistenceBindValue[]): Promise<unknown>;
};

type WindDownRunRow = {
  readonly ambient_completed_at: string | null;
  readonly ambient_sound_id: string;
  readonly ambient_started_at: string | null;
  readonly body_cue_completed_at: string | null;
  readonly body_cue_started_at: string | null;
  readonly breath_session_id: string | null;
  readonly breathwork_completed_at: string | null;
  readonly breathwork_started_at: string | null;
  readonly completed_at: string | null;
  readonly context_goal: string;
  readonly local_install_id: string;
  readonly recovery_state: string;
  readonly routine_id: string;
  readonly run_id: string;
  readonly started_at: string;
  readonly status: string;
  readonly stop_reason: string | null;
  readonly stopped_at: string | null;
  readonly total_duration_seconds: number | null;
  readonly updated_at: string;
};

type RememberedWindDownContextChoiceRow = {
  readonly context_goal: string;
  readonly local_install_id: string;
  readonly routine_id: string;
  readonly selected_at: string;
};

type WindDownEventName =
  | "audio_failed"
  | "audio_started"
  | "wind_down_completed"
  | "wind_down_started";

export async function recordWindDownStartedLocally(
  database: WindDownLocalPersistenceDatabase,
  input: WindDownRunStart,
): Promise<void> {
  const start = windDownRunStartSchema.parse(input);
  const startedRun = windDownRunRecordSchema.parse({
    ambientSoundId: start.ambientSoundId,
    ...(start.breathSessionId === undefined ? {} : { breathSessionId: start.breathSessionId }),
    contextGoal: start.contextGoal,
    localInstallId: start.localInstallId,
    recoveryState: getInitialRecoveryState(start.routineId),
    routineId: start.routineId,
    runId: start.runId,
    startedAt: start.startedAt,
    status: "started",
    updatedAt: start.startedAt,
  });

  await upsertWindDownRun(database, startedRun);
  await insertWindDownEventQueue({
    database,
    ...(start.eventId === undefined ? {} : { eventId: start.eventId }),
    eventName: "wind_down_started",
    localInstallId: start.localInstallId,
    occurredAt: start.startedAt,
    runId: start.runId,
  });
}

export async function saveRememberedWindDownContextChoiceLocally(
  database: WindDownLocalPersistenceDatabase,
  input: RememberedWindDownContextChoice,
): Promise<void> {
  const choice = rememberedWindDownContextChoiceSchema.parse(input);

  await database.runAsync(
    `
      INSERT INTO wind_down_context_preferences (
        local_install_id,
        context_goal,
        routine_id,
        selected_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(local_install_id) DO UPDATE SET
        context_goal = excluded.context_goal,
        routine_id = excluded.routine_id,
        selected_at = excluded.selected_at,
        updated_at = excluded.updated_at;
    `,
    [
      choice.localInstallId,
      choice.contextGoal,
      choice.routineId,
      choice.selectedAt,
      choice.selectedAt,
    ],
  );
}

export async function loadRememberedWindDownContextChoiceLocally(
  database: WindDownLocalPersistenceDatabase,
  input: { readonly localInstallId: string },
): Promise<RememberedWindDownContextChoice | null> {
  const localInstallId = localInstallIdSchema.parse(input.localInstallId);
  const row = await database.getFirstAsync<RememberedWindDownContextChoiceRow>(
    `
      SELECT
        local_install_id,
        context_goal,
        routine_id,
        selected_at
      FROM wind_down_context_preferences
      WHERE local_install_id = ?
      LIMIT 1;
    `,
    [localInstallId],
  );

  if (!row) {
    return null;
  }

  return rememberedWindDownContextChoiceSchema.parse({
    contextGoal: row.context_goal,
    localInstallId: row.local_install_id,
    routineId: row.routine_id,
    selectedAt: row.selected_at,
  });
}

export async function saveWindDownStepProgressLocally(
  database: WindDownLocalPersistenceDatabase,
  input: WindDownStepProgress,
): Promise<void> {
  const progress = windDownStepProgressSchema.parse(input);

  await database.runAsync(
    `
      UPDATE wind_down_runs
      SET
        status = ?,
        recovery_state = ?,
        breath_session_id = COALESCE(?, breath_session_id),
        breathwork_started_at = COALESCE(?, breathwork_started_at),
        breathwork_completed_at = COALESCE(?, breathwork_completed_at),
        body_cue_started_at = COALESCE(?, body_cue_started_at),
        body_cue_completed_at = COALESCE(?, body_cue_completed_at),
        ambient_started_at = COALESCE(?, ambient_started_at),
        ambient_completed_at = COALESCE(?, ambient_completed_at),
        completed_at = COALESCE(?, completed_at),
        stopped_at = COALESCE(?, stopped_at),
        updated_at = ?
      WHERE run_id = ?
        AND local_install_id = ?
        AND status NOT IN ('completed', 'stopped');
    `,
    [
      progress.status,
      progress.recoveryState,
      progress.breathSessionId ?? null,
      progress.breathworkStartedAt ?? null,
      progress.breathworkCompletedAt ?? null,
      progress.bodyCueStartedAt ?? null,
      progress.bodyCueCompletedAt ?? null,
      progress.ambientStartedAt ?? null,
      progress.ambientCompletedAt ?? null,
      progress.completedAt ?? null,
      progress.stoppedAt ?? null,
      progress.updatedAt,
      progress.runId,
      progress.localInstallId,
    ],
  );

  if (progress.queuedEvent === undefined) {
    return;
  }

  await insertWindDownEventQueue({
    database,
    ...(progress.queuedEvent.eventId === undefined
      ? {}
      : { eventId: progress.queuedEvent.eventId }),
    eventName: progress.queuedEvent.eventName,
    localInstallId: progress.localInstallId,
    occurredAt: progress.queuedEvent.occurredAt,
    runId: progress.runId,
  });
}

export async function completeWindDownRunLocally(
  database: WindDownLocalPersistenceDatabase,
  input: WindDownCompletion,
): Promise<void> {
  const completion = windDownCompletionSchema.parse(input);

  await database.runAsync(
    `
      UPDATE wind_down_runs
      SET
        status = ?,
        stop_reason = NULL,
        recovery_state = ?,
        ambient_completed_at = ?,
        completed_at = ?,
        total_duration_seconds = ?,
        updated_at = ?
      WHERE run_id = ?
        AND local_install_id = ?
        AND status != 'completed';
    `,
    [
      "completed",
      completion.recoveryState,
      completion.ambientCompletedAt,
      completion.completedAt,
      completion.totalDurationSeconds,
      completion.updatedAt,
      completion.runId,
      completion.localInstallId,
    ],
  );

  await insertWindDownEventQueue({
    database,
    ...(completion.eventId === undefined ? {} : { eventId: completion.eventId }),
    eventName: "wind_down_completed",
    localInstallId: completion.localInstallId,
    occurredAt: completion.updatedAt,
    runId: completion.runId,
  });
}

export async function stopWindDownRunLocally(
  database: WindDownLocalPersistenceDatabase,
  input: WindDownStop,
): Promise<void> {
  const stop = windDownStopSchema.parse(input);

  await database.runAsync(
    `
      UPDATE wind_down_runs
      SET
        status = ?,
        stop_reason = ?,
        recovery_state = ?,
        stopped_at = ?,
        total_duration_seconds = ?,
        updated_at = ?
      WHERE run_id = ?
        AND local_install_id = ?
        AND status != 'completed';
    `,
    [
      "stopped",
      stop.stopReason,
      stop.recoveryState,
      stop.stoppedAt,
      stop.totalDurationSeconds,
      stop.updatedAt,
      stop.runId,
      stop.localInstallId,
    ],
  );
}

export async function loadLatestRecoverableWindDownRun(
  database: WindDownLocalPersistenceDatabase,
  input: { readonly localInstallId: string },
): Promise<WindDownRunRecord | null> {
  const localInstallId = localInstallIdSchema.parse(input.localInstallId);
  const runRow = await database.getFirstAsync<WindDownRunRow>(
    `
      SELECT
        run_id,
        local_install_id,
        routine_id,
        context_goal,
        breath_session_id,
        ambient_sound_id,
        status,
        stop_reason,
        recovery_state,
        started_at,
        breathwork_started_at,
        breathwork_completed_at,
        body_cue_started_at,
        body_cue_completed_at,
        ambient_started_at,
        ambient_completed_at,
        completed_at,
        stopped_at,
        total_duration_seconds,
        updated_at
      FROM wind_down_runs
      WHERE local_install_id = ?
        AND status != 'completed'
      ORDER BY updated_at DESC
      LIMIT 1;
    `,
    [localInstallId],
  );

  if (!runRow) {
    return null;
  }

  return parseWindDownRunRow(runRow);
}

async function upsertWindDownRun(
  database: WindDownLocalPersistenceDatabase,
  run: WindDownRunRecord,
): Promise<void> {
  await database.runAsync(
    `
      INSERT INTO wind_down_runs (
        run_id,
        local_install_id,
        routine_id,
        context_goal,
        breath_session_id,
        ambient_sound_id,
        status,
        stop_reason,
        recovery_state,
        started_at,
        breathwork_started_at,
        breathwork_completed_at,
        body_cue_started_at,
        body_cue_completed_at,
        ambient_started_at,
        ambient_completed_at,
        completed_at,
        stopped_at,
        total_duration_seconds,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        routine_id = excluded.routine_id,
        context_goal = excluded.context_goal,
        breath_session_id = COALESCE(excluded.breath_session_id, wind_down_runs.breath_session_id),
        ambient_sound_id = excluded.ambient_sound_id,
        status = excluded.status,
        stop_reason = excluded.stop_reason,
        recovery_state = excluded.recovery_state,
        started_at = excluded.started_at,
        updated_at = excluded.updated_at
      WHERE wind_down_runs.status NOT IN ('completed', 'stopped');
    `,
    [
      run.runId,
      run.localInstallId,
      run.routineId,
      run.contextGoal,
      run.breathSessionId ?? null,
      run.ambientSoundId,
      run.status,
      run.stopReason ?? null,
      run.recoveryState,
      run.startedAt,
      run.breathworkStartedAt ?? null,
      run.breathworkCompletedAt ?? null,
      run.bodyCueStartedAt ?? null,
      run.bodyCueCompletedAt ?? null,
      run.ambientStartedAt ?? null,
      run.ambientCompletedAt ?? null,
      run.completedAt ?? null,
      run.stoppedAt ?? null,
      run.totalDurationSeconds ?? null,
      run.updatedAt,
    ],
  );
}

async function insertWindDownEventQueue({
  database,
  eventId,
  eventName,
  localInstallId,
  occurredAt,
  runId,
}: {
  readonly database: WindDownLocalPersistenceDatabase;
  readonly eventId?: string;
  readonly eventName: WindDownEventName;
  readonly localInstallId: string;
  readonly occurredAt: string;
  readonly runId: string;
}): Promise<void> {
  await database.runAsync(
    `
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(event_id) DO NOTHING;
    `,
    [
      eventId ?? createLocalEventId(),
      localInstallId,
      eventName,
      "wind_down_run",
      runId,
      "{}",
      occurredAt,
      occurredAt,
    ],
  );
}

function parseWindDownRunRow(row: WindDownRunRow): WindDownRunRecord {
  return windDownRunRecordSchema.parse({
    ...(row.ambient_completed_at === null ? {} : { ambientCompletedAt: row.ambient_completed_at }),
    ambientSoundId: row.ambient_sound_id,
    ...(row.ambient_started_at === null ? {} : { ambientStartedAt: row.ambient_started_at }),
    ...(row.body_cue_completed_at === null
      ? {}
      : { bodyCueCompletedAt: row.body_cue_completed_at }),
    ...(row.body_cue_started_at === null ? {} : { bodyCueStartedAt: row.body_cue_started_at }),
    ...(row.breath_session_id === null ? {} : { breathSessionId: row.breath_session_id }),
    ...(row.breathwork_completed_at === null
      ? {}
      : { breathworkCompletedAt: row.breathwork_completed_at }),
    ...(row.breathwork_started_at === null
      ? {}
      : { breathworkStartedAt: row.breathwork_started_at }),
    ...(row.completed_at === null ? {} : { completedAt: row.completed_at }),
    contextGoal: row.context_goal,
    localInstallId: row.local_install_id,
    recoveryState: row.recovery_state,
    routineId: row.routine_id,
    runId: row.run_id,
    startedAt: row.started_at,
    status: row.status,
    ...(row.stop_reason === null ? {} : { stopReason: row.stop_reason }),
    ...(row.stopped_at === null ? {} : { stoppedAt: row.stopped_at }),
    ...(row.total_duration_seconds === null
      ? {}
      : { totalDurationSeconds: row.total_duration_seconds }),
    updatedAt: row.updated_at,
  });
}

function getInitialRecoveryState(routineId: WindDownRoutineId): "active_winddown" | "daily_calm" {
  return routineId === "wind_down_daily_calm" ? "daily_calm" : "active_winddown";
}

function createLocalEventId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  const rawSegment = randomUuid
    ? randomUuid.replaceAll("-", "_")
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const randomSegment = rawSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `event_${paddedSegment}`;
}
