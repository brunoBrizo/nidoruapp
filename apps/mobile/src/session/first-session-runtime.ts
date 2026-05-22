import type { BreathPhaseName, BreathTechniqueId, OnboardingPlanId } from "@nidoru/domain";
import type { FirstSessionRecord } from "@nidoru/validation";

import {
  completeBreathSessionIfDue,
  createBreathSessionController,
  endBreathSessionEarly,
  getBreathSessionSnapshot,
  pauseBreathSession,
  resumeBreathSession,
  type BreathSessionController,
  type BreathSessionControllerInput,
  type BreathSessionSnapshot,
} from "./breath-session-runtime";

export type FirstSessionPhaseName = BreathPhaseName;

export type FirstSessionControllerInput = Omit<
  BreathSessionControllerInput,
  "planId" | "source"
> & {
  readonly planId: OnboardingPlanId;
};

type FirstSessionBreathControllerInput = FirstSessionControllerInput & {
  readonly source: "first_session";
};

export type FirstSessionController = BreathSessionController<FirstSessionBreathControllerInput>;

export type FirstSessionSnapshot = BreathSessionSnapshot;

export type FirstSessionDraftRecord = {
  readonly completedBreathCycles: number;
  readonly currentPhaseName: FirstSessionPhaseName;
  readonly durationSeconds: number;
  readonly elapsedDurationMs: number;
  readonly localInstallId: string;
  readonly planId: OnboardingPlanId;
  readonly remainingDurationMs: number;
  readonly sessionId: string;
  readonly startedAt: string;
  readonly status: "draft";
  readonly techniqueId: BreathTechniqueId;
  readonly updatedAt: string;
};

export type FirstSessionAbandonedRecord = Omit<FirstSessionDraftRecord, "status"> & {
  readonly abandonedAt: string;
  readonly status: "abandoned";
};

export function createFirstSessionController(
  input: FirstSessionControllerInput,
): FirstSessionController {
  return createBreathSessionController({
    ...input,
    source: "first_session",
  });
}

export function getFirstSessionSnapshot(
  controller: FirstSessionController,
  observedAtMs: number,
): FirstSessionSnapshot {
  return getBreathSessionSnapshot(controller, observedAtMs);
}

export function pauseFirstSession(
  controller: FirstSessionController,
  pausedAtMs: number,
): FirstSessionController {
  return pauseBreathSession(controller, pausedAtMs);
}

export function resumeFirstSession(
  controller: FirstSessionController,
  resumedAtMs: number,
): FirstSessionController {
  return resumeBreathSession(controller, resumedAtMs);
}

export function completeFirstSessionIfDue(
  controller: FirstSessionController,
  observedAtMs: number,
): FirstSessionRecord | undefined {
  const completedRecord = completeBreathSessionIfDue(controller, observedAtMs);

  if (!completedRecord) {
    return undefined;
  }

  return {
    completedAt: completedRecord.completedAt,
    completedBreathCycles: completedRecord.completedBreathCycles,
    completionPersistedAt: completedRecord.completionPersistedAt,
    durationSeconds: completedRecord.durationSeconds,
    localInstallId: completedRecord.localInstallId,
    planId: controller.planId,
    sessionId: completedRecord.sessionId,
    startedAt: completedRecord.startedAt,
    status: "completed",
    techniqueId: completedRecord.techniqueId,
  };
}

export function endFirstSessionEarly(
  controller: FirstSessionController,
  observedAtMs: number,
): FirstSessionAbandonedRecord {
  const abandonedRecord = endBreathSessionEarly(controller, observedAtMs);

  return {
    abandonedAt: abandonedRecord.abandonedAt,
    completedBreathCycles: abandonedRecord.completedBreathCycles,
    currentPhaseName: abandonedRecord.currentPhaseName,
    durationSeconds: abandonedRecord.durationSeconds,
    elapsedDurationMs: abandonedRecord.elapsedDurationMs,
    localInstallId: abandonedRecord.localInstallId,
    planId: controller.planId,
    remainingDurationMs: abandonedRecord.remainingDurationMs,
    sessionId: abandonedRecord.sessionId,
    startedAt: abandonedRecord.startedAt,
    status: "abandoned",
    techniqueId: abandonedRecord.techniqueId,
    updatedAt: abandonedRecord.updatedAt,
  };
}

export function createFirstSessionDraftFromSnapshot(
  controller: FirstSessionController,
  snapshot: FirstSessionSnapshot,
): FirstSessionDraftRecord {
  return {
    completedBreathCycles: snapshot.completedBreathCycles,
    currentPhaseName: snapshot.phaseName,
    durationSeconds: controller.totalDurationSeconds,
    elapsedDurationMs: snapshot.elapsedDurationMs,
    localInstallId: controller.localInstallId,
    planId: controller.planId,
    remainingDurationMs: snapshot.remainingDurationMs,
    sessionId: controller.sessionId,
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "draft",
    techniqueId: controller.techniqueId,
    updatedAt: new Date(snapshot.observedAtMs).toISOString(),
  };
}
