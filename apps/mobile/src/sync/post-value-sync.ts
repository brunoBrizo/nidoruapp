import {
  completedBreathSessionRecordSchema,
  localInstallIdSchema,
  windDownRunRecordSchema,
} from "@nidoru/validation";

import type {
  SyncFailureReasonClass,
  SyncFailureRecordType,
  SyncFailureStage,
} from "../observability/sync-observability";

type SyncBindValue = string | number | null;

export type PostValueSyncDatabase = {
  getAllAsync<Row>(source: string, params?: readonly SyncBindValue[]): Promise<Row[]>;
  getFirstAsync<Row>(source: string, params?: readonly SyncBindValue[]): Promise<Row | null>;
  runAsync(source: string, params?: readonly SyncBindValue[]): Promise<unknown>;
};

export type PostValueSyncClient = {
  from(tableName: string): {
    upsert(
      values: Record<string, unknown> | readonly Record<string, unknown>[],
      options: { readonly onConflict: string },
    ): PromiseLike<{ readonly error?: unknown }>;
  };
};

export type ObserveSyncFailure = (input: {
  readonly attemptCount: number;
  readonly reasonClass: SyncFailureReasonClass;
  readonly recordType: SyncFailureRecordType;
  readonly syncStage: SyncFailureStage;
}) => void;

type LocalAccountLinkRow = {
  readonly linked_at: string;
  readonly provider: "anonymous" | "apple" | "google";
};

type FirstSessionSyncRow = {
  readonly completed_at: string;
  readonly completed_breath_cycles: number | null;
  readonly duration_seconds: number;
  readonly local_install_id: string;
  readonly session_id: string;
  readonly technique_id: string;
};

type PostSessionReflectionSyncRow = {
  readonly feeling: "same" | "better" | "much_better";
  readonly local_install_id: string;
  readonly reflected_at: string;
  readonly reflection_id: string;
  readonly session_id: string;
};

type BreathSessionSyncRow = {
  readonly audio_cue_mode_id: string | null;
  readonly completed_at: string;
  readonly completed_breath_cycles: number;
  readonly completion_persisted_at: string;
  readonly current_phase: string | null;
  readonly duration_seconds: number;
  readonly elapsed_ms: number;
  readonly local_install_id: string;
  readonly remaining_ms: number;
  readonly session_id: string;
  readonly source: string;
  readonly started_at: string;
  readonly technique_id: string;
};

type WindDownRunSyncRow = {
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

const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function syncPostValueLocalRecords({
  client,
  database,
  localInstallId,
  now = new Date(),
  observeFailure,
  userId,
}: {
  readonly client: PostValueSyncClient;
  readonly database: PostValueSyncDatabase;
  readonly localInstallId: string;
  readonly now?: Date;
  readonly observeFailure?: ObserveSyncFailure;
  readonly userId: string;
}): Promise<
  | { readonly status: "succeeded" }
  | { readonly reason: SyncFailureReasonClass; readonly status: "retry_pending" }
> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);
  const parsedUserId = parseUserId(userId);
  const nowIso = now.toISOString();
  const linkRow = await database.getFirstAsync<LocalAccountLinkRow>(
    `
      SELECT provider, linked_at
      FROM local_account_links
      WHERE local_install_id = ?
        AND user_id = ?
      LIMIT 1;
    `,
    [parsedLocalInstallId, parsedUserId],
  );

  if (!linkRow) {
    return { reason: "auth_denied", status: "retry_pending" };
  }

  const firstSessionRows = await database.getAllAsync<FirstSessionSyncRow>(
    `
      SELECT
        session_id,
        local_install_id,
        technique_id,
        completed_at,
        duration_seconds,
        completed_breath_cycles
      FROM first_session_records
      WHERE local_install_id = ?
        AND status = 'completed'
        AND completed_at IS NOT NULL
        AND completion_persisted_at IS NOT NULL;
    `,
    [parsedLocalInstallId],
  );
  const reflectionRows = await database.getAllAsync<PostSessionReflectionSyncRow>(
    `
      SELECT
        reflection_id,
        session_id,
        local_install_id,
        feeling,
        reflected_at
      FROM post_session_reflections
      WHERE local_install_id = ?;
    `,
    [parsedLocalInstallId],
  );
  const breathSessionRows = await database.getAllAsync<BreathSessionSyncRow>(
    `
      SELECT
        session_id,
        local_install_id,
        source,
        technique_id,
        audio_cue_mode_id,
        started_at,
        completed_at,
        duration_seconds,
        completed_breath_cycles,
        completion_persisted_at,
        elapsed_ms,
        remaining_ms,
        current_phase
      FROM breath_session_records
      WHERE local_install_id = ?
        AND status = 'completed'
        AND completed_at IS NOT NULL
        AND completion_persisted_at IS NOT NULL
        AND remaining_ms = 0;
    `,
    [parsedLocalInstallId],
  );
  const windDownRunRows = await database.getAllAsync<WindDownRunSyncRow>(
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
        AND status IN ('completed', 'stopped')
        AND total_duration_seconds IS NOT NULL;
    `,
    [parsedLocalInstallId],
  );

  try {
    const breathSessionPayloads = createBreathSessionSyncPayloads({
      nowIso,
      rows: breathSessionRows,
      userId: parsedUserId,
    });
    const windDownRunPayloads = createWindDownRunSyncPayloads({
      nowIso,
      rows: windDownRunRows,
      userId: parsedUserId,
    });

    await upsertOrThrow(
      client,
      "local_install_links",
      {
        auth_provider: linkRow.provider,
        last_sync_attempt_at: nowIso,
        linked_at: linkRow.linked_at,
        local_install_id: parsedLocalInstallId,
        sync_status: "succeeded",
        updated_at: nowIso,
        user_id: parsedUserId,
      },
      "local_install_id",
    );

    if (firstSessionRows.length > 0) {
      await upsertOrThrow(
        client,
        "first_session_sync_records",
        firstSessionRows.map((row) => ({
          completed_at: row.completed_at,
          completed_breath_cycles: row.completed_breath_cycles,
          duration_seconds: row.duration_seconds,
          local_install_id: row.local_install_id,
          local_session_id: row.session_id,
          technique_id: row.technique_id,
          updated_at: nowIso,
          user_id: parsedUserId,
        })),
        "user_id,local_session_id",
      );
    }

    if (reflectionRows.length > 0) {
      await upsertOrThrow(
        client,
        "post_session_reflection_sync_records",
        reflectionRows.map((row) => ({
          feeling: row.feeling,
          local_install_id: row.local_install_id,
          local_reflection_id: row.reflection_id,
          local_session_id: row.session_id,
          reflected_at: row.reflected_at,
          updated_at: nowIso,
          user_id: parsedUserId,
        })),
        "user_id,local_reflection_id",
      );
    }

    if (breathSessionPayloads.length > 0) {
      await upsertOrThrow(
        client,
        "breath_sessions",
        breathSessionPayloads,
        "user_id,local_session_id",
      );
    }

    if (windDownRunPayloads.length > 0) {
      await upsertOrThrow(client, "wind_down_runs", windDownRunPayloads, "user_id,local_run_id");
    }
  } catch (error) {
    const reason = classifySyncError(error);

    observeFailure?.({
      attemptCount: 1,
      reasonClass: reason,
      recordType: getFailedRecordType(error),
      syncStage: "post_value_sync",
    });

    return { reason, status: "retry_pending" };
  }

  return { status: "succeeded" };
}

function createWindDownRunSyncPayloads({
  nowIso,
  rows,
  userId,
}: {
  readonly nowIso: string;
  readonly rows: readonly WindDownRunSyncRow[];
  readonly userId: string;
}): readonly Record<string, unknown>[] {
  try {
    return rows.map((row) => {
      const record = windDownRunRecordSchema.parse({
        ...(row.ambient_completed_at === null
          ? {}
          : { ambientCompletedAt: row.ambient_completed_at }),
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

      if (record.status !== "completed" && record.status !== "stopped") {
        throw new Error("Wind-down sync only accepts terminal runs.");
      }

      return {
        ambient_sound_id: record.ambientSoundId,
        completed_at: record.completedAt ?? null,
        completion_state: record.status,
        context_goal: record.contextGoal,
        local_breath_session_id: record.breathSessionId ?? null,
        local_install_id: record.localInstallId,
        local_run_id: record.runId,
        routine_id: record.routineId,
        started_at: record.startedAt,
        stop_reason: record.stopReason ?? null,
        stopped_at: record.stoppedAt ?? null,
        total_duration_seconds: record.totalDurationSeconds,
        updated_at: nowIso,
        user_id: userId,
      };
    });
  } catch {
    throw createSyncTableError("wind_down_runs", {
      code: "LOCAL_VALIDATION_ERROR",
      message: "Invalid local wind-down run sync payload.",
      status: 400,
    });
  }
}

function createBreathSessionSyncPayloads({
  nowIso,
  rows,
  userId,
}: {
  readonly nowIso: string;
  readonly rows: readonly BreathSessionSyncRow[];
  readonly userId: string;
}): readonly Record<string, unknown>[] {
  try {
    return rows.map((row) => {
      const record = completedBreathSessionRecordSchema.parse({
        ...(row.audio_cue_mode_id === null ? {} : { audioCueModeId: row.audio_cue_mode_id }),
        completedAt: row.completed_at,
        completedBreathCycles: row.completed_breath_cycles,
        completionPersistedAt: row.completion_persisted_at,
        currentPhaseName: row.current_phase,
        durationSeconds: row.duration_seconds,
        elapsedDurationMs: row.elapsed_ms,
        localInstallId: row.local_install_id,
        remainingDurationMs: row.remaining_ms,
        sessionId: row.session_id,
        source: row.source,
        startedAt: row.started_at,
        status: "completed",
        techniqueId: row.technique_id,
      });

      return {
        ...(record.audioCueModeId === undefined
          ? {}
          : { audio_cue_mode_id: record.audioCueModeId }),
        completed_at: record.completedAt,
        completed_breath_cycles: record.completedBreathCycles,
        completion_persisted_at: record.completionPersistedAt,
        duration_seconds: record.durationSeconds,
        local_install_id: record.localInstallId,
        local_session_id: record.sessionId,
        source: record.source,
        started_at: record.startedAt,
        technique_id: record.techniqueId,
        updated_at: nowIso,
        user_id: userId,
      };
    });
  } catch {
    throw createSyncTableError("breath_sessions", {
      code: "LOCAL_VALIDATION_ERROR",
      message: "Invalid local breath session sync payload.",
      status: 400,
    });
  }
}

async function upsertOrThrow(
  client: PostValueSyncClient,
  tableName: string,
  values: Record<string, unknown> | readonly Record<string, unknown>[],
  onConflict: string,
): Promise<void> {
  try {
    const result = await client.from(tableName).upsert(values, { onConflict });

    if (result.error) {
      throw createSyncTableError(tableName, result.error);
    }
  } catch (error) {
    throw createSyncTableError(tableName, error);
  }
}

function createSyncTableError(
  tableName: string,
  error: unknown,
): Error & {
  readonly cause: unknown;
  readonly syncRecordType: SyncFailureRecordType;
} {
  const wrappedError = new Error("Post-value sync failed.", { cause: error }) as Error & {
    cause: unknown;
    syncRecordType: SyncFailureRecordType;
  };

  wrappedError.syncRecordType =
    tableName === "wind_down_runs"
      ? "wind_down_run"
      : tableName === "breath_sessions"
        ? "breath_session"
        : tableName === "first_session_sync_records"
          ? "first_session_record"
          : tableName === "post_session_reflection_sync_records"
            ? "post_session_reflection"
            : "local_install_link";

  return wrappedError;
}

function getFailedRecordType(error: unknown): SyncFailureRecordType {
  if (
    error &&
    typeof error === "object" &&
    "syncRecordType" in error &&
    typeof error.syncRecordType === "string"
  ) {
    return error.syncRecordType as SyncFailureRecordType;
  }

  return "local_install_link";
}

function classifySyncError(error: unknown): SyncFailureReasonClass {
  const cause = unwrapSyncCause(error);

  if (cause instanceof TypeError) {
    return "offline";
  }

  if (cause && typeof cause === "object") {
    const status = "status" in cause ? Number(cause.status) : 0;
    const code = "code" in cause && typeof cause.code === "string" ? cause.code : "";
    const message = "message" in cause && typeof cause.message === "string" ? cause.message : "";

    if (
      status === 401 ||
      status === 403 ||
      code === "42501" ||
      /row-level security/i.test(message)
    ) {
      return "auth_denied";
    }

    if (status === 429) {
      return "rate_limited";
    }

    if (status >= 500) {
      return "server_error";
    }

    if (status >= 400) {
      return "validation_error";
    }
  }

  return "unknown";
}

function unwrapSyncCause(error: unknown): unknown {
  let currentError = error;

  while (currentError && typeof currentError === "object" && "cause" in currentError) {
    currentError = (currentError as { cause: unknown }).cause;
  }

  return currentError;
}

function parseUserId(userId: string): string {
  if (!userIdPattern.test(userId)) {
    throw new Error("Invalid Supabase user id.");
  }

  return userId;
}
