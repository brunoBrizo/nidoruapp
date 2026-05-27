import {
  getNoHoldFallbackTechniqueId,
  parseWindDownContextGoalInput,
  resolveWindDownRoutine,
  type BreathAudioCueModeId,
  type WindDownContextGoal,
  type WindDownRoutine,
} from "@nidoru/domain";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import type { SQLiteDatabase } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import {
  createActiveSessionAudioController,
  type ActiveSessionAudioController,
} from "../audio/active-session-audio-controller";
import {
  createWindDownAmbientAudioController,
  type WindDownAmbientAudioController,
  type WindDownAmbientAudioSnapshot,
} from "../audio/wind-down-ambient-audio";
import type { SleepTimerAppState } from "../audio/sleep-timer-power-management";
import {
  completeBreathSessionLocally,
  recordBreathSessionStartedLocally,
  saveBreathSessionDraftLocally,
} from "../session/breath-session-local-persistence";
import {
  completeBreathSessionIfDue,
  createBreathSessionController,
  getBreathSessionSnapshot,
  type BreathSessionController,
  type BreathSessionSnapshot,
} from "../session/breath-session-runtime";
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
import {
  markWindDownPerformanceStart,
  recordWindDownPerformanceMeasure,
} from "./wind-down-performance-proof";

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
  readonly audioCueModeId: BreathAudioCueModeId;
  readonly breathSessionController: WindDownBreathSessionController;
  readonly breathSessionId: string;
  readonly routine: WindDownRoutine;
  readonly runId: string;
};

type WindDownBreathSessionController = BreathSessionController<{
  readonly localInstallId: string;
  readonly sessionId: string;
  readonly source: "wind_down";
  readonly startedAtMs: number;
  readonly techniqueId: WindDownRoutine["breathwork"]["techniqueId"];
  readonly totalDurationSeconds: number;
}>;

const windDownAudioCueModeId = "nature-ambient" as const satisfies BreathAudioCueModeId;
const breathworkTickIntervalMs = 1000;
const breathworkDraftPersistIntervalMs = 15000;
const ambientAudioTickIntervalMs = 1000;
const ambientInactivityDimMs = 30_000;

export function WindDownRoute() {
  const params = useLocalSearchParams();
  const visualProofState = parseVisualProofState(params.windDownState);
  const visualProofGoal = parseVisualProofGoal(params.windDownGoal);

  if (__DEV__ && visualProofState) {
    return <WindDownVisualProofRoute goal={visualProofGoal} state={visualProofState} />;
  }

  return <WindDownLiveRoute />;
}

function WindDownLiveRoute() {
  const [routeState, setRouteState] = useState<WindDownRouteState>({ status: "preparing" });
  const [ambientAudioSnapshot, setAmbientAudioSnapshot] =
    useState<WindDownAmbientAudioSnapshot>();
  const [liveActiveRoutine, setLiveActiveRoutine] = useState<WindDownActiveRoutineView>();
  const ambientAudioControllerRef = useRef<WindDownAmbientAudioController | undefined>(undefined);
  const ambientCompletionPersistingRunIdsRef = useRef(new Set<string>());
  const ambientStartedAtMsRef = useRef<number | undefined>(undefined);
  const audioControllerRef = useRef<ActiveSessionAudioController | undefined>(undefined);
  const bodyCueStartedAtMsRef = useRef<number | undefined>(undefined);
  const completionPersistingRunIdsRef = useRef(new Set<string>());
  const currentAppStateRef = useRef(AppState.currentState);
  const lastDraftPersistedAtMsRef = useRef<number | undefined>(undefined);
  const previousPhaseNameRef = useRef<BreathSessionSnapshot["phaseName"] | undefined>(undefined);

  if (!audioControllerRef.current) {
    audioControllerRef.current = createActiveSessionAudioController();
  }

  if (!ambientAudioControllerRef.current) {
    ambientAudioControllerRef.current = createWindDownAmbientAudioController();
  }

  useEffect(
    () => () => {
      audioControllerRef.current?.release();
      ambientAudioControllerRef.current?.release();
    },
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      currentAppStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

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

  const persistBreathworkDraft = useCallback(
    (session: WindDownRouteSession, snapshot: BreathSessionSnapshot) =>
      saveBreathSessionDraftLocally(session.database, {
        audioCueModeId: session.audioCueModeId,
        completedBreathCycles: snapshot.completedBreathCycles,
        currentPhaseName: snapshot.phaseName,
        durationSeconds: session.breathSessionController.totalDurationSeconds,
        elapsedDurationMs: snapshot.elapsedDurationMs,
        localInstallId: session.localInstallId,
        remainingDurationMs: snapshot.remainingDurationMs,
        sessionId: session.breathSessionId,
        source: "wind_down",
        startedAt: new Date(session.breathSessionController.startedAtMs).toISOString(),
        status: "draft",
        techniqueId: session.breathSessionController.techniqueId,
        updatedAt: new Date(snapshot.observedAtMs).toISOString(),
        windDownRunId: session.runId,
      }),
    [],
  );

  const saveSessionProgress = useCallback(
    async (
      session: WindDownRouteSession,
      input: {
        readonly recoveryState: Parameters<
          typeof saveWindDownStepProgressLocally
        >[1]["recoveryState"];
        readonly status: "started" | "breath_completed" | "body_cue_completed" | "ambient_playing";
      } & Partial<{
        readonly ambientCompletedAt: string;
        readonly ambientStartedAt: string;
        readonly bodyCueCompletedAt: string;
        readonly bodyCueStartedAt: string;
        readonly breathSessionId: string;
        readonly breathworkCompletedAt: string;
        readonly breathworkStartedAt: string;
        readonly queuedEvent: NonNullable<
          Parameters<typeof saveWindDownStepProgressLocally>[1]["queuedEvent"]
        >;
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

  const getSleepTimerAppState = useCallback(
    () => mapAppStateToSleepTimerAppState(currentAppStateRef.current),
    [],
  );

  const startBodyCue = useCallback(
    (session: WindDownRouteSession) => {
      const startedAtMs = Date.now();
      const startedAt = new Date(startedAtMs).toISOString();
      bodyCueStartedAtMsRef.current = startedAtMs;

      return saveSessionProgress(session, {
        bodyCueStartedAt: startedAt,
        recoveryState: "body_cue",
        status: "breath_completed",
      }).finally(() => moveSession(session, "body_cue"));
    },
    [moveSession, saveSessionProgress],
  );

  const startAmbientHandoff = useCallback(
    async (session: WindDownRouteSession) => {
      const startedAtMs = Date.now();
      const startedAt = new Date(startedAtMs).toISOString();

      ambientStartedAtMsRef.current = startedAtMs;
      audioControllerRef.current?.release();
      markWindDownPerformanceStart("ambient_handoff_start");

      const snapshot = await ambientAudioControllerRef.current?.start({
        appState: getSleepTimerAppState(),
        fadeOutDurationSeconds: session.routine.ambient.fadeOutDurationSeconds,
        nowMs: startedAtMs,
        soundId: session.routine.ambient.soundId,
        soundLabel: session.routine.ambient.soundLabel,
        timerDurationSeconds: session.ambientTimerDurationSeconds,
      });

      if (snapshot) {
        setAmbientAudioSnapshot(snapshot);
        recordWindDownPerformanceMeasure("ambient_audio_start", {
          status: snapshot.status,
          volume: snapshot.volume,
        });
      }

      await saveSessionProgress(session, {
        ambientStartedAt: startedAt,
        bodyCueCompletedAt: startedAt,
        queuedEvent: {
          eventName: "audio_started",
          occurredAt: startedAt,
        },
        recoveryState: "ambient_handoff",
        status: "ambient_playing",
      });
      moveSession(session, "ambient_handoff");
    },
    [getSleepTimerAppState, moveSession, saveSessionProgress],
  );

  const completeAmbientTimer = useCallback(
    async (session: WindDownRouteSession, observedAtMs = Date.now()) => {
      if (ambientCompletionPersistingRunIdsRef.current.has(session.runId)) {
        return;
      }

      ambientCompletionPersistingRunIdsRef.current.add(session.runId);

      try {
        const completedAt = new Date(observedAtMs).toISOString();

        const snapshot = await ambientAudioControllerRef.current?.stop({
          appState: getSleepTimerAppState(),
          nowMs: observedAtMs,
          reason: "timer-ended",
        });

        if (snapshot) {
          setAmbientAudioSnapshot(snapshot);
        }

        await completeWindDownRunLocally(session.database, {
          ambientCompletedAt: completedAt,
          completedAt,
          localInstallId: session.localInstallId,
          recoveryState: "completion",
          runId: session.runId,
          status: "completed",
          totalDurationSeconds: session.ambientTimerDurationSeconds,
          updatedAt: completedAt,
        });
        moveSession(session, "completion");
      } finally {
        ambientCompletionPersistingRunIdsRef.current.delete(session.runId);
      }
    },
    [getSleepTimerAppState, moveSession],
  );

  const stopAmbientPlayback = useCallback(
    async (session: WindDownRouteSession, observedAtMs = Date.now()) => {
      const stoppedAt = new Date(observedAtMs).toISOString();
      const snapshot = await ambientAudioControllerRef.current?.stop({
        appState: getSleepTimerAppState(),
        nowMs: observedAtMs,
        reason: "manual-stop",
      });

      if (snapshot) {
        setAmbientAudioSnapshot(snapshot);
      }

      await stopWindDownRunLocally(session.database, {
        localInstallId: session.localInstallId,
        recoveryState: "completion",
        runId: session.runId,
        stopReason: "user_stop",
        status: "stopped",
        stoppedAt,
        totalDurationSeconds: getAmbientElapsedTotalSeconds(
          session,
          observedAtMs,
          ambientStartedAtMsRef.current,
        ),
        updatedAt: stoppedAt,
      });
      moveSession(session, "completion");
    },
    [getSleepTimerAppState, moveSession],
  );

  const completeBreathworkAndMoveToTransition = useCallback(
    async (
      session: WindDownRouteSession,
      observedAtMs = Date.now(),
      nextVisualState: Extract<
        WindDownVisualStateId,
        "background_recovery" | "transition_card"
      > = "transition_card",
    ) => {
      if (completionPersistingRunIdsRef.current.has(session.runId)) {
        return;
      }

      const snapshot = getBreathSessionSnapshot(session.breathSessionController, observedAtMs);
      const completedRecord = completeBreathSessionIfDue(
        session.breathSessionController,
        observedAtMs,
      );

      if (!completedRecord) {
        await persistBreathworkDraft(session, snapshot);
        return;
      }

      completionPersistingRunIdsRef.current.add(session.runId);

      try {
        await completeBreathSessionLocally(session.database, {
          audioCueModeId: session.audioCueModeId,
          completedAt: completedRecord.completedAt,
          completedBreathCycles: completedRecord.completedBreathCycles,
          completionPersistedAt: completedRecord.completionPersistedAt,
          currentPhaseName: snapshot.phaseName,
          durationSeconds: completedRecord.durationSeconds,
          elapsedDurationMs: snapshot.elapsedDurationMs,
          localInstallId: completedRecord.localInstallId,
          remainingDurationMs: 0,
          sessionId: completedRecord.sessionId,
          source: "wind_down",
          startedAt: completedRecord.startedAt,
          status: "completed",
          techniqueId: completedRecord.techniqueId,
          updatedAt: completedRecord.completionPersistedAt,
          windDownRunId: session.runId,
        });
        await saveSessionProgress(session, {
          breathSessionId: session.breathSessionId,
          breathworkCompletedAt: completedRecord.completedAt,
          recoveryState: nextVisualState,
          status: "breath_completed",
        });
        moveSession(session, nextVisualState);
      } finally {
        completionPersistingRunIdsRef.current.delete(session.runId);
      }
    },
    [moveSession, persistBreathworkDraft, saveSessionProgress],
  );

  const switchSessionToNoHoldFallback = useCallback((session: WindDownRouteSession) => {
    const fallbackRoutine = resolveWindDownRoutine({
      preferNoHoldBreathwork: true,
      selectedGoal: session.routine.contextGoal,
    }).routine;
    const activeRoutine = createActiveRoutineView(fallbackRoutine, {
      isNoHoldFallback:
        fallbackRoutine.breathwork.techniqueId !== session.routine.breathwork.techniqueId,
    });
    const breathSessionController = createWindDownBreathSessionController({
      durationSeconds: fallbackRoutine.breathwork.durationSeconds,
      localInstallId: session.localInstallId,
      sessionId: session.breathSessionId,
      startedAtMs: Date.now(),
      techniqueId: fallbackRoutine.breathwork.techniqueId,
    });

    setLiveActiveRoutine(activeRoutine);
    lastDraftPersistedAtMsRef.current = undefined;

    setRouteState((currentState) => {
      if (currentState.status !== "session" || currentState.session.runId !== session.runId) {
        return currentState;
      }

      return {
        session: {
          ...currentState.session,
          activeRoutine,
          breathSessionController,
          routine: fallbackRoutine,
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
      const selectedAtMs = Date.parse(selectedAt);
      const resolution = resolveWindDownRoutine({ selectedGoal: goal });
      const runId = createWindDownRunId();
      const breathSessionId = createBreathSessionId();
      const breathSessionController = createWindDownBreathSessionController({
        durationSeconds: resolution.routine.breathwork.durationSeconds,
        localInstallId: bootstrap.localInstallId,
        sessionId: breathSessionId,
        startedAtMs: selectedAtMs,
        techniqueId: resolution.routine.breathwork.techniqueId,
      });
      const snapshot = getBreathSessionSnapshot(breathSessionController, selectedAtMs);

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
        breathSessionId,
        contextGoal: resolution.routine.contextGoal,
        localInstallId: bootstrap.localInstallId,
        routineId: resolution.routine.id,
        runId,
        startedAt: selectedAt,
      });

      await recordBreathSessionStartedLocally(bootstrap.database, {
        audioCueModeId: windDownAudioCueModeId,
        currentPhaseName: snapshot.phaseName,
        durationSeconds: resolution.routine.breathwork.durationSeconds,
        localInstallId: bootstrap.localInstallId,
        sessionId: breathSessionId,
        source: "wind_down",
        startedAt: selectedAt,
        status: "started",
        techniqueId: resolution.routine.breathwork.techniqueId,
        windDownRunId: runId,
      });

      const activeRoutine = createActiveRoutineView(resolution.routine, {}, snapshot);
      setLiveActiveRoutine(activeRoutine);
      lastDraftPersistedAtMsRef.current = selectedAtMs;

      setRouteState({
        session: {
          ...bootstrap,
          activeRoutine,
          ambientTimerDurationSeconds: resolution.routine.ambient.timerDurationSeconds,
          audioCueModeId: windDownAudioCueModeId,
          breathSessionController,
          breathSessionId,
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
        const startedAtMs = Date.parse(startedAt);
        const breathSessionId = createBreathSessionId();
        const breathSessionController = createWindDownBreathSessionController({
          durationSeconds: rememberedResolution.routine.breathwork.durationSeconds,
          localInstallId,
          sessionId: breathSessionId,
          startedAtMs,
          techniqueId: rememberedResolution.routine.breathwork.techniqueId,
        });
        const snapshot = getBreathSessionSnapshot(breathSessionController, startedAtMs);

        await recordWindDownStartedLocally(localDatabase, {
          ambientSoundId: rememberedResolution.routine.ambient.soundId,
          breathSessionId,
          contextGoal: rememberedResolution.routine.contextGoal,
          localInstallId,
          routineId: rememberedResolution.routine.id,
          runId,
          startedAt,
        });

        await recordBreathSessionStartedLocally(localDatabase, {
          audioCueModeId: windDownAudioCueModeId,
          currentPhaseName: snapshot.phaseName,
          durationSeconds: rememberedResolution.routine.breathwork.durationSeconds,
          localInstallId,
          sessionId: breathSessionId,
          source: "wind_down",
          startedAt,
          status: "started",
          techniqueId: rememberedResolution.routine.breathwork.techniqueId,
          windDownRunId: runId,
        });

        if (isMounted) {
          const activeRoutine = createActiveRoutineView(rememberedResolution.routine, {}, snapshot);
          setLiveActiveRoutine(activeRoutine);
          lastDraftPersistedAtMsRef.current = startedAtMs;

          setRouteState({
            session: {
              activeRoutine,
              ambientTimerDurationSeconds:
                rememberedResolution.routine.ambient.timerDurationSeconds,
              audioCueModeId: windDownAudioCueModeId,
              breathSessionController,
              breathSessionId,
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

  const activeBreathworkRoute =
    routeState.status === "session" && isActiveBreathworkState(routeState.visualState)
      ? {
          key: [
            routeState.session.runId,
            routeState.visualState,
            routeState.session.breathSessionController.techniqueId,
            routeState.session.breathSessionController.startedAtMs,
          ].join(":"),
          session: routeState.session,
          visualState: routeState.visualState,
      }
      : null;

  const ambientRoute =
    routeState.status === "session" && isAmbientAudioState(routeState.visualState)
      ? {
          key: [routeState.session.runId, routeState.visualState].join(":"),
          session: routeState.session,
          visualState: routeState.visualState,
        }
      : null;

  useEffect(() => {
    if (!activeBreathworkRoute) {
      return undefined;
    }

    const { session, visualState } = activeBreathworkRoute;

    audioControllerRef.current?.setMode(session.audioCueModeId);
    previousPhaseNameRef.current = undefined;

    const refreshBreathwork = () => {
      const snapshot = getBreathSessionSnapshot(session.breathSessionController, Date.now());

      setLiveActiveRoutine(
        createActiveRoutineView(
          session.routine,
          { isNoHoldFallback: session.activeRoutine.isNoHoldFallback },
          snapshot,
        ),
      );

      void audioControllerRef.current?.handleSnapshot(snapshot).catch(() => undefined);

      if (snapshot.status !== "active") {
        return;
      }

      const previousPhaseName = previousPhaseNameRef.current;
      previousPhaseNameRef.current = snapshot.phaseName;

      if (previousPhaseName && previousPhaseName !== snapshot.phaseName) {
        const feedbackStyle =
          snapshot.phaseName === "exhale"
            ? Haptics.ImpactFeedbackStyle.Soft
            : snapshot.phaseName === "inhale"
              ? Haptics.ImpactFeedbackStyle.Light
              : null;

        if (feedbackStyle && currentAppStateRef.current === "active") {
          void Haptics.impactAsync(feedbackStyle).catch(() => undefined);
        }
      }

      const lastDraftPersistedAtMs = lastDraftPersistedAtMsRef.current;
      const shouldPersistDraft =
        lastDraftPersistedAtMs === undefined ||
        snapshot.observedAtMs - lastDraftPersistedAtMs >= breathworkDraftPersistIntervalMs;

      if (!shouldPersistDraft) {
        return;
      }

      lastDraftPersistedAtMsRef.current = snapshot.observedAtMs;

      void Promise.all([
        persistBreathworkDraft(session, snapshot),
        saveSessionProgress(session, {
          breathSessionId: session.breathSessionId,
          recoveryState: visualState,
          status: "started",
        }),
      ]).catch(() => undefined);
    };

    refreshBreathwork();

    const tick = setInterval(refreshBreathwork, breathworkTickIntervalMs);

    return () => clearInterval(tick);
  }, [activeBreathworkRoute?.key, persistBreathworkDraft, saveSessionProgress]);

  useEffect(() => {
    if (!activeBreathworkRoute) {
      return undefined;
    }

    const { session } = activeBreathworkRoute;
    const snapshot = getBreathSessionSnapshot(session.breathSessionController, Date.now());
    const timeout = setTimeout(() => {
      void completeBreathworkAndMoveToTransition(session);
    }, snapshot.remainingDurationMs);

    return () => clearTimeout(timeout);
  }, [activeBreathworkRoute?.key, completeBreathworkAndMoveToTransition]);

  useEffect(() => {
    if (!activeBreathworkRoute) {
      return undefined;
    }

    const { session, visualState } = activeBreathworkRoute;
    const subscription = AppState.addEventListener("change", (nextState) => {
      currentAppStateRef.current = nextState;
      const snapshot = getBreathSessionSnapshot(session.breathSessionController, Date.now());

      if (snapshot.status === "completed") {
        void completeBreathworkAndMoveToTransition(
          session,
          snapshot.observedAtMs,
          "background_recovery",
        );
        return;
      }

      if (nextState === "active") {
        void audioControllerRef.current?.handleAppWake(snapshot).catch(() => undefined);
      }

      void Promise.all([
        persistBreathworkDraft(session, snapshot),
        saveSessionProgress(session, {
          breathSessionId: session.breathSessionId,
          recoveryState: visualState,
          status: "started",
        }),
      ]).catch(() => undefined);
    });

    return () => subscription.remove();
  }, [
    activeBreathworkRoute?.key,
    completeBreathworkAndMoveToTransition,
    persistBreathworkDraft,
    saveSessionProgress,
  ]);

  useEffect(() => {
    if (routeState.status !== "session") {
      return undefined;
    }

    const { session, visualState } = routeState;

    if (
      visualState === "active_winddown" ||
      visualState === "daily_calm" ||
      visualState === "no_hold_fallback"
    ) {
      return undefined;
    }

    if (visualState === "transition_card") {
      const timeout = setTimeout(() => {
        void startBodyCue(session);
      }, 5_000);

      return () => clearTimeout(timeout);
    }

    if (visualState === "body_cue") {
      const timeout = setTimeout(() => {
        void startAmbientHandoff(session).catch(() => undefined);
      }, 120_000);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [routeState, startAmbientHandoff, startBodyCue]);

  useEffect(() => {
    if (!ambientRoute) {
      return undefined;
    }

    const { session } = ambientRoute;
    const tickAmbientTimer = () => {
      void ambientAudioControllerRef.current
        ?.handleTimerTick({
          appState: getSleepTimerAppState(),
          nowMs: Date.now(),
        })
        .then((snapshot) => {
          setAmbientAudioSnapshot(snapshot);

          if (snapshot.status === "completed") {
            void completeAmbientTimer(session);
          }
        })
        .catch(() => undefined);
    };

    tickAmbientTimer();
    const interval = setInterval(tickAmbientTimer, ambientAudioTickIntervalMs);

    return () => clearInterval(interval);
  }, [ambientRoute?.key, completeAmbientTimer, getSleepTimerAppState]);

  useEffect(() => {
    if (!ambientRoute) {
      return undefined;
    }

    const { session } = ambientRoute;
    const ambientStartedAtMs = ambientStartedAtMsRef.current ?? Date.now();
    const elapsedMs = Math.max(0, Date.now() - ambientStartedAtMs);
    const remainingMs = Math.max(0, session.ambientTimerDurationSeconds * 1000 - elapsedMs);
    const timeout = setTimeout(() => {
      void completeAmbientTimer(session).catch(() => undefined);
    }, remainingMs);

    return () => clearTimeout(timeout);
  }, [ambientRoute?.session.runId, completeAmbientTimer]);

  useEffect(() => {
    if (
      !ambientRoute ||
      (ambientRoute.visualState !== "ambient_handoff" &&
        ambientRoute.visualState !== "audio_interruption" &&
        ambientRoute.visualState !== "tap_to_wake")
    ) {
      return undefined;
    }

    const { session } = ambientRoute;
    const timeout = setTimeout(() => {
      moveSession(session, "dimmed_idle");
    }, ambientInactivityDimMs);

    return () => clearTimeout(timeout);
  }, [ambientRoute?.key, moveSession]);

  if (routeState.status === "session") {
    const { session, visualState } = routeState;

    return (
      <WindDownScreen
        activeRoutine={liveActiveRoutine ?? session.activeRoutine}
        {...(ambientAudioSnapshot
          ? {
              ambientAudio: {
                remainingSeconds: ambientAudioSnapshot.remainingSeconds,
                soundLabel: session.routine.ambient.soundLabel,
                status:
                  ambientAudioSnapshot.status === "idle" ? "playing" : ambientAudioSnapshot.status,
              },
            }
          : {})}
        onClose={() => {
          moveSession(session, "completion");
        }}
        onContinue={() => {
          if (visualState === "transition_card" || visualState === "background_recovery") {
            void startBodyCue(session);
            return;
          }

          if (visualState === "ambient_handoff" || visualState === "audio_interruption") {
            void saveSessionProgress(session, {
              ambientStartedAt: new Date().toISOString(),
              recoveryState: "dimmed_idle",
              status: "ambient_playing",
            }).finally(() => moveSession(session, "dimmed_idle"));
            return;
          }

          if (visualState === "partial_stop") {
            void startAmbientHandoff(session);
            return;
          }

          moveSession(session, "body_cue");
        }}
        onFadeNow={() => {
          void ambientAudioControllerRef.current
            ?.fadeNow({
              appState: getSleepTimerAppState(),
              nowMs: Date.now(),
            })
            .then((snapshot) => {
              setAmbientAudioSnapshot(snapshot);

              return saveSessionProgress(session, {
                recoveryState: "audio_interruption",
                status: "ambient_playing",
              });
            })
            .finally(() => moveSession(session, "audio_interruption"));
        }}
        onSkipForTonight={() => {
          if (visualState === "background_recovery") {
            const stoppedAt = new Date().toISOString();

            void stopWindDownRunLocally(session.database, {
              localInstallId: session.localInstallId,
              recoveryState: "partial_stop",
              runId: session.runId,
              stopReason: "app_backgrounded_after_main_exercise",
              status: "stopped",
              stoppedAt,
              totalDurationSeconds: session.routine.breathwork.durationSeconds,
              updatedAt: stoppedAt,
            }).finally(() => moveSession(session, "partial_stop"));
            return;
          }

          moveSession(session, "completion");
        }}
        onStop={() => {
          const stoppedAt = new Date().toISOString();

          if (visualState === "body_cue") {
            const bodyCueStartedAtMs = bodyCueStartedAtMsRef.current;
            const bodyCueElapsedSeconds =
              bodyCueStartedAtMs === undefined
                ? 0
                : Math.max(0, Math.floor((Date.now() - bodyCueStartedAtMs) / 1000));

            void stopWindDownRunLocally(session.database, {
              localInstallId: session.localInstallId,
              recoveryState: "partial_stop",
              runId: session.runId,
              stopReason: "user_stop",
              status: "stopped",
              stoppedAt,
              totalDurationSeconds:
                session.routine.breathwork.durationSeconds + bodyCueElapsedSeconds,
              updatedAt: stoppedAt,
            }).finally(() => moveSession(session, "partial_stop"));
            return;
          }

          if (isAmbientAudioState(visualState)) {
            void stopAmbientPlayback(session);
            return;
          }

          void completeAmbientTimer(session, Date.parse(stoppedAt));
        }}
        onUseNoHoldFallback={() => {
          void saveSessionProgress(session, {
            breathSessionId: session.breathSessionId,
            recoveryState: "no_hold_fallback",
            status: "started",
          }).finally(() => switchSessionToNoHoldFallback(session));
        }}
        onWake={() => {
          markWindDownPerformanceStart("dimmed_tap");
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
          markWindDownPerformanceStart("context_choice");
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

function WindDownVisualProofRoute({
  goal,
  state,
}: {
  readonly goal: WindDownContextGoal | null;
  readonly state: WindDownVisualStateId;
}) {
  if (state === "quick_context") {
    return <WindDownScreen onSelectGoal={() => undefined} state="quick_context" />;
  }

  const activeRoutine = goal
    ? createActiveRoutineView(resolveWindDownRoutine({ selectedGoal: goal }).routine)
    : undefined;

  return activeRoutine ? (
    <WindDownScreen activeRoutine={activeRoutine} state={state} />
  ) : (
    <WindDownScreen state={state} />
  );
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
  snapshot?: BreathSessionSnapshot,
): WindDownActiveRoutineView {
  return {
    breathworkDurationSeconds: routine.breathwork.durationSeconds,
    bodyCue: {
      eyebrow: routine.bodyCue.eyebrow,
      title: routine.bodyCue.title,
      subtitle: routine.bodyCue.subtitle,
    },
    phaseLabel: snapshot ? getPhaseLabel(snapshot.phaseName) : "Inhale",
    remainingSeconds: snapshot?.remainingSeconds ?? routine.breathwork.durationSeconds,
    isNoHoldFallback: options.isNoHoldFallback === true,
    noHoldFallbackTechniqueId: getNoHoldFallbackTechniqueId(routine.breathwork.techniqueId),
    soundLabel: routine.ambient.soundLabel,
    techniqueId: routine.breathwork.techniqueId,
    uiState: routine.breathwork.uiState,
  };
}

function createWindDownBreathSessionController({
  durationSeconds,
  localInstallId,
  sessionId,
  startedAtMs,
  techniqueId,
}: {
  readonly durationSeconds: number;
  readonly localInstallId: string;
  readonly sessionId: string;
  readonly startedAtMs: number;
  readonly techniqueId: WindDownRoutine["breathwork"]["techniqueId"];
}): WindDownBreathSessionController {
  return createBreathSessionController({
    localInstallId,
    sessionId,
    source: "wind_down",
    startedAtMs,
    techniqueId,
    totalDurationSeconds: durationSeconds,
  });
}

function isActiveBreathworkState(
  state: Exclude<WindDownVisualStateId, "quick_context">,
): state is Extract<WindDownVisualStateId, "active_winddown" | "daily_calm" | "no_hold_fallback"> {
  return state === "active_winddown" || state === "daily_calm" || state === "no_hold_fallback";
}

function isAmbientAudioState(
  state: Exclude<WindDownVisualStateId, "quick_context">,
): state is Extract<
  WindDownVisualStateId,
  "ambient_handoff" | "audio_interruption" | "dimmed_idle" | "tap_to_wake"
> {
  return (
    state === "ambient_handoff" ||
    state === "audio_interruption" ||
    state === "dimmed_idle" ||
    state === "tap_to_wake"
  );
}

function mapAppStateToSleepTimerAppState(appState: AppStateStatus): SleepTimerAppState {
  return appState === "active" ? "active" : "background";
}

function getAmbientElapsedTotalSeconds(
  session: WindDownRouteSession,
  observedAtMs: number,
  ambientStartedAtMs: number | undefined,
) {
  const startedAtMs = ambientStartedAtMs ?? observedAtMs;
  const ambientElapsedSeconds = Math.max(0, Math.floor((observedAtMs - startedAtMs) / 1000));

  return (
    session.routine.breathwork.durationSeconds +
    session.routine.transition.durationSeconds +
    session.routine.bodyCue.durationSeconds +
    ambientElapsedSeconds
  );
}

function getPhaseLabel(phaseName: BreathSessionSnapshot["phaseName"]) {
  switch (phaseName) {
    case "exhale":
      return "Exhale";
    case "hold":
      return "Hold";
    case "inhale":
      return "Inhale";
    case "second-inhale":
      return "Inhale";
  }
}

const windDownVisualProofStates = [
  "quick_context",
  "active_winddown",
  "no_hold_fallback",
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

function parseVisualProofGoal(value: unknown): WindDownContextGoal | null {
  return parseWindDownContextGoalInput(Array.isArray(value) ? value[0] : value);
}

function createWindDownRunId(): string {
  return createLocalRecordId("winddown");
}

function createBreathSessionId(): string {
  return createLocalRecordId("session");
}

function createLocalRecordId(prefix: "session" | "winddown"): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  const rawSegment = randomUuid
    ? randomUuid.replaceAll("-", "_")
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const randomSegment = rawSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    randomSegment.length >= 8
      ? randomSegment
      : `${randomSegment}${"0".repeat(8 - randomSegment.length)}`;

  return `${prefix}_${paddedSegment}`;
}
