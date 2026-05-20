import { getOnboardingPlanForGoal } from "@nidoru/domain";
import type { BreathworkFamiliarity, OnboardingGoal, SleepBaseline } from "@nidoru/domain";
import {
  abandonedFirstSessionRecordSchema,
  firstSessionRecordSchema,
  localInstallIdSchema,
  onboardingResponseSchema,
  recoverableFirstSessionDraftSchema,
} from "@nidoru/validation";
import type {
  AbandonedFirstSessionRecord,
  FirstSessionRecord,
  OnboardingResponse,
  RecoverableFirstSessionDraft,
} from "@nidoru/validation";

export type LocalFirstOnboardingBindValue = string | number | null;

export type LocalFirstOnboardingDatabase = {
  getFirstAsync<Row>(
    source: string,
    params?: readonly LocalFirstOnboardingBindValue[],
  ): Promise<Row | null>;
  runAsync(source: string, params?: readonly LocalFirstOnboardingBindValue[]): Promise<unknown>;
};

export type GetOrCreateLocalInstallIdentityInput = {
  readonly database: LocalFirstOnboardingDatabase;
  readonly now?: Date;
  readonly createId?: () => string;
};

type FirstSessionCompletionInput = FirstSessionRecord;
type FirstSessionDraftInput = RecoverableFirstSessionDraft;
type FirstSessionAbandonedInput = AbandonedFirstSessionRecord;

type RecoverableFirstSessionDraftRow = {
  readonly completed_breath_cycles: number | null;
  readonly current_phase: string | null;
  readonly duration_seconds: number;
  readonly elapsed_ms: number | null;
  readonly local_install_id: string;
  readonly plan_id: string;
  readonly remaining_ms: number | null;
  readonly session_id: string;
  readonly started_at: string;
  readonly status: string;
  readonly technique_id: string;
  readonly updated_at: string | null;
};

export type OnboardingPersonalizationInput = {
  readonly breathworkFamiliarity: BreathworkFamiliarity;
  readonly completedAt: string;
  readonly displayName: string | undefined;
  readonly eventId?: string;
  readonly goal: OnboardingGoal;
  readonly localInstallId: string;
  readonly sleepBaseline: SleepBaseline;
  readonly startedAt: string;
  readonly windDownMinutesAfterMidnight: number;
};

export function createLocalInstallId(createRandomSegment = createDefaultRandomSegment): string {
  const randomSegment = createRandomSegment()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

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

export async function completeOnboardingPersonalizationLocally(
  database: LocalFirstOnboardingDatabase,
  input: OnboardingPersonalizationInput,
): Promise<OnboardingResponse> {
  const recommendedPlan = getOnboardingPlanForGoal(input.goal);
  const onboardingResponse = onboardingResponseSchema.parse({
    localInstallId: input.localInstallId,
    status: "completed",
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    goal: input.goal,
    sleepBaseline: input.sleepBaseline,
    windDownMinutesAfterMidnight: input.windDownMinutesAfterMidnight,
    breathworkFamiliarity: input.breathworkFamiliarity,
    displayName: input.displayName,
    recommendedPlanId: recommendedPlan.id,
    recommendedTechniqueId: recommendedPlan.firstSession.techniqueId,
  });

  await database.runAsync(
    `
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(local_install_id) DO UPDATE SET
        status = excluded.status,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        goal = excluded.goal,
        sleep_baseline = excluded.sleep_baseline,
        wind_down_minutes_after_midnight = excluded.wind_down_minutes_after_midnight,
        breathwork_familiarity = excluded.breathwork_familiarity,
        display_name = excluded.display_name,
        recommended_plan_id = excluded.recommended_plan_id,
        recommended_technique_id = excluded.recommended_technique_id,
        first_session_duration_seconds = excluded.first_session_duration_seconds,
        updated_at = excluded.updated_at;
    `,
    [
      onboardingResponse.localInstallId,
      onboardingResponse.status,
      onboardingResponse.startedAt,
      onboardingResponse.completedAt ?? null,
      onboardingResponse.goal,
      onboardingResponse.sleepBaseline,
      onboardingResponse.windDownMinutesAfterMidnight,
      onboardingResponse.breathworkFamiliarity,
      onboardingResponse.displayName ?? null,
      onboardingResponse.recommendedPlanId,
      onboardingResponse.recommendedTechniqueId,
      recommendedPlan.firstSession.durationSeconds,
      onboardingResponse.completedAt ?? input.completedAt,
    ],
  );

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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      input.eventId ?? createLocalEventId(),
      onboardingResponse.localInstallId,
      "onboarding_completed",
      "onboarding_response",
      onboardingResponse.localInstallId,
      "{}",
      onboardingResponse.completedAt ?? input.completedAt,
      onboardingResponse.completedAt ?? input.completedAt,
    ],
  );

  return onboardingResponse;
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

export async function saveFirstSessionDraftLocally(
  database: LocalFirstOnboardingDatabase,
  input: FirstSessionDraftInput,
): Promise<void> {
  const firstSessionDraft = recoverableFirstSessionDraftSchema.parse(input);

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
        completion_persisted_at,
        elapsed_ms,
        remaining_ms,
        current_phase,
        abandoned_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        status = excluded.status,
        duration_seconds = excluded.duration_seconds,
        completed_breath_cycles = excluded.completed_breath_cycles,
        elapsed_ms = excluded.elapsed_ms,
        remaining_ms = excluded.remaining_ms,
        current_phase = excluded.current_phase,
        abandoned_at = excluded.abandoned_at,
        updated_at = excluded.updated_at;
    `,
    [
      firstSessionDraft.sessionId,
      firstSessionDraft.localInstallId,
      firstSessionDraft.status,
      firstSessionDraft.planId,
      firstSessionDraft.techniqueId,
      firstSessionDraft.startedAt,
      null,
      firstSessionDraft.durationSeconds,
      firstSessionDraft.completedBreathCycles,
      null,
      firstSessionDraft.elapsedDurationMs,
      firstSessionDraft.remainingDurationMs,
      firstSessionDraft.currentPhaseName,
      null,
      firstSessionDraft.updatedAt,
    ],
  );
}

export async function loadRecoverableFirstSessionDraft(
  database: LocalFirstOnboardingDatabase,
  input: { readonly localInstallId: string },
): Promise<RecoverableFirstSessionDraft | null> {
  const localInstallId = localInstallIdSchema.parse(input.localInstallId);
  const draftRow = await database.getFirstAsync<RecoverableFirstSessionDraftRow>(
    `
      SELECT
        session_id,
        local_install_id,
        status,
        plan_id,
        technique_id,
        started_at,
        duration_seconds,
        completed_breath_cycles,
        elapsed_ms,
        remaining_ms,
        current_phase,
        updated_at
      FROM first_session_records
      WHERE local_install_id = ?
        AND status = 'draft'
        AND remaining_ms > 0
      ORDER BY updated_at DESC
      LIMIT 1;
    `,
    [localInstallId],
  );

  if (!draftRow) {
    return null;
  }

  return recoverableFirstSessionDraftSchema.parse({
    completedBreathCycles: draftRow.completed_breath_cycles ?? 0,
    currentPhaseName: draftRow.current_phase,
    durationSeconds: draftRow.duration_seconds,
    elapsedDurationMs: draftRow.elapsed_ms ?? 0,
    localInstallId: draftRow.local_install_id,
    planId: draftRow.plan_id,
    remainingDurationMs: draftRow.remaining_ms,
    sessionId: draftRow.session_id,
    startedAt: draftRow.started_at,
    status: draftRow.status,
    techniqueId: draftRow.technique_id,
    updatedAt: draftRow.updated_at,
  });
}

export async function abandonFirstSessionLocally(
  database: LocalFirstOnboardingDatabase,
  input: FirstSessionAbandonedInput,
): Promise<void> {
  const firstSessionRecord = abandonedFirstSessionRecordSchema.parse(input);

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
        completion_persisted_at,
        elapsed_ms,
        remaining_ms,
        current_phase,
        abandoned_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        status = excluded.status,
        completed_at = excluded.completed_at,
        duration_seconds = excluded.duration_seconds,
        completed_breath_cycles = excluded.completed_breath_cycles,
        completion_persisted_at = excluded.completion_persisted_at,
        elapsed_ms = excluded.elapsed_ms,
        remaining_ms = excluded.remaining_ms,
        current_phase = excluded.current_phase,
        abandoned_at = excluded.abandoned_at,
        updated_at = excluded.updated_at;
    `,
    [
      firstSessionRecord.sessionId,
      firstSessionRecord.localInstallId,
      firstSessionRecord.status,
      firstSessionRecord.planId,
      firstSessionRecord.techniqueId,
      firstSessionRecord.startedAt,
      null,
      firstSessionRecord.durationSeconds,
      firstSessionRecord.completedBreathCycles,
      null,
      firstSessionRecord.elapsedDurationMs,
      firstSessionRecord.remainingDurationMs,
      firstSessionRecord.currentPhaseName,
      firstSessionRecord.abandonedAt,
      firstSessionRecord.updatedAt,
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

function createLocalEventId(): string {
  const randomSegment = createDefaultRandomSegment()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `event_${paddedSegment}`;
}
