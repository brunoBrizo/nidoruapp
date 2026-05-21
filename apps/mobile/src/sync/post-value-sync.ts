import { localInstallIdSchema } from "@nidoru/validation";

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

  try {
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
    tableName === "first_session_sync_records"
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
