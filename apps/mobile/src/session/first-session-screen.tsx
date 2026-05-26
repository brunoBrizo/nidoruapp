import {
  breathTechniques,
  onboardingPlans,
  type BreathAudioCueModeId,
  type BreathTechniqueId,
  type OnboardingPlanId,
} from "@nidoru/domain";
import { colors, motion } from "@nidoru/ui-tokens";
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
import { AppState, type AppStateStatus } from "react-native";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import {
  createActiveSessionAudioController,
  type ActiveSessionAudioController,
} from "../audio/active-session-audio-controller";
import { NidoruButton, NidoruIconButton } from "../design-system/interaction";
import { OrbStage } from "../design-system/orb";
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
import { Animated, Pressable, Text, View, cn } from "../tw";
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

const orbLayerScales = {
  core: 1.12,
  innerGlow: 1.18,
  midDiffusion: 1.25,
  outerGlow: 1.35,
  pulseRing: 1.6,
} as const;

const orbLayerOpacities = {
  midDiffusionActive: 0.15,
  midDiffusionRest: 0.3,
  outerGlowActive: 0.08,
  outerGlowRest: 0.15,
  pulseRingActive: 0.5,
} as const;

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

const firstSessionClassNames = {
  audioModeIconCircle: "h-7 w-7 items-center justify-center rounded-[14px] bg-white/[0.04]",
  audioModeIconSelected: "bg-[#A89CE0]/10",
  audioModeLabel: "flex-1 font-nidoru-primary-semibold text-[11px] text-[#8A8FA8]",
  audioModeLabelSelected: "text-[#EEF0FF]",
  audioModeOption:
    "min-h-[52px] w-full flex-row items-center gap-3 rounded-2xl border border-[#1C2040] bg-[#111430]/80 px-3.5 active:scale-[0.96]",
  audioModeOptionSelected:
    "border-[#A89CE0]/50 bg-[#1C2040] shadow-[0_0_16px_rgba(124,111,205,0.2)]",
  audioPickerBackdrop: "absolute inset-0",
  audioPickerCopy:
    "mb-3.5 text-center font-nidoru-primary-regular text-[13px] leading-[18px] text-[#8A8FA8]",
  audioPickerHandle: "mb-3.5 h-1 w-9 rounded-full bg-[#A89CE0]/35",
  audioPickerLayer: "absolute inset-0 justify-end bg-[#0D0F1A]/60 p-5",
  audioPickerOptions: "w-full gap-2.5",
  audioPickerSheet:
    "w-full items-center rounded-3xl border border-[#1C2040] bg-[#0D0F1A] px-4 pb-[18px] pt-3 shadow-[0_-10px_38px_rgba(4,6,16,0.48)]",
  audioPickerTitle: "mb-1.5 font-nidoru-primary-semibold text-[18px] leading-[24px] text-[#EEF0FF]",
  backgroundGlow:
    "pointer-events-none absolute left-[-30px] top-[150px] h-[440px] w-[440px] rounded-full bg-[#0F1230] opacity-[0.34]",
  continueButton:
    "min-h-14 w-full flex-row items-center justify-center gap-2 rounded-full border border-[#7C6FCD]/40 bg-[#1C2040] shadow-[0_0_22px_rgba(124,111,205,0.22)] active:scale-[0.96]",
  continueButtonText: "font-nidoru-primary-semibold text-[16px] leading-[22px] text-[#EEF0FF]",
  controlDisabled: "opacity-[0.45]",
  controlsArea: "gap-4",
  core: "absolute h-[150px] w-[150px] items-center justify-center overflow-hidden rounded-full bg-[#7C6FCD] shadow-[0_0_44px_rgba(124,111,205,0.42)]",
  coreAtmosphere: "h-[108px] w-[108px] rounded-full bg-[#EEF0FF]/[0.14]",
  endForNowButton: "min-h-12 items-center justify-center active:scale-[0.98]",
  endForNowText: "font-nidoru-primary-semibold text-[16px] leading-[22px] text-[#8A8FA8]",
  footer:
    "relative z-10 flex-row items-center justify-between bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A] to-transparent px-7 pb-7 pt-4",
  header: "relative z-10 items-center gap-[7px] px-6 pb-4 pt-16 text-center",
  innerGlow: "absolute h-[200px] w-[200px] rounded-full bg-[#7C6FCD]/20",
  midDiffusion:
    "absolute h-[220px] w-[220px] rounded-full bg-[#A89CE0]/30 shadow-[0_0_32px_rgba(168,156,224,0.22)]",
  orbSection: "relative z-10 min-h-[400px] flex-1 items-center justify-center",
  orbStage: "h-[260px] w-[260px] items-center justify-center",
  orbStagePaused: "opacity-30 scale-[0.85]",
  outerRing:
    "absolute h-[240px] w-[240px] rounded-full border-[1.5px] border-[#A89CE0]/25 border-t-[#A89CE0]/40",
  overlay: "absolute inset-0 z-40 items-center justify-center bg-[#0D0F1A] px-8",
  overlayActions: "w-full max-w-[280px] gap-3",
  overlayCopy: "mb-[34px] font-nidoru-primary-regular text-[14px] leading-[20px] text-[#8A8FA8]",
  overlayEyebrow:
    "mb-2 font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-[#A4AAC4]",
  overlayGlow:
    "pointer-events-none absolute h-[240px] w-[240px] rounded-full bg-[#7C6FCD]/5 shadow-[0_0_86px_rgba(124,111,205,0.2)]",
  overlayTitle: "mb-2 font-nidoru-primary-semibold text-[24px] leading-[30px] text-[#EEF0FF]",
  pauseButton:
    "h-14 w-14 items-center justify-center rounded-full border border-[#1C2040] bg-[#14172B] active:scale-[0.96]",
  phaseLabel: "absolute font-nidoru-primary-semibold text-[20px] leading-[26px] text-[#EEF0FF]",
  preparingCenter: "flex-1 items-center justify-center gap-2",
  pulseRing: "absolute h-[150px] w-[150px] rounded-full border-[1.5px] border-[#EEF0FF]/40",
  reflectionButton:
    "min-h-14 w-full flex-row items-center justify-between rounded-[16px] border border-[#1C2040] bg-[#14172B] px-5 active:scale-[0.96]",
  reflectionButtons: "mb-6 w-full max-w-[320px] gap-3.5",
  reflectionButtonSelected:
    "border-[#7C6FCD]/50 bg-[#1C2040] shadow-[0_0_14px_rgba(124,111,205,0.18)]",
  reflectionButtonText: "font-nidoru-primary-semibold text-[16px] leading-[22px] text-[#EEF0FF]",
  reflectionCheckCircle:
    "h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-[#2A2E50]",
  reflectionCheckSelected: "border-transparent shadow-[0_0_10px_rgba(168,156,224,0.42)]",
  reflectionContent: "relative z-10 w-full -translate-y-7 items-center justify-center px-6",
  reflectionCopy:
    "max-w-[290px] text-center font-nidoru-primary-regular text-[14px] leading-[21px] text-[#A4AAC4]",
  reflectionError:
    "mt-4 max-w-[300px] text-center font-nidoru-primary-semibold text-[13px] leading-[18px] text-nidoru-dark-danger",
  reflectionEyebrow:
    "font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-[#A4AAC4]",
  reflectionEyebrowRow: "mb-3 flex-row items-center justify-center gap-2",
  reflectionFadeLayer: "absolute inset-0",
  reflectionOverlay:
    "absolute inset-0 z-50 items-center justify-center overflow-hidden bg-[#0D0F1A]",
  reflectionTitle:
    "mb-8 text-center font-nidoru-primary-semibold text-[28px] leading-[34px] tracking-normal text-[#EEF0FF]",
  rewardActionWrap: "absolute bottom-8 left-0 right-0 items-center px-6",
  rewardContinueButton:
    "h-14 w-full max-w-[342px] items-center justify-center rounded-2xl border border-[#1C2040] bg-[#1C2040] active:scale-[0.96]",
  rewardContinueText: "font-nidoru-primary-semibold text-[16px] leading-[22px] text-[#EEF0FF]",
  screen: "flex-1 overflow-hidden bg-[#0D0F1A]",
  statusControl: "min-h-16 min-w-16 items-center justify-center gap-1.5 active:scale-[0.96]",
  statusIconCircle:
    "h-12 w-12 items-center justify-center rounded-full border border-[#1C2040] bg-[#14172B]",
  statusIconCircleActive: "border-[#7C6FCD]/50",
  statusLabel: "font-nidoru-primary-semibold text-[13px] text-[#8A8FA8]",
  statusLabelActive: "text-[#A89CE0]",
  subtitle: "font-nidoru-primary-regular text-[14px] leading-[20px] text-[#8A8FA8]",
  timer:
    "absolute bottom-[22px] font-nidoru-data-regular text-[16px] leading-[22px] tracking-[3px] text-[#8A8FA8]/80 tabular-nums",
  title: "font-nidoru-primary-semibold text-[16px] leading-[22px] text-[#EEF0FF]",
} as const;

const reflectionTransitionFrameStyle = {
  alignItems: "center",
  flex: 1,
  justifyContent: "center",
  width: "100%",
} as const;

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
  const [isAudioPickerVisible, setAudioPickerVisible] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [completionMode, setCompletionMode] = useState<CompletionMode>(initialCompletionMode);
  const isPersistingTerminalStateRef = useRef(false);
  const hasPersistedSessionStartRef = useRef(Boolean(initialCompletionMode));
  const hasPersistedFinalDraftRef = useRef(false);
  const lastPausedDraftObservedAtMsRef = useRef<number | undefined>(undefined);
  const lastDraftPersistedAtMs = useRef<number | undefined>(undefined);
  const previousPhaseNameRef = useRef<FirstSessionPhaseName>(snapshot.phaseName);
  const currentAppStateRef = useRef<AppStateStatus>(getInitialHapticAppState());
  const initialLayerTargets = getOrbLayerTargets(snapshot.phaseName, reduceMotionEnabled);
  const coreScale = useSharedValue(initialLayerTargets.coreScale);
  const innerGlowScale = useSharedValue(initialLayerTargets.innerGlowScale);
  const midDiffusionOpacity = useSharedValue(initialLayerTargets.midDiffusionOpacity);
  const midDiffusionScale = useSharedValue(initialLayerTargets.midDiffusionScale);
  const outerGlowOpacity = useSharedValue(initialLayerTargets.outerGlowOpacity);
  const outerGlowScale = useSharedValue(initialLayerTargets.outerGlowScale);
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
    const layerTargets = getOrbLayerTargets(snapshot.phaseName, reduceMotionEnabled);
    coreScale.value = withTiming(layerTargets.coreScale, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });
    innerGlowScale.value = withTiming(layerTargets.innerGlowScale, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });
    midDiffusionScale.value = withTiming(layerTargets.midDiffusionScale, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });
    midDiffusionOpacity.value = withTiming(layerTargets.midDiffusionOpacity, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });
    outerGlowScale.value = withTiming(layerTargets.outerGlowScale, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });
    outerGlowOpacity.value = withTiming(layerTargets.outerGlowOpacity, {
      duration: animationDurationMs,
      easing: Easing.inOut(Easing.ease),
    });

    if (snapshot.phaseName === "inhale" && !reduceMotionEnabled) {
      pulseScale.value = 1;
      pulseOpacity.value = orbLayerOpacities.pulseRingActive;
      pulseScale.value = withTiming(orbLayerScales.pulseRing, {
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
    coreScale,
    innerGlowScale,
    labelOpacity,
    midDiffusionOpacity,
    midDiffusionScale,
    outerGlowOpacity,
    outerGlowScale,
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

  const coreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));
  const innerGlowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerGlowScale.value }],
  }));
  const midDiffusionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: midDiffusionOpacity.value,
    transform: [{ scale: midDiffusionScale.value }],
  }));
  const outerGlowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: outerGlowOpacity.value,
    transform: [{ scale: outerGlowScale.value }],
  }));
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const pauseSession = () => {
    setAudioPickerVisible(false);
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
  const selectedAudioMode = getAudioModeOption(audioMode);
  const hapticsActive = hapticsEnabled;
  const isPaused = snapshot.isPaused && !completionMode;

  return (
    <View
      className={firstSessionClassNames.screen}
      style={{
        paddingBottom: Math.max(safeAreaInsets.bottom, 0),
        paddingTop: Math.max(safeAreaInsets.top, 0),
      }}
      testID="first-session-screen"
    >
      <StatusBar hidden />
      <View className={firstSessionClassNames.backgroundGlow} pointerEvents="none" />

      <View className={firstSessionClassNames.header} testID="first-session-header">
        <Text accessibilityRole="header" className={firstSessionClassNames.title} selectable>
          Let’s wind down.
        </Text>
        <Text className={firstSessionClassNames.subtitle} selectable>
          {sessionLabel}
        </Text>
      </View>

      <View className={firstSessionClassNames.orbSection}>
        <OrbStage
          accessibilityHint="Guides the current breath phase."
          accessibilityLabel={`${phaseLabels[snapshot.phaseName]} breathing phase`}
          accessibilityRole="image"
          className={cn(
            firstSessionClassNames.orbStage,
            isPaused ? firstSessionClassNames.orbStagePaused : null,
          )}
          isDecorative={false}
          testID="first-session-orb"
        >
          {reduceMotionEnabled ? null : (
            <Animated.View
              className={firstSessionClassNames.outerRing}
              style={outerGlowAnimatedStyle}
              testID="first-session-orb-outer-ring"
            />
          )}
          <Animated.View
            className={firstSessionClassNames.innerGlow}
            style={innerGlowAnimatedStyle}
            testID="first-session-orb-inner-glow"
          />
          <Animated.View
            className={firstSessionClassNames.midDiffusion}
            style={midDiffusionAnimatedStyle}
            testID="first-session-orb-mid-diffusion"
          />
          <Animated.View
            className={firstSessionClassNames.core}
            style={coreAnimatedStyle}
            testID="first-session-orb-core"
          >
            <View className={firstSessionClassNames.coreAtmosphere} />
          </Animated.View>
          {reduceMotionEnabled ? null : (
            <Animated.View
              pointerEvents="none"
              className={firstSessionClassNames.pulseRing}
              style={pulseAnimatedStyle}
              testID="first-session-orb-pulse-ring"
            />
          )}
          <Animated.Text
            className={firstSessionClassNames.phaseLabel}
            selectable={false}
            style={labelAnimatedStyle}
          >
            {phaseLabels[snapshot.phaseName]}
          </Animated.Text>
        </OrbStage>

        <Text
          accessibilityLabel={`Time remaining ${formatAccessibleRemainingTime(
            snapshot.remainingSeconds,
          )}`}
          className={firstSessionClassNames.timer}
          selectable
        >
          {formatRemainingTime(snapshot.remainingSeconds)}
        </Text>
      </View>

      <View className={firstSessionClassNames.controlsArea}>
        <View className={firstSessionClassNames.footer} testID="first-session-footer">
          <ControlButton
            active
            activeLabel={selectedAudioMode.accessibilityLabel}
            activeTone="muted"
            accessibilityHint="Opens audio cue options for this session."
            inactiveLabel={selectedAudioMode.accessibilityLabel}
            label={selectedAudioMode.label}
            onPress={() => {
              setAudioPickerVisible(true);
            }}
            testID="first-session-audio-control"
          >
            <AudioModeIcon color={colors.dark.textSecondary.value} mode={audioMode} />
          </ControlButton>

          <NidoruIconButton
            accessibilityHint="Pauses this breathing session."
            accessibilityLabel="Pause session"
            disabled={Boolean(completionMode)}
            className={cn(
              firstSessionClassNames.pauseButton,
              completionMode ? firstSessionClassNames.controlDisabled : null,
            )}
            onPress={pauseSession}
          >
            <Pause color={colors.dark.textSecondary.value} size={24} strokeWidth={1.5} />
          </NidoruIconButton>

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

      {isAudioPickerVisible ? (
        <AudioModePicker
          onDismiss={() => {
            setAudioPickerVisible(false);
          }}
          onSelect={(mode) => {
            setAudioMode(mode);
            setAudioPickerVisible(false);
          }}
          selectedMode={audioMode}
        />
      ) : null}

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
    <View className={firstSessionClassNames.screen}>
      <View className={firstSessionClassNames.backgroundGlow} pointerEvents="none" />
      <View className={firstSessionClassNames.preparingCenter}>
        <Text accessibilityRole="header" className={firstSessionClassNames.title} selectable>
          Let’s wind down.
        </Text>
        <Text className={firstSessionClassNames.subtitle} selectable>
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
    <View className={firstSessionClassNames.overlay} testID="first-session-pause-overlay">
      <View className={firstSessionClassNames.overlayGlow} pointerEvents="none" />
      <Text className={firstSessionClassNames.overlayEyebrow} selectable>
        {sessionLabel} · {formatRemainingTime(remainingSeconds, false)} left
      </Text>
      <Text accessibilityRole="header" className={firstSessionClassNames.overlayTitle} selectable>
        Paused
      </Text>
      <Text className={firstSessionClassNames.overlayCopy} selectable>
        You can continue when you’re ready.
      </Text>
      <View className={firstSessionClassNames.overlayActions}>
        <NidoruButton
          accessibilityHint="Returns to the current breath phase."
          accessibilityLabel="Resume session"
          className={firstSessionClassNames.continueButton}
          onPress={onResume}
          variant="secondary"
        >
          <Text className={firstSessionClassNames.continueButtonText} selectable={false}>
            Continue
          </Text>
        </NidoruButton>
        <NidoruButton
          accessibilityHint="Saves this session as ended without showing the reflection step."
          accessibilityLabel="End session for now"
          className={firstSessionClassNames.endForNowButton}
          onPress={onEnd}
          variant="ghost"
        >
          <Text className={firstSessionClassNames.endForNowText} selectable={false}>
            End for now
          </Text>
        </NidoruButton>
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
    <View
      className={firstSessionClassNames.reflectionOverlay}
      testID="first-session-reflection-overlay"
    >
      <Animated.View style={[reflectionTransitionFrameStyle, overlayAnimatedStyle]}>
        <ReflectionAmbientFade />
        <View className={firstSessionClassNames.reflectionContent}>
          <Animated.View
            className={firstSessionClassNames.reflectionEyebrowRow}
            style={eyebrowAnimatedStyle}
          >
            <CheckCircle
              color={colors.dark.primaryGlow.value}
              fill={colors.dark.primaryGlow.value}
              size={16}
              strokeWidth={0}
            />
            <Text className={firstSessionClassNames.reflectionEyebrow} selectable>
              {completionEyebrow}
            </Text>
          </Animated.View>

          <Animated.Text
            accessibilityRole="header"
            className={firstSessionClassNames.reflectionTitle}
            selectable
            style={titleAnimatedStyle}
          >
            How do you feel?
          </Animated.Text>

          <Animated.View
            className={firstSessionClassNames.reflectionButtons}
            style={optionsAnimatedStyle}
            testID="first-session-reflection-options"
          >
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
            <Animated.Text
              className={firstSessionClassNames.reflectionCopy}
              selectable
              style={scienceAnimatedStyle}
            >
              Deep breathing shifts your nervous system into rest mode.
            </Animated.Text>
          ) : null}

          {reflectionError ? (
            <Text
              accessibilityRole="alert"
              className={firstSessionClassNames.reflectionError}
              selectable
            >
              {reflectionError}
            </Text>
          ) : null}
        </View>

        {selectedFeeling ? (
          <Animated.View
            className={firstSessionClassNames.rewardActionWrap}
            style={continueAnimatedStyle}
          >
            <NidoruButton
              className={firstSessionClassNames.rewardContinueButton}
              onPress={onRewardMomentComplete}
              variant="secondary"
            >
              <Text className={firstSessionClassNames.rewardContinueText} selectable={false}>
                Continue
              </Text>
            </NidoruButton>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
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
      className={cn(
        firstSessionClassNames.reflectionButton,
        isSelected ? firstSessionClassNames.reflectionButtonSelected : null,
      )}
      onPress={onPress}
    >
      <Text className={firstSessionClassNames.reflectionButtonText} selectable={false}>
        {label}
      </Text>
      <View
        className={cn(
          firstSessionClassNames.reflectionCheckCircle,
          isSelected ? firstSessionClassNames.reflectionCheckSelected : null,
        )}
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

function ReflectionAmbientFade() {
  return (
    <View
      className={firstSessionClassNames.reflectionFadeLayer}
      pointerEvents="none"
      testID="first-session-reflection-fade"
    >
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 844" width="100%">
        <Defs>
          <RadialGradient
            cx="195"
            cy="430"
            fx="195"
            fy="430"
            gradientUnits="userSpaceOnUse"
            id="reflection-center-wash"
            r="730"
          >
            <Stop offset="0" stopColor="#242A52" stopOpacity="0.38" />
            <Stop offset="0.24" stopColor="#20254B" stopOpacity="0.3" />
            <Stop offset="0.5" stopColor="#191D3A" stopOpacity="0.2" />
            <Stop offset="0.76" stopColor="#11152A" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="195"
            cy="374"
            fx="195"
            fy="374"
            gradientUnits="userSpaceOnUse"
            id="reflection-core-glow"
            r="265"
          >
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.14" />
            <Stop offset="0.4" stopColor="#7C6FCD" stopOpacity="0.07" />
            <Stop offset="1" stopColor="#7C6FCD" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#reflection-center-wash)" height="844" width="390" x="0" y="0" />
        <Rect fill="url(#reflection-core-glow)" height="844" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}

function AudioModePicker({
  onDismiss,
  onSelect,
  selectedMode,
}: {
  readonly onDismiss: () => void;
  readonly onSelect: (mode: BreathAudioCueModeId) => void;
  readonly selectedMode: BreathAudioCueModeId;
}) {
  return (
    <View
      accessibilityViewIsModal
      className={firstSessionClassNames.audioPickerLayer}
      importantForAccessibility="yes"
      testID="first-session-audio-picker"
    >
      <Pressable
        accessibilityHint="Closes audio cue options."
        accessibilityLabel="Close audio mode picker"
        accessibilityRole="button"
        className={firstSessionClassNames.audioPickerBackdrop}
        onPress={onDismiss}
      />
      <View className={firstSessionClassNames.audioPickerSheet}>
        <View className={firstSessionClassNames.audioPickerHandle} />
        <Text
          accessibilityRole="header"
          className={firstSessionClassNames.audioPickerTitle}
          selectable
        >
          Audio cues
        </Text>
        <Text className={firstSessionClassNames.audioPickerCopy} selectable>
          Choose the sound layer for breath phase guidance.
        </Text>
        <View className={firstSessionClassNames.audioPickerOptions}>
          {audioModeOptions.map((option) => (
            <AudioModeOptionButton
              key={option.id}
              accessibilityLabel={`Select ${option.accessibilityLabel.replace(
                "Audio mode",
                "audio mode",
              )}`}
              accessibilityHint={getAudioModeAccessibilityHint(option.id)}
              isSelected={selectedMode === option.id}
              label={option.label}
              mode={option.id}
              onPress={() => {
                onSelect(option.id);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function AudioModeOptionButton({
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
      className={cn(
        firstSessionClassNames.audioModeOption,
        isSelected ? firstSessionClassNames.audioModeOptionSelected : null,
      )}
      onPress={onPress}
    >
      <View
        className={cn(
          firstSessionClassNames.audioModeIconCircle,
          isSelected ? firstSessionClassNames.audioModeIconSelected : null,
        )}
      >
        <AudioModeIcon color={iconColor} mode={mode} />
      </View>
      <Text
        className={cn(
          firstSessionClassNames.audioModeLabel,
          isSelected ? firstSessionClassNames.audioModeLabelSelected : null,
        )}
        numberOfLines={1}
        selectable={false}
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
  activeTone = "accent",
  children,
  inactiveLabel,
  label,
  onPress,
  testID,
}: {
  readonly accessibilityHint: string;
  readonly active: boolean;
  readonly activeLabel: string;
  readonly activeTone?: "accent" | "muted";
  readonly children: ReactNode;
  readonly inactiveLabel: string;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID?: string;
}) {
  const shouldShowAccent = active && activeTone === "accent";

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={active ? activeLabel : inactiveLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={firstSessionClassNames.statusControl}
      onPress={onPress}
      testID={testID}
    >
      <View
        className={cn(
          firstSessionClassNames.statusIconCircle,
          shouldShowAccent ? firstSessionClassNames.statusIconCircleActive : null,
        )}
      >
        {children}
      </View>
      <Text
        className={cn(
          firstSessionClassNames.statusLabel,
          shouldShowAccent ? firstSessionClassNames.statusLabelActive : null,
        )}
        selectable={false}
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

function getOrbLayerTargets(phaseName: FirstSessionPhaseName, reduceMotionEnabled: boolean) {
  const isExpandingPhase = isExpandingBreathPhase(phaseName);
  const coreScale = isExpandingPhase ? orbLayerScales.core : motion.breathingOrb.restScale;

  return {
    coreScale,
    innerGlowScale:
      isExpandingPhase && !reduceMotionEnabled
        ? orbLayerScales.innerGlow
        : motion.breathingOrb.restScale,
    midDiffusionOpacity:
      isExpandingPhase && !reduceMotionEnabled
        ? orbLayerOpacities.midDiffusionActive
        : orbLayerOpacities.midDiffusionRest,
    midDiffusionScale:
      isExpandingPhase && !reduceMotionEnabled
        ? orbLayerScales.midDiffusion
        : motion.breathingOrb.restScale,
    outerGlowOpacity: isExpandingPhase
      ? orbLayerOpacities.outerGlowActive
      : orbLayerOpacities.outerGlowRest,
    outerGlowScale: isExpandingPhase ? orbLayerScales.outerGlow : motion.breathingOrb.restScale,
  };
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

function getAudioModeOption(mode: BreathAudioCueModeId) {
  return audioModeOptions.find((option) => option.id === mode) ?? audioModeOptions[1];
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
