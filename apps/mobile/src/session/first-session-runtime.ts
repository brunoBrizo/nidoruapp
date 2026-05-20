import { breathTechniques, type BreathTechniqueId, type OnboardingPlanId } from "@nidoru/domain";
import type { FirstSessionRecord } from "@nidoru/validation";

export type FirstSessionPhaseName =
  (typeof breathTechniques)[BreathTechniqueId]["phases"][number]["name"];

export type FirstSessionControllerInput = {
  readonly localInstallId: string;
  readonly planId: OnboardingPlanId;
  readonly sessionId: string;
  readonly startedAtMs: number;
  readonly techniqueId: BreathTechniqueId;
  readonly totalDurationSeconds: number;
};

export type FirstSessionController = FirstSessionControllerInput & {
  readonly pausedAtMs?: number;
  readonly totalPausedMs: number;
};

export type FirstSessionSnapshot = {
  readonly completedBreathCycles: number;
  readonly elapsedDurationMs: number;
  readonly elapsedSeconds: number;
  readonly isPaused: boolean;
  readonly observedAtMs: number;
  readonly phaseDurationMs: number;
  readonly phaseElapsedMs: number;
  readonly phaseName: FirstSessionPhaseName;
  readonly remainingDurationMs: number;
  readonly remainingSeconds: number;
  readonly status: "active" | "completed" | "paused";
};

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

const minimumDurationSeconds = 1;

export function createFirstSessionController(
  input: FirstSessionControllerInput,
): FirstSessionController {
  const technique = breathTechniques[input.techniqueId];

  if (!technique) {
    throw new Error(`Unknown first-session technique: ${input.techniqueId}`);
  }

  if (input.totalDurationSeconds < minimumDurationSeconds) {
    throw new Error("First-session duration must be positive.");
  }

  return {
    ...input,
    totalPausedMs: 0,
  };
}

export function getFirstSessionSnapshot(
  controller: FirstSessionController,
  observedAtMs: number,
): FirstSessionSnapshot {
  const technique = breathTechniques[controller.techniqueId];
  const totalDurationMs = controller.totalDurationSeconds * 1000;
  const effectiveObservedAtMs = controller.pausedAtMs ?? observedAtMs;
  const elapsedDurationMs = clamp(
    effectiveObservedAtMs - controller.startedAtMs - controller.totalPausedMs,
    0,
    totalDurationMs,
  );
  const phase = getPhaseAtElapsedMs(technique.phases, elapsedDurationMs);
  const remainingDurationMs = totalDurationMs - elapsedDurationMs;
  const isPaused = controller.pausedAtMs !== undefined;
  const status = isPaused
    ? "paused"
    : elapsedDurationMs >= totalDurationMs
      ? "completed"
      : "active";

  return {
    completedBreathCycles: Math.floor(elapsedDurationMs / getCycleDurationMs(technique.phases)),
    elapsedDurationMs,
    elapsedSeconds: Math.floor(elapsedDurationMs / 1000),
    isPaused,
    observedAtMs: effectiveObservedAtMs,
    phaseDurationMs: phase.durationMs,
    phaseElapsedMs: phase.elapsedMs,
    phaseName: phase.name,
    remainingDurationMs,
    remainingSeconds: Math.ceil(remainingDurationMs / 1000),
    status,
  };
}

export function pauseFirstSession(
  controller: FirstSessionController,
  pausedAtMs: number,
): FirstSessionController {
  if (controller.pausedAtMs !== undefined) {
    return controller;
  }

  return {
    ...controller,
    pausedAtMs,
  };
}

export function resumeFirstSession(
  controller: FirstSessionController,
  resumedAtMs: number,
): FirstSessionController {
  const pausedAtMs = controller.pausedAtMs;

  if (pausedAtMs === undefined) {
    return controller;
  }

  return {
    localInstallId: controller.localInstallId,
    planId: controller.planId,
    sessionId: controller.sessionId,
    startedAtMs: controller.startedAtMs,
    techniqueId: controller.techniqueId,
    totalPausedMs: controller.totalPausedMs + Math.max(0, resumedAtMs - pausedAtMs),
    totalDurationSeconds: controller.totalDurationSeconds,
  };
}

export function completeFirstSessionIfDue(
  controller: FirstSessionController,
  observedAtMs: number,
): FirstSessionRecord | undefined {
  const snapshot = getFirstSessionSnapshot(controller, observedAtMs);

  if (snapshot.status !== "completed") {
    return undefined;
  }

  const completedAt = new Date(snapshot.observedAtMs).toISOString();

  return {
    completedAt,
    completedBreathCycles: snapshot.completedBreathCycles,
    completionPersistedAt: completedAt,
    durationSeconds: controller.totalDurationSeconds,
    localInstallId: controller.localInstallId,
    planId: controller.planId,
    sessionId: controller.sessionId,
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "completed",
    techniqueId: controller.techniqueId,
  };
}

export function endFirstSessionEarly(
  controller: FirstSessionController,
  observedAtMs: number,
): FirstSessionAbandonedRecord {
  const snapshot = getFirstSessionSnapshot(controller, observedAtMs);
  const abandonedAt = new Date(snapshot.observedAtMs).toISOString();

  return {
    ...createFirstSessionDraftFromSnapshot(controller, snapshot),
    abandonedAt,
    status: "abandoned",
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

function getPhaseAtElapsedMs(
  phases: (typeof breathTechniques)[BreathTechniqueId]["phases"],
  elapsedDurationMs: number,
) {
  const cycleDurationMs = getCycleDurationMs(phases);
  const cycleElapsedMs = elapsedDurationMs % cycleDurationMs;
  let phaseStartMs = 0;

  for (const phase of phases) {
    const phaseEndMs = phaseStartMs + phase.durationMs;

    if (cycleElapsedMs < phaseEndMs) {
      return {
        durationMs: phase.durationMs,
        elapsedMs: cycleElapsedMs - phaseStartMs,
        name: phase.name,
      };
    }

    phaseStartMs = phaseEndMs;
  }

  const fallbackPhase = phases[phases.length - 1];

  if (!fallbackPhase) {
    throw new Error("First-session technique must include at least one breath phase.");
  }

  return {
    durationMs: fallbackPhase.durationMs,
    elapsedMs: fallbackPhase.durationMs,
    name: fallbackPhase.name,
  };
}

function getCycleDurationMs(phases: (typeof breathTechniques)[BreathTechniqueId]["phases"]) {
  return phases.reduce((durationMs, phase) => durationMs + phase.durationMs, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
