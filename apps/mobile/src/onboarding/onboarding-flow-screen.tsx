import {
  breathworkFamiliarityOptions,
  createPersonalizedOnboardingPlan,
  onboardingPlans,
  onboardingQuestionLimit,
  sleepBaselineOptions,
  windDownTimePresets,
} from "@nidoru/domain";
import type {
  BreathworkFamiliarity,
  BreathTechniqueId,
  OnboardingGoal,
  OnboardingPlanId,
  PersonalizedOnboardingPlan,
  SleepBaseline,
} from "@nidoru/domain";
import { colors, motion, spacing, typography } from "@nidoru/ui-tokens";
import { useRouter, type Href } from "expo-router";
import {
  CircleDot,
  Infinity as InfinityIcon,
  Leaf,
  Moon,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wind,
} from "lucide-react-native";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import {
  FIRST_BREATH_DEMO_AUTO_ADVANCE_DELAY_MS,
  FirstBreathDemoScreen,
} from "./first-breath-demo-screen";
import {
  completeOnboardingPersonalizationLocally,
  getOrCreateLocalInstallIdentity,
  loadFirstLaunchOnboardingResumeTarget,
  recordFirstBreathDemoEventLocally,
  recordOnboardingStartedLocally,
} from "./local-first-onboarding";
import type { LocalFirstOnboardingDatabase } from "./local-first-onboarding";
import { OnboardingSplashScreen } from "./onboarding-splash-screen";
import { PersonalizedPlanScreen } from "./personalized-plan-screen";
import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";
import { openMigratedLocalDatabase } from "../storage/local-database";

export const ONBOARDING_FIRST_BREATH_SPLASH_DELAY_MS = 1200;
export const ONBOARDING_PERSONALIZATION_QUESTION_COUNT = onboardingQuestionLimit;
export const ONBOARDING_QUESTION_SCREEN_EXIT_MS = 600;
export const ONBOARDING_DISPLAY_NAME_MAX_LENGTH = 40;
export const FIRST_LAUNCH_DEFAULT_PLAN_ID = "sleep_focused" satisfies OnboardingPlanId;
export const FIRST_LAUNCH_DEFAULT_FIRST_SESSION = {
  durationSeconds: onboardingPlans[FIRST_LAUNCH_DEFAULT_PLAN_ID].firstSession.durationSeconds,
  planId: FIRST_LAUNCH_DEFAULT_PLAN_ID,
  techniqueId: onboardingPlans[FIRST_LAUNCH_DEFAULT_PLAN_ID].firstSession
    .techniqueId as BreathTechniqueId,
} as const;

export type OnboardingFlowStep =
  | "splash"
  | "first-breath-demo"
  | "first-session"
  | "personalization";
type OnboardingPersonalizationQuestionId =
  | "goal"
  | "sleep_baseline"
  | "wind_down_time"
  | "breathwork_familiarity"
  | "display_name";

export type OnboardingPersonalizationAnswers = {
  readonly breathworkFamiliarity: BreathworkFamiliarity;
  readonly completedAt: string;
  readonly displayName: string | undefined;
  readonly goal: OnboardingGoal;
  readonly sleepBaseline: SleepBaseline;
  readonly startedAt: string;
  readonly windDownMinutesAfterMidnight: number;
};

type OnboardingFlowScreenProps = {
  readonly continueAfterPlan?: (plan: PersonalizedOnboardingPlan) => void;
  readonly firstBreathAutoAdvanceDelayMs?: number;
  readonly initialStep?: OnboardingFlowStep;
  readonly loadInitialStep?: () => Promise<OnboardingFlowStep>;
  readonly persistFirstBreathDemoEvent?: (eventType: "started" | "completed") => Promise<void>;
  readonly persistOnboardingStarted?: () => Promise<void>;
  readonly splashDurationMs?: number;
  readonly startDefaultFirstSession?: () => void;
};

type OnboardingPersonalizationFlowScreenProps = {
  readonly continueAfterPlan?: (plan: PersonalizedOnboardingPlan) => void;
  readonly persistAnswers?: (answers: OnboardingPersonalizationAnswers) => Promise<void>;
  readonly screenExitMs?: number;
  readonly startedAt?: string;
};

type PartialPersonalizationAnswers = {
  breathworkFamiliarity: BreathworkFamiliarity;
  displayName: string;
  goal?: OnboardingGoal;
  sleepBaseline: SleepBaseline;
  windDownMinutesAfterMidnight: number;
};

type GoalTile = {
  readonly description: string;
  readonly icon: typeof Moon;
  readonly label: string;
  readonly value: OnboardingGoal;
};

const QUESTION_ORDER = [
  "goal",
  "sleep_baseline",
  "wind_down_time",
  "breathwork_familiarity",
  "display_name",
] as const satisfies readonly OnboardingPersonalizationQuestionId[];

const GOAL_TILES: readonly GoalTile[] = [
  {
    description: "Wind down tonight.",
    icon: Moon,
    label: "Sleep better",
    value: "sleep",
  },
  {
    description: "Find steadier breath.",
    icon: Wind,
    label: "Ease anxiety",
    value: "anxiety",
  },
  {
    description: "Let the day settle.",
    icon: Leaf,
    label: "Reset stress",
    value: "stress",
  },
  {
    description: "Start simple.",
    icon: Sparkles,
    label: "Just exploring",
    value: "curiosity",
  },
] as const;

const SLEEP_SUMMARY_BY_VALUE = {
  1: "Rough most nights",
  2: "Restless most nights",
  3: "Mixed most nights",
  4: "Okay most nights",
  5: "Rested most nights",
} as const satisfies Record<SleepBaseline, string>;

const BREATHWORK_CARD_COPY = {
  yes: {
    description: "Keep cues light.",
    icon: InfinityIcon,
    label: "Yes",
  },
  new_to_me: {
    description: "Guide me gently.",
    icon: CircleDot,
    label: "New to me",
  },
} as const satisfies Record<
  BreathworkFamiliarity,
  {
    readonly description: string;
    readonly icon: typeof CircleDot;
    readonly label: string;
  }
>;

const questionCopy = {
  breathwork_familiarity: {
    eyebrow: "4 of 5",
    subtitle: "We’ll match the guidance to you.",
    title: "Have you tried breathwork before?",
  },
  display_name: {
    eyebrow: "5 of 5",
    subtitle: "You can skip this.",
    title: "What should we call you?",
  },
  goal: {
    eyebrow: "1 of 5",
    subtitle: "We’ll shape your follow-up plan around this.",
    title: "What brings you here?",
  },
  sleep_baseline: {
    eyebrow: "2 of 5",
    subtitle: "A rough sense is enough.",
    title: "How do you sleep most nights?",
  },
  wind_down_time: {
    eyebrow: "3 of 5",
    subtitle: "We’ll time your evening plan around this.",
    title: "When do you usually\nwind down?",
  },
} as const satisfies Record<
  OnboardingPersonalizationQuestionId,
  { readonly eyebrow: string; readonly subtitle: string; readonly title: string }
>;

export function OnboardingFlowScreen({
  continueAfterPlan,
  firstBreathAutoAdvanceDelayMs = FIRST_BREATH_DEMO_AUTO_ADVANCE_DELAY_MS,
  initialStep,
  loadInitialStep = loadInitialOnboardingStepLocally,
  persistFirstBreathDemoEvent = persistFirstBreathDemoEventLocally,
  persistOnboardingStarted = persistOnboardingStartedLocally,
  splashDurationMs = ONBOARDING_FIRST_BREATH_SPLASH_DELAY_MS,
  startDefaultFirstSession,
}: OnboardingFlowScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingFlowStep | "checking">(initialStep ?? "checking");
  const hasRecordedOnboardingStartRef = useRef(false);
  const hasResolvedInitialStepRef = useRef(Boolean(initialStep));
  const hasStartedDefaultFirstSessionRef = useRef(false);
  const onboardingStartedPromiseRef = useRef<Promise<void> | undefined>(undefined);

  const handleStartDefaultFirstSession = useCallback(() => {
    if (startDefaultFirstSession) {
      startDefaultFirstSession();
      return;
    }

    router.replace({
      params: {
        durationSeconds: String(FIRST_LAUNCH_DEFAULT_FIRST_SESSION.durationSeconds),
        firstLaunch: "1",
        planId: FIRST_LAUNCH_DEFAULT_FIRST_SESSION.planId,
        technique: FIRST_LAUNCH_DEFAULT_FIRST_SESSION.techniqueId,
      },
      pathname: "/breathe/[technique]",
    } as Href);
  }, [router, startDefaultFirstSession]);

  const handleContinueAfterPlan = useCallback(
    (plan: PersonalizedOnboardingPlan) => {
      if (continueAfterPlan) {
        continueAfterPlan(plan);
        return;
      }

      router.replace("/post-value");
    },
    [continueAfterPlan, router],
  );

  useEffect(() => {
    if (hasResolvedInitialStepRef.current) {
      return;
    }

    let isMounted = true;

    loadInitialStep()
      .then((nextStep) => {
        if (!isMounted) {
          return;
        }

        hasResolvedInitialStepRef.current = true;
        setStep(nextStep);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        hasResolvedInitialStepRef.current = true;
        setStep("splash");
      });

    return () => {
      isMounted = false;
    };
  }, [loadInitialStep]);

  useEffect(() => {
    if (step !== "splash") {
      return;
    }

    if (!hasRecordedOnboardingStartRef.current) {
      hasRecordedOnboardingStartRef.current = true;
      onboardingStartedPromiseRef.current = persistOnboardingStarted().catch(() => undefined);
    }

    const splashTimer = setTimeout(() => {
      setStep("first-breath-demo");
    }, splashDurationMs);

    return () => {
      clearTimeout(splashTimer);
    };
  }, [persistOnboardingStarted, splashDurationMs, step]);

  useEffect(() => {
    if (step !== "first-session" || hasStartedDefaultFirstSessionRef.current) {
      return;
    }

    hasStartedDefaultFirstSessionRef.current = true;
    handleStartDefaultFirstSession();
  }, [handleStartDefaultFirstSession, step]);

  const handleFirstBreathComplete = useCallback(() => {
    setStep("first-session");
  }, []);
  const handleFirstBreathEvent = useCallback(
    async (eventType: "started" | "completed") => {
      await onboardingStartedPromiseRef.current;
      await persistFirstBreathDemoEvent(eventType);
    },
    [persistFirstBreathDemoEvent],
  );
  if (step === "checking" || step === "splash" || step === "first-session") {
    return <OnboardingSplashScreen />;
  }

  if (step === "personalization") {
    return <OnboardingPersonalizationFlowScreen continueAfterPlan={handleContinueAfterPlan} />;
  }

  return (
    <FirstBreathDemoScreen
      autoAdvanceDelayMs={firstBreathAutoAdvanceDelayMs}
      onBreathComplete={() => handleFirstBreathEvent("completed")}
      onComplete={handleFirstBreathComplete}
      onStarted={() => handleFirstBreathEvent("started")}
    />
  );
}

export function OnboardingPersonalizationFlowScreen({
  continueAfterPlan = () => undefined,
  persistAnswers = persistOnboardingAnswersLocally,
  screenExitMs = ONBOARDING_QUESTION_SCREEN_EXIT_MS,
  startedAt: startedAtOverride,
}: OnboardingPersonalizationFlowScreenProps) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    reduceMotionPreference.isResolved && reduceMotionPreference.reduceMotionEnabled;
  const startedAt = useRef(startedAtOverride ?? new Date().toISOString()).current;
  const entryProgress = useRef(new Animated.Value(0)).current;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PartialPersonalizationAnswers>({
    breathworkFamiliarity: "new_to_me",
    displayName: "",
    sleepBaseline: 4,
    windDownMinutesAfterMidnight: 22 * 60 + 30,
  });
  const [nameError, setNameError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personalizedPlan, setPersonalizedPlan] = useState<
    PersonalizedOnboardingPlan | undefined
  >();
  const currentQuestionId = QUESTION_ORDER[currentQuestionIndex] ?? "goal";
  const isLastQuestion = currentQuestionId === "display_name";
  const currentCopy = questionCopy[currentQuestionId];

  const contentTranslateY = entryProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  useEffect(() => {
    entryProgress.stopAnimation();
    entryProgress.setValue(0);
    Animated.timing(entryProgress, {
      duration: reduceMotionEnabled ? 0 : motion.duration.screenEnterMs,
      easing: Easing.out(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex, entryProgress, reduceMotionEnabled]);

  const completeOrAdvance = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    if (!isLastQuestion) {
      Animated.timing(entryProgress, {
        duration: reduceMotionEnabled ? 0 : screenExitMs,
        easing: Easing.in(Easing.ease),
        toValue: 0,
        useNativeDriver: true,
      }).start();

      const exitTimer = setTimeout(
        () => {
          setCurrentQuestionIndex((previousQuestionIndex) => previousQuestionIndex + 1);
        },
        reduceMotionEnabled ? 0 : screenExitMs,
      );

      return () => {
        clearTimeout(exitTimer);
      };
    }

    const parsedDisplayName = validateDisplayName(answers.displayName);

    if (!parsedDisplayName.isValid) {
      setNameError(parsedDisplayName.message);
      return;
    }

    if (!answers.goal) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const completedAnswers = {
        breathworkFamiliarity: answers.breathworkFamiliarity,
        completedAt: new Date().toISOString(),
        displayName:
          parsedDisplayName.displayName.length > 0 ? parsedDisplayName.displayName : undefined,
        goal: answers.goal,
        sleepBaseline: answers.sleepBaseline,
        startedAt,
        windDownMinutesAfterMidnight: answers.windDownMinutesAfterMidnight,
      };
      const nextPlan = createPersonalizedOnboardingPlan(completedAnswers);

      await persistAnswers(completedAnswers);
      setPersonalizedPlan(nextPlan);
    } catch {
      setSubmitError("We couldn’t save this locally yet. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    answers,
    entryProgress,
    isLastQuestion,
    isSubmitting,
    persistAnswers,
    reduceMotionEnabled,
    screenExitMs,
    startedAt,
  ]);

  const canContinue = useMemo(() => {
    if (isSubmitting) {
      return false;
    }

    if (currentQuestionId === "goal") {
      return Boolean(answers.goal);
    }

    if (currentQuestionId === "display_name") {
      return answers.displayName.trim().length > 0;
    }

    return true;
  }, [answers.displayName, answers.goal, currentQuestionId, isSubmitting]);

  if (personalizedPlan) {
    return (
      <PersonalizedPlanScreen
        ctaLabel="Continue"
        localProofChipLabel="Saved locally"
        onContinue={continueAfterPlan}
        plan={personalizedPlan}
        screenExitMs={screenExitMs}
        sessionEyebrow="Next session"
        statusLabel={getFollowUpPlanStatusLabel(personalizedPlan.greeting)}
      />
    );
  }

  return (
    <View style={styles.screen} testID="onboarding-personalization-flow-entry">
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: "100%",
            paddingBottom: Math.max(safeAreaInsets.bottom + spacing.lg, 48),
            paddingTop: Math.max(safeAreaInsets.top + 28, 56),
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="onboarding-personalization-scroll"
      >
        <Animated.View
          style={[
            styles.questionScreen,
            {
              opacity: entryProgress,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <QuestionHeader
            currentQuestionIndex={currentQuestionIndex}
            isOpeningQuestion={currentQuestionId === "goal"}
            subtitle={currentCopy.subtitle}
            title={currentCopy.title}
          />

          <View style={styles.questionBody}>
            {currentQuestionId === "goal" ? (
              <GoalQuestion
                selectedGoal={answers.goal}
                setSelectedGoal={(goal) => {
                  setAnswers((previousAnswers) => ({ ...previousAnswers, goal }));
                }}
              />
            ) : null}

            {currentQuestionId === "sleep_baseline" ? (
              <SleepBaselineQuestion
                selectedBaseline={answers.sleepBaseline}
                setSelectedBaseline={(sleepBaseline) => {
                  setAnswers((previousAnswers) => ({ ...previousAnswers, sleepBaseline }));
                }}
              />
            ) : null}

            {currentQuestionId === "wind_down_time" ? (
              <WindDownTimeQuestion
                selectedMinutes={answers.windDownMinutesAfterMidnight}
                setSelectedMinutes={(windDownMinutesAfterMidnight) => {
                  setAnswers((previousAnswers) => ({
                    ...previousAnswers,
                    windDownMinutesAfterMidnight,
                  }));
                }}
              />
            ) : null}

            {currentQuestionId === "breathwork_familiarity" ? (
              <BreathworkFamiliarityQuestion
                selectedFamiliarity={answers.breathworkFamiliarity}
                setSelectedFamiliarity={(breathworkFamiliarity) => {
                  setAnswers((previousAnswers) => ({
                    ...previousAnswers,
                    breathworkFamiliarity,
                  }));
                }}
              />
            ) : null}

            {currentQuestionId === "display_name" ? (
              <DisplayNameQuestion
                nameError={nameError}
                setDisplayName={(displayName) => {
                  setNameError(undefined);
                  setAnswers((previousAnswers) => ({ ...previousAnswers, displayName }));
                }}
                value={answers.displayName}
              />
            ) : null}
          </View>

          <View style={styles.footer}>
            {submitError ? (
              <Text accessibilityRole="alert" selectable style={styles.errorText}>
                {submitError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canContinue }}
              disabled={!canContinue}
              onPress={() => {
                void completeOrAdvance();
              }}
              style={({ pressed }) => [
                styles.continueButton,
                isLastQuestion && answers.displayName.trim().length > 0 && styles.primaryButton,
                !canContinue && styles.disabledButton,
                pressed && canContinue ? styles.ctaPressed : null,
              ]}
            >
              <Text
                selectable={false}
                style={[
                  styles.continueButtonText,
                  !canContinue && styles.disabledButtonText,
                  isLastQuestion &&
                    answers.displayName.trim().length > 0 &&
                    styles.primaryButtonText,
                ]}
              >
                {isSubmitting ? "Saving" : "Continue"}
              </Text>
            </Pressable>

            {isLastQuestion ? (
              <Pressable
                accessibilityHint="Skip name personalization and continue with non-personal copy."
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => {
                  setNameError(undefined);
                  setAnswers((previousAnswers) => ({ ...previousAnswers, displayName: "" }));
                  void submitSkippedName({
                    answers,
                    persistAnswers,
                    setPersonalizedPlan,
                    setIsSubmitting,
                    setSubmitError,
                    startedAt,
                  });
                }}
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed && !isSubmitting ? styles.skipButtonPressed : null,
                ]}
              >
                <Text selectable={false} style={styles.skipButtonText}>
                  Skip for now
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

async function persistOnboardingAnswersLocally(
  answers: OnboardingPersonalizationAnswers,
): Promise<void> {
  const database = await openMigratedLocalDatabase();
  const localDatabase: LocalFirstOnboardingDatabase = {
    getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
    runAsync: (source, params = []) => database.runAsync(source, [...params]),
  };
  const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });

  await completeOnboardingPersonalizationLocally(localDatabase, {
    ...answers,
    localInstallId,
  });
  captureAnalyticsEventDeferred("onboarding_completed");
}

async function loadInitialOnboardingStepLocally(): Promise<OnboardingFlowStep> {
  const database = await openMigratedLocalDatabase();
  const localDatabase: LocalFirstOnboardingDatabase = {
    getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
    runAsync: (source, params = []) => database.runAsync(source, [...params]),
  };
  const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
  const resumeTarget = await loadFirstLaunchOnboardingResumeTarget(localDatabase, {
    localInstallId,
  });

  if (resumeTarget === "first-session" || resumeTarget === "personalization") {
    return resumeTarget;
  }

  return "splash";
}

function getFollowUpPlanStatusLabel(greeting: string): string {
  return greeting.replace("first session", "follow-up plan");
}

async function persistOnboardingStartedLocally(): Promise<void> {
  const database = await openMigratedLocalDatabase();
  const localDatabase: LocalFirstOnboardingDatabase = {
    getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
    runAsync: (source, params = []) => database.runAsync(source, [...params]),
  };
  const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
  const startedAt = new Date().toISOString();

  await recordOnboardingStartedLocally(localDatabase, {
    localInstallId,
    startedAt,
  });
  captureAnalyticsEventDeferred("onboarding_started");
}

async function persistFirstBreathDemoEventLocally(
  eventType: "started" | "completed",
): Promise<void> {
  const database = await openMigratedLocalDatabase();
  const localDatabase: LocalFirstOnboardingDatabase = {
    getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
    runAsync: (source, params = []) => database.runAsync(source, [...params]),
  };
  const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });

  await recordFirstBreathDemoEventLocally(localDatabase, {
    elapsedSeconds: eventType === "started" ? 0 : 30,
    eventType,
    localInstallId,
    occurredAt: new Date().toISOString(),
  });
  captureAnalyticsEventDeferred(
    eventType === "started" ? "first_breath_started" : "first_breath_completed",
  );
}

function validateDisplayName(
  displayName: string,
):
  | { readonly displayName: string; readonly isValid: true }
  | { readonly isValid: false; readonly message: string } {
  const trimmedDisplayName = displayName.trim();

  if (trimmedDisplayName.length > ONBOARDING_DISPLAY_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      message: "Use 40 characters or fewer.",
    };
  }

  const hasControlCharacter = Array.from(trimmedDisplayName).some((character) => {
    const characterCode = character.charCodeAt(0);

    return characterCode <= 31 || characterCode === 127;
  });

  if (hasControlCharacter) {
    return {
      isValid: false,
      message: "Use a name without control characters.",
    };
  }

  return {
    displayName: trimmedDisplayName,
    isValid: true,
  };
}

async function submitSkippedName({
  answers,
  persistAnswers,
  setPersonalizedPlan,
  setIsSubmitting,
  setSubmitError,
  startedAt,
}: {
  readonly answers: PartialPersonalizationAnswers;
  readonly persistAnswers: (answers: OnboardingPersonalizationAnswers) => Promise<void>;
  readonly setPersonalizedPlan: (plan: PersonalizedOnboardingPlan) => void;
  readonly setIsSubmitting: (isSubmitting: boolean) => void;
  readonly setSubmitError: (message: string | undefined) => void;
  readonly startedAt: string;
}): Promise<void> {
  if (!answers.goal) {
    return;
  }

  setIsSubmitting(true);
  setSubmitError(undefined);

  try {
    const completedAnswers = {
      breathworkFamiliarity: answers.breathworkFamiliarity,
      completedAt: new Date().toISOString(),
      displayName: undefined,
      goal: answers.goal,
      sleepBaseline: answers.sleepBaseline,
      startedAt,
      windDownMinutesAfterMidnight: answers.windDownMinutesAfterMidnight,
    };
    const nextPlan = createPersonalizedOnboardingPlan(completedAnswers);

    await persistAnswers(completedAnswers);
    setPersonalizedPlan(nextPlan);
  } catch {
    setSubmitError("We couldn’t save this locally yet. Try again.");
  } finally {
    setIsSubmitting(false);
  }
}

function QuestionHeader({
  currentQuestionIndex,
  isOpeningQuestion,
  subtitle,
  title,
}: {
  readonly currentQuestionIndex: number;
  readonly isOpeningQuestion: boolean;
  readonly subtitle: string;
  readonly title: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.progressRow}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.progressTrack}
        >
          {QUESTION_ORDER.map((questionId, index) => (
            <View
              key={questionId}
              style={[
                styles.progressSegment,
                index <= currentQuestionIndex && styles.progressSegmentActive,
                index === currentQuestionIndex &&
                  currentQuestionIndex === QUESTION_ORDER.length - 1 &&
                  styles.progressSegmentCurrentFinal,
              ]}
            />
          ))}
        </View>
        <Text selectable style={styles.progressText}>
          {currentQuestionIndex + 1} of {ONBOARDING_PERSONALIZATION_QUESTION_COUNT}
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        selectable
        style={[styles.title, isOpeningQuestion && styles.openingTitle]}
      >
        {title}
      </Text>
      <Text selectable style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function GoalQuestion({
  selectedGoal,
  setSelectedGoal,
}: {
  readonly selectedGoal: OnboardingGoal | undefined;
  readonly setSelectedGoal: (goal: OnboardingGoal) => void;
}) {
  return (
    <View style={styles.goalGrid}>
      {GOAL_TILES.map((tile) => {
        const Icon = tile.icon;
        const isSelected = selectedGoal === tile.value;

        return (
          <Pressable
            accessibilityHint={tile.description}
            accessibilityLabel={`${tile.label}. ${tile.description}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={tile.value}
            onPress={() => {
              setSelectedGoal(tile.value);
            }}
            style={({ pressed }) => [
              styles.goalTile,
              isSelected && styles.selectedGoalTile,
              pressed ? styles.tilePressed : null,
            ]}
          >
            <View style={[styles.goalIconCircle, isSelected && styles.selectedIconCircle]}>
              <Icon
                color={isSelected ? colors.dark.primaryGlow.value : colors.dark.textSecondary.value}
                size={23}
              />
            </View>
            <View style={styles.goalCopy}>
              <Text selectable={false} style={styles.goalTileTitle}>
                {tile.label}
              </Text>
              <Text
                selectable={false}
                style={[styles.goalTileSubtitle, isSelected && styles.selectedSubcopy]}
              >
                {tile.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function SleepBaselineQuestion({
  selectedBaseline,
  setSelectedBaseline,
}: {
  readonly selectedBaseline: SleepBaseline;
  readonly setSelectedBaseline: (baseline: SleepBaseline) => void;
}) {
  return (
    <View style={styles.scaleCard}>
      <View pointerEvents="none" style={styles.scaleTrack} />
      <View style={styles.scaleRow}>
        {sleepBaselineOptions.map((option) => {
          const isSelected = selectedBaseline === option.value;

          return (
            <Pressable
              accessibilityHint={SLEEP_SUMMARY_BY_VALUE[option.value]}
              accessibilityLabel={`Sleep baseline ${option.value}, ${option.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.value}
              onPress={() => {
                setSelectedBaseline(option.value);
              }}
              style={({ pressed }) => [styles.scalePoint, pressed ? styles.scalePressed : null]}
            >
              <View style={[styles.scaleBubble, isSelected && styles.scaleBubbleSelected]}>
                <Text
                  selectable={false}
                  style={[styles.scaleNumber, isSelected && styles.scaleNumberSelected]}
                >
                  {option.value}
                </Text>
              </View>
              <Text
                selectable={false}
                style={[styles.scaleLabel, isSelected && styles.scaleLabelSelected]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.cardDivider} />
      <Text selectable style={styles.scaleSummary}>
        {SLEEP_SUMMARY_BY_VALUE[selectedBaseline]}
      </Text>
    </View>
  );
}

function WindDownTimeQuestion({
  selectedMinutes,
  setSelectedMinutes,
}: {
  readonly selectedMinutes: number;
  readonly setSelectedMinutes: (minutes: number) => void;
}) {
  const selectedHour = Math.floor(selectedMinutes / 60);
  const selectedMinute = selectedMinutes % 60;
  const normalizedHour = selectedHour > 12 ? selectedHour - 12 : selectedHour;
  const previousMinute = selectedMinute === 0 ? 55 : selectedMinute - 5;
  const nextMinute = selectedMinute === 55 ? 0 : selectedMinute + 5;
  const previousHour = normalizedHour === 1 ? 12 : normalizedHour - 1;
  const nextHour = normalizedHour === 12 ? 1 : normalizedHour + 1;

  return (
    <View style={styles.timeCard}>
      <View style={styles.presetRow}>
        {windDownTimePresets.map((preset) => {
          const isSelected = selectedMinutes === preset.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={preset.value}
              onPress={() => {
                setSelectedMinutes(preset.value);
              }}
              style={({ pressed }) => [
                styles.presetButton,
                isSelected && styles.presetButtonSelected,
                pressed ? styles.presetPressed : null,
              ]}
            >
              <Text
                selectable={false}
                style={[styles.presetText, isSelected && styles.presetTextSelected]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        accessibilityLabel={`Selected wind-down time ${formatWindDownTime(selectedMinutes)}`}
        accessibilityRole="adjustable"
        style={styles.timeWheel}
      >
        <View style={styles.timeHighlightBand} />
        <View style={styles.timeFadeTop} />
        <View style={styles.timeFadeBottom} />
        <View style={styles.timeColumn}>
          <TimeWheelValue dimmed value={padTimeNumber(previousHour)} />
          <TimeWheelValue large value={padTimeNumber(normalizedHour)} />
          <TimeWheelValue dimmed value={padTimeNumber(nextHour)} />
        </View>
        <Text selectable={false} style={styles.timeColon}>
          :
        </Text>
        <View style={styles.timeColumn}>
          <TimeWheelValue dimmed value={padTimeNumber(previousMinute)} />
          <TimeWheelValue large value={padTimeNumber(selectedMinute)} />
          <TimeWheelValue dimmed value={padTimeNumber(nextMinute)} />
        </View>
        <View style={styles.periodColumn}>
          <Text selectable={false} style={styles.periodHidden}>
            PM
          </Text>
          <Text selectable={false} style={styles.periodText}>
            PM
          </Text>
          <Text selectable={false} style={styles.periodHidden}>
            AM
          </Text>
        </View>
      </View>

      <View style={styles.timeDivider} />
      <Text selectable style={styles.timeCaption}>
        Usually around {formatWindDownTime(selectedMinutes)}
      </Text>
    </View>
  );
}

function TimeWheelValue({
  dimmed = false,
  large = false,
  value,
}: {
  readonly dimmed?: boolean;
  readonly large?: boolean;
  readonly value: string;
}) {
  return (
    <Text
      selectable={false}
      style={[styles.timeValue, dimmed && styles.timeValueDimmed, large && styles.timeValueLarge]}
    >
      {value}
    </Text>
  );
}

function BreathworkFamiliarityQuestion({
  selectedFamiliarity,
  setSelectedFamiliarity,
}: {
  readonly selectedFamiliarity: BreathworkFamiliarity;
  readonly setSelectedFamiliarity: (familiarity: BreathworkFamiliarity) => void;
}) {
  return (
    <View style={styles.choiceStack}>
      {breathworkFamiliarityOptions.map((option) => {
        const optionCopy = BREATHWORK_CARD_COPY[option.value];
        const Icon = optionCopy.icon;
        const isSelected = selectedFamiliarity === option.value;

        return (
          <Pressable
            accessibilityHint={optionCopy.description}
            accessibilityLabel={`${optionCopy.label}. ${optionCopy.description}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => {
              setSelectedFamiliarity(option.value);
            }}
            style={({ pressed }) => [
              styles.choiceCard,
              isSelected && styles.choiceCardSelected,
              pressed ? styles.tilePressed : null,
            ]}
          >
            <View style={[styles.choiceIconCircle, isSelected && styles.selectedIconCircle]}>
              <Icon
                color={isSelected ? colors.dark.primaryGlow.value : colors.dark.textTertiary.value}
                size={24}
              />
            </View>
            <View style={styles.choiceCopy}>
              <Text selectable={false} style={styles.choiceLabel}>
                {optionCopy.label}
              </Text>
              <Text selectable={false} style={styles.choiceDescription}>
                {optionCopy.description}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function DisplayNameQuestion({
  nameError,
  setDisplayName,
  value,
}: {
  readonly nameError: string | undefined;
  readonly setDisplayName: (displayName: string) => void;
  readonly value: string;
}) {
  return (
    <View style={styles.nameStack}>
      <View style={[styles.inputShell, nameError && styles.inputShellError]}>
        <UserRound color={colors.dark.textTertiary.value} size={22} />
        <TextInput
          accessibilityHint="Optional. Used only to personalize greetings."
          accessibilityLabel="Display name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={ONBOARDING_DISPLAY_NAME_MAX_LENGTH}
          onChangeText={setDisplayName}
          placeholder="Name"
          placeholderTextColor={colors.dark.textTertiary.value}
          spellCheck={false}
          style={styles.nameInput}
          value={value}
        />
      </View>
      {nameError ? (
        <Text accessibilityRole="alert" selectable style={styles.errorText}>
          {nameError}
        </Text>
      ) : null}
      <View style={styles.privacyLine}>
        <ShieldCheck color={colors.dark.textTertiary.value} size={16} />
        <Text selectable style={styles.privacyText}>
          Only used to personalize greetings.
        </Text>
      </View>
    </View>
  );
}

function formatWindDownTime(minutesAfterMidnight: number): string {
  const hour24 = Math.floor(minutesAfterMidnight / 60);
  const minute = minutesAfterMidnight % 60;
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;

  return `${hour12}:${padTimeNumber(minute)} PM`;
}

function padTimeNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  scrollContent: {
    backgroundColor: colors.dark.background.value,
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  questionScreen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 0,
    paddingBottom: spacing.md,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  progressTrack: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    width: 86,
  },
  progressSegment: {
    backgroundColor: "#232743",
    borderRadius: 999,
    flex: 1,
    height: 4,
  },
  progressSegmentActive: {
    backgroundColor: colors.dark.primaryGlow.value,
  },
  progressSegmentCurrentFinal: {
    backgroundColor: colors.dark.textPrimary.value,
  },
  progressText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 30,
    marginBottom: 12,
  },
  openingTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 23,
  },
  questionBody: {
    flex: 1,
    paddingTop: 10,
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  goalTile: {
    backgroundColor: colors.dark.surface.value,
    borderColor: "transparent",
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    flexBasis: "47.2%",
    flexGrow: 1,
    minHeight: 145,
    overflow: "hidden",
    padding: 18,
  },
  selectedGoalTile: {
    backgroundColor: "#1A1E36",
    borderColor: "rgba(168, 156, 224, 0.35)",
    boxShadow: "inset 0 0 0 1px rgba(168,156,224,0.2), 0 8px 20px rgba(168,156,224,0.08)",
  },
  tilePressed: {
    transform: [{ scale: 0.96 }],
  },
  goalIconCircle: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderRadius: 24,
    height: 44,
    justifyContent: "center",
    marginBottom: 26,
    width: 44,
  },
  selectedIconCircle: {
    backgroundColor: "rgba(124, 111, 205, 0.18)",
    boxShadow: "0 0 16px rgba(124, 111, 205, 0.22)",
  },
  goalCopy: {
    gap: 6,
  },
  goalTileTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },
  goalTileSubtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
  selectedSubcopy: {
    color: "#B5B9D1",
  },
  scaleCard: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderCurve: "continuous",
    borderRadius: 32,
    minHeight: 162,
    overflow: "hidden",
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 30,
    position: "relative",
  },
  scaleTrack: {
    backgroundColor: "#232743",
    borderRadius: 999,
    height: 2,
    left: "14%",
    position: "absolute",
    right: "14%",
    top: 53,
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    zIndex: 1,
  },
  scalePoint: {
    alignItems: "center",
    gap: 8,
    minHeight: 72,
    minWidth: 52,
  },
  scalePressed: {
    transform: [{ scale: 0.95 }],
  },
  scaleBubble: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  scaleBubbleSelected: {
    borderColor: "rgba(168,156,224,0.52)",
    borderWidth: 1,
    boxShadow: "0 0 22px rgba(168,156,224,0.35), 0 8px 20px rgba(124,111,205,0.15)",
    transform: [{ scale: 1.12 }],
  },
  scaleNumber: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0,
    lineHeight: 24,
  },
  scaleNumberSelected: {
    color: colors.dark.textPrimary.value,
  },
  scaleLabel: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 15,
    textAlign: "center",
  },
  scaleLabelSelected: {
    color: colors.dark.primaryGlow.value,
  },
  cardDivider: {
    backgroundColor: "#232743",
    height: 1,
    marginBottom: 12,
    marginTop: 20,
    opacity: 0.72,
    width: "80%",
  },
  scaleSummary: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
  },
  timeCard: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderCurve: "continuous",
    borderRadius: 32,
    minHeight: 333,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  presetRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 28,
    width: "100%",
  },
  presetButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 82,
    paddingHorizontal: 12,
  },
  presetButtonSelected: {
    borderColor: "rgba(168,156,224,0.54)",
    boxShadow: "0 4px 12px rgba(124,111,205,0.15)",
  },
  presetPressed: {
    transform: [{ scale: 0.96 }],
  },
  presetText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 18,
  },
  presetTextSelected: {
    color: colors.dark.textPrimary.value,
  },
  timeWheel: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    height: 180,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: 260,
  },
  timeHighlightBand: {
    backgroundColor: colors.dark.surfaceRaised.value,
    borderColor: "rgba(168,156,224,0.24)",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: "0 8px 20px rgba(124,111,205,0.1)",
    height: 58,
    left: 0,
    position: "absolute",
    right: 0,
    top: 61,
  },
  timeFadeTop: {
    backgroundColor: "rgba(20, 23, 43, 0.84)",
    height: 58,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 2,
  },
  timeFadeBottom: {
    backgroundColor: "rgba(20, 23, 43, 0.84)",
    bottom: 0,
    height: 58,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 2,
  },
  timeColumn: {
    alignItems: "center",
    gap: 22,
    width: 54,
    zIndex: 3,
  },
  timeValue: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.data.light,
    fontSize: 38,
    fontVariant: ["tabular-nums"],
    height: 48,
    letterSpacing: 0,
    lineHeight: 48,
    textAlign: "center",
  },
  timeValueDimmed: {
    color: "#676C88",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 22,
    height: 24,
    lineHeight: 24,
  },
  timeValueLarge: {
    color: "rgba(238, 240, 255, 0.92)",
  },
  timeColon: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.light,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    lineHeight: 40,
    marginHorizontal: 14,
    paddingBottom: 4,
    zIndex: 3,
  },
  periodColumn: {
    alignItems: "center",
    gap: 22,
    width: 46,
    zIndex: 3,
  },
  periodText: {
    color: "rgba(238, 240, 255, 0.92)",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 20,
    height: 48,
    letterSpacing: 0,
    lineHeight: 48,
  },
  periodHidden: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 18,
    height: 24,
    lineHeight: 24,
    opacity: 0,
  },
  timeDivider: {
    backgroundColor: "#232743",
    height: 1,
    marginBottom: 16,
    marginTop: 26,
    opacity: 0.72,
    width: "80%",
  },
  timeCaption: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 20,
  },
  choiceStack: {
    gap: 16,
  },
  choiceCard: {
    alignItems: "flex-start",
    backgroundColor: colors.dark.surface.value,
    borderColor: "transparent",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 18,
    minHeight: 84,
    padding: 20,
  },
  choiceCardSelected: {
    backgroundColor: "#16192E",
    borderColor: "rgba(168,156,224,0.34)",
    boxShadow: "0 8px 24px rgba(168,156,224,0.13)",
  },
  choiceIconCircle: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  choiceCopy: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  choiceLabel: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 17,
    letterSpacing: 0,
    lineHeight: 22,
  },
  choiceDescription: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 18,
  },
  nameStack: {
    gap: 14,
    paddingTop: 24,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: "transparent",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    height: 64,
    paddingHorizontal: 20,
  },
  inputShellError: {
    borderColor: "rgba(255,107,107,0.54)",
  },
  nameInput: {
    color: colors.dark.textPrimary.value,
    flex: 1,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 24,
    minHeight: 44,
    padding: 0,
  },
  privacyLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
  },
  privacyText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 18,
  },
  errorText: {
    color: colors.dark.danger.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
  footer: {
    gap: 10,
    marginTop: "auto",
    paddingTop: spacing.lg,
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: colors.dark.surfaceRaised.value,
    borderCurve: "continuous",
    borderRadius: 20,
    height: 52,
    justifyContent: "center",
    width: "100%",
  },
  primaryButton: {
    backgroundColor: colors.dark.primary.value,
    boxShadow: "0 8px 20px rgba(124,111,205,0.25)",
  },
  disabledButton: {
    opacity: 0.46,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },
  primaryButtonText: {
    color: colors.dark.textPrimary.value,
  },
  disabledButtonText: {
    color: "rgba(138,143,168,0.7)",
  },
  skipButton: {
    alignItems: "center",
    borderRadius: 20,
    height: 44,
    justifyContent: "center",
  },
  skipButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  skipButtonText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },
});
