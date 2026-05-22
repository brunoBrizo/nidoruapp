import {
  breathTechniques,
  onboardingPlans,
  type BreathAudioCueModeId,
  type BreathTechniqueId,
  type OnboardingPlanId,
} from "@nidoru/domain";
import { colors, motion, spacing, typography } from "@nidoru/ui-tokens";
import type {
  AbandonedFirstSessionRecord,
  AbandonedBreathSessionRecord,
  BreathSessionStartedRecord,
  CompletedBreathSessionRecord,
  FirstSessionRecord,
  PostSessionReflection,
  RecoverableBreathSessionDraft,
  RecoverableFirstSessionDraft,
} from "@nidoru/validation";
import * as Haptics from "expo-haptics";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bell,
  CheckCircle,
  Pause,
  TreePine,
  Vibrate,
  VibrateOff,
  VolumeX,
  Wind,
} from "lucide-react-native";
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Pressable, StyleSheet, Text, View, type AppStateStatus } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  createActiveSessionAudioController,
  type ActiveSessionAudioController,
} from "../audio/active-session-audio-controller";
import {
  abandonFirstSessionLocally,
  completeFirstSessionLocally,
  recordFirstSessionStartedLocally,
  getOrCreateLocalInstallIdentity,
  loadPendingPostSessionReflection,
  loadRecoverableFirstSessionDraft,
  saveFirstSessionDraftLocally,
  savePostSessionReflectionLocally,
  type LocalFirstOnboardingDatabase,
} from "../onboarding/local-first-onboarding";
import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";
import { openMigratedLocalDatabase } from "../storage/local-database";
import {
  abandonBreathSessionLocally,
  completeBreathSessionLocally,
  loadPendingBreathSessionCompletion,
  loadRecoverableBreathSessionDraft,
  recordBreathSessionStartedLocally,
  saveBreathSessionDraftLocally,
} from "./breath-session-local-persistence";
import {
  completeBreathSessionIfDue,
  createBreathSessionController,
  endBreathSessionEarly,
  getBreathSessionSnapshot,
  pauseBreathSession,
  resumeBreathSession,
  type BreathSessionController,
  type BreathSessionSnapshot,
  type BreathSessionSource,
} from "./breath-session-runtime";
import { type FirstSessionPhaseName } from "./first-session-runtime";

export type BreathSessionPersistence = {
  readonly persistAbandoned?: (record: AbandonedFirstSessionRecord) => Promise<void>;
  readonly persistBreathSessionAbandoned?: (record: AbandonedBreathSessionRecord) => Promise<void>;
  readonly persistBreathSessionCompletion?: (record: CompletedBreathSessionRecord) => Promise<void>;
  readonly persistBreathSessionDraft?: (record: RecoverableBreathSessionDraft) => Promise<void>;
  readonly persistBreathSessionStarted?: (record: BreathSessionStartedRecord) => Promise<void>;
  readonly persistCompletion?: (record: FirstSessionRecord) => Promise<void>;
  readonly persistDraft?: (record: RecoverableFirstSessionDraft) => Promise<void>;
  readonly persistReflection?: (reflection: PostSessionReflection) => Promise<void>;
  readonly persistStarted?: (record: {
    readonly localInstallId: string;
    readonly sessionId: string;
    readonly startedAt: string;
  }) => Promise<void>;
};

export type FirstSessionPersistence = BreathSessionPersistence;

export type BreathSessionScreenProps = BreathSessionPersistence & {
  readonly completionEyebrow?: string;
  readonly disableHaptics?: boolean;
  readonly durationSeconds?: number;
  readonly initialCompletionMode?: CompletionMode;
  readonly localInstallId: string;
  readonly onRewardMomentComplete?: () => void;
  readonly planId?: OnboardingPlanId;
  readonly sessionId: string;
  readonly source: BreathSessionSource;
  readonly startedAtMs?: number;
  readonly techniqueId: BreathTechniqueId;
  readonly tickIntervalMs?: number;
};

export type FirstSessionScreenProps = Omit<
  BreathSessionScreenProps,
  "completionEyebrow" | "planId" | "source"
> & {
  readonly planId: OnboardingPlanId;
};

type BreathSessionRouteScreenProps = {
  readonly durationSeconds?: number;
  readonly planId?: OnboardingPlanId;
  readonly postRewardRoute?: Href;
  readonly source: BreathSessionSource;
  readonly techniqueId: BreathTechniqueId;
};

type FirstSessionRouteScreenProps = Omit<BreathSessionRouteScreenProps, "source">;

type CompletionMode = "completed" | "abandoned" | undefined;

const defaultTickIntervalMs = 1000;
const draftPersistIntervalMs = 15000;
const finalDraftWindowMs = 10000;

const phaseLabels = {
  exhale: "Exhale",
  hold: "Hold",
  inhale: "Inhale",
  "second-inhale": "Sip in",
} as const satisfies Record<FirstSessionPhaseName, string>;

const audioModeOptions = [
  { accessibilityLabel: "Audio mode: No audio", id: "none", label: "No audio" },
  { accessibilityLabel: "Audio mode: Gentle bell", id: "gentle-bell", label: "Bell" },
  { accessibilityLabel: "Audio mode: Soft whoosh", id: "soft-whoosh", label: "Whoosh" },
  { accessibilityLabel: "Audio mode: Nature ambient", id: "nature-ambient", label: "Nature" },
] as const satisfies readonly {
  readonly accessibilityLabel: string;
  readonly id: BreathAudioCueModeId;
  readonly label: string;
}[];

export function BreathSessionRouteScreen({
  durationSeconds,
  planId,
  postRewardRoute = "/post-value",
  source,
  techniqueId,
}: BreathSessionRouteScreenProps) {
  const router = useRouter();
  const [sessionConfig, setSessionConfig] = useState<{
    readonly database: LocalFirstOnboardingDatabase;
    readonly durationSeconds: number;
    readonly initialCompletionMode?: CompletionMode;
    readonly localInstallId: string;
    readonly planId?: OnboardingPlanId;
    readonly sessionId: string;
    readonly startedAtMs: number;
    readonly techniqueId: BreathTechniqueId;
  }>();
  const fallbackPlan = getPlanForTechnique(techniqueId);

  useEffect(() => {
    let isMounted = true;

    async function prepareLocalSession() {
      const database = await openMigratedLocalDatabase();
      const localDatabase: LocalFirstOnboardingDatabase = {
        getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
        runAsync: (source, params = []) => database.runAsync(source, [...params]),
      };
      const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
      const pendingCompletion =
        source === "first_session"
          ? await loadPendingPostSessionReflection(localDatabase, {
              localInstallId,
            })
          : await loadPendingBreathSessionCompletion(localDatabase, {
              localInstallId,
              source,
            });
      const recoverableDraft = pendingCompletion
        ? null
        : source === "first_session"
          ? await loadRecoverableFirstSessionDraft(localDatabase, {
              localInstallId,
            })
          : await loadRecoverableBreathSessionDraft(localDatabase, {
              localInstallId,
              source,
            });
      const nowMs = Date.now();
      const selectedPlanId =
        planId ??
        pendingCompletion?.planId ??
        recoverableDraft?.planId ??
        (source === "first_session" ? fallbackPlan.id : undefined);
      const selectedTechniqueId =
        pendingCompletion?.techniqueId ?? recoverableDraft?.techniqueId ?? techniqueId;
      const selectedDurationSeconds =
        durationSeconds ??
        pendingCompletion?.durationSeconds ??
        recoverableDraft?.durationSeconds ??
        (selectedPlanId
          ? onboardingPlans[selectedPlanId].firstSession.durationSeconds
          : undefined) ??
        breathTechniques[selectedTechniqueId].defaultDurationSeconds;
      const sessionId =
        pendingCompletion?.sessionId ?? recoverableDraft?.sessionId ?? createFirstSessionId();
      const startedAtMs = pendingCompletion
        ? Date.parse(pendingCompletion.startedAt)
        : recoverableDraft
          ? nowMs - recoverableDraft.elapsedDurationMs
          : nowMs;

      if (!isMounted) {
        return;
      }

      setSessionConfig({
        database: localDatabase,
        durationSeconds: selectedDurationSeconds,
        ...(pendingCompletion ? { initialCompletionMode: "completed" } : {}),
        localInstallId,
        ...(selectedPlanId === undefined ? {} : { planId: selectedPlanId }),
        sessionId,
        startedAtMs,
        techniqueId: selectedTechniqueId,
      });
    }

    void prepareLocalSession();

    return () => {
      isMounted = false;
    };
  }, [
    durationSeconds,
    fallbackPlan.firstSession.durationSeconds,
    fallbackPlan.id,
    planId,
    source,
    techniqueId,
  ]);

  if (!sessionConfig) {
    return <FirstSessionPreparingScreen techniqueId={techniqueId} />;
  }

  return (
    <BreathSessionScreen
      completionEyebrow={source === "first_session" ? "First session complete" : "Session complete"}
      durationSeconds={sessionConfig.durationSeconds}
      localInstallId={sessionConfig.localInstallId}
      persistAbandoned={(record) => abandonFirstSessionLocally(sessionConfig.database, record)}
      persistBreathSessionAbandoned={(record) =>
        abandonBreathSessionLocally(sessionConfig.database, record)
      }
      persistBreathSessionCompletion={async (record) => {
        await completeBreathSessionLocally(sessionConfig.database, record);
        captureAnalyticsEventDeferred("breath_session_completed");
      }}
      persistBreathSessionDraft={(record) =>
        saveBreathSessionDraftLocally(sessionConfig.database, record)
      }
      persistBreathSessionStarted={async (record) => {
        await recordBreathSessionStartedLocally(sessionConfig.database, record);
        captureAnalyticsEventDeferred("breath_session_started");
      }}
      persistCompletion={async (record) => {
        await completeFirstSessionLocally(sessionConfig.database, record);
        captureAnalyticsEventDeferred("first_session_completed");
      }}
      persistDraft={(record) => saveFirstSessionDraftLocally(sessionConfig.database, record)}
      persistReflection={async (reflection) => {
        await savePostSessionReflectionLocally(sessionConfig.database, reflection);
      }}
      persistStarted={async (record) => {
        await recordFirstSessionStartedLocally(sessionConfig.database, record);
        captureAnalyticsEventDeferred("first_session_started");
      }}
      onRewardMomentComplete={() => {
        router.replace(postRewardRoute);
      }}
      {...(sessionConfig.initialCompletionMode === undefined
        ? {}
        : { initialCompletionMode: sessionConfig.initialCompletionMode })}
      {...(sessionConfig.planId === undefined ? {} : { planId: sessionConfig.planId })}
      sessionId={sessionConfig.sessionId}
      source={source}
      startedAtMs={sessionConfig.startedAtMs}
      techniqueId={sessionConfig.techniqueId}
    />
  );
}

export function FirstSessionRouteScreen(props: FirstSessionRouteScreenProps) {
  return <BreathSessionRouteScreen {...props} source="first_session" />;
}

export function FirstSessionScreen(props: FirstSessionScreenProps) {
  return (
    <BreathSessionScreen
      {...props}
      completionEyebrow="First session complete"
      source="first_session"
    />
  );
}

export function BreathSessionScreen({
  completionEyebrow = "Session complete",
  disableHaptics = false,
  durationSeconds,
  initialCompletionMode,
  localInstallId,
  onRewardMomentComplete = () => undefined,
  persistAbandoned = async () => undefined,
  persistBreathSessionAbandoned = async () => undefined,
  persistBreathSessionCompletion = async () => undefined,
  persistBreathSessionDraft = async () => undefined,
  persistBreathSessionStarted = async () => undefined,
  persistCompletion = async () => undefined,
  persistDraft = async () => undefined,
  persistReflection = async () => undefined,
  persistStarted = async () => undefined,
  planId,
  sessionId,
  source,
  startedAtMs = Date.now(),
  techniqueId,
  tickIntervalMs = defaultTickIntervalMs,
}: BreathSessionScreenProps) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const technique = breathTechniques[techniqueId];
  const plan = planId ? onboardingPlans[planId] : undefined;
  const sessionDurationSeconds =
    durationSeconds ?? plan?.firstSession.durationSeconds ?? technique.defaultDurationSeconds;
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    reduceMotionPreference.isResolved && reduceMotionPreference.reduceMotionEnabled;
  const controllerRef = useRef(
    createBreathSessionController({
      localInstallId,
      ...(planId === undefined ? {} : { planId }),
      sessionId,
      source,
      startedAtMs,
      techniqueId,
      totalDurationSeconds: sessionDurationSeconds,
    }),
  );
  const [controller, setController] = useState(controllerRef.current);
  const [snapshot, setSnapshot] = useState(() =>
    getBreathSessionSnapshot(controllerRef.current, startedAtMs),
  );
  const audioControllerRef = useRef<ActiveSessionAudioController | undefined>(undefined);
  const [audioMode, setAudioMode] = useState<BreathAudioCueModeId>("gentle-bell");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [completionMode, setCompletionMode] = useState<CompletionMode>(initialCompletionMode);
  const isPersistingTerminalStateRef = useRef(false);
  const hasPersistedSessionStartRef = useRef(Boolean(initialCompletionMode));
  const hasPersistedFinalDraftRef = useRef(false);
  const lastPausedDraftObservedAtMsRef = useRef<number | undefined>(undefined);
  const lastDraftPersistedAtMs = useRef<number | undefined>(undefined);
  const previousPhaseNameRef = useRef<FirstSessionPhaseName>(snapshot.phaseName);
  const currentAppStateRef = useRef<AppStateStatus>(getInitialHapticAppState());
  const orbScale = useSharedValue(getOrbScale(snapshot.phaseName, reduceMotionEnabled));
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(1);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  if (!audioControllerRef.current) {
    audioControllerRef.current = createActiveSessionAudioController();
  }

  useEffect(
    () => () => {
      audioControllerRef.current?.release();
    },
    [],
  );

  useEffect(() => {
    audioControllerRef.current?.setMode(audioMode);
  }, [audioMode]);

  useEffect(() => {
    if (completionMode) {
      audioControllerRef.current?.release();
      return;
    }

    void audioControllerRef.current?.handleSnapshot(snapshot);
  }, [audioMode, completionMode, snapshot]);

  useEffect(() => {
    if (hasPersistedSessionStartRef.current) {
      return;
    }

    hasPersistedSessionStartRef.current = true;
    const startedAt = new Date(startedAtMs).toISOString();

    void persistBreathSessionStarted({
      audioCueModeId: audioMode,
      currentPhaseName: snapshot.phaseName,
      durationSeconds: sessionDurationSeconds,
      localInstallId,
      ...(planId === undefined ? {} : { planId }),
      sessionId,
      source,
      startedAt,
      status: "started",
      techniqueId,
    })
      .then(() =>
        source === "first_session"
          ? persistStarted({
              localInstallId,
              sessionId,
              startedAt,
            })
          : undefined,
      )
      .catch(() => undefined);
  }, [
    audioMode,
    localInstallId,
    persistBreathSessionStarted,
    persistStarted,
    planId,
    sessionDurationSeconds,
    sessionId,
    source,
    snapshot.phaseName,
    startedAtMs,
    techniqueId,
  ]);

  const refreshSnapshot = useCallback((observedAtMs = Date.now()) => {
    const nextSnapshot = getBreathSessionSnapshot(controllerRef.current, observedAtMs);
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      currentAppStateRef.current = nextAppState;

      if (completionMode) {
        return;
      }

      const nextSnapshot = refreshSnapshot();

      if (nextAppState === "active") {
        void audioControllerRef.current?.handleAppWake(nextSnapshot);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [completionMode, refreshSnapshot]);

  useEffect(() => {
    if (completionMode) {
      return undefined;
    }

    const tick = setInterval(() => {
      refreshSnapshot();
    }, tickIntervalMs);

    return () => {
      clearInterval(tick);
    };
  }, [completionMode, refreshSnapshot, tickIntervalMs]);

  useEffect(() => {
    const animationDurationMs = reduceMotionEnabled
      ? 250
      : Math.max(250, Math.min(snapshot.phaseDurationMs, 8000));

    labelOpacity.value = withTiming(0, {
      duration: reduceMotionEnabled ? 0 : motion.duration.phaseLabelCrossfadeLeadMs,
      easing: Easing.out(Easing.ease),
    });
    labelOpacity.value = withTiming(1, {
      duration: reduceMotionEnabled ? 0 : motion.duration.phaseLabelCrossfadeLeadMs,
      easing: Easing.in(Easing.ease),
    });
    orbScale.value = withTiming(getOrbScale(snapshot.phaseName, reduceMotionEnabled), {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });

    if (snapshot.phaseName === "inhale" && !reduceMotionEnabled) {
      pulseScale.value = 1;
      pulseOpacity.value = 0.6;
      pulseScale.value = withTiming(1.8, {
        duration: snapshot.phaseDurationMs,
        easing: Easing.inOut(Easing.ease),
      });
      pulseOpacity.value = withTiming(0, {
        duration: snapshot.phaseDurationMs,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      pulseOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [
    labelOpacity,
    orbScale,
    pulseOpacity,
    pulseScale,
    reduceMotionEnabled,
    snapshot.phaseDurationMs,
    snapshot.phaseName,
  ]);

  useEffect(() => {
    const previousPhaseName = previousPhaseNameRef.current;
    previousPhaseNameRef.current = snapshot.phaseName;
    const isHapticCuePhase = isBreathHapticCuePhase(snapshot.phaseName);

    if (
      disableHaptics ||
      !hapticsEnabled ||
      !canTriggerScreenOnHaptic(currentAppStateRef.current) ||
      snapshot.status !== "active" ||
      previousPhaseName === snapshot.phaseName ||
      !isHapticCuePhase
    ) {
      return;
    }

    const feedbackStyle =
      snapshot.phaseName === "exhale"
        ? Haptics.ImpactFeedbackStyle.Soft
        : Haptics.ImpactFeedbackStyle.Light;

    void Haptics.impactAsync(feedbackStyle).catch(() => undefined);
  }, [disableHaptics, hapticsEnabled, snapshot.phaseName, snapshot.status]);

  useEffect(() => {
    if (snapshot.status === "completed" || completionMode) {
      return;
    }

    const isFinalDraftWindow = snapshot.remainingDurationMs <= finalDraftWindowMs;
    const shouldPersistPausedDraft =
      snapshot.isPaused && lastPausedDraftObservedAtMsRef.current !== snapshot.observedAtMs;
    const shouldPersistDraft =
      lastDraftPersistedAtMs.current === undefined ||
      snapshot.observedAtMs - lastDraftPersistedAtMs.current >= draftPersistIntervalMs ||
      (isFinalDraftWindow && !hasPersistedFinalDraftRef.current) ||
      shouldPersistPausedDraft;

    if (!shouldPersistDraft) {
      return;
    }

    lastDraftPersistedAtMs.current = snapshot.observedAtMs;

    if (isFinalDraftWindow) {
      hasPersistedFinalDraftRef.current = true;
    }

    if (snapshot.isPaused) {
      lastPausedDraftObservedAtMsRef.current = snapshot.observedAtMs;
    } else {
      lastPausedDraftObservedAtMsRef.current = undefined;
    }

    const breathSessionDraft = createBreathSessionDraftFromSnapshot(
      controllerRef.current,
      snapshot,
      audioMode,
    );
    const firstSessionDraft = createFirstSessionDraftRecord(controllerRef.current, snapshot);
    const persistDrafts = [persistBreathSessionDraft(breathSessionDraft)];

    if (firstSessionDraft) {
      persistDrafts.push(persistDraft(firstSessionDraft));
    }

    void Promise.all(persistDrafts).catch(() => undefined);
  }, [audioMode, completionMode, persistBreathSessionDraft, persistDraft, snapshot]);

  useEffect(() => {
    if (snapshot.status !== "completed" || completionMode || isPersistingTerminalStateRef.current) {
      return;
    }

    const completedRecord = completeBreathSessionIfDue(
      controllerRef.current,
      snapshot.observedAtMs,
    );
    const firstSessionRecord = completedRecord
      ? createFirstSessionCompletionRecord(completedRecord)
      : undefined;

    if (!completedRecord) {
      return;
    }

    const { completedAt, completionPersistedAt } = completedRecord;

    if (!completedAt || !completionPersistedAt) {
      return;
    }

    isPersistingTerminalStateRef.current = true;
    void persistBreathSessionCompletion({
      audioCueModeId: audioMode,
      completedAt,
      completedBreathCycles: completedRecord.completedBreathCycles ?? 0,
      completionPersistedAt,
      currentPhaseName: snapshot.phaseName,
      durationSeconds: completedRecord.durationSeconds,
      elapsedDurationMs: snapshot.elapsedDurationMs,
      localInstallId: completedRecord.localInstallId,
      ...(completedRecord.planId === undefined ? {} : { planId: completedRecord.planId }),
      remainingDurationMs: snapshot.remainingDurationMs,
      sessionId: completedRecord.sessionId,
      source,
      startedAt: completedRecord.startedAt,
      status: "completed",
      techniqueId: completedRecord.techniqueId,
      updatedAt: completionPersistedAt,
    })
      .then(() => (firstSessionRecord ? persistCompletion(firstSessionRecord) : undefined))
      .then(() => {
        setCompletionMode("completed");
      })
      .finally(() => {
        isPersistingTerminalStateRef.current = false;
      });
  }, [
    audioMode,
    completionMode,
    persistBreathSessionCompletion,
    persistCompletion,
    snapshot,
    source,
  ]);

  const orbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const pauseSession = () => {
    const paused = pauseBreathSession(controllerRef.current, Date.now());
    setController(paused);
    setSnapshot(getBreathSessionSnapshot(paused, Date.now()));
  };

  const resumeSession = () => {
    const resumed = resumeBreathSession(controllerRef.current, Date.now());
    setController(resumed);
    setSnapshot(getBreathSessionSnapshot(resumed, Date.now()));
  };

  const endSessionEarly = () => {
    if (isPersistingTerminalStateRef.current) {
      return;
    }

    const abandonedRecord = endBreathSessionEarly(controllerRef.current, Date.now());
    const firstSessionAbandonedRecord = createFirstSessionAbandonedRecord(abandonedRecord);

    isPersistingTerminalStateRef.current = true;
    const persistTerminalState = [
      persistBreathSessionAbandoned({
        ...abandonedRecord,
        audioCueModeId: audioMode,
        stopReason: "user_ended",
      }),
    ];

    if (firstSessionAbandonedRecord) {
      persistTerminalState.push(persistAbandoned(firstSessionAbandonedRecord));
    }

    void Promise.all(persistTerminalState)
      .then(() => {
        setCompletionMode("abandoned");
      })
      .finally(() => {
        isPersistingTerminalStateRef.current = false;
      });
  };

  const sessionLabel = `${technique.name} · ${Math.round(sessionDurationSeconds / 60)} min`;
  const hapticsActive = hapticsEnabled;
  const isPaused = snapshot.isPaused && !completionMode;

  return (
    <View
      style={[
        styles.screen,
        {
          paddingBottom: Math.max(safeAreaInsets.bottom, 0),
          paddingTop: Math.max(safeAreaInsets.top, 0),
        },
      ]}
      testID="first-session-screen"
    >
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.backgroundGlow} />

      <View style={styles.header}>
        <Text accessibilityRole="header" selectable style={styles.title}>
          Let’s wind down.
        </Text>
        <Text selectable style={styles.subtitle}>
          {sessionLabel}
        </Text>
      </View>

      <View style={styles.orbSection}>
        <Animated.View
          accessibilityHint="Guides the current breath phase."
          accessibilityLabel={`${phaseLabels[snapshot.phaseName]} breathing phase`}
          accessibilityRole="image"
          style={[styles.orbStage, isPaused ? styles.orbStagePaused : null, orbAnimatedStyle]}
          testID="first-session-orb"
        >
          {reduceMotionEnabled ? null : (
            <View style={styles.outerRing} testID="first-session-orb-outer-ring" />
          )}
          <View style={styles.innerGlow} testID="first-session-orb-inner-glow" />
          <View style={styles.core} testID="first-session-orb-core">
            <View style={styles.coreAtmosphere} />
          </View>
          {reduceMotionEnabled ? null : (
            <Animated.View
              pointerEvents="none"
              style={[styles.pulseRing, pulseAnimatedStyle]}
              testID="first-session-orb-pulse-ring"
            />
          )}
          <Animated.Text selectable={false} style={[styles.phaseLabel, labelAnimatedStyle]}>
            {phaseLabels[snapshot.phaseName]}
          </Animated.Text>
        </Animated.View>

        <Text
          accessibilityLabel={`Time remaining ${formatAccessibleRemainingTime(
            snapshot.remainingSeconds,
          )}`}
          selectable
          style={styles.timer}
        >
          {formatRemainingTime(snapshot.remainingSeconds)}
        </Text>
      </View>

      <View style={styles.controlsArea}>
        <View style={styles.audioModeRow}>
          {audioModeOptions.map((option) => (
            <AudioModeButton
              key={option.id}
              accessibilityLabel={option.accessibilityLabel}
              accessibilityHint={getAudioModeAccessibilityHint(option.id)}
              isSelected={audioMode === option.id}
              label={option.label}
              mode={option.id}
              onPress={() => {
                setAudioMode(option.id);
              }}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerSpacer} />

          <Pressable
            accessibilityHint="Pauses this breathing session."
            accessibilityLabel="Pause session"
            accessibilityRole="button"
            disabled={Boolean(completionMode)}
            onPress={pauseSession}
            style={({ pressed }) => [
              styles.pauseButton,
              pressed && !completionMode ? styles.controlPressed : null,
              completionMode ? styles.controlDisabled : null,
            ]}
          >
            <Pause color={colors.dark.textSecondary.value} size={24} strokeWidth={1.5} />
          </Pressable>

          <ControlButton
            active={hapticsActive}
            activeLabel="Haptics on"
            accessibilityHint="Toggles breath phase haptics without changing audio or visual guidance."
            inactiveLabel="Haptics off"
            label={hapticsActive ? "Haptics" : "No haptics"}
            onPress={() => {
              setHapticsEnabled((enabled) => !enabled);
            }}
          >
            {hapticsActive ? (
              <Vibrate color={colors.dark.primaryGlow.value} size={20} strokeWidth={1.6} />
            ) : (
              <VibrateOff color={colors.dark.textSecondary.value} size={20} strokeWidth={1.6} />
            )}
          </ControlButton>
        </View>
      </View>

      {isPaused ? (
        <PauseOverlay
          onEnd={endSessionEarly}
          onResume={resumeSession}
          remainingSeconds={snapshot.remainingSeconds}
          sessionLabel={technique.name}
        />
      ) : null}

      {completionMode === "completed" ? (
        <ReflectionOverlay
          completionEyebrow={completionEyebrow}
          disableHaptics={disableHaptics}
          hapticsEnabled={hapticsEnabled}
          localInstallId={localInstallId}
          onRewardMomentComplete={onRewardMomentComplete}
          persistReflection={persistReflection}
          reduceMotionEnabled={reduceMotionEnabled}
          sessionId={sessionId}
        />
      ) : null}
    </View>
  );
}

function FirstSessionPreparingScreen({ techniqueId }: { readonly techniqueId: BreathTechniqueId }) {
  const technique = breathTechniques[techniqueId];

  return (
    <View style={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundGlow} />
      <View style={styles.preparingCenter}>
        <Text accessibilityRole="header" selectable style={styles.title}>
          Let’s wind down.
        </Text>
        <Text selectable style={styles.subtitle}>
          {technique.name}
        </Text>
      </View>
    </View>
  );
}

function PauseOverlay({
  onEnd,
  onResume,
  remainingSeconds,
  sessionLabel,
}: {
  readonly onEnd: () => void;
  readonly onResume: () => void;
  readonly remainingSeconds: number;
  readonly sessionLabel: string;
}) {
  return (
    <View style={styles.overlay} testID="first-session-pause-overlay">
      <View pointerEvents="none" style={styles.overlayGlow} />
      <Text selectable style={styles.overlayEyebrow}>
        {sessionLabel} · {formatRemainingTime(remainingSeconds, false)} left
      </Text>
      <Text accessibilityRole="header" selectable style={styles.overlayTitle}>
        Paused
      </Text>
      <Text selectable style={styles.overlayCopy}>
        You can continue when you’re ready.
      </Text>
      <View style={styles.overlayActions}>
        <Pressable
          accessibilityHint="Returns to the current breath phase."
          accessibilityLabel="Resume session"
          accessibilityRole="button"
          onPress={onResume}
          style={({ pressed }) => [styles.continueButton, pressed ? styles.controlPressed : null]}
        >
          <Text selectable={false} style={styles.continueButtonText}>
            Continue
          </Text>
        </Pressable>
        <Pressable
          accessibilityHint="Saves this session as ended without showing the reflection step."
          accessibilityLabel="End session for now"
          accessibilityRole="button"
          onPress={onEnd}
          style={({ pressed }) => [styles.endForNowButton, pressed ? styles.endPressed : null]}
        >
          <Text selectable={false} style={styles.endForNowText}>
            End for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const reflectionOptions = [
  { label: "Same", value: "same" },
  { label: "Better", value: "better" },
  { label: "Much better", value: "much_better" },
] as const satisfies readonly {
  readonly label: string;
  readonly value: PostSessionReflection["feeling"];
}[];

function ReflectionOverlay({
  completionEyebrow,
  disableHaptics,
  hapticsEnabled,
  localInstallId,
  onRewardMomentComplete,
  persistReflection,
  reduceMotionEnabled,
  sessionId,
}: {
  readonly completionEyebrow: string;
  readonly disableHaptics: boolean;
  readonly hapticsEnabled: boolean;
  readonly localInstallId: string;
  readonly onRewardMomentComplete: () => void;
  readonly persistReflection: (reflection: PostSessionReflection) => Promise<void>;
  readonly reduceMotionEnabled: boolean;
  readonly sessionId: string;
}) {
  const [selectedFeeling, setSelectedFeeling] = useState<PostSessionReflection["feeling"]>();
  const [reflectionError, setReflectionError] = useState<string | undefined>();
  const overlayProgress = useSharedValue(0);
  const eyebrowProgress = useSharedValue(0);
  const titleProgress = useSharedValue(0);
  const optionsProgress = useSharedValue(0);
  const rewardProgress = useSharedValue(0);

  useEffect(() => {
    const contentDuration = reduceMotionEnabled ? 0 : 800;

    overlayProgress.value = withTiming(1, {
      duration: reduceMotionEnabled ? 0 : 1200,
      easing: Easing.out(Easing.ease),
    });
    eyebrowProgress.value = withDelay(
      reduceMotionEnabled ? 0 : 300,
      withTiming(1, { duration: contentDuration, easing: Easing.out(Easing.ease) }),
    );
    titleProgress.value = withDelay(
      reduceMotionEnabled ? 0 : 450,
      withTiming(1, { duration: contentDuration, easing: Easing.out(Easing.ease) }),
    );
    optionsProgress.value = withDelay(
      reduceMotionEnabled ? 0 : 600,
      withTiming(1, { duration: contentDuration, easing: Easing.out(Easing.ease) }),
    );
  }, [eyebrowProgress, optionsProgress, overlayProgress, reduceMotionEnabled, titleProgress]);

  useEffect(() => {
    rewardProgress.value = withTiming(selectedFeeling ? 1 : 0, {
      duration: reduceMotionEnabled ? 0 : 500,
      easing: Easing.out(Easing.ease),
    });
  }, [reduceMotionEnabled, rewardProgress, selectedFeeling]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayProgress.value,
    transform: [{ scale: reduceMotionEnabled ? 1 : 0.95 + overlayProgress.value * 0.05 }],
  }));
  const eyebrowAnimatedStyle = useFadeUpAnimatedStyle(eyebrowProgress, reduceMotionEnabled);
  const titleAnimatedStyle = useFadeUpAnimatedStyle(titleProgress, reduceMotionEnabled);
  const optionsAnimatedStyle = useFadeUpAnimatedStyle(optionsProgress, reduceMotionEnabled);
  const scienceAnimatedStyle = useFadeUpAnimatedStyle(rewardProgress, reduceMotionEnabled);
  const continueAnimatedStyle = useFadeUpAnimatedStyle(rewardProgress, reduceMotionEnabled);

  const selectFeeling = (feeling: PostSessionReflection["feeling"]) => {
    setSelectedFeeling(feeling);
    setReflectionError(undefined);

    if (!disableHaptics && hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }

    void persistReflection({
      feeling,
      localInstallId,
      reflectedAt: new Date().toISOString(),
      sessionId,
    }).catch(() => {
      setReflectionError("We couldn’t save this locally yet. Try again.");
    });
  };

  return (
    <Animated.View
      style={[styles.reflectionOverlay, overlayAnimatedStyle]}
      testID="first-session-reflection-overlay"
    >
      <View pointerEvents="none" style={styles.reflectionAmbientGlow} />
      <View style={styles.reflectionContent}>
        <Animated.View style={[styles.reflectionEyebrowRow, eyebrowAnimatedStyle]}>
          <CheckCircle
            color={colors.dark.primaryGlow.value}
            fill={colors.dark.primaryGlow.value}
            size={16}
            strokeWidth={0}
          />
          <Text selectable style={styles.reflectionEyebrow}>
            {completionEyebrow}
          </Text>
        </Animated.View>

        <Animated.Text
          accessibilityRole="header"
          selectable
          style={[styles.reflectionTitle, titleAnimatedStyle]}
        >
          How do you feel?
        </Animated.Text>

        <Animated.View style={[styles.reflectionButtons, optionsAnimatedStyle]}>
          {reflectionOptions.map((option) => (
            <ReflectionButton
              key={option.value}
              isSelected={selectedFeeling === option.value}
              label={option.label}
              onPress={() => {
                selectFeeling(option.value);
              }}
            />
          ))}
        </Animated.View>

        {selectedFeeling ? (
          <Animated.Text selectable style={[styles.reflectionCopy, scienceAnimatedStyle]}>
            Deep breathing shifts your nervous system into rest mode.
          </Animated.Text>
        ) : null}

        {reflectionError ? (
          <Text accessibilityRole="alert" selectable style={styles.reflectionError}>
            {reflectionError}
          </Text>
        ) : null}
      </View>

      {selectedFeeling ? (
        <Animated.View style={[styles.rewardActionWrap, continueAnimatedStyle]}>
          <Pressable
            accessibilityRole="button"
            onPress={onRewardMomentComplete}
            style={({ pressed }) => [
              styles.rewardContinueButton,
              pressed ? styles.controlPressed : null,
            ]}
          >
            <Text selectable={false} style={styles.rewardContinueText}>
              Continue
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function ReflectionButton({
  isSelected,
  label,
  onPress,
}: {
  readonly isSelected: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.reflectionButton,
        isSelected ? styles.reflectionButtonSelected : null,
        pressed ? styles.controlPressed : null,
      ]}
    >
      <Text selectable={false} style={styles.reflectionButtonText}>
        {label}
      </Text>
      <View
        style={[styles.reflectionCheckCircle, isSelected ? styles.reflectionCheckSelected : null]}
      >
        {isSelected ? (
          <CheckCircle
            color={colors.dark.primaryGlow.value}
            fill={colors.dark.primaryGlow.value}
            size={24}
            strokeWidth={0}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

function useFadeUpAnimatedStyle(progress: SharedValue<number>, reduceMotionEnabled: boolean) {
  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: reduceMotionEnabled ? 0 : 16 - progress.value * 16 }],
  }));
}

function AudioModeButton({
  accessibilityLabel,
  accessibilityHint,
  isSelected,
  label,
  mode,
  onPress,
}: {
  readonly accessibilityLabel: string;
  readonly accessibilityHint: string;
  readonly isSelected: boolean;
  readonly label: string;
  readonly mode: BreathAudioCueModeId;
  readonly onPress: () => void;
}) {
  const iconColor = isSelected ? colors.dark.primaryGlow.value : colors.dark.textSecondary.value;

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.audioModeButton,
        isSelected ? styles.audioModeButtonSelected : null,
        pressed ? styles.controlPressed : null,
      ]}
    >
      <View style={[styles.audioModeIconCircle, isSelected ? styles.audioModeIconSelected : null]}>
        <AudioModeIcon color={iconColor} mode={mode} />
      </View>
      <Text
        numberOfLines={1}
        selectable={false}
        style={[styles.audioModeLabel, isSelected ? styles.audioModeLabelSelected : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AudioModeIcon({
  color,
  mode,
}: {
  readonly color: string;
  readonly mode: BreathAudioCueModeId;
}) {
  switch (mode) {
    case "gentle-bell":
      return <Bell color={color} size={16} strokeWidth={1.7} />;
    case "nature-ambient":
      return <TreePine color={color} size={16} strokeWidth={1.7} />;
    case "none":
      return <VolumeX color={color} size={16} strokeWidth={1.7} />;
    case "soft-whoosh":
      return <Wind color={color} size={16} strokeWidth={1.7} />;
  }
}

function ControlButton({
  accessibilityHint,
  active,
  activeLabel,
  children,
  inactiveLabel,
  label,
  onPress,
}: {
  readonly accessibilityHint: string;
  readonly active: boolean;
  readonly activeLabel: string;
  readonly children: ReactNode;
  readonly inactiveLabel: string;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={active ? activeLabel : inactiveLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.statusControl, pressed ? styles.controlPressed : null]}
    >
      <View style={[styles.statusIconCircle, active ? styles.statusIconCircleActive : null]}>
        {children}
      </View>
      <Text
        selectable={false}
        style={[styles.statusLabel, active ? styles.statusLabelActive : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createBreathSessionDraftFromSnapshot(
  controller: BreathSessionController,
  snapshot: BreathSessionSnapshot,
  audioMode: BreathAudioCueModeId,
): RecoverableBreathSessionDraft {
  return {
    audioCueModeId: audioMode,
    completedBreathCycles: snapshot.completedBreathCycles,
    currentPhaseName: snapshot.phaseName,
    durationSeconds: controller.totalDurationSeconds,
    elapsedDurationMs: snapshot.elapsedDurationMs,
    localInstallId: controller.localInstallId,
    ...(controller.planId === undefined ? {} : { planId: controller.planId }),
    remainingDurationMs: snapshot.remainingDurationMs,
    sessionId: controller.sessionId,
    source: controller.source,
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "draft",
    techniqueId: controller.techniqueId,
    updatedAt: new Date(snapshot.observedAtMs).toISOString(),
  };
}

function createFirstSessionDraftRecord(
  controller: BreathSessionController,
  snapshot: BreathSessionSnapshot,
): RecoverableFirstSessionDraft | undefined {
  if (controller.source !== "first_session" || controller.planId === undefined) {
    return undefined;
  }

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

function createFirstSessionCompletionRecord(record: {
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
}): FirstSessionRecord | undefined {
  if (record.source !== "first_session" || record.planId === undefined) {
    return undefined;
  }

  return {
    completedAt: record.completedAt,
    completedBreathCycles: record.completedBreathCycles,
    completionPersistedAt: record.completionPersistedAt,
    durationSeconds: record.durationSeconds,
    localInstallId: record.localInstallId,
    planId: record.planId,
    sessionId: record.sessionId,
    startedAt: record.startedAt,
    status: record.status,
    techniqueId: record.techniqueId,
  };
}

function createFirstSessionAbandonedRecord(record: {
  readonly abandonedAt: string;
  readonly completedBreathCycles: number;
  readonly currentPhaseName: FirstSessionPhaseName;
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
}): AbandonedFirstSessionRecord | undefined {
  if (record.source !== "first_session" || record.planId === undefined) {
    return undefined;
  }

  return {
    abandonedAt: record.abandonedAt,
    completedBreathCycles: record.completedBreathCycles,
    currentPhaseName: record.currentPhaseName,
    durationSeconds: record.durationSeconds,
    elapsedDurationMs: record.elapsedDurationMs,
    localInstallId: record.localInstallId,
    planId: record.planId,
    remainingDurationMs: record.remainingDurationMs,
    sessionId: record.sessionId,
    startedAt: record.startedAt,
    status: record.status,
    techniqueId: record.techniqueId,
    updatedAt: record.updatedAt,
  };
}

function getPlanForTechnique(techniqueId: BreathTechniqueId) {
  return (
    Object.values(onboardingPlans).find((plan) => plan.firstSession.techniqueId === techniqueId) ??
    onboardingPlans.sleep_focused
  );
}

function getOrbScale(phaseName: FirstSessionPhaseName, reduceMotionEnabled: boolean) {
  const activeScale = reduceMotionEnabled ? motion.breathingOrb.inhaleScale : 1.45;

  if (isExpandingBreathPhase(phaseName)) {
    return activeScale;
  }

  return 1;
}

function isExpandingBreathPhase(phaseName: FirstSessionPhaseName) {
  return phaseName === "inhale" || phaseName === "second-inhale" || phaseName === "hold";
}

function isBreathHapticCuePhase(phaseName: FirstSessionPhaseName) {
  return phaseName === "inhale" || phaseName === "second-inhale" || phaseName === "exhale";
}

function getInitialHapticAppState(): AppStateStatus {
  return canTriggerScreenOnHaptic(AppState.currentState) ? "active" : AppState.currentState;
}

function canTriggerScreenOnHaptic(appState: AppStateStatus) {
  return appState !== "background" && appState !== "inactive";
}

function formatRemainingTime(remainingSeconds: number, padMinutes = true) {
  const boundedSeconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;
  const minuteText = padMinutes ? minutes.toString().padStart(2, "0") : minutes.toString();

  return `${minuteText}:${seconds.toString().padStart(2, "0")}`;
}

function formatAccessibleRemainingTime(remainingSeconds: number) {
  const boundedSeconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;
  const parts: string[] = [];

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
  }

  return parts.join(" ");
}

function getAudioModeAccessibilityHint(mode: BreathAudioCueModeId) {
  switch (mode) {
    case "gentle-bell":
      return "Uses a gentle bell for phase cues.";
    case "nature-ambient":
      return "Uses nature ambience under phase cues.";
    case "none":
      return "Turns off audio cues for this session.";
    case "soft-whoosh":
      return "Uses a soft whoosh for phase cues.";
  }
}

function createFirstSessionId() {
  const randomSegment =
    globalThis.crypto?.randomUUID?.().replaceAll("-", "_") ??
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  const sanitizedSegment = randomSegment.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 64);
  const paddedSegment =
    sanitizedSegment.length >= 8
      ? sanitizedSegment
      : `${sanitizedSegment}${"0".repeat(8 - sanitizedSegment.length)}`;

  return `session_${paddedSegment}`;
}

const styles = StyleSheet.create({
  backgroundGlow: {
    backgroundColor: "#0F1230",
    borderRadius: 220,
    height: 440,
    left: -30,
    opacity: 0.34,
    position: "absolute",
    top: 150,
    width: 440,
  },
  audioModeButton: {
    alignItems: "center",
    backgroundColor: "rgba(17, 20, 48, 0.78)",
    borderColor: colors.dark.divider.value,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    justifyContent: "center",
    minHeight: 58,
    minWidth: 0,
    paddingHorizontal: 6,
  },
  audioModeButtonSelected: {
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: "rgba(168, 156, 224, 0.48)",
    boxShadow: "0 0 16px rgba(124, 111, 205, 0.22)",
  },
  audioModeIconCircle: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  audioModeIconSelected: {
    backgroundColor: "rgba(168, 156, 224, 0.12)",
  },
  audioModeLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 11,
    textAlign: "center",
    width: "100%",
  },
  audioModeLabelSelected: {
    color: colors.dark.textPrimary.value,
  },
  audioModeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
  },
  controlDisabled: {
    opacity: 0.45,
  },
  controlPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
  controlsArea: {
    gap: spacing.sm,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: "rgba(124, 111, 205, 0.42)",
    borderRadius: 999,
    borderWidth: 1,
    boxShadow: "0 0 22px rgba(124, 111, 205, 0.22)",
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 56,
    width: "100%",
  },
  continueButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  core: {
    alignItems: "center",
    backgroundColor: colors.dark.primary.value,
    borderRadius: 75,
    boxShadow: "0 0 44px rgba(124, 111, 205, 0.42)",
    height: 150,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    width: 150,
  },
  coreAtmosphere: {
    backgroundColor: "rgba(238, 240, 255, 0.14)",
    borderRadius: 54,
    height: 108,
    width: 108,
  },
  endForNowButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  endForNowText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  endPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 28,
    paddingHorizontal: 28,
    paddingTop: spacing.sm,
  },
  footerSpacer: {
    width: 72,
  },
  header: {
    alignItems: "center",
    gap: 7,
    paddingHorizontal: spacing.md,
    paddingTop: 42,
  },
  innerGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.2)",
    borderRadius: 100,
    height: 200,
    position: "absolute",
    width: 200,
  },
  orbSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 400,
  },
  orbStage: {
    alignItems: "center",
    height: 260,
    justifyContent: "center",
    width: 260,
  },
  orbStagePaused: {
    opacity: 0.3,
    transform: [{ scale: 0.85 }],
  },
  outerRing: {
    borderColor: "rgba(168, 156, 224, 0.24)",
    borderRadius: 120,
    borderTopColor: "rgba(168, 156, 224, 0.42)",
    borderWidth: 1.5,
    height: 240,
    position: "absolute",
    width: 240,
  },
  overlay: {
    alignItems: "center",
    backgroundColor: colors.dark.background.value,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    right: 0,
    top: 0,
  },
  overlayActions: {
    gap: spacing.sm,
    maxWidth: 280,
    width: "100%",
  },
  overlayCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    marginBottom: spacing.lg + 2,
  },
  overlayEyebrow: {
    color: "#A4AAC4",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  overlayGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.17)",
    borderRadius: 120,
    height: 240,
    position: "absolute",
    width: 240,
  },
  overlayTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.divider.value,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  phaseLabel: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    position: "absolute",
  },
  preparingCenter: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
  },
  pulseRing: {
    borderColor: "rgba(238, 240, 255, 0.38)",
    borderRadius: 75,
    borderWidth: 1.5,
    height: 150,
    position: "absolute",
    width: 150,
  },
  reflectionAmbientGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.18)",
    borderRadius: 140,
    height: 280,
    position: "absolute",
    width: 280,
  },
  reflectionButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.divider.value,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 20,
    width: "100%",
  },
  reflectionButtons: {
    gap: 14,
    marginBottom: spacing.md,
    maxWidth: 320,
    width: "100%",
  },
  reflectionButtonSelected: {
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: "rgba(124, 111, 205, 0.48)",
    boxShadow: "0 0 14px rgba(124, 111, 205, 0.18)",
  },
  reflectionButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  reflectionCheckCircle: {
    alignItems: "center",
    borderColor: "#2A2E50",
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  reflectionCheckSelected: {
    borderColor: "transparent",
    boxShadow: "0 0 10px rgba(168, 156, 224, 0.42)",
  },
  reflectionContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    position: "relative",
    transform: [{ translateY: -28 }],
    width: "100%",
  },
  reflectionCopy: {
    color: "#A4AAC4",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 290,
    textAlign: "center",
  },
  reflectionError: {
    color: colors.dark.danger.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
    maxWidth: 300,
    textAlign: "center",
  },
  reflectionEyebrow: {
    color: "#A4AAC4",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
  },
  reflectionEyebrowRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: 12,
  },
  reflectionOverlay: {
    alignItems: "center",
    backgroundColor: colors.dark.background.value,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
  },
  reflectionTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 28,
    letterSpacing: 0,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  rewardActionWrap: {
    alignItems: "center",
    bottom: 32,
    left: 0,
    paddingHorizontal: 24,
    position: "absolute",
    right: 0,
  },
  rewardContinueButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: colors.dark.surfaceRaised.value,
    borderRadius: 16,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    maxWidth: 342,
    width: "100%",
  },
  rewardContinueText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
    overflow: "hidden",
  },
  statusControl: {
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    minHeight: 64,
    minWidth: 64,
  },
  statusIconCircle: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.divider.value,
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  statusIconCircleActive: {
    borderColor: "rgba(124, 111, 205, 0.48)",
  },
  statusLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
  },
  statusLabelActive: {
    color: colors.dark.primaryGlow.value,
  },
  subtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
  },
  timer: {
    bottom: 22,
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    letterSpacing: 3,
    opacity: 0.82,
    position: "absolute",
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
});
