import {
  abandonedBreathSessionRecordSchema,
  breathSessionSourceSchema,
  completedBreathSessionRecordSchema,
  localInstallIdSchema,
  recoverableBreathSessionDraftSchema,
  breathSessionStartedRecordSchema,
} from "@nidoru/validation";
import type {
  AbandonedBreathSessionRecord,
  BreathSessionStartedRecord,
  CompletedBreathSessionRecord,
  RecoverableBreathSessionDraft,
} from "@nidoru/validation";

export type BreathSessionLocalPersistenceBindValue = string | number | null;

export type BreathSessionLocalPersistenceDatabase = {
  getFirstAsync<Row>(
    source: string,
    params?: readonly BreathSessionLocalPersistenceBindValue[],
  ): Promise<Row | null>;
  runAsync(
    source: string,
    params?: readonly BreathSessionLocalPersistenceBindValue[],
  ): Promise<unknown>;
};

type BreathSessionRow = {
  readonly abandoned_at?: string | null;
  readonly audio_cue_mode_id: string | null;
  readonly completed_at?: string | null;
  readonly completed_breath_cycles: number;
  readonly completion_persisted_at?: string | null;
  readonly current_phase: string | null;
  readonly duration_seconds: number;
  readonly elapsed_ms: number;
  readonly local_install_id: string;
  readonly plan_id: string | null;
  readonly remaining_ms: number;
  readonly session_id: string;
  readonly source: string;
  readonly started_at: string;
  readonly status: string;
  readonly stop_reason?: string | null;
  readonly technique_id: string;
  readonly updated_at: string;
};

type OptionalSourceFilterInput = {
  readonly localInstallId: string;
  readonly source?: string;
};

export async function recordBreathSessionStartedLocally(
  database: BreathSessionLocalPersistenceDatabase,
  input: BreathSessionStartedRecord,
): Promise<void> {
  const startedRecord = breathSessionStartedRecordSchema.parse(input);
  const durationMs = startedRecord.durationSeconds * 1000;

  await upsertBreathSessionRecord(database, "non_terminal", [
    startedRecord.sessionId,
    startedRecord.localInstallId,
    startedRecord.source,
    startedRecord.planId ?? null,
    startedRecord.techniqueId,
    startedRecord.audioCueModeId ?? null,
    startedRecord.status,
    startedRecord.startedAt,
    null,
    startedRecord.durationSeconds,
    0,
    null,
    0,
    durationMs,
    startedRecord.currentPhaseName,
    null,
    null,
    startedRecord.startedAt,
  ]);

  await insertBreathSessionEventQueue({
    database,
    ...(startedRecord.eventId === undefined ? {} : { eventId: startedRecord.eventId }),
    eventName: "breath_session_started",
    localInstallId: startedRecord.localInstallId,
    occurredAt: startedRecord.startedAt,
    sessionId: startedRecord.sessionId,
  });
}

export async function saveBreathSessionDraftLocally(
  database: BreathSessionLocalPersistenceDatabase,
  input: RecoverableBreathSessionDraft,
): Promise<void> {
  const draftRecord = recoverableBreathSessionDraftSchema.parse(input);

  await upsertBreathSessionRecord(database, "non_terminal", [
    draftRecord.sessionId,
    draftRecord.localInstallId,
    draftRecord.source,
    draftRecord.planId ?? null,
    draftRecord.techniqueId,
    draftRecord.audioCueModeId ?? null,
    draftRecord.status,
    draftRecord.startedAt,
    null,
    draftRecord.durationSeconds,
    draftRecord.completedBreathCycles,
    null,
    draftRecord.elapsedDurationMs,
    draftRecord.remainingDurationMs,
    draftRecord.currentPhaseName,
    null,
    null,
    draftRecord.updatedAt,
  ]);
}

export async function completeBreathSessionLocally(
  database: BreathSessionLocalPersistenceDatabase,
  input: CompletedBreathSessionRecord,
): Promise<void> {
  const completedRecord = completedBreathSessionRecordSchema.parse(input);
  const updatedAt = completedRecord.updatedAt ?? completedRecord.completionPersistedAt;

  await upsertBreathSessionRecord(database, "terminal", [
    completedRecord.sessionId,
    completedRecord.localInstallId,
    completedRecord.source,
    completedRecord.planId ?? null,
    completedRecord.techniqueId,
    completedRecord.audioCueModeId ?? null,
    completedRecord.status,
    completedRecord.startedAt,
    completedRecord.completedAt,
    completedRecord.durationSeconds,
    completedRecord.completedBreathCycles,
    completedRecord.completionPersistedAt,
    completedRecord.elapsedDurationMs,
    completedRecord.remainingDurationMs,
    completedRecord.currentPhaseName,
    null,
    null,
    updatedAt,
  ]);

  await insertBreathSessionEventQueue({
    database,
    ...(completedRecord.eventId === undefined ? {} : { eventId: completedRecord.eventId }),
    eventName: "breath_session_completed",
    localInstallId: completedRecord.localInstallId,
    occurredAt: completedRecord.completionPersistedAt,
    sessionId: completedRecord.sessionId,
  });
}

export async function abandonBreathSessionLocally(
  database: BreathSessionLocalPersistenceDatabase,
  input: AbandonedBreathSessionRecord,
): Promise<void> {
  const abandonedRecord = abandonedBreathSessionRecordSchema.parse(input);

  await upsertBreathSessionRecord(database, "non_terminal", [
    abandonedRecord.sessionId,
    abandonedRecord.localInstallId,
    abandonedRecord.source,
    abandonedRecord.planId ?? null,
    abandonedRecord.techniqueId,
    abandonedRecord.audioCueModeId ?? null,
    abandonedRecord.status,
    abandonedRecord.startedAt,
    null,
    abandonedRecord.durationSeconds,
    abandonedRecord.completedBreathCycles,
    null,
    abandonedRecord.elapsedDurationMs,
    abandonedRecord.remainingDurationMs,
    abandonedRecord.currentPhaseName,
    abandonedRecord.abandonedAt,
    abandonedRecord.stopReason,
    abandonedRecord.updatedAt,
  ]);
}

export async function loadRecoverableBreathSessionDraft(
  database: BreathSessionLocalPersistenceDatabase,
  input: OptionalSourceFilterInput,
): Promise<RecoverableBreathSessionDraft | null> {
  const { sourceFilterSql, params } = parseSourceFilterInput(input);
  const draftRow = await database.getFirstAsync<BreathSessionRow>(
    `
      SELECT
        session_id,
        local_install_id,
        source,
        plan_id,
        technique_id,
        audio_cue_mode_id,
        status,
        started_at,
        duration_seconds,
        completed_breath_cycles,
        elapsed_ms,
        remaining_ms,
        current_phase,
        updated_at
      FROM breath_session_records
      WHERE local_install_id = ?
        AND status IN ('started', 'draft')
        AND remaining_ms > 0
        ${sourceFilterSql}
      ORDER BY updated_at DESC
      LIMIT 1;
    `,
    params,
  );

  if (!draftRow) {
    return null;
  }

  return recoverableBreathSessionDraftSchema.parse({
    ...(draftRow.audio_cue_mode_id === null ? {} : { audioCueModeId: draftRow.audio_cue_mode_id }),
    completedBreathCycles: draftRow.completed_breath_cycles,
    currentPhaseName: draftRow.current_phase,
    durationSeconds: draftRow.duration_seconds,
    elapsedDurationMs: draftRow.elapsed_ms,
    localInstallId: draftRow.local_install_id,
    ...(draftRow.plan_id === null ? {} : { planId: draftRow.plan_id }),
    remainingDurationMs: draftRow.remaining_ms,
    sessionId: draftRow.session_id,
    source: draftRow.source,
    startedAt: draftRow.started_at,
    status: draftRow.status,
    techniqueId: draftRow.technique_id,
    updatedAt: draftRow.updated_at,
  });
}

export async function loadPendingBreathSessionCompletion(
  database: BreathSessionLocalPersistenceDatabase,
  input: OptionalSourceFilterInput,
): Promise<CompletedBreathSessionRecord | null> {
  const { sourceFilterSql, params } = parseSourceFilterInput(input);
  const completedRow = await database.getFirstAsync<BreathSessionRow>(
    `
      SELECT
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
        updated_at
      FROM breath_session_records
      WHERE local_install_id = ?
        AND status = 'completed'
        AND completed_at IS NOT NULL
        AND completion_persisted_at IS NOT NULL
        ${sourceFilterSql}
      ORDER BY completed_at DESC
      LIMIT 1;
    `,
    params,
  );

  if (!completedRow) {
    return null;
  }

  return completedBreathSessionRecordSchema.parse({
    ...(completedRow.audio_cue_mode_id === null
      ? {}
      : { audioCueModeId: completedRow.audio_cue_mode_id }),
    completedAt: completedRow.completed_at,
    completedBreathCycles: completedRow.completed_breath_cycles,
    completionPersistedAt: completedRow.completion_persisted_at,
    currentPhaseName: completedRow.current_phase,
    durationSeconds: completedRow.duration_seconds,
    elapsedDurationMs: completedRow.elapsed_ms,
    localInstallId: completedRow.local_install_id,
    ...(completedRow.plan_id === null ? {} : { planId: completedRow.plan_id }),
    remainingDurationMs: completedRow.remaining_ms,
    sessionId: completedRow.session_id,
    source: completedRow.source,
    startedAt: completedRow.started_at,
    status: completedRow.status,
    techniqueId: completedRow.technique_id,
    updatedAt: completedRow.updated_at,
  });
}

async function upsertBreathSessionRecord(
  database: BreathSessionLocalPersistenceDatabase,
  terminalMode: "non_terminal" | "terminal",
  params: readonly BreathSessionLocalPersistenceBindValue[],
): Promise<void> {
  await database.runAsync(
    `
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        source = excluded.source,
        plan_id = excluded.plan_id,
        technique_id = excluded.technique_id,
        audio_cue_mode_id = excluded.audio_cue_mode_id,
        status = excluded.status,
        completed_at = excluded.completed_at,
        duration_seconds = excluded.duration_seconds,
        completed_breath_cycles = excluded.completed_breath_cycles,
        completion_persisted_at = excluded.completion_persisted_at,
        elapsed_ms = excluded.elapsed_ms,
        remaining_ms = excluded.remaining_ms,
        current_phase = excluded.current_phase,
        abandoned_at = excluded.abandoned_at,
        stop_reason = excluded.stop_reason,
        updated_at = excluded.updated_at
      ${terminalMode === "terminal" ? "" : "WHERE breath_session_records.status != 'completed'"};
    `,
    params,
  );
}

async function insertBreathSessionEventQueue({
  database,
  eventId,
  eventName,
  localInstallId,
  occurredAt,
  sessionId,
}: {
  readonly database: BreathSessionLocalPersistenceDatabase;
  readonly eventId?: string;
  readonly eventName: "breath_session_started" | "breath_session_completed";
  readonly localInstallId: string;
  readonly occurredAt: string;
  readonly sessionId: string;
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
      "breath_session_record",
      sessionId,
      "{}",
      occurredAt,
      occurredAt,
    ],
  );
}

function parseSourceFilterInput(input: OptionalSourceFilterInput): {
  readonly params: readonly BreathSessionLocalPersistenceBindValue[];
  readonly sourceFilterSql: string;
} {
  const localInstallId = localInstallIdSchema.parse(input.localInstallId);

  if (input.source === undefined) {
    return { params: [localInstallId], sourceFilterSql: "" };
  }

  const source = breathSessionSourceSchema.parse(input.source);

  return {
    params: [localInstallId, source],
    sourceFilterSql: "AND source = ?",
  };
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
