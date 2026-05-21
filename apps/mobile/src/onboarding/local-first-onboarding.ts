import { getOnboardingPlanForGoal } from "@nidoru/domain";
import type { BreathworkFamiliarity, OnboardingGoal, SleepBaseline } from "@nidoru/domain";
import {
  abandonedFirstSessionRecordSchema,
  firstSessionRecordSchema,
  localInstallIdSchema,
  notificationGateEligibilitySchema,
  onboardingResponseSchema,
  postSessionReflectionSchema,
  recoverableFirstSessionDraftSchema,
} from "@nidoru/validation";
import type {
  AbandonedFirstSessionRecord,
  FirstSessionRecord,
  NotificationGateEligibility,
  OnboardingResponse,
  PostSessionReflection,
  RecoverableFirstSessionDraft,
} from "@nidoru/validation";
import type { SystemNotificationPermissionState } from "@nidoru/domain";

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

type FirstSessionCompletionInput = FirstSessionRecord & {
  readonly eventId?: string;
};
type FirstSessionDraftInput = RecoverableFirstSessionDraft;
type FirstSessionAbandonedInput = AbandonedFirstSessionRecord;
type PostSessionReflectionInput = PostSessionReflection & {
  readonly reflectionId?: string;
};

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

type PendingPostSessionReflectionRow = {
  readonly completed_at: string;
  readonly completed_breath_cycles: number | null;
  readonly completion_persisted_at: string;
  readonly duration_seconds: number;
  readonly local_install_id: string;
  readonly plan_id: string;
  readonly session_id: string;
  readonly started_at: string;
  readonly status: string;
  readonly technique_id: string;
};

type NotificationGateEligibilityRow = {
  readonly completed_session_count: number;
  readonly first_active_at: string;
  readonly last_seen_at: string | null;
  readonly permission_state: string | null;
  readonly wind_down_minutes_after_midnight: number | null;
};

export type NotificationGateReadiness = {
  readonly eligibility: NotificationGateEligibility;
  readonly lastOpenedAt: Date | null;
  readonly windDownMinutesAfterMidnight: number | null;
};

export type LoadNotificationGateReadinessInput = {
  readonly database: LocalFirstOnboardingDatabase;
  readonly isInOnboarding: boolean;
  readonly localInstallId: string;
  readonly now: Date;
  readonly systemPermissionState: SystemNotificationPermissionState;
};

export type NotificationGateStateMutationInput = {
  readonly database: LocalFirstOnboardingDatabase;
  readonly eventId?: string;
  readonly localInstallId: string;
  readonly now: Date;
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

export async function loadNotificationGateReadiness({
  database,
  isInOnboarding,
  localInstallId,
  now,
  systemPermissionState,
}: LoadNotificationGateReadinessInput): Promise<NotificationGateReadiness> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);
  const gateRow = await database.getFirstAsync<NotificationGateEligibilityRow>(
    `
      SELECT
        local_install_identity.created_at AS first_active_at,
        local_install_identity.last_seen_at,
        onboarding_responses.wind_down_minutes_after_midnight,
        notification_gate_state.permission_state,
        (
          SELECT COUNT(*)
          FROM first_session_records
          WHERE first_session_records.local_install_id = local_install_identity.local_install_id
            AND first_session_records.status = 'completed'
            AND first_session_records.completed_at IS NOT NULL
            AND first_session_records.completion_persisted_at IS NOT NULL
        ) AS completed_session_count
      FROM local_install_identity
      LEFT JOIN onboarding_responses
        ON onboarding_responses.local_install_id = local_install_identity.local_install_id
      LEFT JOIN notification_gate_state
        ON notification_gate_state.local_install_id = local_install_identity.local_install_id
      WHERE local_install_identity.local_install_id = ?
      LIMIT 1;
    `,
    [parsedLocalInstallId],
  );

  if (!gateRow) {
    throw new Error("Cannot evaluate notification gate without a local install identity.");
  }

  const firstActiveAt = new Date(gateRow.first_active_at);
  const lastOpenedAt = gateRow.last_seen_at ? new Date(gateRow.last_seen_at) : null;
  const eligibility = notificationGateEligibilitySchema.parse({
    localInstallId: parsedLocalInstallId,
    isInOnboarding,
    daysSinceFirstActiveDay: getLocalCalendarDayDifference(now, firstActiveAt),
    completedSessionCount: gateRow.completed_session_count,
    permissionState: gateRow.permission_state ?? "not_shown",
    systemPermissionState,
  });

  return {
    eligibility,
    lastOpenedAt,
    windDownMinutesAfterMidnight: gateRow.wind_down_minutes_after_midnight,
  };
}

export async function markLocalInstallSeen({
  database,
  localInstallId,
  now,
}: Omit<NotificationGateStateMutationInput, "eventId">): Promise<void> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);
  const nowIso = now.toISOString();

  await database.runAsync(
    `
      UPDATE local_install_identity
      SET last_seen_at = ?
      WHERE local_install_id = ?;
    `,
    [nowIso, parsedLocalInstallId],
  );
}

export async function markNotificationPermissionPrompted({
  database,
  eventId,
  localInstallId,
  now,
}: NotificationGateStateMutationInput): Promise<void> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);
  const nowIso = now.toISOString();

  await upsertNotificationGateState(database, parsedLocalInstallId, "shown", nowIso, "shown_at");
  await insertNotificationPermissionEvent({
    database,
    eventName: "notification_permission_prompted",
    localInstallId: parsedLocalInstallId,
    nowIso,
    ...(eventId ? { eventId } : {}),
  });
}

export async function markNotificationPermissionAccepted({
  database,
  eventId,
  localInstallId,
  now,
}: NotificationGateStateMutationInput): Promise<void> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);
  const nowIso = now.toISOString();

  await upsertNotificationGateState(
    database,
    parsedLocalInstallId,
    "accepted",
    nowIso,
    "accepted_at",
  );
  await insertNotificationPermissionEvent({
    database,
    eventName: "notification_permission_accepted",
    localInstallId: parsedLocalInstallId,
    nowIso,
    ...(eventId ? { eventId } : {}),
  });
}

export async function markNotificationPermissionDeclined({
  database,
  localInstallId,
  now,
}: Omit<NotificationGateStateMutationInput, "eventId">): Promise<void> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);

  await upsertNotificationGateState(
    database,
    parsedLocalInstallId,
    "declined",
    now.toISOString(),
    "declined_at",
  );
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

  const eventAt = firstSessionRecord.completionPersistedAt ?? firstSessionRecord.completedAt;

  if (!eventAt) {
    throw new Error("Completed first-session records must include a persisted timestamp.");
  }

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
      input.eventId ?? createLocalEventId(),
      firstSessionRecord.localInstallId,
      "first_session_completed",
      "first_session_record",
      firstSessionRecord.sessionId,
      "{}",
      eventAt,
      eventAt,
    ],
  );
}

export async function savePostSessionReflectionLocally(
  database: LocalFirstOnboardingDatabase,
  input: PostSessionReflectionInput,
): Promise<PostSessionReflection> {
  const reflection = postSessionReflectionSchema.parse(input);
  const completedSession = await database.getFirstAsync<{
    readonly local_install_id: string;
    readonly session_id: string;
  }>(
    `
      SELECT session_id, local_install_id
      FROM first_session_records
      WHERE session_id = ?
        AND local_install_id = ?
        AND status = 'completed'
        AND completed_at IS NOT NULL
        AND completion_persisted_at IS NOT NULL
      LIMIT 1;
    `,
    [reflection.sessionId, reflection.localInstallId],
  );

  if (!completedSession) {
    throw new Error("Cannot save reflection without a completed first-session record.");
  }

  await database.runAsync(
    `
      INSERT INTO post_session_reflections (
        reflection_id,
        local_install_id,
        session_id,
        reflected_at,
        feeling
      )
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        reflected_at = excluded.reflected_at,
        feeling = excluded.feeling;
    `,
    [
      input.reflectionId ?? createLocalReflectionId(),
      reflection.localInstallId,
      reflection.sessionId,
      reflection.reflectedAt,
      reflection.feeling,
    ],
  );

  return reflection;
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

export async function loadPendingPostSessionReflection(
  database: LocalFirstOnboardingDatabase,
  input: { readonly localInstallId: string },
): Promise<FirstSessionRecord | null> {
  const localInstallId = localInstallIdSchema.parse(input.localInstallId);
  const completedRow = await database.getFirstAsync<PendingPostSessionReflectionRow>(
    `
      SELECT
        first_session_records.session_id,
        first_session_records.local_install_id,
        first_session_records.status,
        first_session_records.plan_id,
        first_session_records.technique_id,
        first_session_records.started_at,
        first_session_records.completed_at,
        first_session_records.duration_seconds,
        first_session_records.completed_breath_cycles,
        first_session_records.completion_persisted_at
      FROM first_session_records
      WHERE first_session_records.local_install_id = ?
        AND first_session_records.status = 'completed'
        AND first_session_records.completed_at IS NOT NULL
        AND first_session_records.completion_persisted_at IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM post_session_reflections
          WHERE post_session_reflections.session_id = first_session_records.session_id
        )
      ORDER BY first_session_records.completed_at DESC
      LIMIT 1;
    `,
    [localInstallId],
  );

  if (!completedRow) {
    return null;
  }

  return firstSessionRecordSchema.parse({
    completedAt: completedRow.completed_at,
    ...(completedRow.completed_breath_cycles === null
      ? {}
      : { completedBreathCycles: completedRow.completed_breath_cycles }),
    completionPersistedAt: completedRow.completion_persisted_at,
    durationSeconds: completedRow.duration_seconds,
    localInstallId: completedRow.local_install_id,
    planId: completedRow.plan_id,
    sessionId: completedRow.session_id,
    startedAt: completedRow.started_at,
    status: completedRow.status,
    techniqueId: completedRow.technique_id,
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

async function upsertNotificationGateState(
  database: LocalFirstOnboardingDatabase,
  localInstallId: string,
  permissionState: "shown" | "declined" | "accepted",
  nowIso: string,
  timestampColumn: "shown_at" | "declined_at" | "accepted_at",
): Promise<void> {
  await database.runAsync(
    `
      INSERT INTO notification_gate_state (
        local_install_id,
        first_active_day,
        completed_session_count,
        permission_state,
        ${timestampColumn},
        updated_at
      )
      VALUES (
        ?,
        (
          SELECT substr(created_at, 1, 10)
          FROM local_install_identity
          WHERE local_install_id = ?
        ),
        (
          SELECT COUNT(*)
          FROM first_session_records
          WHERE local_install_id = ?
            AND status = 'completed'
            AND completed_at IS NOT NULL
            AND completion_persisted_at IS NOT NULL
        ),
        ?,
        ?,
        ?
      )
      ON CONFLICT(local_install_id) DO UPDATE SET
        completed_session_count = excluded.completed_session_count,
        permission_state = excluded.permission_state,
        ${timestampColumn} = COALESCE(notification_gate_state.${timestampColumn}, excluded.${timestampColumn}),
        updated_at = excluded.updated_at;
    `,
    [localInstallId, localInstallId, localInstallId, permissionState, nowIso, nowIso],
  );
}

async function insertNotificationPermissionEvent({
  database,
  eventId,
  eventName,
  localInstallId,
  nowIso,
}: {
  readonly database: LocalFirstOnboardingDatabase;
  readonly eventId?: string;
  readonly eventName: "notification_permission_prompted" | "notification_permission_accepted";
  readonly localInstallId: string;
  readonly nowIso: string;
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
      "notification_gate_state",
      localInstallId,
      "{}",
      nowIso,
      nowIso,
    ],
  );
}

function getLocalCalendarDayDifference(later: Date, earlier: Date): number {
  const laterLocalMidnight = new Date(later.getFullYear(), later.getMonth(), later.getDate());
  const earlierLocalMidnight = new Date(
    earlier.getFullYear(),
    earlier.getMonth(),
    earlier.getDate(),
  );
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.floor(
      (laterLocalMidnight.getTime() - earlierLocalMidnight.getTime()) / millisecondsPerDay,
    ),
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

function createLocalReflectionId(): string {
  const randomSegment = createDefaultRandomSegment()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `reflection_${paddedSegment}`;
}
