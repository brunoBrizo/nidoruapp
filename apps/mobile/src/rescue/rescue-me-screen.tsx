import { colors, typography } from "@nidoru/ui-tokens";
import type {
  AbandonedBreathSessionRecord,
  BreathSessionStartedRecord,
  CompletedBreathSessionRecord,
  RecoverableBreathSessionDraft,
} from "@nidoru/validation";
import { StatusBar } from "expo-status-bar";
import { Bell, Pause, Play, Vibrate } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import {
  useReduceMotionEnabled,
  useReduceMotionPreference,
} from "../motion/use-reduce-motion-enabled";
import {
  completeBreathSessionIfDue,
  createBreathSessionController,
  endBreathSessionEarly,
  getBreathSessionSnapshot,
  pauseBreathSession,
  resumeBreathSession,
  type BreathSessionController,
  type BreathSessionSnapshot,
} from "../session/breath-session-runtime";

export const RESCUE_ME_SCREEN_STATES = [
  "active-launch",
  "active-phase",
  "active-reassurance",
  "complete",
  "sound-handoff",
  "sound-handoff-alt",
] as const;

export type RescueMeScreenState = (typeof RESCUE_ME_SCREEN_STATES)[number];

type ActiveState = Extract<
  RescueMeScreenState,
  "active-launch" | "active-phase" | "active-reassurance"
>;

type ActiveStateConfig = {
  readonly phase: "Inhale" | "Hold" | "Exhale";
  readonly timer: string;
  readonly coreSize: number;
  readonly glowScale: number;
  readonly timerOffset: number;
  readonly accessibilityLabel: string;
  readonly showReassurance: boolean;
};

type RescueMeCompletionMode = "completed" | "abandoned" | undefined;

type RescueMeActiveSessionScreenProps = {
  readonly disableHaptics?: boolean;
  readonly initialCompletionMode?: RescueMeCompletionMode;
  readonly localInstallId: string;
  readonly onContinueWithSound?: () => void;
  readonly onReturnHome?: () => void;
  readonly persistBreathSessionAbandoned?: (record: AbandonedBreathSessionRecord) => Promise<void>;
  readonly persistBreathSessionCompletion?: (record: CompletedBreathSessionRecord) => Promise<void>;
  readonly persistBreathSessionDraft?: (record: RecoverableBreathSessionDraft) => Promise<void>;
  readonly persistBreathSessionStarted?: (record: BreathSessionStartedRecord) => Promise<void>;
  readonly sessionId: string;
  readonly startedAtMs?: number;
  readonly tickIntervalMs?: number;
};

type RescueMeController = BreathSessionController<{
  readonly localInstallId: string;
  readonly sessionId: string;
  readonly source: "rescue_me";
  readonly startedAtMs: number;
  readonly targetBreathCycles: typeof rescueMeBreathCycles;
  readonly techniqueId: typeof rescueMeTechniqueId;
  readonly totalDurationSeconds: typeof rescueMeDurationSeconds;
}>;

const rescueMeTechniqueId = "4-7-8-sleep";
const rescueMeDurationSeconds = 209;
const rescueMeBreathCycles = 5;
const rescueMeTickIntervalMs = 1000;
const rescueMeDraftPersistIntervalMs = 15000;
const rescueMeFinalDraftWindowMs = 10000;
const rescueMeAudioCueModeId = "gentle-bell";

const activeStateConfig: Record<ActiveState, ActiveStateConfig> = {
  "active-launch": {
    accessibilityLabel: "Inhale breathing phase",
    coreSize: 132,
    glowScale: 0.86,
    phase: "Inhale",
    showReassurance: false,
    timer: "03:29",
    timerOffset: 58,
  },
  "active-phase": {
    accessibilityLabel: "Hold breathing phase",
    coreSize: 162,
    glowScale: 1,
    phase: "Hold",
    showReassurance: false,
    timer: "03:29",
    timerOffset: 50,
  },
  "active-reassurance": {
    accessibilityLabel: "Exhale breathing phase",
    coreSize: 132,
    glowScale: 0.92,
    phase: "Exhale",
    showReassurance: true,
    timer: "02:14",
    timerOffset: 48,
  },
};

const screenStateSet = new Set<string>(RESCUE_ME_SCREEN_STATES);

export function parseRescueMeScreenState(
  value: string | readonly string[] | undefined,
): RescueMeScreenState {
  const state = Array.isArray(value) ? value[0] : value;

  return state && screenStateSet.has(state) ? (state as RescueMeScreenState) : "active-launch";
}

export function parseOptionalRescueMeScreenState(
  value: string | readonly string[] | undefined,
): RescueMeScreenState | undefined {
  const state = Array.isArray(value) ? value[0] : value;

  return state && screenStateSet.has(state) ? (state as RescueMeScreenState) : undefined;
}

export function RescueMeScreen({ state }: { readonly state: RescueMeScreenState }) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 760;
  const rootStyle = [
    styles.screen,
    {
      paddingBottom: Math.max(safeAreaInsets.bottom, 0),
      paddingTop: Math.max(safeAreaInsets.top, 0),
    },
  ];

  return (
    <View style={rootStyle} testID={`rescue-me-screen-${state}`}>
      <StatusBar hidden />
      <RescueMeBackground
        variant={state === "sound-handoff" || state === "sound-handoff-alt" ? "sound" : "standard"}
      />
      {state === "complete" ? (
        <CompletionState compact={isCompactHeight} />
      ) : state === "sound-handoff" || state === "sound-handoff-alt" ? (
        <SoundHandoffState compact={isCompactHeight} state={state} />
      ) : (
        <ActiveSessionState compact={isCompactHeight} state={state} />
      )}
    </View>
  );
}

export function RescueMeActiveSessionScreen({
  disableHaptics = false,
  initialCompletionMode,
  localInstallId,
  onContinueWithSound = () => undefined,
  onReturnHome = () => undefined,
  persistBreathSessionAbandoned = () => Promise.resolve(),
  persistBreathSessionCompletion = () => Promise.resolve(),
  persistBreathSessionDraft = () => Promise.resolve(),
  persistBreathSessionStarted = () => Promise.resolve(),
  sessionId,
  startedAtMs = Date.now(),
  tickIntervalMs = rescueMeTickIntervalMs,
}: RescueMeActiveSessionScreenProps) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 760;
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    reduceMotionPreference.isResolved && reduceMotionPreference.reduceMotionEnabled;
  const controllerRef = useRef<RescueMeController>(
    createRescueMeController({
      localInstallId,
      sessionId,
      startedAtMs,
    }),
  );
  const [controller, setController] = useState(controllerRef.current);
  const [snapshot, setSnapshot] = useState(() =>
    getBreathSessionSnapshot(controllerRef.current, startedAtMs),
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [completionMode, setCompletionMode] =
    useState<RescueMeCompletionMode>(initialCompletionMode);
  const hasPersistedSessionStartRef = useRef(Boolean(initialCompletionMode));
  const hasPersistedFinalDraftRef = useRef(false);
  const isPersistingTerminalStateRef = useRef(false);
  const lastDraftPersistedAtMs = useRef<number | undefined>(undefined);

  useEffect(() => {
    controllerRef.current = controller;
  }, [controller]);

  const refreshSnapshot = useCallback((observedAtMs = Date.now()) => {
    const nextSnapshot = getBreathSessionSnapshot(controllerRef.current, observedAtMs);
    setSnapshot(nextSnapshot);
    return nextSnapshot;
  }, []);

  const persistDraftForSnapshot = useCallback(
    (nextSnapshot: BreathSessionSnapshot) =>
      persistBreathSessionDraft(
        createRescueMeDraftRecord(controllerRef.current, nextSnapshot),
      ).catch(() => undefined),
    [persistBreathSessionDraft],
  );

  useEffect(() => {
    if (hasPersistedSessionStartRef.current) {
      return;
    }

    hasPersistedSessionStartRef.current = true;

    void persistBreathSessionStarted({
      audioCueModeId: rescueMeAudioCueModeId,
      currentPhaseName: snapshot.phaseName,
      durationSeconds: rescueMeDurationSeconds,
      localInstallId,
      sessionId,
      source: "rescue_me",
      startedAt: new Date(startedAtMs).toISOString(),
      status: "started",
      techniqueId: rescueMeTechniqueId,
    }).catch(() => undefined);
  }, [localInstallId, persistBreathSessionStarted, sessionId, snapshot.phaseName, startedAtMs]);

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
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (completionMode || nextAppState === "active") {
        return;
      }

      void persistDraftForSnapshot(refreshSnapshot());
    });

    return () => {
      subscription.remove();
    };
  }, [completionMode, persistDraftForSnapshot, refreshSnapshot]);

  useEffect(() => {
    if (snapshot.status === "completed" || completionMode) {
      return;
    }

    const isFinalDraftWindow = snapshot.remainingDurationMs <= rescueMeFinalDraftWindowMs;
    const shouldPersistDraft =
      lastDraftPersistedAtMs.current === undefined ||
      snapshot.observedAtMs - lastDraftPersistedAtMs.current >= rescueMeDraftPersistIntervalMs ||
      (isFinalDraftWindow && !hasPersistedFinalDraftRef.current) ||
      snapshot.isPaused;

    if (!shouldPersistDraft) {
      return;
    }

    lastDraftPersistedAtMs.current = snapshot.observedAtMs;

    if (isFinalDraftWindow) {
      hasPersistedFinalDraftRef.current = true;
    }

    void persistDraftForSnapshot(snapshot);
  }, [completionMode, persistDraftForSnapshot, snapshot]);

  useEffect(() => {
    if (snapshot.status !== "completed" || completionMode || isPersistingTerminalStateRef.current) {
      return;
    }

    const completedRecord = completeBreathSessionIfDue(
      controllerRef.current,
      snapshot.observedAtMs,
    );

    if (!completedRecord) {
      return;
    }

    isPersistingTerminalStateRef.current = true;

    void persistBreathSessionCompletion({
      ...completedRecord,
      audioCueModeId: rescueMeAudioCueModeId,
      currentPhaseName: snapshot.phaseName,
      elapsedDurationMs: snapshot.elapsedDurationMs,
      remainingDurationMs: snapshot.remainingDurationMs,
      updatedAt: completedRecord.completionPersistedAt,
    })
      .then(() => {
        setCompletionMode("completed");
      })
      .finally(() => {
        isPersistingTerminalStateRef.current = false;
      });
  }, [completionMode, persistBreathSessionCompletion, snapshot]);

  const pauseSession = () => {
    const observedAtMs = Date.now();
    const paused = pauseBreathSession(controllerRef.current, observedAtMs);
    const nextSnapshot = getBreathSessionSnapshot(paused, observedAtMs);

    setController(paused);
    setSnapshot(nextSnapshot);
    void persistDraftForSnapshot(nextSnapshot);
  };

  const resumeSession = () => {
    const observedAtMs = Date.now();
    const resumed = resumeBreathSession(controllerRef.current, observedAtMs);

    setController(resumed);
    setSnapshot(getBreathSessionSnapshot(resumed, observedAtMs));
  };

  const endSessionEarly = () => {
    if (isPersistingTerminalStateRef.current) {
      return;
    }

    const abandonedRecord = endBreathSessionEarly(controllerRef.current, Date.now());

    isPersistingTerminalStateRef.current = true;

    void persistBreathSessionAbandoned({
      ...abandonedRecord,
      audioCueModeId: rescueMeAudioCueModeId,
      stopReason: "user_ended",
    })
      .then(() => {
        setCompletionMode("abandoned");
        onReturnHome();
      })
      .finally(() => {
        isPersistingTerminalStateRef.current = false;
      });
  };

  const rootStyle = [
    styles.screen,
    {
      paddingBottom: Math.max(safeAreaInsets.bottom, 0),
      paddingTop: Math.max(safeAreaInsets.top, 0),
    },
  ];

  return (
    <View style={rootStyle} testID="rescue-me-active-session-screen">
      <StatusBar hidden />
      <RescueMeBackground variant="standard" />
      {completionMode === "completed" ? (
        <CompletionState
          compact={isCompactHeight}
          onContinueWithSound={onContinueWithSound}
          onReturnHome={onReturnHome}
        />
      ) : (
        <>
          <ActiveSessionRuntimeState
            compact={isCompactHeight}
            hapticsEnabled={hapticsEnabled}
            onPause={pauseSession}
            onToggleHaptics={() => {
              if (!disableHaptics) {
                setHapticsEnabled((enabled) => !enabled);
              }
            }}
            reduceMotionEnabled={reduceMotionEnabled}
            snapshot={snapshot}
          />
          {snapshot.isPaused ? (
            <RescueMePauseOverlay onEnd={endSessionEarly} onResume={resumeSession} />
          ) : null}
        </>
      )}
    </View>
  );
}

function RescueMeBackground({ variant }: { readonly variant: "standard" | "sound" }) {
  const isSoundHandoff = variant === "sound";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="rescue-me-background">
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 844" width="100%">
        <Defs>
          <RadialGradient
            cx="195"
            cy="360"
            fx="195"
            fy="360"
            gradientUnits="userSpaceOnUse"
            id="rescue-center-wash"
            r="430"
          >
            <Stop offset="0" stopColor="#242A52" stopOpacity="0.18" />
            <Stop offset="0.38" stopColor="#171B36" stopOpacity="0.14" />
            <Stop offset="0.7" stopColor="#101326" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="195"
            cy={isSoundHandoff ? "274" : "300"}
            fx="195"
            fy={isSoundHandoff ? "274" : "300"}
            gradientUnits="userSpaceOnUse"
            id="rescue-orb-wash"
            r={isSoundHandoff ? "178" : "250"}
          >
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity={isSoundHandoff ? "0.075" : "0.1"} />
            <Stop
              offset="0.42"
              stopColor="#7C6FCD"
              stopOpacity={isSoundHandoff ? "0.032" : "0.05"}
            />
            <Stop offset="1" stopColor="#7C6FCD" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#rescue-center-wash)" height="844" width="390" x="0" y="0" />
        <Rect fill="url(#rescue-orb-wash)" height="844" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}

function ActiveSessionState({
  compact,
  state,
}: {
  readonly compact: boolean;
  readonly state: ActiveState;
}) {
  const config = activeStateConfig[state];
  const orbLift = compact ? -30 : -18;

  return (
    <>
      <View style={[styles.activeMain, { transform: [{ translateY: orbLift }] }]}>
        <BreathingOrb
          accessibilityLabel={config.accessibilityLabel}
          coreSize={config.coreSize}
          glowScale={config.glowScale}
          phase={config.phase}
        />
        <Text
          accessibilityLabel={`Time remaining ${config.timer}`}
          selectable
          style={[styles.timer, { marginTop: config.timerOffset }]}
        >
          {config.timer}
        </Text>
      </View>

      {config.showReassurance ? (
        <Text selectable style={styles.reassurance}>
          You’re doing enough. Stay with the next breath.
        </Text>
      ) : null}

      <ActiveControls />
    </>
  );
}

function ActiveSessionRuntimeState({
  compact,
  hapticsEnabled,
  onPause,
  onToggleHaptics,
  reduceMotionEnabled,
  snapshot,
}: {
  readonly compact: boolean;
  readonly hapticsEnabled: boolean;
  readonly onPause: () => void;
  readonly onToggleHaptics: () => void;
  readonly reduceMotionEnabled: boolean;
  readonly snapshot: BreathSessionSnapshot;
}) {
  const config = getRuntimeActiveStateConfig(snapshot);
  const orbLift = compact ? -30 : -18;

  return (
    <>
      <View style={[styles.activeMain, { transform: [{ translateY: orbLift }] }]}>
        <BreathingOrb
          accessibilityLabel={config.accessibilityLabel}
          coreSize={config.coreSize}
          glowScale={config.glowScale}
          phase={config.phase}
          reduceMotionEnabled={reduceMotionEnabled}
        />
        <Text
          accessibilityLabel={`Time remaining ${formatAccessibleRemainingTime(
            snapshot.remainingSeconds,
          )}`}
          selectable
          style={[styles.timer, { marginTop: config.timerOffset }]}
        >
          {formatRemainingTime(snapshot.remainingSeconds)}
        </Text>
      </View>

      {config.showReassurance ? (
        <Text selectable style={styles.reassurance}>
          You’re doing enough. Stay with the next breath.
        </Text>
      ) : null}

      <ActiveControls
        hapticsEnabled={hapticsEnabled}
        onPause={onPause}
        onToggleHaptics={onToggleHaptics}
      />
    </>
  );
}

function BreathingOrb({
  accessibilityLabel,
  coreSize,
  glowScale,
  phase,
  reduceMotionEnabled = false,
}: {
  readonly accessibilityLabel: string;
  readonly coreSize: number;
  readonly glowScale: number;
  readonly phase: string;
  readonly reduceMotionEnabled?: boolean;
}) {
  const outerSize = 280 * glowScale;
  const midSize = 220 * glowScale;
  const innerSize = 180 * glowScale;

  return (
    <View
      accessibilityHint="Guides the current breath phase."
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="timer"
      style={styles.orbStage}
      testID="rescue-me-orb"
    >
      {reduceMotionEnabled ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.outerGlow,
            {
              borderRadius: outerSize / 2,
              height: outerSize,
              width: outerSize,
            },
          ]}
          testID="rescue-me-orb-outer-glow"
        />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.midGlow,
          {
            borderRadius: midSize / 2,
            height: midSize,
            width: midSize,
          },
        ]}
        testID="rescue-me-orb-mid-glow"
      />
      <View
        pointerEvents="none"
        style={[
          styles.innerGlow,
          {
            borderRadius: innerSize / 2,
            height: innerSize,
            width: innerSize,
          },
        ]}
        testID="rescue-me-orb-inner-glow"
      />
      {reduceMotionEnabled ? null : (
        <View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              borderRadius: coreSize * 0.68,
              height: coreSize * 1.36,
              width: coreSize * 1.36,
            },
          ]}
          testID="rescue-me-orb-pulse-ring"
        />
      )}
      <View
        style={[
          styles.orbCore,
          {
            borderRadius: coreSize / 2,
            height: coreSize,
            width: coreSize,
          },
        ]}
        testID="rescue-me-orb-core"
      >
        <Svg height="100%" viewBox="0 0 132 132" width="100%">
          <Defs>
            <LinearGradient id="rescue-orb-core-gradient" x1="0" x2="1" y1="1" y2="0">
              <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.95" />
              <Stop offset="1" stopColor="#A89CE0" stopOpacity="0.96" />
            </LinearGradient>
            <LinearGradient id="rescue-orb-highlight" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.22" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="66" cy="66" fill="url(#rescue-orb-core-gradient)" r="66" />
          <Circle cx="66" cy="46" fill="url(#rescue-orb-highlight)" r="66" />
        </Svg>
        <Text selectable={false} style={styles.phaseLabel}>
          {phase}
        </Text>
      </View>
    </View>
  );
}

function ActiveControls({
  hapticsEnabled = true,
  onPause = () => undefined,
  onToggleHaptics = () => undefined,
}: {
  readonly hapticsEnabled?: boolean;
  readonly onPause?: () => void;
  readonly onToggleHaptics?: () => void;
}) {
  return (
    <View style={styles.controls} testID="rescue-me-controls">
      <ControlButton accessibilityLabel="Audio cue: Bell" label="Bell">
        <Bell color={colors.dark.textSecondary.value} size={22} strokeWidth={1.5} />
      </ControlButton>

      <Pressable
        accessibilityHint="Pauses this Rescue Me session."
        accessibilityLabel="Pause Rescue Me session"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onPause}
        style={styles.pauseButton}
      >
        <Pause color={colors.dark.textPrimary.value} size={30} strokeWidth={1.45} />
      </Pressable>

      <ControlButton accessibilityLabel="Haptics on" label="Haptics" onPress={onToggleHaptics}>
        <Vibrate
          color={hapticsEnabled ? colors.dark.textSecondary.value : "rgba(138, 143, 168, 0.42)"}
          size={22}
          strokeWidth={1.45}
        />
      </ControlButton>
    </View>
  );
}

function ControlButton({
  accessibilityLabel,
  children,
  label,
  onPress = () => undefined,
}: {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly label: string;
  readonly onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={styles.controlButton}
    >
      <View style={styles.controlIcon}>{children}</View>
      <Text selectable={false} style={styles.controlLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function CompletionState({
  compact,
  onContinueWithSound = () => undefined,
  onReturnHome = () => undefined,
}: {
  readonly compact: boolean;
  readonly onContinueWithSound?: () => void;
  readonly onReturnHome?: () => void;
}) {
  return (
    <View style={[styles.centeredState, compact && styles.centeredStateCompact]}>
      <MiniOrb />
      <Text accessibilityRole="header" selectable style={styles.completionTitle}>
        That took courage to start.
      </Text>
      <Text selectable style={styles.completionCopy}>
        You completed 5 breath cycles.
      </Text>
      <Pressable
        accessibilityLabel="Continue with a calming sound"
        accessibilityRole="button"
        onPress={onContinueWithSound}
        style={styles.primaryAction}
      >
        <Text selectable={false} style={styles.primaryActionText}>
          Continue with a calming sound
        </Text>
      </Pressable>
      <ReturnHomeButton onPress={onReturnHome} />
    </View>
  );
}

function SoundHandoffState({
  compact,
  state,
}: {
  readonly compact: boolean;
  readonly state: Extract<RescueMeScreenState, "sound-handoff" | "sound-handoff-alt">;
}) {
  return (
    <View
      style={[styles.centeredState, styles.handoffState, compact && styles.centeredStateCompact]}
    >
      <SoundBars variant={state} />
      <Text accessibilityRole="header" selectable style={styles.handoffTitle}>
        Rain is playing
      </Text>
      <Text selectable style={styles.handoffCopy}>
        Works offline. You can stop anytime.
      </Text>
      <Pressable
        accessibilityLabel="Pause Rain sound"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => undefined}
        style={styles.soundPauseButton}
      >
        <Pause color={colors.dark.textPrimary.value} size={28} strokeWidth={1.5} />
      </Pressable>
      <Text selectable={false} style={styles.soundLabel}>
        Rain
      </Text>
      <ReturnHomeButton />
    </View>
  );
}

function MiniOrb() {
  return (
    <View style={styles.miniOrbStage} testID="rescue-me-complete-orb">
      <View style={styles.miniOrbGlow} />
      <View style={styles.miniOrbCore}>
        <Svg height="100%" viewBox="0 0 64 64" width="100%">
          <Defs>
            <LinearGradient id="rescue-mini-orb-gradient" x1="0" x2="1" y1="1" y2="0">
              <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.96" />
              <Stop offset="1" stopColor="#A89CE0" stopOpacity="0.96" />
            </LinearGradient>
          </Defs>
          <Circle cx="32" cy="32" fill="url(#rescue-mini-orb-gradient)" r="32" />
        </Svg>
      </View>
    </View>
  );
}

function SoundBars({
  variant,
}: {
  readonly variant: Extract<RescueMeScreenState, "sound-handoff" | "sound-handoff-alt">;
}) {
  const reduceMotionEnabled = useReduceMotionEnabled();
  const playbackProgress = useRef(new Animated.Value(variant === "sound-handoff" ? 0 : 1)).current;

  useEffect(() => {
    const initialValue = variant === "sound-handoff" ? 0 : 1;
    const oppositeValue = initialValue === 0 ? 1 : 0;

    playbackProgress.setValue(initialValue);

    if (reduceMotionEnabled) {
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(playbackProgress, {
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          toValue: oppositeValue,
          useNativeDriver: true,
        }),
        Animated.timing(playbackProgress, {
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          toValue: initialValue,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [playbackProgress, reduceMotionEnabled, variant]);

  return (
    <View style={styles.soundBarsStage} testID={`rescue-me-${variant}-bars`}>
      <SoundHandoffIconAura />
      <View style={styles.soundBars}>
        {soundBarFrames.map(({ soundHandoff, soundHandoffAlt }, index) => (
          <Animated.View
            key={`sound-bar-${index}`}
            style={[
              styles.soundBar,
              {
                height: soundBarMaxHeight,
                opacity: playbackProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [soundHandoff.opacity, soundHandoffAlt.opacity],
                }),
                transform: [
                  {
                    scaleY: playbackProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        soundHandoff.height / soundBarMaxHeight,
                        soundHandoffAlt.height / soundBarMaxHeight,
                      ],
                    }),
                  },
                ],
              },
            ]}
            testID={`rescue-me-sound-bar-${index}`}
          />
        ))}
      </View>
    </View>
  );
}

const soundBarMaxHeight = 24;
const soundBarFrames = [
  {
    soundHandoff: { height: 24, opacity: 0.92 },
    soundHandoffAlt: { height: 8, opacity: 0.5 },
  },
  {
    soundHandoff: { height: 18, opacity: 0.72 },
    soundHandoffAlt: { height: 14, opacity: 0.68 },
  },
  {
    soundHandoff: { height: 14, opacity: 0.58 },
    soundHandoffAlt: { height: 24, opacity: 0.94 },
  },
] as const;

function SoundHandoffIconAura() {
  return (
    <View pointerEvents="none" style={styles.soundBarsAura} testID="rescue-me-sound-bars-aura">
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 220 174" width="100%">
        <Defs>
          <RadialGradient
            cx="110"
            cy="87"
            fx="110"
            fy="87"
            gradientUnits="userSpaceOnUse"
            id="rescue-sound-bars-aura"
            r="110"
          >
            <Stop offset="0" stopColor="#A89CE0" stopOpacity="0.15" />
            <Stop offset="0.3" stopColor="#7C6FCD" stopOpacity="0.085" />
            <Stop offset="0.62" stopColor="#242A52" stopOpacity="0.035" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#rescue-sound-bars-aura)" height="174" width="220" x="0" y="0" />
      </Svg>
    </View>
  );
}

function ReturnHomeButton({ onPress = () => undefined }: { readonly onPress?: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Return home"
      accessibilityRole="button"
      hitSlop={10}
      onPress={onPress}
      style={styles.returnHomeButton}
    >
      <Text selectable={false} style={styles.returnHomeText}>
        Return home
      </Text>
    </Pressable>
  );
}

function RescueMePauseOverlay({
  onEnd,
  onResume,
}: {
  readonly onEnd: () => void;
  readonly onResume: () => void;
}) {
  return (
    <View style={styles.pauseOverlay} testID="rescue-me-pause-overlay">
      <View pointerEvents="none" style={styles.pauseOverlayGlow} />
      <Text accessibilityRole="header" selectable style={styles.pauseOverlayTitle}>
        Paused
      </Text>
      <Text selectable style={styles.pauseOverlayCopy}>
        You can continue when you’re ready.
      </Text>
      <View style={styles.pauseOverlayActions}>
        <Pressable
          accessibilityLabel="Resume Rescue Me session"
          accessibilityRole="button"
          onPress={onResume}
          style={styles.pauseOverlayPrimaryAction}
        >
          <Play color={colors.dark.textPrimary.value} size={18} strokeWidth={1.7} />
          <Text selectable={false} style={styles.pauseOverlayPrimaryText}>
            Resume
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel="End Rescue Me for now"
          accessibilityRole="button"
          onPress={onEnd}
          style={styles.pauseOverlaySecondaryAction}
        >
          <Text selectable={false} style={styles.pauseOverlaySecondaryText}>
            End for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createRescueMeController({
  localInstallId,
  sessionId,
  startedAtMs,
}: {
  readonly localInstallId: string;
  readonly sessionId: string;
  readonly startedAtMs: number;
}): RescueMeController {
  return createBreathSessionController({
    localInstallId,
    sessionId,
    source: "rescue_me",
    startedAtMs,
    targetBreathCycles: rescueMeBreathCycles,
    techniqueId: rescueMeTechniqueId,
    totalDurationSeconds: rescueMeDurationSeconds,
  }) as RescueMeController;
}

function createRescueMeDraftRecord(
  controller: RescueMeController,
  snapshot: BreathSessionSnapshot,
): RecoverableBreathSessionDraft {
  return {
    audioCueModeId: rescueMeAudioCueModeId,
    completedBreathCycles: snapshot.completedBreathCycles,
    currentPhaseName: snapshot.phaseName,
    durationSeconds: rescueMeDurationSeconds,
    elapsedDurationMs: snapshot.elapsedDurationMs,
    localInstallId: controller.localInstallId,
    remainingDurationMs: snapshot.remainingDurationMs,
    sessionId: controller.sessionId,
    source: "rescue_me",
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "draft",
    techniqueId: rescueMeTechniqueId,
    updatedAt: new Date(snapshot.observedAtMs).toISOString(),
  };
}

function getRuntimeActiveStateConfig(snapshot: BreathSessionSnapshot): ActiveStateConfig {
  const phase = getPhaseLabel(snapshot.phaseName);
  const phaseProgress = Math.max(0, Math.min(1, snapshot.phaseProgress));
  const inhaleCoreSize = 132 + 30 * phaseProgress;
  const exhaleCoreSize = 162 - 30 * phaseProgress;
  const inhaleGlowScale = 0.86 + 0.14 * phaseProgress;
  const exhaleGlowScale = 1 - 0.08 * phaseProgress;

  return {
    accessibilityLabel: `${phase} breathing phase`,
    coreSize:
      snapshot.phaseName === "hold"
        ? 162
        : snapshot.phaseName === "exhale"
          ? exhaleCoreSize
          : inhaleCoreSize,
    glowScale:
      snapshot.phaseName === "hold"
        ? 1
        : snapshot.phaseName === "exhale"
          ? exhaleGlowScale
          : inhaleGlowScale,
    phase,
    showReassurance:
      snapshot.completedBreathCycles >= 2 && snapshot.status === "active" && !snapshot.isPaused,
    timer: formatRemainingTime(snapshot.remainingSeconds),
    timerOffset: snapshot.phaseName === "hold" ? 50 : snapshot.phaseName === "exhale" ? 48 : 58,
  };
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

function formatRemainingTime(remainingSeconds: number) {
  const boundedSeconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(boundedSeconds / 60);
  const seconds = boundedSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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

const styles = StyleSheet.create({
  activeMain: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  centeredState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 56,
  },
  centeredStateCompact: {
    transform: [{ translateY: -18 }],
  },
  completionCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  completionTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 19,
    letterSpacing: 0,
    lineHeight: 27,
    marginTop: 54,
    textAlign: "center",
  },
  controlButton: {
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    minWidth: 44,
    width: 64,
  },
  controlIcon: {
    alignItems: "center",
    backgroundColor: "rgba(20, 23, 43, 0.6)",
    borderColor: "rgba(238, 240, 255, 0.06)",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  controlLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 14,
    textAlign: "center",
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    gap: 38,
    justifyContent: "center",
    minHeight: 160,
    paddingBottom: 30,
    paddingHorizontal: 28,
  },
  handoffCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 20,
    marginTop: 12,
    textAlign: "center",
  },
  handoffState: {
    justifyContent: "center",
  },
  handoffTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 28,
    marginTop: 54,
    textAlign: "center",
  },
  innerGlow: {
    backgroundColor: "rgba(168, 156, 224, 0.18)",
    boxShadow: "0 0 34px rgba(168, 156, 224, 0.22)",
    position: "absolute",
  },
  midGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.12)",
    boxShadow: "0 0 54px rgba(124, 111, 205, 0.24)",
    position: "absolute",
  },
  miniOrbCore: {
    borderRadius: 32,
    height: 64,
    overflow: "hidden",
    width: 64,
  },
  miniOrbGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.16)",
    borderRadius: 90,
    boxShadow: "0 0 42px rgba(124, 111, 205, 0.36)",
    height: 180,
    position: "absolute",
    width: 180,
  },
  miniOrbStage: {
    alignItems: "center",
    height: 116,
    justifyContent: "center",
    width: 180,
  },
  orbCore: {
    alignItems: "center",
    boxShadow: "0 0 44px rgba(124, 111, 205, 0.4)",
    justifyContent: "center",
    overflow: "hidden",
  },
  orbStage: {
    alignItems: "center",
    height: 300,
    justifyContent: "center",
    width: 300,
  },
  outerGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.04)",
    borderColor: "rgba(124, 111, 205, 0.16)",
    borderWidth: 1,
    boxShadow: "0 0 72px rgba(124, 111, 205, 0.18)",
    position: "absolute",
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 32, 64, 0.64)",
    borderColor: "rgba(124, 111, 205, 0.28)",
    borderRadius: 34,
    borderWidth: 1,
    boxShadow: "0 0 24px rgba(124, 111, 205, 0.1)",
    height: 68,
    justifyContent: "center",
    marginTop: -16,
    minHeight: 44,
    minWidth: 44,
    width: 68,
  },
  phaseLabel: {
    color: "rgba(238, 240, 255, 0.9)",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 22,
    position: "absolute",
    textAlign: "center",
  },
  primaryAction: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: colors.dark.primary.value,
    borderRadius: 13,
    justifyContent: "center",
    marginTop: 46,
    minHeight: 44,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
  },
  pulseRing: {
    borderColor: "rgba(168, 156, 224, 0.42)",
    borderWidth: 1.2,
    opacity: 0.22,
    position: "absolute",
  },
  pauseOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(13, 15, 26, 0.94)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 42,
    position: "absolute",
    right: 0,
    top: 0,
  },
  pauseOverlayActions: {
    alignItems: "center",
    gap: 18,
    marginTop: 42,
    width: "100%",
  },
  pauseOverlayCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  pauseOverlayGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.13)",
    borderRadius: 120,
    boxShadow: "0 0 80px rgba(124, 111, 205, 0.3)",
    height: 180,
    position: "absolute",
    top: "34%",
    width: 180,
  },
  pauseOverlayPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.dark.primary.value,
    borderRadius: 13,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 180,
    paddingHorizontal: 20,
  },
  pauseOverlayPrimaryText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
  },
  pauseOverlaySecondaryAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 140,
    paddingHorizontal: 12,
  },
  pauseOverlaySecondaryText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
  },
  pauseOverlayTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 22,
    letterSpacing: 0,
    lineHeight: 30,
    textAlign: "center",
  },
  reassurance: {
    alignSelf: "center",
    backgroundColor: undefined,
    bottom: 194,
    color: "rgba(138, 143, 168, 0.78)",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 18,
    paddingHorizontal: 32,
    position: "absolute",
    textAlign: "center",
  },
  returnHomeButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: 12,
  },
  returnHomeText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: "center",
  },
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
    overflow: "hidden",
  },
  soundBar: {
    backgroundColor: colors.dark.primaryGlow.value,
    borderRadius: 9999,
    width: 4,
  },
  soundBars: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    height: 30,
    justifyContent: "center",
  },
  soundBarsAura: {
    height: 174,
    position: "absolute",
    width: 220,
  },
  soundBarsStage: {
    alignItems: "center",
    height: 112,
    justifyContent: "center",
    width: 220,
  },
  soundLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 14,
    marginTop: 10,
    textAlign: "center",
  },
  soundPauseButton: {
    alignItems: "center",
    backgroundColor: "rgba(28, 32, 64, 0.64)",
    borderColor: "rgba(124, 111, 205, 0.34)",
    borderRadius: 25,
    borderWidth: 1,
    boxShadow: "0 0 24px rgba(124, 111, 205, 0.12)",
    height: 50,
    justifyContent: "center",
    marginTop: 58,
    minHeight: 44,
    minWidth: 44,
    width: 50,
  },
  timer: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    letterSpacing: 3,
    lineHeight: 24,
    opacity: 0.8,
    textAlign: "center",
  },
});
