import {
  breathTechniques,
  onboardingPlans,
  type BreathTechniqueId,
  type OnboardingPlanId,
} from "@nidoru/domain";
import { colors, motion, spacing, typography } from "@nidoru/ui-tokens";
import type {
  AbandonedFirstSessionRecord,
  FirstSessionRecord,
  RecoverableFirstSessionDraft,
} from "@nidoru/validation";
import * as Haptics from "expo-haptics";
import { Bell, BellOff, Pause, Play, Vibrate, VibrateOff } from "lucide-react-native";
import { useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  abandonFirstSessionLocally,
  completeFirstSessionLocally,
  getOrCreateLocalInstallIdentity,
  loadRecoverableFirstSessionDraft,
  saveFirstSessionDraftLocally,
  type LocalFirstOnboardingDatabase,
} from "../onboarding/local-first-onboarding";
import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { openMigratedLocalDatabase } from "../storage/local-database";
import {
  completeFirstSessionIfDue,
  createFirstSessionController,
  createFirstSessionDraftFromSnapshot,
  endFirstSessionEarly,
  getFirstSessionSnapshot,
  pauseFirstSession,
  resumeFirstSession,
  type FirstSessionPhaseName,
} from "./first-session-runtime";

export type FirstSessionPersistence = {
  readonly persistAbandoned?: (record: AbandonedFirstSessionRecord) => Promise<void>;
  readonly persistCompletion?: (record: FirstSessionRecord) => Promise<void>;
  readonly persistDraft?: (record: RecoverableFirstSessionDraft) => Promise<void>;
};

export type FirstSessionScreenProps = FirstSessionPersistence & {
  readonly disableHaptics?: boolean;
  readonly durationSeconds?: number;
  readonly localInstallId: string;
  readonly planId: OnboardingPlanId;
  readonly sessionId: string;
  readonly startedAtMs?: number;
  readonly techniqueId: BreathTechniqueId;
  readonly tickIntervalMs?: number;
};

type FirstSessionRouteScreenProps = {
  readonly durationSeconds?: number;
  readonly planId?: OnboardingPlanId;
  readonly techniqueId: BreathTechniqueId;
};

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

export function FirstSessionRouteScreen({
  durationSeconds,
  planId,
  techniqueId,
}: FirstSessionRouteScreenProps) {
  const [sessionConfig, setSessionConfig] = useState<{
    readonly database: LocalFirstOnboardingDatabase;
    readonly durationSeconds: number;
    readonly localInstallId: string;
    readonly planId: OnboardingPlanId;
    readonly sessionId: string;
    readonly startedAtMs: number;
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
      const recoverableDraft = await loadRecoverableFirstSessionDraft(localDatabase, {
        localInstallId,
      });
      const nowMs = Date.now();
      const selectedPlanId = planId ?? recoverableDraft?.planId ?? fallbackPlan.id;
      const selectedDurationSeconds =
        durationSeconds ??
        recoverableDraft?.durationSeconds ??
        fallbackPlan.firstSession.durationSeconds;
      const sessionId = recoverableDraft?.sessionId ?? createFirstSessionId();
      const startedAtMs = recoverableDraft ? nowMs - recoverableDraft.elapsedDurationMs : nowMs;

      if (!isMounted) {
        return;
      }

      setSessionConfig({
        database: localDatabase,
        durationSeconds: selectedDurationSeconds,
        localInstallId,
        planId: selectedPlanId,
        sessionId,
        startedAtMs,
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
    techniqueId,
  ]);

  if (!sessionConfig) {
    return <FirstSessionPreparingScreen techniqueId={techniqueId} />;
  }

  return (
    <FirstSessionScreen
      durationSeconds={sessionConfig.durationSeconds}
      localInstallId={sessionConfig.localInstallId}
      persistAbandoned={(record) => abandonFirstSessionLocally(sessionConfig.database, record)}
      persistCompletion={(record) => completeFirstSessionLocally(sessionConfig.database, record)}
      persistDraft={(record) => saveFirstSessionDraftLocally(sessionConfig.database, record)}
      planId={sessionConfig.planId}
      sessionId={sessionConfig.sessionId}
      startedAtMs={sessionConfig.startedAtMs}
      techniqueId={techniqueId}
    />
  );
}

export function FirstSessionScreen({
  disableHaptics = false,
  durationSeconds,
  localInstallId,
  persistAbandoned = async () => undefined,
  persistCompletion = async () => undefined,
  persistDraft = async () => undefined,
  planId,
  sessionId,
  startedAtMs = Date.now(),
  techniqueId,
  tickIntervalMs = defaultTickIntervalMs,
}: FirstSessionScreenProps) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const technique = breathTechniques[techniqueId];
  const plan = onboardingPlans[planId];
  const sessionDurationSeconds = durationSeconds ?? plan.firstSession.durationSeconds;
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    reduceMotionPreference.isResolved && reduceMotionPreference.reduceMotionEnabled;
  const controllerRef = useRef(
    createFirstSessionController({
      localInstallId,
      planId,
      sessionId,
      startedAtMs,
      techniqueId,
      totalDurationSeconds: sessionDurationSeconds,
    }),
  );
  const [controller, setController] = useState(controllerRef.current);
  const [snapshot, setSnapshot] = useState(() =>
    getFirstSessionSnapshot(controllerRef.current, startedAtMs),
  );
  const [audioMode, setAudioMode] = useState<"bell" | "none">("bell");
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [completionMode, setCompletionMode] = useState<CompletionMode>();
  const isPersistingTerminalStateRef = useRef(false);
  const lastDraftPersistedAtMs = useRef<number | undefined>(undefined);
  const previousPhaseNameRef = useRef<FirstSessionPhaseName>(snapshot.phaseName);
  const orbScale = useSharedValue(getOrbScale(snapshot.phaseName, reduceMotionEnabled));
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(1);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  const refreshSnapshot = useCallback((observedAtMs = Date.now()) => {
    const nextSnapshot = getFirstSessionSnapshot(controllerRef.current, observedAtMs);
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, []);

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

    if (
      disableHaptics ||
      !hapticsEnabled ||
      snapshot.status !== "active" ||
      previousPhaseName === snapshot.phaseName
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

    const shouldPersistDraft =
      lastDraftPersistedAtMs.current === undefined ||
      snapshot.observedAtMs - lastDraftPersistedAtMs.current >= draftPersistIntervalMs ||
      snapshot.remainingDurationMs <= finalDraftWindowMs ||
      snapshot.isPaused;

    if (!shouldPersistDraft) {
      return;
    }

    lastDraftPersistedAtMs.current = snapshot.observedAtMs;
    void persistDraft(createFirstSessionDraftFromSnapshot(controllerRef.current, snapshot)).catch(
      () => undefined,
    );
  }, [completionMode, persistDraft, snapshot]);

  useEffect(() => {
    if (snapshot.status !== "completed" || completionMode || isPersistingTerminalStateRef.current) {
      return;
    }

    const completedRecord = completeFirstSessionIfDue(controllerRef.current, snapshot.observedAtMs);

    if (!completedRecord) {
      return;
    }

    isPersistingTerminalStateRef.current = true;
    void persistCompletion(completedRecord)
      .then(() => {
        setCompletionMode("completed");
      })
      .finally(() => {
        isPersistingTerminalStateRef.current = false;
      });
  }, [completionMode, persistCompletion, snapshot]);

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
    const paused = pauseFirstSession(controllerRef.current, Date.now());
    setController(paused);
    setSnapshot(getFirstSessionSnapshot(paused, Date.now()));
  };

  const resumeSession = () => {
    const resumed = resumeFirstSession(controllerRef.current, Date.now());
    setController(resumed);
    setSnapshot(getFirstSessionSnapshot(resumed, Date.now()));
  };

  const endSessionEarly = () => {
    if (isPersistingTerminalStateRef.current) {
      return;
    }

    const abandonedRecord = endFirstSessionEarly(controllerRef.current, Date.now());

    isPersistingTerminalStateRef.current = true;
    void persistAbandoned(abandonedRecord)
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
      <View pointerEvents="none" style={styles.backgroundGlow} />
      <View pointerEvents="none" style={styles.lowerGlow} />

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
          accessibilityLabel={`${phaseLabels[snapshot.phaseName]} breathing phase`}
          accessibilityRole="image"
          style={[styles.orbStage, isPaused ? styles.orbStagePaused : null, orbAnimatedStyle]}
          testID="first-session-orb"
        >
          <View style={styles.outerRing} />
          <View style={styles.innerGlow} />
          <View style={styles.core}>
            <View style={styles.coreAtmosphere} />
          </View>
          <Animated.View pointerEvents="none" style={[styles.pulseRing, pulseAnimatedStyle]} />
          <Animated.Text selectable={false} style={[styles.phaseLabel, labelAnimatedStyle]}>
            {phaseLabels[snapshot.phaseName]}
          </Animated.Text>
        </Animated.View>

        <Text selectable style={styles.timer}>
          {formatRemainingTime(snapshot.remainingSeconds)}
        </Text>
      </View>

      <View style={styles.footer}>
        <ControlButton
          active={audioMode === "bell"}
          activeLabel="Bell"
          inactiveLabel="No audio"
          label={audioMode === "bell" ? "Bell" : "No audio"}
          onPress={() => {
            setAudioMode((currentMode) => (currentMode === "bell" ? "none" : "bell"));
          }}
        >
          {audioMode === "bell" ? (
            <Bell color={colors.dark.textSecondary.value} size={20} strokeWidth={1.6} />
          ) : (
            <BellOff color={colors.dark.textSecondary.value} size={20} strokeWidth={1.6} />
          )}
        </ControlButton>

        <Pressable
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
          activeLabel="Haptics"
          inactiveLabel="No haptics"
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

      {isPaused ? (
        <PauseOverlay
          onEnd={endSessionEarly}
          onResume={resumeSession}
          remainingSeconds={snapshot.remainingSeconds}
          sessionLabel={technique.name}
        />
      ) : null}

      {completionMode ? <ReflectionOverlay mode={completionMode} /> : null}
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
          accessibilityRole="button"
          onPress={onResume}
          style={({ pressed }) => [styles.continueButton, pressed ? styles.controlPressed : null]}
        >
          <Play color={colors.dark.textPrimary.value} size={16} strokeWidth={1.6} />
          <Text selectable={false} style={styles.continueButtonText}>
            Continue
          </Text>
        </Pressable>
        <Pressable
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

function ReflectionOverlay({ mode }: { readonly mode: Exclude<CompletionMode, undefined> }) {
  const isAbandoned = mode === "abandoned";

  return (
    <View style={styles.overlay} testID="first-session-reflection-overlay">
      <View pointerEvents="none" style={styles.overlayGlow} />
      <Text accessibilityRole="header" selectable style={styles.reflectionTitle}>
        How do you feel?
      </Text>
      <View style={styles.reflectionButtons}>
        <ReflectionButton label="Same" />
        <ReflectionButton label={isAbandoned ? "A little better" : "Better"} />
        <ReflectionButton label={isAbandoned ? "Better" : "Much better"} />
      </View>
      <Text selectable style={styles.reflectionCopy}>
        {isAbandoned
          ? "Even a short pause can help your body settle."
          : "Deep breathing shifts your nervous system into rest mode."}
      </Text>
    </View>
  );
}

function ReflectionButton({ label }: { readonly label: string }) {
  return (
    <Pressable accessibilityRole="button" style={styles.reflectionButton}>
      <Text selectable={false} style={styles.reflectionButtonText}>
        {label}
      </Text>
    </Pressable>
  );
}

function ControlButton({
  active,
  activeLabel,
  children,
  inactiveLabel,
  label,
  onPress,
}: {
  readonly active: boolean;
  readonly activeLabel: string;
  readonly children: ReactNode;
  readonly inactiveLabel: string;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
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

function getPlanForTechnique(techniqueId: BreathTechniqueId) {
  return (
    Object.values(onboardingPlans).find((plan) => plan.firstSession.techniqueId === techniqueId) ??
    onboardingPlans.sleep_focused
  );
}

function getOrbScale(phaseName: FirstSessionPhaseName, reduceMotionEnabled: boolean) {
  if (reduceMotionEnabled) {
    return 1;
  }

  if (phaseName === "inhale" || phaseName === "hold") {
    return 1.45;
  }

  return 1;
}

function formatRemainingTime(remainingSeconds: number, padMinutes = true) {
  const boundedSeconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;
  const minuteText = padMinutes ? minutes.toString().padStart(2, "0") : minutes.toString();

  return `${minuteText}:${seconds.toString().padStart(2, "0")}`;
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
  controlDisabled: {
    opacity: 0.45,
  },
  controlPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
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
  lowerGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.11)",
    borderRadius: 150,
    bottom: -110,
    height: 300,
    left: 45,
    position: "absolute",
    width: 300,
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
    backgroundColor: "rgba(13, 15, 26, 0.93)",
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
  reflectionButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.divider.value,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    width: "100%",
  },
  reflectionButtons: {
    gap: 12,
    marginBottom: spacing.lg,
    maxWidth: 280,
    width: "100%",
  },
  reflectionButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  reflectionCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 290,
    textAlign: "center",
  },
  reflectionTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 24,
    marginBottom: spacing.lg,
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
