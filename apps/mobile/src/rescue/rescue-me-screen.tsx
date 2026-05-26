import type {
  AbandonedBreathSessionRecord,
  BreathSessionStartedRecord,
  CompletedBreathSessionRecord,
  RecoverableBreathSessionDraft,
} from "@nidoru/validation";
import { getNoHoldFallbackTechniqueId, type BreathTechniqueId } from "@nidoru/domain";
import { StatusBar } from "expo-status-bar";
import { Bell, Pause, Play, Vibrate } from "lucide-react-native";
import type { ReactNode } from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, AppState, Easing, useWindowDimensions } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { Pressable, ReactNativeAnimatedView, Text, View, cn } from "../tw";
import {
  useReduceMotionEnabled,
  useReduceMotionPreference,
} from "../motion/use-reduce-motion-enabled";
import {
  createRescueMeSoundHandoffAudioController,
  type RescueMeSoundHandoffAudioController,
} from "../audio/rescue-me-sound-handoff-audio";
import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";
import { recordRescueMeOrbVisible } from "./rescue-me-launch-performance";
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
import { breathHoldSafetyGuidance } from "../session/breath-hold-safety-guidance";

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
type RescueMeAnalyticsEventName = "rescue_me_started" | "rescue_me_completed";

type RescueMeActiveSessionScreenProps = {
  readonly disableHaptics?: boolean;
  readonly hasExistingLocalRecord?: boolean;
  readonly initialCompletionMode?: RescueMeCompletionMode;
  readonly initialDurationSeconds?: number;
  readonly initialTechniqueId?: BreathTechniqueId;
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
  readonly targetBreathCycles?: typeof rescueMeBreathCycles;
  readonly techniqueId: BreathTechniqueId;
  readonly totalDurationSeconds: number;
}>;

const rescueMeTechniqueId = "4-7-8-sleep";
const rescueMeNoHoldTechniqueId =
  getNoHoldFallbackTechniqueId(rescueMeTechniqueId) ?? "diaphragmatic-breathing";
const rescueMeDurationSeconds = 209;
const rescueMeNoHoldDurationSeconds = 180;
const rescueMeBreathCycles = 5;
const rescueMeTickIntervalMs = 1000;
const rescueMeDraftPersistIntervalMs = 15000;
const rescueMeFinalDraftWindowMs = 10000;
const rescueMeAudioCueModeId = "gentle-bell";
const rescueMeIconColor = {
  primary: "#EEF0FF",
  secondary: "#8A8FA8",
  secondaryDim: "rgba(138, 143, 168, 0.42)",
} as const;

const rescueMeClassNames = {
  activeMain: "flex-1 items-center justify-center",
  centeredState: "flex-1 items-center justify-center px-14",
  centeredStateCompact: "-translate-y-[18px]",
  completionCopy:
    "mt-3 text-center font-nidoru-primary-regular text-[15px] leading-[22px] tracking-normal text-[#8A8FA8]",
  completionTitle:
    "mt-[54px] text-center font-nidoru-primary-semibold text-[19px] leading-[27px] tracking-normal text-[#EEF0FF]",
  controlButton:
    "min-h-[44px] min-w-[44px] w-16 items-center gap-2.5 active:scale-[0.96] transition-transform duration-200",
  controlIcon:
    "h-12 w-12 items-center justify-center rounded-full border border-[#EEF0FF]/[0.06] bg-[#14172B]/60",
  controlLabel:
    "text-center font-nidoru-primary-regular text-[11px] leading-[14px] tracking-normal text-[#8A8FA8]",
  controls: "min-h-[160px] flex-row items-center justify-center gap-[38px] px-7 pb-[30px]",
  handoffCopy:
    "mt-3 text-center font-nidoru-primary-regular text-[13px] leading-5 tracking-normal text-[#8A8FA8]",
  handoffTitle:
    "mt-[54px] text-center font-nidoru-primary-semibold text-xl leading-7 tracking-normal text-[#EEF0FF]",
  innerGlow: "absolute bg-[#A89CE0]/[0.18] shadow-[0_0_34px_rgba(168,156,224,0.22)]",
  midGlow: "absolute bg-[#7C6FCD]/[0.12] shadow-[0_0_54px_rgba(124,111,205,0.24)]",
  miniOrbCore: "h-16 w-16 overflow-hidden rounded-full",
  miniOrbGlow:
    "absolute h-[180px] w-[180px] rounded-full bg-[#7C6FCD]/[0.16] shadow-[0_0_42px_rgba(124,111,205,0.36)]",
  miniOrbStage: "h-[116px] w-[180px] items-center justify-center",
  orbCore: "items-center justify-center overflow-hidden shadow-[0_0_44px_rgba(124,111,205,0.4)]",
  orbStage: "h-[300px] w-[300px] items-center justify-center",
  outerGlow:
    "absolute border border-[#7C6FCD]/[0.16] bg-[#7C6FCD]/[0.04] shadow-[0_0_72px_rgba(124,111,205,0.18)]",
  pauseButton:
    "-mt-4 h-[68px] w-[68px] min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#7C6FCD]/[0.28] bg-[#1C2040]/[0.64] shadow-[0_0_24px_rgba(124,111,205,0.1)] active:scale-[0.96] transition-transform duration-200",
  phaseLabel:
    "absolute text-center font-nidoru-primary-semibold text-[16px] leading-[22px] tracking-[0.2px] text-[#EEF0FF]/90",
  primaryAction:
    "mt-[46px] min-h-[44px] self-stretch items-center justify-center rounded-[13px] bg-[#7C6FCD] px-[18px] py-3 active:scale-[0.96] transition-transform duration-200",
  primaryActionText:
    "text-center font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-normal text-[#EEF0FF]",
  pulseRing: "absolute border-[1.2px] border-[#A89CE0]/[0.42] opacity-[0.22]",
  pauseOverlay: "absolute inset-0 z-40 items-center justify-center bg-[#0D0F1A]/[0.94] px-[42px]",
  pauseOverlayActions: "mt-[42px] w-full items-center gap-[18px]",
  pauseOverlayCopy:
    "mt-3 text-center font-nidoru-primary-regular text-[15px] leading-[22px] tracking-normal text-[#8A8FA8]",
  pauseOverlaySafetyCopy:
    "mt-4 max-w-[292px] text-center font-nidoru-primary-regular text-[12px] leading-[18px] tracking-normal text-[#8A8FA8]/80",
  pauseOverlayGlow:
    "pointer-events-none absolute top-[34%] h-[180px] w-[180px] rounded-full bg-[#7C6FCD]/[0.13] shadow-[0_0_80px_rgba(124,111,205,0.3)]",
  pauseOverlayPrimaryAction:
    "min-h-12 min-w-[180px] flex-row items-center justify-center gap-2 rounded-[13px] bg-[#7C6FCD] px-5 active:scale-[0.96] transition-transform duration-200",
  pauseOverlayPrimaryText:
    "text-center font-nidoru-primary-semibold text-sm leading-[18px] tracking-normal text-[#EEF0FF]",
  pauseOverlayFallbackAction:
    "min-h-[44px] min-w-[190px] items-center justify-center rounded-[13px] border border-[#7C6FCD]/25 px-4 active:scale-[0.98] transition-transform duration-200",
  pauseOverlayFallbackText:
    "text-center font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-normal text-[#EEF0FF]/90",
  pauseOverlaySecondaryAction:
    "min-h-[44px] min-w-[140px] items-center justify-center px-3 active:scale-[0.98] transition-transform duration-200",
  pauseOverlaySecondaryText:
    "text-center font-nidoru-primary-regular text-[13px] leading-[18px] tracking-normal text-[#8A8FA8]",
  pauseOverlayTitle:
    "text-center font-nidoru-primary-semibold text-[22px] leading-[30px] tracking-normal text-[#EEF0FF]",
  reassurance:
    "absolute bottom-[194px] self-center px-8 text-center font-nidoru-primary-regular text-[12px] leading-[18px] tracking-normal text-[rgba(138,143,168,0.78)]",
  returnHomeButton:
    "mt-6 min-h-[44px] min-w-[120px] items-center justify-center px-3 active:scale-[0.98] transition-transform duration-200",
  returnHomeText:
    "text-center font-nidoru-primary-regular text-[13px] leading-[18px] tracking-normal text-[#8A8FA8]",
  screen: "flex-1 overflow-hidden bg-[#0D0F1A]",
  soundBar: "w-1 rounded-full bg-[#A89CE0]",
  soundBars: "h-[30px] flex-row items-center justify-center gap-[5px]",
  soundBarsAura: "absolute h-[174px] w-[220px]",
  soundBarsStage: "h-28 w-[220px] items-center justify-center",
  soundLabel:
    "mt-2.5 text-center font-nidoru-primary-regular text-[11px] leading-[14px] tracking-normal text-[#8A8FA8]",
  soundPauseButton:
    "mt-[58px] h-[50px] w-[50px] min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#7C6FCD]/[0.34] bg-[#1C2040]/[0.64] shadow-[0_0_24px_rgba(124,111,205,0.12)] active:scale-[0.96] transition-transform duration-200",
  sessionModeLabel:
    "mt-3 text-center font-nidoru-primary-semibold text-[12px] leading-[16px] tracking-normal text-[#A89CE0]/85",
  timer:
    "text-center font-nidoru-data-regular text-[17px] leading-6 tracking-[3px] text-[#8A8FA8]/80 tabular-nums",
} as const;

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

export function RescueMeScreen({
  onReturnHome = () => undefined,
  state,
}: {
  readonly onReturnHome?: () => void;
  readonly state: RescueMeScreenState;
}) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const { height } = useWindowDimensions();
  const isCompactHeight = height < 760;
  const hasRecordedOrbVisibleRef = useRef(false);
  const recordOrbVisibleOnce = useCallback(() => {
    if (hasRecordedOrbVisibleRef.current) {
      return;
    }

    hasRecordedOrbVisibleRef.current = true;
    recordRescueMeOrbVisible();
  }, []);
  const rootStyle = {
    paddingBottom: Math.max(safeAreaInsets.bottom, 0),
    paddingTop: Math.max(safeAreaInsets.top, 0),
  };

  return (
    <View
      className={rescueMeClassNames.screen}
      style={rootStyle}
      testID={`rescue-me-screen-${state}`}
    >
      <StatusBar hidden />
      <RescueMeBackground
        variant={state === "sound-handoff" || state === "sound-handoff-alt" ? "sound" : "standard"}
      />
      {state === "complete" ? (
        <CompletionState compact={isCompactHeight} onReturnHome={onReturnHome} />
      ) : state === "sound-handoff" || state === "sound-handoff-alt" ? (
        <SoundHandoffState compact={isCompactHeight} onReturnHome={onReturnHome} state={state} />
      ) : (
        <ActiveSessionState
          compact={isCompactHeight}
          onOrbLayout={recordOrbVisibleOnce}
          state={state}
        />
      )}
    </View>
  );
}

export function RescueMeActiveSessionScreen({
  disableHaptics = false,
  hasExistingLocalRecord = false,
  initialCompletionMode,
  initialDurationSeconds,
  initialTechniqueId,
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
  const initialRescueMeTechniqueId = normalizeRescueMeTechniqueId(initialTechniqueId);
  const initialRescueMeDurationSeconds = normalizeRescueMeDurationSeconds(
    initialDurationSeconds,
    initialRescueMeTechniqueId,
  );
  const controllerRef = useRef<RescueMeController>(
    createRescueMeController({
      durationSeconds: initialRescueMeDurationSeconds,
      localInstallId,
      sessionId,
      startedAtMs,
      techniqueId: initialRescueMeTechniqueId,
    }),
  );
  const [controller, setController] = useState(controllerRef.current);
  const [snapshot, setSnapshot] = useState(() =>
    getBreathSessionSnapshot(controllerRef.current, startedAtMs),
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [completionMode, setCompletionMode] =
    useState<RescueMeCompletionMode>(initialCompletionMode);
  const hasPersistedSessionStartRef = useRef(
    Boolean(initialCompletionMode) || hasExistingLocalRecord,
  );
  const hasPersistedFinalDraftRef = useRef(false);
  const isPersistingTerminalStateRef = useRef(false);
  const lastDraftPersistedAtMs = useRef<number | undefined>(undefined);
  const startPersistenceRef = useRef<Promise<void>>(Promise.resolve());
  const hasRecordedOrbVisibleRef = useRef(false);
  const recordOrbVisibleOnce = useCallback(() => {
    if (hasRecordedOrbVisibleRef.current) {
      return;
    }

    hasRecordedOrbVisibleRef.current = true;
    recordRescueMeOrbVisible();
  }, []);

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
    captureRescueMeAnalyticsEvent("rescue_me_started");
    const currentController = controllerRef.current;

    startPersistenceRef.current = persistBreathSessionStarted({
      audioCueModeId: rescueMeAudioCueModeId,
      currentPhaseName: snapshot.phaseName,
      durationSeconds: currentController.totalDurationSeconds,
      localInstallId,
      sessionId,
      source: "rescue_me",
      startedAt: new Date(currentController.startedAtMs).toISOString(),
      status: "started",
      techniqueId: currentController.techniqueId,
    })
      .then(() => undefined)
      .catch(() => undefined);
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
        captureRescueMeAnalyticsEvent("rescue_me_completed");
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

  const switchToNoHoldFallback = () => {
    if (controllerRef.current.techniqueId === rescueMeNoHoldTechniqueId) {
      return;
    }

    const observedAtMs = Date.now();
    const fallbackController = createRescueMeController({
      durationSeconds: rescueMeNoHoldDurationSeconds,
      localInstallId,
      sessionId,
      startedAtMs: observedAtMs,
      techniqueId: rescueMeNoHoldTechniqueId,
    });
    const nextSnapshot = getBreathSessionSnapshot(fallbackController, observedAtMs);

    controllerRef.current = fallbackController;
    lastDraftPersistedAtMs.current = undefined;
    hasPersistedFinalDraftRef.current = false;
    setController(fallbackController);
    setSnapshot(nextSnapshot);
    void startPersistenceRef.current.finally(() => persistDraftForSnapshot(nextSnapshot));
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

  const rootStyle = {
    paddingBottom: Math.max(safeAreaInsets.bottom, 0),
    paddingTop: Math.max(safeAreaInsets.top, 0),
  };

  return (
    <View
      className={rescueMeClassNames.screen}
      style={rootStyle}
      testID="rescue-me-active-session-screen"
    >
      <StatusBar hidden />
      <RescueMeBackground variant="standard" />
      {completionMode === "completed" ? (
        <CompletionState
          compact={isCompactHeight}
          completedCycleCount={snapshot.completedBreathCycles || rescueMeBreathCycles}
          isNoHoldFallback={controller.techniqueId === rescueMeNoHoldTechniqueId}
          onContinueWithSound={onContinueWithSound}
          onReturnHome={onReturnHome}
        />
      ) : (
        <>
          <ActiveSessionRuntimeState
            compact={isCompactHeight}
            hapticsEnabled={hapticsEnabled}
            isNoHoldFallback={controller.techniqueId === rescueMeNoHoldTechniqueId}
            onPause={pauseSession}
            onToggleHaptics={() => {
              if (!disableHaptics) {
                setHapticsEnabled((enabled) => !enabled);
              }
            }}
            onOrbLayout={recordOrbVisibleOnce}
            reduceMotionEnabled={reduceMotionEnabled}
            snapshot={snapshot}
          />
          {snapshot.isPaused ? (
            <RescueMePauseOverlay
              onEnd={endSessionEarly}
              onResume={resumeSession}
              onUseNoHoldFallback={
                controller.techniqueId === rescueMeNoHoldTechniqueId
                  ? undefined
                  : switchToNoHoldFallback
              }
            />
          ) : null}
        </>
      )}
    </View>
  );
}

function RescueMeBackground({ variant }: { readonly variant: "standard" | "sound" }) {
  const isSoundHandoff = variant === "sound";

  return (
    <View className="absolute inset-0" pointerEvents="none" testID="rescue-me-background">
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
  onOrbLayout,
  state,
}: {
  readonly compact: boolean;
  readonly onOrbLayout?: (() => void) | undefined;
  readonly state: ActiveState;
}) {
  const config = activeStateConfig[state];
  const orbLift = compact ? -30 : -18;

  return (
    <>
      <View
        className={rescueMeClassNames.activeMain}
        style={{ transform: [{ translateY: orbLift }] }}
      >
        <BreathingOrb
          accessibilityLabel={config.accessibilityLabel}
          coreSize={config.coreSize}
          glowScale={config.glowScale}
          onLayout={onOrbLayout}
          phase={config.phase}
        />
        <Text
          accessibilityLabel={`Time remaining ${config.timer}`}
          className={rescueMeClassNames.timer}
          selectable
          style={{ marginTop: config.timerOffset }}
        >
          {config.timer}
        </Text>
      </View>

      {config.showReassurance ? (
        <Text className={rescueMeClassNames.reassurance} selectable>
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
  isNoHoldFallback,
  onPause,
  onOrbLayout,
  onToggleHaptics,
  reduceMotionEnabled,
  snapshot,
}: {
  readonly compact: boolean;
  readonly hapticsEnabled: boolean;
  readonly isNoHoldFallback: boolean;
  readonly onPause: () => void;
  readonly onOrbLayout?: (() => void) | undefined;
  readonly onToggleHaptics: () => void;
  readonly reduceMotionEnabled: boolean;
  readonly snapshot: BreathSessionSnapshot;
}) {
  const config = getRuntimeActiveStateConfig(snapshot);
  const orbLift = compact ? -30 : -18;

  return (
    <>
      <View
        className={rescueMeClassNames.activeMain}
        style={{ transform: [{ translateY: orbLift }] }}
      >
        <BreathingOrb
          accessibilityLabel={config.accessibilityLabel}
          coreSize={config.coreSize}
          glowScale={config.glowScale}
          onLayout={onOrbLayout}
          phase={config.phase}
          reduceMotionEnabled={reduceMotionEnabled}
        />
        <Text
          accessibilityLabel={`Time remaining ${formatAccessibleRemainingTime(
            snapshot.remainingSeconds,
          )}`}
          className={rescueMeClassNames.timer}
          selectable
          style={{ marginTop: config.timerOffset }}
        >
          {formatRemainingTime(snapshot.remainingSeconds)}
        </Text>
        {isNoHoldFallback ? (
          <Text className={rescueMeClassNames.sessionModeLabel} selectable>
            No-hold breathing
          </Text>
        ) : null}
      </View>

      {config.showReassurance ? (
        <Text className={rescueMeClassNames.reassurance} selectable>
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
  onLayout,
  phase,
  reduceMotionEnabled = false,
}: {
  readonly accessibilityLabel: string;
  readonly coreSize: number;
  readonly glowScale: number;
  readonly onLayout?: (() => void) | undefined;
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
      className={rescueMeClassNames.orbStage}
      onLayout={onLayout}
      testID="rescue-me-orb"
    >
      {reduceMotionEnabled ? null : (
        <View
          className={rescueMeClassNames.outerGlow}
          pointerEvents="none"
          style={{
            borderRadius: outerSize / 2,
            height: outerSize,
            width: outerSize,
          }}
          testID="rescue-me-orb-outer-glow"
        />
      )}
      <View
        className={rescueMeClassNames.midGlow}
        pointerEvents="none"
        style={{
          borderRadius: midSize / 2,
          height: midSize,
          width: midSize,
        }}
        testID="rescue-me-orb-mid-glow"
      />
      <View
        className={rescueMeClassNames.innerGlow}
        pointerEvents="none"
        style={{
          borderRadius: innerSize / 2,
          height: innerSize,
          width: innerSize,
        }}
        testID="rescue-me-orb-inner-glow"
      />
      {reduceMotionEnabled ? null : (
        <View
          className={rescueMeClassNames.pulseRing}
          pointerEvents="none"
          style={{
            borderRadius: coreSize * 0.68,
            height: coreSize * 1.36,
            width: coreSize * 1.36,
          }}
          testID="rescue-me-orb-pulse-ring"
        />
      )}
      <View
        className={rescueMeClassNames.orbCore}
        style={{
          borderRadius: coreSize / 2,
          height: coreSize,
          width: coreSize,
        }}
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
        <Text className={rescueMeClassNames.phaseLabel} selectable={false}>
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
    <View className={rescueMeClassNames.controls} testID="rescue-me-controls">
      <ControlButton accessibilityLabel="Audio cue: Bell" label="Bell">
        <Bell color={rescueMeIconColor.secondary} size={22} strokeWidth={1.5} />
      </ControlButton>

      <Pressable
        accessibilityHint="Pauses this Rescue Me session."
        accessibilityLabel="Pause Rescue Me session"
        accessibilityRole="button"
        className={rescueMeClassNames.pauseButton}
        hitSlop={8}
        onPress={onPause}
      >
        <Pause color={rescueMeIconColor.primary} size={30} strokeWidth={1.45} />
      </Pressable>

      <ControlButton accessibilityLabel="Haptics on" label="Haptics" onPress={onToggleHaptics}>
        <Vibrate
          color={hapticsEnabled ? rescueMeIconColor.secondary : rescueMeIconColor.secondaryDim}
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
      className={rescueMeClassNames.controlButton}
      hitSlop={8}
      onPress={onPress}
    >
      <View className={rescueMeClassNames.controlIcon}>{children}</View>
      <Text className={rescueMeClassNames.controlLabel} selectable={false}>
        {label}
      </Text>
    </Pressable>
  );
}

function CompletionState({
  compact,
  completedCycleCount = rescueMeBreathCycles,
  isNoHoldFallback = false,
  onContinueWithSound = () => undefined,
  onReturnHome = () => undefined,
}: {
  readonly compact: boolean;
  readonly completedCycleCount?: number;
  readonly isNoHoldFallback?: boolean;
  readonly onContinueWithSound?: () => void;
  readonly onReturnHome?: () => void;
}) {
  const title = isNoHoldFallback ? "No-hold breathing complete." : "That took courage to start.";
  const copy = isNoHoldFallback
    ? `You completed ${completedCycleCount} no-hold breath cycles.`
    : "You completed 5 breath cycles.";

  return (
    <View
      className={cn(
        rescueMeClassNames.centeredState,
        compact ? rescueMeClassNames.centeredStateCompact : null,
      )}
    >
      <MiniOrb />
      <Text accessibilityRole="header" className={rescueMeClassNames.completionTitle} selectable>
        {title}
      </Text>
      <Text className={rescueMeClassNames.completionCopy} selectable>
        {copy}
      </Text>
      <Pressable
        accessibilityLabel="Continue with a calming sound"
        accessibilityRole="button"
        className={rescueMeClassNames.primaryAction}
        onPress={onContinueWithSound}
      >
        <Text className={rescueMeClassNames.primaryActionText} selectable={false}>
          Continue with a calming sound
        </Text>
      </Pressable>
      <ReturnHomeButton onPress={onReturnHome} />
    </View>
  );
}

function SoundHandoffState({
  compact,
  onReturnHome = () => undefined,
  state,
}: {
  readonly compact: boolean;
  readonly onReturnHome?: () => void;
  readonly state: Extract<RescueMeScreenState, "sound-handoff" | "sound-handoff-alt">;
}) {
  const audioControllerRef = useRef<RescueMeSoundHandoffAudioController | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const audioController = createRescueMeSoundHandoffAudioController();
    audioControllerRef.current = audioController;
    void audioController.start().catch(() => undefined);

    return () => {
      audioControllerRef.current?.release();
      audioControllerRef.current = undefined;
    };
  }, []);

  const togglePlayback = useCallback(() => {
    const audioController = audioControllerRef.current;

    if (isPlaying) {
      setIsPlaying(false);
      void audioController?.pause().catch(() => undefined);
      return;
    }

    setIsPlaying(true);
    void audioController?.resume().catch(() => undefined);
  }, [isPlaying]);

  return (
    <View
      className={cn(
        rescueMeClassNames.centeredState,
        compact ? rescueMeClassNames.centeredStateCompact : null,
      )}
    >
      <SoundBars variant={state} />
      <Text accessibilityRole="header" className={rescueMeClassNames.handoffTitle} selectable>
        Rain is playing
      </Text>
      <Text className={rescueMeClassNames.handoffCopy} selectable>
        Works offline. You can stop anytime.
      </Text>
      <Pressable
        accessibilityLabel={isPlaying ? "Pause Rain sound" : "Resume Rain sound"}
        accessibilityRole="button"
        className={rescueMeClassNames.soundPauseButton}
        hitSlop={10}
        onPress={togglePlayback}
      >
        {isPlaying ? (
          <Pause color={rescueMeIconColor.primary} size={28} strokeWidth={1.5} />
        ) : (
          <Play color={rescueMeIconColor.primary} size={24} strokeWidth={1.5} />
        )}
      </Pressable>
      <Text className={rescueMeClassNames.soundLabel} selectable={false}>
        Rain
      </Text>
      <ReturnHomeButton onPress={onReturnHome} />
    </View>
  );
}

function MiniOrb() {
  return (
    <View className={rescueMeClassNames.miniOrbStage} testID="rescue-me-complete-orb">
      <View className={rescueMeClassNames.miniOrbGlow} />
      <View className={rescueMeClassNames.miniOrbCore}>
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
    <View className={rescueMeClassNames.soundBarsStage} testID={`rescue-me-${variant}-bars`}>
      <SoundHandoffIconAura />
      <View className={rescueMeClassNames.soundBars}>
        {soundBarFrames.map(({ soundHandoff, soundHandoffAlt }, index) => (
          <ReactNativeAnimatedView
            className={rescueMeClassNames.soundBar}
            key={`sound-bar-${index}`}
            style={{
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
            }}
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
    <View
      className={rescueMeClassNames.soundBarsAura}
      pointerEvents="none"
      testID="rescue-me-sound-bars-aura"
    >
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
      className={rescueMeClassNames.returnHomeButton}
      hitSlop={10}
      onPress={onPress}
    >
      <Text className={rescueMeClassNames.returnHomeText} selectable={false}>
        Return home
      </Text>
    </Pressable>
  );
}

function RescueMePauseOverlay({
  onEnd,
  onResume,
  onUseNoHoldFallback,
}: {
  readonly onEnd: () => void;
  readonly onResume: () => void;
  readonly onUseNoHoldFallback?: (() => void) | undefined;
}) {
  return (
    <View className={rescueMeClassNames.pauseOverlay} testID="rescue-me-pause-overlay">
      <View className={rescueMeClassNames.pauseOverlayGlow} pointerEvents="none" />
      <Text accessibilityRole="header" className={rescueMeClassNames.pauseOverlayTitle} selectable>
        Paused
      </Text>
      <Text className={rescueMeClassNames.pauseOverlayCopy} selectable>
        You can continue when you’re ready.
      </Text>
      <Text className={rescueMeClassNames.pauseOverlaySafetyCopy} selectable>
        {breathHoldSafetyGuidance}
      </Text>
      <View className={rescueMeClassNames.pauseOverlayActions}>
        <Pressable
          accessibilityLabel="Resume Rescue Me session"
          accessibilityRole="button"
          className={rescueMeClassNames.pauseOverlayPrimaryAction}
          onPress={onResume}
        >
          <Play color={rescueMeIconColor.primary} size={18} strokeWidth={1.7} />
          <Text className={rescueMeClassNames.pauseOverlayPrimaryText} selectable={false}>
            Resume
          </Text>
        </Pressable>
        {onUseNoHoldFallback ? (
          <Pressable
            accessibilityLabel="Switch to no-hold breathing"
            accessibilityRole="button"
            className={rescueMeClassNames.pauseOverlayFallbackAction}
            onPress={onUseNoHoldFallback}
          >
            <Text className={rescueMeClassNames.pauseOverlayFallbackText} selectable={false}>
              Switch to no-hold breathing
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="End Rescue Me for now"
          accessibilityRole="button"
          className={rescueMeClassNames.pauseOverlaySecondaryAction}
          onPress={onEnd}
        >
          <Text className={rescueMeClassNames.pauseOverlaySecondaryText} selectable={false}>
            End for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createRescueMeController({
  durationSeconds = rescueMeDurationSeconds,
  localInstallId,
  sessionId,
  startedAtMs,
  techniqueId = rescueMeTechniqueId,
}: {
  readonly durationSeconds?: number;
  readonly localInstallId: string;
  readonly sessionId: string;
  readonly startedAtMs: number;
  readonly techniqueId?: BreathTechniqueId;
}): RescueMeController {
  const targetBreathCycles =
    techniqueId === rescueMeTechniqueId ? rescueMeBreathCycles : undefined;

  return createBreathSessionController({
    localInstallId,
    sessionId,
    source: "rescue_me",
    startedAtMs,
    ...(targetBreathCycles === undefined ? {} : { targetBreathCycles }),
    techniqueId,
    totalDurationSeconds: durationSeconds,
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
    durationSeconds: controller.totalDurationSeconds,
    elapsedDurationMs: snapshot.elapsedDurationMs,
    localInstallId: controller.localInstallId,
    remainingDurationMs: snapshot.remainingDurationMs,
    sessionId: controller.sessionId,
    source: "rescue_me",
    startedAt: new Date(controller.startedAtMs).toISOString(),
    status: "draft",
    techniqueId: controller.techniqueId,
    updatedAt: new Date(snapshot.observedAtMs).toISOString(),
  };
}

function normalizeRescueMeTechniqueId(
  techniqueId: BreathTechniqueId | undefined,
): BreathTechniqueId {
  return techniqueId === rescueMeNoHoldTechniqueId
    ? rescueMeNoHoldTechniqueId
    : rescueMeTechniqueId;
}

function normalizeRescueMeDurationSeconds(
  durationSeconds: number | undefined,
  techniqueId: BreathTechniqueId,
): number {
  if (
    typeof durationSeconds === "number" &&
    Number.isInteger(durationSeconds) &&
    durationSeconds > 0
  ) {
    return durationSeconds;
  }

  return techniqueId === rescueMeNoHoldTechniqueId
    ? rescueMeNoHoldDurationSeconds
    : rescueMeDurationSeconds;
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

function captureRescueMeAnalyticsEvent(eventName: RescueMeAnalyticsEventName): void {
  try {
    captureAnalyticsEventDeferred(eventName);
  } catch {
    // Telemetry must never block Rescue Me rendering or local persistence.
  }
}
