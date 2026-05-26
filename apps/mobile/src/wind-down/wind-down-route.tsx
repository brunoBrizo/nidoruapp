import {
  getNoHoldFallbackTechniqueId,
  resolveWindDownRoutine,
  type WindDownContextGoal,
  type WindDownRoutine,
} from "@nidoru/domain";
import { useLocalSearchParams } from "expo-router";
import type { SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import { getOrCreateLocalInstallIdentity } from "../storage/local-install-identity";
import { openMigratedLocalDatabase } from "../storage/local-database";
import {
  completeWindDownRunLocally,
  loadRememberedWindDownContextChoiceLocally,
  recordWindDownStartedLocally,
  saveRememberedWindDownContextChoiceLocally,
  saveWindDownStepProgressLocally,
  stopWindDownRunLocally,
  type WindDownLocalPersistenceDatabase,
} from "./wind-down-local-persistence";
import {
  WindDownScreen,
  type WindDownActiveRoutineView,
  type WindDownVisualStateId,
} from "./wind-down-screen";

type WindDownRouteState =
  | { readonly status: "preparing" }
  | {
      readonly database: WindDownLocalPersistenceDatabase;
      readonly localInstallId: string;
      readonly status: "quick_context";
    }
  | {
      readonly session: WindDownRouteSession;
      readonly status: "session";
      readonly visualState: Exclude<WindDownVisualStateId, "quick_context">;
    };

type WindDownBootstrap = {
  readonly database: WindDownLocalPersistenceDatabase;
  readonly localInstallId: string;
};

type WindDownRouteSession = WindDownBootstrap & {
  readonly activeRoutine: WindDownActiveRoutineView;
  readonly ambientTimerDurationSeconds: number;
  readonly routine: WindDownRoutine;
  readonly runId: string;
};

export function WindDownRoute() {
  const visualProofState = parseVisualProofState(useLocalSearchParams().windDownState);

  if (__DEV__ && visualProofState) {
    return <WindDownVisualProofRoute state={visualProofState} />;
  }

  return <WindDownLiveRoute />;
}

function WindDownLiveRoute() {
  const [routeState, setRouteState] = useState<WindDownRouteState>({ status: "preparing" });

  const moveSession = useCallback(
    (
      session: WindDownRouteSession,
      visualState: Exclude<WindDownVisualStateId, "quick_context">,
    ) => {
      setRouteState((currentState) => {
        if (currentState.status !== "session" || currentState.session.runId !== session.runId) {
          return currentState;
        }

        return {
          ...currentState,
          visualState,
        };
      });
    },
    [],
  );

  const saveSessionProgress = useCallback(
    async (
      session: WindDownRouteSession,
      input: {
        readonly recoveryState: Exclude<WindDownVisualStateId, "quick_context">;
        readonly status: "started" | "breath_completed" | "body_cue_completed" | "ambient_playing";
      } & Partial<{
        readonly ambientCompletedAt: string;
        readonly ambientStartedAt: string;
        readonly bodyCueCompletedAt: string;
        readonly bodyCueStartedAt: string;
        readonly breathworkCompletedAt: string;
        readonly breathworkStartedAt: string;
      }>,
    ) => {
      await saveWindDownStepProgressLocally(session.database, {
        localInstallId: session.localInstallId,
        runId: session.runId,
        updatedAt: new Date().toISOString(),
        ...input,
      });
    },
    [],
  );

  const switchSessionToNoHoldFallback = useCallback((session: WindDownRouteSession) => {
    setRouteState((currentState) => {
      if (currentState.status !== "session" || currentState.session.runId !== session.runId) {
        return currentState;
      }

      const fallbackRoutine = resolveWindDownRoutine({
        preferNoHoldBreathwork: true,
        selectedGoal: session.routine.contextGoal,
      }).routine;
      const activeRoutine = createActiveRoutineView(fallbackRoutine, {
        isNoHoldFallback:
          fallbackRoutine.breathwork.techniqueId !== session.routine.breathwork.techniqueId,
      });

      return {
        session: {
          ...currentState.session,
          activeRoutine,
        },
        status: "session",
        visualState: activeRoutine.uiState,
      };
    });
  }, []);

  const startRoutine = useCallback(
    async ({
      bootstrap,
      goal,
      rememberChoice,
    }: {
      readonly bootstrap: WindDownBootstrap;
      readonly goal: WindDownContextGoal;
      readonly rememberChoice: boolean;
    }) => {
      const selectedAt = new Date().toISOString();
      const resolution = resolveWindDownRoutine({ selectedGoal: goal });
      const runId = createWindDownRunId();

      if (rememberChoice) {
        await saveRememberedWindDownContextChoiceLocally(bootstrap.database, {
          contextGoal: goal,
          localInstallId: bootstrap.localInstallId,
          routineId: resolution.routine.id,
          selectedAt,
        });
      }

      await recordWindDownStartedLocally(bootstrap.database, {
        ambientSoundId: resolution.routine.ambient.soundId,
        contextGoal: resolution.routine.contextGoal,
        localInstallId: bootstrap.localInstallId,
        routineId: resolution.routine.id,
        runId,
        startedAt: selectedAt,
      });

      const activeRoutine = createActiveRoutineView(resolution.routine);

      setRouteState({
        session: {
          ...bootstrap,
          activeRoutine,
          ambientTimerDurationSeconds: resolution.routine.ambient.timerDurationSeconds,
          routine: resolution.routine,
          runId,
        },
        status: "session",
        visualState: activeRoutine.uiState,
      });
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    openMigratedLocalDatabase()
      .then(async (database) => {
        const localDatabase = createWindDownLocalPersistenceDatabase(database);
        const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
        const rememberedChoice = await loadRememberedWindDownContextChoiceLocally(localDatabase, {
          localInstallId,
        });

        if (!isMounted) {
          return;
        }

        if (!rememberedChoice) {
          setRouteState({
            database: localDatabase,
            localInstallId,
            status: "quick_context",
          });
          return;
        }

        const rememberedResolution = resolveWindDownRoutine({
          rememberedGoal: rememberedChoice.contextGoal,
        });
        const runId = createWindDownRunId();
        const startedAt = new Date().toISOString();

        await recordWindDownStartedLocally(localDatabase, {
          ambientSoundId: rememberedResolution.routine.ambient.soundId,
          contextGoal: rememberedResolution.routine.contextGoal,
          localInstallId,
          routineId: rememberedResolution.routine.id,
          runId,
          startedAt,
        });

        if (isMounted) {
          const activeRoutine = createActiveRoutineView(rememberedResolution.routine);

          setRouteState({
            session: {
              activeRoutine,
              ambientTimerDurationSeconds:
                rememberedResolution.routine.ambient.timerDurationSeconds,
              database: localDatabase,
              localInstallId,
              routine: rememberedResolution.routine,
              runId,
            },
            status: "session",
            visualState: activeRoutine.uiState,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteState({ status: "preparing" });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (routeState.status !== "session") {
      return undefined;
    }

    const { session, visualState } = routeState;
    const scheduleTransition = (
      delayMs: number,
      nextState: Exclude<WindDownVisualStateId, "quick_context">,
      createPersistInput?: () => Parameters<typeof saveSessionProgress>[1],
    ) => {
      const timeout = setTimeout(() => {
        const persistInput = createPersistInput?.();

        void (persistInput
          ? saveSessionProgress(session, persistInput).finally(() =>
              moveSession(session, nextState),
            )
          : Promise.resolve().then(() => moveSession(session, nextState)));
      }, delayMs);

      return () => clearTimeout(timeout);
    };

    if (visualState === "active_winddown" || visualState === "daily_calm") {
      return scheduleTransition(
        session.activeRoutine.remainingSeconds * 1000,
        "transition_card",
        () => ({
          breathworkCompletedAt: new Date().toISOString(),
          recoveryState: "transition_card",
          status: "breath_completed",
        }),
      );
    }

    if (visualState === "transition_card") {
      return scheduleTransition(5_000, "body_cue", () => ({
        bodyCueStartedAt: new Date().toISOString(),
        recoveryState: "body_cue",
        status: "breath_completed",
      }));
    }

    if (visualState === "body_cue") {
      return scheduleTransition(120_000, "ambient_handoff", () => {
        const completedAt = new Date().toISOString();

        return {
          ambientStartedAt: completedAt,
          bodyCueCompletedAt: completedAt,
          recoveryState: "ambient_handoff",
          status: "body_cue_completed",
        };
      });
    }

    if (visualState === "dimmed_idle") {
      const timeout = setTimeout(() => {
        const completedAt = new Date().toISOString();

        void completeWindDownRunLocally(session.database, {
          ambientCompletedAt: completedAt,
          completedAt,
          localInstallId: session.localInstallId,
          recoveryState: "completion",
          runId: session.runId,
          status: "completed",
          totalDurationSeconds: session.ambientTimerDurationSeconds,
          updatedAt: completedAt,
        }).finally(() => moveSession(session, "completion"));
      }, session.ambientTimerDurationSeconds * 1000);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [moveSession, routeState, saveSessionProgress]);

  if (routeState.status === "session") {
    const { session, visualState } = routeState;

    return (
      <WindDownScreen
        activeRoutine={session.activeRoutine}
        onClose={() => {
          moveSession(session, "completion");
        }}
        onContinue={() => {
          if (visualState === "ambient_handoff" || visualState === "audio_interruption") {
            void saveSessionProgress(session, {
              ambientStartedAt: new Date().toISOString(),
              recoveryState: "dimmed_idle",
              status: "ambient_playing",
            }).finally(() => moveSession(session, "dimmed_idle"));
            return;
          }

          if (visualState === "partial_stop" || visualState === "background_recovery") {
            moveSession(session, "ambient_handoff");
            return;
          }

          moveSession(session, "body_cue");
        }}
        onFadeNow={() => {
          void saveSessionProgress(session, {
            recoveryState: "audio_interruption",
            status: "ambient_playing",
          }).finally(() => moveSession(session, "audio_interruption"));
        }}
        onSkipForTonight={() => {
          moveSession(session, "completion");
        }}
        onStop={() => {
          const stoppedAt = new Date().toISOString();

          if (visualState === "body_cue") {
            void stopWindDownRunLocally(session.database, {
              localInstallId: session.localInstallId,
              recoveryState: "partial_stop",
              runId: session.runId,
              stopReason: "user_stop",
              status: "stopped",
              stoppedAt,
              totalDurationSeconds: 380,
              updatedAt: stoppedAt,
            }).finally(() => moveSession(session, "partial_stop"));
            return;
          }

          void completeWindDownRunLocally(session.database, {
            ambientCompletedAt: stoppedAt,
            completedAt: stoppedAt,
            localInstallId: session.localInstallId,
            recoveryState: "completion",
            runId: session.runId,
            status: "completed",
            totalDurationSeconds: session.ambientTimerDurationSeconds,
            updatedAt: stoppedAt,
          }).finally(() => moveSession(session, "completion"));
        }}
        onUseNoHoldFallback={() => {
          switchSessionToNoHoldFallback(session);
        }}
        onWake={() => {
          moveSession(session, "tap_to_wake");
        }}
        state={visualState}
      />
    );
  }

  if (routeState.status === "quick_context") {
    return (
      <WindDownScreen
        onSelectGoal={(goal) => {
          void startRoutine({
            bootstrap: {
              database: routeState.database,
              localInstallId: routeState.localInstallId,
            },
            goal,
            rememberChoice: true,
          });
        }}
        state="quick_context"
      />
    );
  }

  return <WindDownScreen state="preparing" />;
}

function WindDownVisualProofRoute({ state }: { readonly state: WindDownVisualStateId }) {
  if (state === "quick_context") {
    return <WindDownScreen onSelectGoal={() => undefined} state="quick_context" />;
  }

  return <WindDownScreen state={state} />;
}

function createWindDownLocalPersistenceDatabase(
  database: SQLiteDatabase,
): WindDownLocalPersistenceDatabase {
  return {
    getFirstAsync: (source, values = []) => database.getFirstAsync(source, [...values]),
    runAsync: (source, values = []) => database.runAsync(source, [...values]),
  };
}

function createActiveRoutineView(
  routine: WindDownRoutine,
  options: { readonly isNoHoldFallback?: boolean } = {},
): WindDownActiveRoutineView {
  return {
    breathworkDurationSeconds: routine.breathwork.durationSeconds,
    phaseLabel: "Inhale",
    remainingSeconds: routine.breathwork.durationSeconds,
    isNoHoldFallback: options.isNoHoldFallback === true,
    noHoldFallbackTechniqueId: getNoHoldFallbackTechniqueId(routine.breathwork.techniqueId),
    soundLabel: routine.ambient.soundLabel,
    techniqueId: routine.breathwork.techniqueId,
    uiState: routine.breathwork.uiState,
  };
}

const windDownVisualProofStates = [
  "quick_context",
  "active_winddown",
  "daily_calm",
  "transition_card",
  "body_cue",
  "ambient_handoff",
  "dimmed_idle",
  "tap_to_wake",
  "audio_interruption",
  "completion",
  "partial_stop",
  "background_recovery",
] as const satisfies readonly WindDownVisualStateId[];

function parseVisualProofState(value: unknown): WindDownVisualStateId | null {
  const candidate = Array.isArray(value) ? value[0] : value;

  return windDownVisualProofStates.includes(candidate as WindDownVisualStateId)
    ? (candidate as WindDownVisualStateId)
    : null;
}

function createWindDownRunId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  const rawSegment = randomUuid
    ? randomUuid.replaceAll("-", "_")
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const randomSegment = rawSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `winddown_${paddedSegment}`;
}
