import { firstSessionRecordSchema, localInstallIdSchema } from "@nidoru/validation";
import type { FirstSessionRecord } from "@nidoru/validation";

export type LocalFirstOnboardingDatabase = {
  getFirstAsync<Row>(source: string, params?: readonly unknown[]): Promise<Row | null>;
  runAsync(source: string, params?: readonly unknown[]): Promise<unknown>;
};

export type GetOrCreateLocalInstallIdentityInput = {
  readonly database: LocalFirstOnboardingDatabase;
  readonly now?: Date;
  readonly createId?: () => string;
};

type FirstSessionCompletionInput = FirstSessionRecord;

export function createLocalInstallId(createRandomSegment = createDefaultRandomSegment): string {
  const randomSegment = createRandomSegment().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8 ? randomSegment : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return localInstallIdSchema.parse(`install_${paddedSegment}`);
}

export async function getOrCreateLocalInstallIdentity({
  createId = createLocalInstallId,
  database,
  now = new Date(),
}: GetOrCreateLocalInstallIdentityInput): Promise<string> {
  const existingIdentity = await database.getFirstAsync<{ local_install_id: string }>(
    "SELECT local_install_id FROM local_install_identity ORDER BY created_at LIMIT 1;",
  );

  if (existingIdentity) {
    return localInstallIdSchema.parse(existingIdentity.local_install_id);
  }

  const localInstallId = localInstallIdSchema.parse(createId());
  const nowIso = now.toISOString();

  await database.runAsync(
    `
      INSERT INTO local_install_identity (local_install_id, created_at, last_seen_at)
      VALUES (?, ?, ?);
    `,
    [localInstallId, nowIso, nowIso],
  );

  return localInstallId;
}

export async function completeFirstSessionLocally(
  database: LocalFirstOnboardingDatabase,
  input: FirstSessionCompletionInput,
): Promise<void> {
  const firstSessionRecord = firstSessionRecordSchema.parse(input);

  await database.runAsync(
    `
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        duration_seconds = excluded.duration_seconds,
        completed_breath_cycles = excluded.completed_breath_cycles,
        completion_persisted_at = excluded.completion_persisted_at;
    `,
    [
      firstSessionRecord.sessionId,
      firstSessionRecord.localInstallId,
      firstSessionRecord.status,
      firstSessionRecord.planId,
      firstSessionRecord.techniqueId,
      firstSessionRecord.startedAt,
      firstSessionRecord.completedAt ?? null,
      firstSessionRecord.durationSeconds,
      firstSessionRecord.completedBreathCycles ?? null,
      firstSessionRecord.completionPersistedAt ?? null,
    ],
  );
}

function createDefaultRandomSegment(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();

  if (randomUuid) {
    return randomUuid.replaceAll("-", "_");
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
}
