import { motion } from "@nidoru/ui-tokens";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

import { RestingBreathingOrb } from "../breathing/breathing-orb";
import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { ReactNativeAnimatedText, ReactNativeAnimatedView, View, cn } from "../tw";

export const FIRST_BREATH_DEMO_COPY = {
  exhale: "And out.",
  inhale: "Breathe in with us.",
} as const;

export const FIRST_BREATH_DEMO_COMPLETION_COPY = "That took 30 seconds. Imagine 4 minutes.";

export const FIRST_BREATH_DEMO_BREATH_TIMING = {
  cycles: 3,
  exhaleDurationMs: 5000,
  inhaleDurationMs: 5000,
  totalDurationMs: 30000,
} as const;

export const FIRST_BREATH_DEMO_CONTENT_ENTER_MS = motion.duration.screenEnterMs;
export const FIRST_BREATH_DEMO_SCREEN_EXIT_MS = motion.duration.screenExitMs;
export const FIRST_BREATH_DEMO_LABEL_CROSSFADE_MS = motion.duration.phaseLabelCrossfadeLeadMs;
export const FIRST_BREATH_DEMO_AUTO_ADVANCE_DELAY_MS = 1800;

const FIRST_BREATH_DEMO_ORB_REST_SCALE = 1.55;
const FIRST_BREATH_DEMO_ORB_INHALE_SCALE =
  FIRST_BREATH_DEMO_ORB_REST_SCALE * motion.breathingOrb.inhaleScale;
const FIRST_BREATH_DEMO_PHASE_TEXT_CLASS_NAME =
  "max-w-[280px] text-center font-nidoru-primary-semibold text-[23px] leading-[30px] text-[#EEF0FF]/[0.92]";
const FIRST_BREATH_DEMO_COMPLETION_TEXT_CLASS_NAME =
  "font-nidoru-primary-bold text-[22px] leading-[30px] text-nidoru-dark-text-primary";

type FirstBreathDemoBreathPhase = "inhale" | "exhale";
type FirstBreathDemoPhaseId =
  | "inhale-1"
  | "exhale-1"
  | "inhale-2"
  | "exhale-2"
  | "inhale-3"
  | "exhale-3";

type FirstBreathDemoPhase = {
  readonly copy: string;
  readonly cycle: 1 | 2 | 3;
  readonly durationMs: number;
  readonly id: FirstBreathDemoPhaseId;
  readonly phase: FirstBreathDemoBreathPhase;
};

type FirstBreathDemoPhaseResult =
  | {
      readonly copy: string;
      readonly cycle: 1 | 2 | 3;
      readonly phase: FirstBreathDemoBreathPhase;
    }
  | {
      readonly copy: typeof FIRST_BREATH_DEMO_COMPLETION_COPY;
      readonly phase: "complete";
    };

const FIRST_BREATH_DEMO_INITIAL_PHASE: FirstBreathDemoPhase = {
  copy: FIRST_BREATH_DEMO_COPY.inhale,
  cycle: 1,
  durationMs: FIRST_BREATH_DEMO_BREATH_TIMING.inhaleDurationMs,
  id: "inhale-1",
  phase: "inhale",
};

export const FIRST_BREATH_DEMO_PHASES: readonly FirstBreathDemoPhase[] = [
  FIRST_BREATH_DEMO_INITIAL_PHASE,
  {
    copy: FIRST_BREATH_DEMO_COPY.exhale,
    cycle: 1,
    durationMs: FIRST_BREATH_DEMO_BREATH_TIMING.exhaleDurationMs,
    id: "exhale-1",
    phase: "exhale",
  },
  {
    copy: FIRST_BREATH_DEMO_COPY.inhale,
    cycle: 2,
    durationMs: FIRST_BREATH_DEMO_BREATH_TIMING.inhaleDurationMs,
    id: "inhale-2",
    phase: "inhale",
  },
  {
    copy: FIRST_BREATH_DEMO_COPY.exhale,
    cycle: 2,
    durationMs: FIRST_BREATH_DEMO_BREATH_TIMING.exhaleDurationMs,
    id: "exhale-2",
    phase: "exhale",
  },
  {
    copy: FIRST_BREATH_DEMO_COPY.inhale,
    cycle: 3,
    durationMs: FIRST_BREATH_DEMO_BREATH_TIMING.inhaleDurationMs,
    id: "inhale-3",
    phase: "inhale",
  },
  {
    copy: FIRST_BREATH_DEMO_COPY.exhale,
    cycle: 3,
    durationMs: FIRST_BREATH_DEMO_BREATH_TIMING.exhaleDurationMs,
    id: "exhale-3",
    phase: "exhale",
  },
] as const;

type FirstBreathDemoScreenProps = {
  readonly autoAdvanceDelayMs?: number;
  readonly disableHaptics?: boolean;
  readonly onBreathComplete?: () => Promise<void> | void;
  readonly onComplete?: () => void;
  readonly onStarted?: () => Promise<void> | void;
};

type PhaseLabelState = {
  readonly current: string;
  readonly previous?: string;
};

export function getFirstBreathDemoPhaseForElapsedMs(elapsedMs: number): FirstBreathDemoPhaseResult {
  const boundedElapsedMs = Math.max(0, elapsedMs);

  if (boundedElapsedMs >= FIRST_BREATH_DEMO_BREATH_TIMING.totalDurationMs) {
    return {
      copy: FIRST_BREATH_DEMO_COMPLETION_COPY,
      phase: "complete",
    };
  }

  let elapsedBeforePhaseMs = 0;

  for (const demoPhase of FIRST_BREATH_DEMO_PHASES) {
    const phaseEndMs = elapsedBeforePhaseMs + demoPhase.durationMs;

    if (boundedElapsedMs < phaseEndMs) {
      return {
        copy: demoPhase.copy,
        cycle: demoPhase.cycle,
        phase: demoPhase.phase,
      };
    }

    elapsedBeforePhaseMs = phaseEndMs;
  }

  return {
    copy: FIRST_BREATH_DEMO_COMPLETION_COPY,
    phase: "complete",
  };
}

function getFirstBreathDemoPhaseAtIndex(phaseIndex: number): FirstBreathDemoPhase {
  return FIRST_BREATH_DEMO_PHASES[phaseIndex] ?? FIRST_BREATH_DEMO_INITIAL_PHASE;
}

export function FirstBreathDemoScreen({
  autoAdvanceDelayMs = FIRST_BREATH_DEMO_AUTO_ADVANCE_DELAY_MS,
  disableHaptics = false,
  onBreathComplete,
  onComplete,
  onStarted,
}: FirstBreathDemoScreenProps) {
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceDecorativeMotion =
    reduceMotionPreference.isResolved && reduceMotionPreference.reduceMotionEnabled;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const currentPhase = getFirstBreathDemoPhaseAtIndex(phaseIndex);
  const currentCopy = isComplete ? FIRST_BREATH_DEMO_COMPLETION_COPY : currentPhase.copy;
  const [phaseLabel, setPhaseLabel] = useState<PhaseLabelState>({ current: currentCopy });
  const previousCopyRef = useRef(currentCopy);
  const contentProgress = useRef(new Animated.Value(0)).current;
  const labelProgress = useRef(new Animated.Value(1)).current;
  const breathProgress = useRef(new Animated.Value(0)).current;
  const hasCompletedRef = useRef(false);
  const hasStartedRef = useRef(false);

  const contentTranslateY = contentProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const orbScale = breathProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [FIRST_BREATH_DEMO_ORB_REST_SCALE, FIRST_BREATH_DEMO_ORB_INHALE_SCALE],
  });
  const glowScale = breathProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: reduceDecorativeMotion ? [1, 1] : [1, 1.14],
  });
  const glowOpacity = breathProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: reduceDecorativeMotion ? [0.34, 0.34] : [0.3, 0.46],
  });
  const previousLabelOpacity = labelProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      void onStarted?.();
    }

    contentProgress.setValue(0);
    Animated.timing(contentProgress, {
      duration: reduceDecorativeMotion ? 0 : FIRST_BREATH_DEMO_CONTENT_ENTER_MS,
      easing: Easing.out(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [contentProgress, onStarted, reduceDecorativeMotion]);

  useEffect(() => {
    if (isComplete) {
      return;
    }

    const phase = getFirstBreathDemoPhaseAtIndex(phaseIndex);
    const startsExpanded = phase.phase === "exhale";

    breathProgress.stopAnimation();
    breathProgress.setValue(startsExpanded ? 1 : 0);
    Animated.timing(breathProgress, {
      duration: phase.durationMs,
      easing: Easing.inOut(Easing.ease),
      toValue: phase.phase === "inhale" ? 1 : 0,
      useNativeDriver: true,
    }).start();

    void triggerFirstBreathHaptic(phase.phase, disableHaptics);

    const phaseTimer = setTimeout(() => {
      if (phaseIndex === FIRST_BREATH_DEMO_PHASES.length - 1) {
        hasCompletedRef.current = true;
        void onBreathComplete?.();
        setIsComplete(true);
        return;
      }

      setPhaseIndex((previousPhaseIndex) => previousPhaseIndex + 1);
    }, phase.durationMs);

    return () => {
      clearTimeout(phaseTimer);
    };
  }, [breathProgress, disableHaptics, isComplete, onBreathComplete, phaseIndex]);

  useEffect(() => {
    if (previousCopyRef.current === currentCopy) {
      return;
    }

    const previousCopy = previousCopyRef.current;

    previousCopyRef.current = currentCopy;
    labelProgress.stopAnimation();
    labelProgress.setValue(0);
    setPhaseLabel({
      current: currentCopy,
      previous: previousCopy,
    });

    Animated.timing(labelProgress, {
      duration: FIRST_BREATH_DEMO_LABEL_CROSSFADE_MS,
      easing: Easing.inOut(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPhaseLabel({ current: currentCopy });
      }
    });
  }, [currentCopy, labelProgress]);

  useEffect(() => {
    if (!hasCompletedRef.current || !onComplete) {
      return;
    }

    const handoffTimer = setTimeout(() => {
      Animated.timing(contentProgress, {
        duration: FIRST_BREATH_DEMO_SCREEN_EXIT_MS,
        easing: Easing.in(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onComplete();
        }
      });
    }, autoAdvanceDelayMs);

    return () => {
      clearTimeout(handoffTimer);
    };
  }, [autoAdvanceDelayMs, contentProgress, onComplete, isComplete]);

  const accessibilityLabel = useMemo(() => {
    if (isComplete) {
      return "First breath demo complete.";
    }

    return `First breath demo, cycle ${currentPhase.cycle} of ${FIRST_BREATH_DEMO_BREATH_TIMING.cycles}, ${currentPhase.phase}.`;
  }, [currentPhase.cycle, currentPhase.phase, isComplete]);

  return (
    <View className="flex-1 bg-nidoru-dark-background" testID="first-breath-demo-screen">
      <StatusBar style="light" />
      <ReactNativeAnimatedView
        accessibilityLabel={accessibilityLabel}
        className="flex-1 items-center justify-center gap-nidoru-xxl px-nidoru-screen pb-nidoru-lg"
        style={{
          opacity: contentProgress,
          transform: [{ translateY: contentTranslateY }],
        }}
        testID="first-breath-demo-content"
      >
        <View className="h-[240px] w-[240px] items-center justify-center">
          <ReactNativeAnimatedView
            className="absolute h-[224px] w-[224px] rounded-full bg-[#A89CE0]/[0.32] shadow-[0_0_56px_rgba(168,156,224,0.34)]"
            pointerEvents="none"
            style={{
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            }}
            testID="first-breath-demo-orb-glow"
          />
          <ReactNativeAnimatedView
            className="h-[180px] w-[180px] items-center justify-center"
            style={{ transform: [{ scale: orbScale }] }}
            testID="first-breath-demo-orb-scale"
          >
            <RestingBreathingOrb
              accessibilityLabel="Nidoru breathing orb"
              isDecorative={false}
              testID="first-breath-demo-orb"
            />
          </ReactNativeAnimatedView>
        </View>

        <View
          className="min-h-[68px] w-full items-center justify-center"
          testID="first-breath-demo-phase-label"
        >
          {phaseLabel.previous ? (
            <ReactNativeAnimatedText
              className={cn(FIRST_BREATH_DEMO_PHASE_TEXT_CLASS_NAME, "absolute")}
              selectable
              style={{ opacity: previousLabelOpacity }}
            >
              {phaseLabel.previous}
            </ReactNativeAnimatedText>
          ) : null}
          <ReactNativeAnimatedText
            accessibilityRole={isComplete ? "header" : undefined}
            className={cn(
              FIRST_BREATH_DEMO_PHASE_TEXT_CLASS_NAME,
              isComplete ? FIRST_BREATH_DEMO_COMPLETION_TEXT_CLASS_NAME : null,
            )}
            selectable
            style={{ opacity: phaseLabel.previous ? labelProgress : 1 }}
          >
            {phaseLabel.current}
          </ReactNativeAnimatedText>
        </View>
      </ReactNativeAnimatedView>
    </View>
  );
}

async function triggerFirstBreathHaptic(
  phase: FirstBreathDemoBreathPhase,
  disableHaptics: boolean,
): Promise<void> {
  if (disableHaptics) {
    return;
  }

  try {
    await Haptics.impactAsync(
      phase === "inhale" ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
    );
  } catch {
    // Haptics must never block or interrupt the local-first breath demo.
  }
}
