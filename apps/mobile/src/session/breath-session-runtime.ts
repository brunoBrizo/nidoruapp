import {
  breathSessionDurationBounds,
  breathTechniques,
  type BreathPhaseName,
  type BreathTechniqueId,
  type OnboardingPlanId,
} from "@nidoru/domain";

type BreathTechniquePhase = {
  readonly durationMs: number;
  readonly name: BreathPhaseName;
};

type BreathTechniquePhases = readonly BreathTechniquePhase[];

export type BreathSessionSource =
  | "breathe_tab"
  | "first_session"
  | "morning_check_in"
  | "rescue_me"
  | "wind_down";

export type BreathSessionControllerInput = {
  readonly localInstallId: string;
  readonly planId?: OnboardingPlanId;
  readonly sessionId: string;
  readonly source: BreathSessionSource;
  readonly startedAtMs: number;
  readonly targetBreathCycles?: number;
  readonly techniqueId: BreathTechniqueId;
  readonly totalDurationSeconds: number;
};

export type BreathSessionController<
  TInput extends BreathSessionControllerInput = BreathSessionControllerInput,
> = TInput & {
  readonly pausedAtMs?: number;
  readonly totalPausedMs: number;
};

export type BreathSessionSnapshotStatus = "active" | "completed" | "paused";

export type BreathSessionSnapshot = {
  readonly completedBreathCycles: number;
  readonly currentPhase: {
    readonly durationMs: number;
    readonly elapsedMs: number;
    readonly index: number;
    readonly name: BreathPhaseName;
    readonly progress: number;
    readonly startedAtElapsedMs: number;
    readonly startedAtMs: number;
  };
  readonly elapsedDurationMs: number;
  readonly elapsedSeconds: number;
  readonly isPaused: boolean;
  readonly observedAtMs: number;
  readonly phaseDurationMs: number;
  readonly phaseElapsedMs: number;
  readonly phaseIndex: number;
  readonly phaseName: BreathPhaseName;
  readonly phaseProgress: number;
  readonly phaseStartedAtElapsedMs: number;
  readonly phaseStartedAtMs: number;
  readonly remainingDurationMs: number;
  readonly remainingSeconds: number;
  readonly status: BreathSessionSnapshotStatus;
  readonly totalDurationMs: number;
  readonly totalDurationSeconds: number;
};

export type CompletedBreathSessionRecord = {
  readonly completedAt: string;
  readonly completedBreathCycles: number;
  readonly completionPersistedAt: string;
  readonly durationSeconds: number;
  readonly localInstallId: string;
  readonly planId?: OnboardingPlanId;
  readonly sessionId: string;
  readonly source: BreathSessionSource;
  readonly startedAt: string;
  readonly status: "completed";
  readonly techniqueId: BreathTechniqueId;
};

export type AbandonedBreathSessionRecord = {
  readonly abandonedAt: string;
  readonly completedBreathCycles: number;
  readonly currentPhaseName: BreathPhaseName;
  readonly durationSeconds: number;
  readonly elapsedDurationMs: number;
  readonly localInstallId: string;
  readonly planId?: OnboardingPlanId;
  readonly remainingDurationMs: number;
  readonly sessionId: string;
  readonly source: BreathSessionSource;
  readonly startedAt: string;
  readonly status: "abandoned";
  readonly techniqueId: BreathTechniqueId;
  readonly updatedAt: string;
};

export function createBreathSessionController<TInput extends BreathSessionControllerInput>(
  input: TInput,
): BreathSessionController<TInput> {
  const technique = breathTechniques[input.techniqueId];

  if (!technique) {
    throw new Error(`Unknown breath-session technique: ${input.techniqueId}`);
  }

  if (!Number.isFinite(input.startedAtMs)) {
    throw new Error("Breath-session start time must be finite.");
  }

  if (
    !Number.isInteger(input.totalDurationSeconds) ||
    input.totalDurationSeconds < breathSessionDurationBounds.minSeconds ||
    input.totalDurationSeconds > breathSessionDurationBounds.maxSeconds
  ) {
    throw new Error("Breath-session duration is outside the supported bounds.");
  }

  if (
    input.targetBreathCycles !== undefined &&
    (!Number.isInteger(input.targetBreathCycles) || input.targetBreathCycles <= 0)
  ) {
    throw new Error("Breath-session target cycle count must be a positive integer.");
  }

  return {
    ...input,
    totalPausedMs: 0,
  };
}

export function getBreathSessionSnapshot(
  controller: BreathSessionController,
  observedAtMs: number,
): BreathSessionSnapshot {
  const technique = breathTechniques[controller.techniqueId];
  const totalDurationMs = controller.totalDurationSeconds * 1000;
  const phases = getSessionPhases({
    phases: technique.phases,
    targetBreathCycles: controller.targetBreathCycles,
    totalDurationMs,
  });
  const effectiveObservedAtMs = controller.pausedAtMs ?? observedAtMs;
  const elapsedDurationMs = clamp(
    effectiveObservedAtMs - controller.startedAtMs - controller.totalPausedMs,
    0,
    totalDurationMs,
  );
  const phase = getPhaseAtElapsedMs(phases, elapsedDurationMs);
  const phaseStartedAtMs =
    controller.startedAtMs + controller.totalPausedMs + phase.startedAtElapsedMs;
  const remainingDurationMs = totalDurationMs - elapsedDurationMs;
  const isPaused = controller.pausedAtMs !== undefined;
  const status = isPaused
    ? "paused"
    : elapsedDurationMs >= totalDurationMs
      ? "completed"
      : "active";
  const phaseProgress = phase.elapsedMs / phase.durationMs;

  return {
    completedBreathCycles: Math.floor(elapsedDurationMs / getCycleDurationMs(phases)),
    currentPhase: {
      durationMs: phase.durationMs,
      elapsedMs: phase.elapsedMs,
      index: phase.index,
      name: phase.name,
      progress: phaseProgress,
      startedAtElapsedMs: phase.startedAtElapsedMs,
      startedAtMs: phaseStartedAtMs,
    },
    elapsedDurationMs,
    elapsedSeconds: Math.floor(elapsedDurationMs / 1000),
    isPaused,
    observedAtMs: effectiveObservedAtMs,
    phaseDurationMs: phase.durationMs,
    phaseElapsedMs: phase.elapsedMs,
    phaseIndex: phase.index,
    phaseName: phase.name,
    phaseProgress,
    phaseStartedAtElapsedMs: phase.startedAtElapsedMs,
    phaseStartedAtMs,
    remainingDurationMs,
    remainingSeconds: Math.ceil(remainingDurationMs / 1000),
    status,
    totalDurationMs,
    totalDurationSeconds: controller.totalDurationSeconds,
  };
}

export function pauseBreathSession<TInput extends BreathSessionControllerInput>(
  controller: BreathSessionController<TInput>,
  pausedAtMs: number,
): BreathSessionController<TInput> {
  if (controller.pausedAtMs !== undefined) {
    return controller;
  }

  return {
    ...controller,
    pausedAtMs,
  };
}

export function resumeBreathSession<TInput extends BreathSessionControllerInput>(
  controller: BreathSessionController<TInput>,
  resumedAtMs: number,
): BreathSessionController<TInput> {
  const { pausedAtMs, ...activeController } = controller;

  if (pausedAtMs === undefined) {
    return controller;
  }

  return {
    ...activeController,
    totalPausedMs: activeController.totalPausedMs + Math.max(0, resumedAtMs - pausedAtMs),
  } as BreathSessionController<TInput>;
}

export function completeBreathSessionIfDue(
  controller: BreathSessionController,
  observedAtMs: number,
): CompletedBreathSessionRecord | undefined {
  const snapshot = getBreathSessionSnapshot(controller, observedAtMs);

  if (snapshot.status !== "completed") {
    return undefined;
  }

  const completedAt = new Date(
    controller.startedAtMs + controller.totalPausedMs + snapshot.totalDurationMs,
  ).toISOString();
  const baseRecord = {
    completedAt,
    completedBreathCycles: snapshot.completedBreathCycles,
    completionPersistedAt: completedAt,
    durationSeconds: controller.totalDurationSeconds,
    localInstallId: controller.localInstallId,
    sessionId: controller.sessionId,
    source: controller.source,
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "completed",
    techniqueId: controller.techniqueId,
  } as const;

  return controller.planId === undefined
    ? baseRecord
    : { ...baseRecord, planId: controller.planId };
}

export function endBreathSessionEarly(
  controller: BreathSessionController,
  observedAtMs: number,
): AbandonedBreathSessionRecord {
  const snapshot = getBreathSessionSnapshot(controller, observedAtMs);
  const abandonedAt = new Date(snapshot.observedAtMs).toISOString();
  const baseRecord = {
    abandonedAt,
    completedBreathCycles: snapshot.completedBreathCycles,
    currentPhaseName: snapshot.phaseName,
    durationSeconds: controller.totalDurationSeconds,
    elapsedDurationMs: snapshot.elapsedDurationMs,
    localInstallId: controller.localInstallId,
    remainingDurationMs: snapshot.remainingDurationMs,
    sessionId: controller.sessionId,
    source: controller.source,
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "abandoned",
    techniqueId: controller.techniqueId,
    updatedAt: abandonedAt,
  } as const;

  return controller.planId === undefined
    ? baseRecord
    : { ...baseRecord, planId: controller.planId };
}

function getPhaseAtElapsedMs(phases: BreathTechniquePhases, elapsedDurationMs: number) {
  const cycleDurationMs = getCycleDurationMs(phases);
  const cycleStartElapsedMs = Math.floor(elapsedDurationMs / cycleDurationMs) * cycleDurationMs;
  const cycleElapsedMs = elapsedDurationMs % cycleDurationMs;
  let phaseStartInCycleMs = 0;

  for (const [index, phase] of phases.entries()) {
    const phaseEndMs = phaseStartInCycleMs + phase.durationMs;

    if (cycleElapsedMs < phaseEndMs) {
      return {
        durationMs: phase.durationMs,
        elapsedMs: cycleElapsedMs - phaseStartInCycleMs,
        index,
        name: phase.name,
        startedAtElapsedMs: cycleStartElapsedMs + phaseStartInCycleMs,
      };
    }

    phaseStartInCycleMs = phaseEndMs;
  }

  const fallbackPhase = phases[phases.length - 1];

  if (!fallbackPhase) {
    throw new Error("Breath-session technique must include at least one breath phase.");
  }

  return {
    durationMs: fallbackPhase.durationMs,
    elapsedMs: fallbackPhase.durationMs,
    index: phases.length - 1,
    name: fallbackPhase.name,
    startedAtElapsedMs: cycleStartElapsedMs + phaseStartInCycleMs - fallbackPhase.durationMs,
  };
}

function getSessionPhases({
  phases,
  targetBreathCycles,
  totalDurationMs,
}: {
  readonly phases: BreathTechniquePhases;
  readonly targetBreathCycles: number | undefined;
  readonly totalDurationMs: number;
}): BreathTechniquePhases {
  if (targetBreathCycles === undefined) {
    return phases;
  }

  const baseCycleDurationMs = getCycleDurationMs(phases);
  const targetCycleDurationMs = totalDurationMs / targetBreathCycles;
  let accumulatedDurationMs = 0;

  return phases.map((phase, index) => {
    const isLastPhase = index === phases.length - 1;
    const durationMs = isLastPhase
      ? Math.max(1, Math.round(targetCycleDurationMs - accumulatedDurationMs))
      : Math.max(1, Math.round((phase.durationMs / baseCycleDurationMs) * targetCycleDurationMs));

    accumulatedDurationMs += durationMs;

    return {
      ...phase,
      durationMs,
    };
  }) as BreathTechniquePhases;
}

function getCycleDurationMs(phases: BreathTechniquePhases) {
  const cycleDurationMs = phases.reduce((durationMs, phase) => durationMs + phase.durationMs, 0);

  if (cycleDurationMs <= 0) {
    throw new Error("Breath-session technique cycle duration must be positive.");
  }

  return cycleDurationMs;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
