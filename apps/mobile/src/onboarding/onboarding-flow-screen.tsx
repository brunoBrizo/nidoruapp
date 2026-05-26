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
import { colors, motion } from "@nidoru/ui-tokens";
import { StatusBar } from "expo-status-bar";
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
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
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
import { Pressable, ReactNativeAnimatedView, ScrollView, Text, TextInput, View, cn } from "../tw";

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
    // The PNG reference was pre-session; these labels keep the same layout while reflecting
    // that personalization now happens after the first full-session reward moment.
    return (
      <PersonalizedPlanScreen
        ctaLabel="Let’s start"
        localProofChipLabel="No account needed"
        onContinue={continueAfterPlan}
        plan={personalizedPlan}
        screenExitMs={screenExitMs}
        sessionEyebrow="Next session"
        statusLabel={getFollowUpPlanStatusLabel(personalizedPlan.greeting)}
      />
    );
  }

  return (
    <View className="flex-1 bg-nidoru-dark-background" testID="onboarding-question-shell">
      <View
        className="absolute inset-0"
        pointerEvents="none"
        testID="onboarding-personalization-flow-entry"
      />
      <StatusBar hidden />
      <ScrollView
        bounces={false}
        className="flex-1 bg-nidoru-dark-background"
        contentContainerClassName="min-h-full bg-nidoru-dark-background"
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        testID="onboarding-personalization-scroll"
      >
        <ReactNativeAnimatedView
          className="flex-1 px-nidoru-screen"
          style={{
            opacity: entryProgress,
            paddingBottom: Math.max(safeAreaInsets.bottom + 32, 48),
            paddingTop: 56,
            transform: [{ translateY: contentTranslateY }],
          }}
          testID="onboarding-question-content"
        >
          <QuestionHeader
            currentQuestionIndex={currentQuestionIndex}
            isOpeningQuestion={currentQuestionId === "goal"}
            questionId={currentQuestionId}
            subtitle={currentCopy.subtitle}
            title={currentCopy.title}
          />

          <View className="flex-1 pt-2.5">
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

          <View className="mt-auto gap-2.5 pt-8">
            {submitError ? (
              <Text
                accessibilityRole="alert"
                className="font-nidoru-primary-semibold text-[13px] leading-[18px] text-nidoru-dark-danger"
                selectable
              >
                {submitError}
              </Text>
            ) : null}

            <OnboardingContinueButton
              disabled={!canContinue}
              hiddenUntilReady={currentQuestionId === "goal"}
              isLoading={isSubmitting}
              onPress={() => {
                void completeOrAdvance();
              }}
              primary={isLastQuestion && answers.displayName.trim().length > 0}
              testID="onboarding-continue-cta"
            />

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
                className={cn(
                  "h-11 items-center justify-center rounded-[20px] active:scale-[0.98]",
                  answers.displayName.trim().length > 0
                    ? "text-nidoru-dark-text-tertiary"
                    : "text-nidoru-dark-text-secondary",
                )}
              >
                <Text
                  className={cn(
                    "font-nidoru-primary-semibold text-base leading-[22px]",
                    answers.displayName.trim().length > 0
                      ? "text-nidoru-dark-text-tertiary"
                      : "text-nidoru-dark-text-secondary",
                  )}
                  selectable={false}
                >
                  Skip for now
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ReactNativeAnimatedView>
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
  questionId,
  subtitle,
  title,
}: {
  readonly currentQuestionIndex: number;
  readonly isOpeningQuestion: boolean;
  readonly questionId: OnboardingPersonalizationQuestionId;
  readonly subtitle: string;
  readonly title: string;
}) {
  return (
    <View className="pb-6">
      <View className="mb-8 w-full flex-row items-center justify-between">
        <View
          accessibilityElementsHidden
          className="w-24 flex-row items-center gap-1.5"
          importantForAccessibility="no-hide-descendants"
          testID="onboarding-progress-track"
        >
          {QUESTION_ORDER.map((questionId, index) => (
            <ProgressSegment
              currentQuestionIndex={currentQuestionIndex}
              index={index}
              key={questionId}
              questionId={questionId}
            />
          ))}
        </View>
        <Text
          className="font-nidoru-primary-regular text-[13px] leading-[18px] text-nidoru-dark-text-secondary"
          selectable
        >
          {currentQuestionIndex + 1} of {ONBOARDING_PERSONALIZATION_QUESTION_COUNT}
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        className={cn(
          "mb-3 font-nidoru-primary-semibold tracking-normal text-nidoru-dark-text-primary",
          isOpeningQuestion ? "text-[28px] leading-[34px]" : "text-2xl leading-[30px]",
        )}
        selectable
      >
        {title}
      </Text>
      <Text
        className={cn(
          "font-nidoru-primary-regular tracking-normal text-nidoru-dark-text-secondary",
          questionId === "breathwork_familiarity" ? "text-[15px]" : "text-base",
          isOpeningQuestion ? "leading-[24px]" : "leading-[23px]",
        )}
        selectable
      >
        {subtitle}
      </Text>
    </View>
  );
}

function ProgressSegment({
  currentQuestionIndex,
  index,
  questionId,
}: {
  readonly currentQuestionIndex: number;
  readonly index: number;
  readonly questionId: OnboardingPersonalizationQuestionId;
}) {
  const isCurrentFinal =
    index === currentQuestionIndex && currentQuestionIndex === QUESTION_ORDER.length - 1;
  const isActive = index <= currentQuestionIndex;

  return (
    <View
      className={cn(
        "h-1 flex-1 rounded-full",
        isCurrentFinal ? "bg-[#EEF0FF]" : isActive ? "bg-[#A89CE0]" : "bg-[#232743]",
      )}
      testID={`onboarding-progress-segment-${questionId}`}
    />
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
    <View className="flex-1 flex-row flex-wrap content-start gap-4">
      {GOAL_TILES.map((tile) => {
        const Icon = tile.icon;
        const isSelected = selectedGoal === tile.value;

        return (
          <OnboardingSelectionTile
            accessibilityHint={tile.description}
            accessibilityLabel={`${tile.label}. ${tile.description}`}
            accessibilityState={{ selected: isSelected }}
            className={cn(
              "min-h-[145px] grow basis-[47.2%] flex-col p-5",
              isSelected
                ? "border-[#A89CE0]/35 bg-[#1A1E36] shadow-[inset_0_0_0_1px_rgba(168,156,224,0.25),0_8px_20px_rgba(168,156,224,0.08)]"
                : null,
            )}
            key={tile.value}
            onPress={() => {
              setSelectedGoal(tile.value);
            }}
          >
            <SelectionIconCircle selected={isSelected}>
              <Icon
                color={isSelected ? colors.dark.primaryGlow.value : colors.dark.textSecondary.value}
                size={23}
              />
            </SelectionIconCircle>
            <View className="mt-6 gap-1">
              <Text
                className="font-nidoru-primary-semibold text-base leading-[22px] text-nidoru-dark-text-primary"
                selectable={false}
              >
                {tile.label}
              </Text>
              <Text
                className={cn(
                  "font-nidoru-primary-regular text-[13px] leading-[18px] text-nidoru-dark-text-secondary",
                  isSelected ? "text-[#B5B9D1]" : null,
                )}
                selectable={false}
              >
                {tile.description}
              </Text>
            </View>
          </OnboardingSelectionTile>
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
    <OnboardingQuestionCard className="min-h-[162px] items-center px-4 pb-5 pt-8">
      <View
        className="absolute left-[10%] right-[10%] top-[55px] h-[2px] rounded-full bg-[#232743]"
        pointerEvents="none"
      />
      <View className="z-10 w-full flex-row justify-between">
        {sleepBaselineOptions.map((option) => {
          const isSelected = selectedBaseline === option.value;

          return (
            <Pressable
              accessibilityHint={SLEEP_SUMMARY_BY_VALUE[option.value]}
              accessibilityLabel={`Sleep baseline ${option.value}, ${option.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className="min-h-[72px] min-w-[52px] items-center gap-2 active:scale-[0.95]"
              key={option.value}
              onPress={() => {
                setSelectedBaseline(option.value);
              }}
            >
              <View
                className={cn(
                  "h-[46px] w-[46px] items-center justify-center rounded-full bg-[#1C2040]",
                  isSelected
                    ? "scale-[1.12] border border-[#A89CE0]/50 shadow-[0_0_22px_rgba(168,156,224,0.35),0_8px_20px_rgba(124,111,205,0.15)]"
                    : null,
                )}
              >
                <Text
                  className={cn(
                    "font-nidoru-data-regular text-xl leading-6 text-nidoru-dark-text-secondary tabular-nums",
                    isSelected ? "text-nidoru-dark-text-primary" : null,
                  )}
                  selectable={false}
                >
                  {option.value}
                </Text>
              </View>
              <Text
                className={cn(
                  "text-center font-nidoru-primary-regular text-xs leading-[15px] text-nidoru-dark-text-secondary",
                  isSelected ? "text-[#A89CE0]" : null,
                )}
                selectable={false}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <OnboardingCardDivider className="mb-3 mt-6" />
      <Text
        className="font-nidoru-primary-semibold text-sm leading-5 text-nidoru-dark-text-primary"
        selectable
      >
        {SLEEP_SUMMARY_BY_VALUE[selectedBaseline]}
      </Text>
    </OnboardingQuestionCard>
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
    <OnboardingQuestionCard className="min-h-[333px] items-center px-4 pb-6 pt-7">
      <View className="z-20 mb-8 w-full flex-row items-center justify-center gap-3">
        {windDownTimePresets.map((preset) => {
          const isSelected = selectedMinutes === preset.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={cn(
                "min-h-9 min-w-[82px] items-center justify-center rounded-full bg-[#1C2040] px-3 active:scale-[0.96]",
                isSelected
                  ? "border border-[#A89CE0]/50 shadow-[inset_0_0_0_1px_rgba(168,156,224,0.22),0_4px_12px_rgba(124,111,205,0.15)]"
                  : "border border-transparent",
              )}
              key={preset.value}
              onPress={() => {
                setSelectedMinutes(preset.value);
              }}
            >
              <Text
                className={cn(
                  "font-nidoru-primary-semibold text-sm leading-[18px] text-nidoru-dark-text-secondary",
                  isSelected ? "text-nidoru-dark-text-primary" : null,
                )}
                selectable={false}
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
        className="relative h-[180px] w-full max-w-[260px] flex-row items-center justify-center overflow-hidden rounded-[20px]"
      >
        <View className="absolute inset-x-0 top-[60px] h-[60px] rounded-[16px] border border-[#A89CE0]/20 bg-[#1C2040] shadow-[inset_0_0_0_1px_rgba(168,156,224,0.12),0_8px_20px_rgba(124,111,205,0.10)]" />
        <View
          className="absolute inset-x-0 top-0 z-20 h-[60px] bg-[#14172B]/85"
          pointerEvents="none"
        />
        <View
          className="absolute inset-x-0 bottom-0 z-20 h-[60px] bg-[#14172B]/85"
          pointerEvents="none"
        />
        <View className="z-10 w-[54px] items-center gap-[22px]">
          <TimeWheelValue dimmed value={padTimeNumber(previousHour)} />
          <TimeWheelValue large value={padTimeNumber(normalizedHour)} />
          <TimeWheelValue dimmed value={padTimeNumber(nextHour)} />
        </View>
        <Text
          className="z-10 mx-[14px] pb-1 font-nidoru-data-light text-[30px] leading-10 text-nidoru-dark-text-secondary tabular-nums"
          selectable={false}
        >
          :
        </Text>
        <View className="z-10 w-[54px] items-center gap-[22px]">
          <TimeWheelValue dimmed value={padTimeNumber(previousMinute)} />
          <TimeWheelValue large value={padTimeNumber(selectedMinute)} />
          <TimeWheelValue dimmed value={padTimeNumber(nextMinute)} />
        </View>
        <View className="z-10 w-[46px] items-center gap-[22px]">
          <Text
            className="h-6 font-nidoru-data-regular text-lg leading-6 text-nidoru-dark-text-secondary opacity-0"
            selectable={false}
          >
            PM
          </Text>
          <Text
            className="h-12 font-nidoru-data-regular text-xl leading-[48px] text-[#EEF0FF]/90"
            selectable={false}
          >
            PM
          </Text>
          <Text
            className="h-6 font-nidoru-data-regular text-lg leading-6 text-nidoru-dark-text-secondary opacity-0"
            selectable={false}
          >
            AM
          </Text>
        </View>
      </View>

      <OnboardingCardDivider className="mb-4 mt-8" />
      <Text
        className="font-nidoru-primary-semibold text-[15px] leading-5 text-nidoru-dark-text-secondary"
        selectable
      >
        Usually around {formatWindDownTime(selectedMinutes)}
      </Text>
    </OnboardingQuestionCard>
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
      className={cn(
        "text-center font-nidoru-data-light tracking-normal text-[#EEF0FF]/90 tabular-nums",
        large ? "h-12 text-[38px] leading-[48px]" : null,
        dimmed ? "h-6 font-nidoru-data-regular text-[22px] leading-6 text-[#A0A5C0]" : null,
      )}
      selectable={false}
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
    <View className="gap-4">
      {breathworkFamiliarityOptions.map((option) => {
        const optionCopy = BREATHWORK_CARD_COPY[option.value];
        const Icon = optionCopy.icon;
        const isSelected = selectedFamiliarity === option.value;

        return (
          <OnboardingSelectionTile
            accessibilityHint={optionCopy.description}
            accessibilityLabel={`${optionCopy.label}. ${optionCopy.description}`}
            accessibilityState={{ selected: isSelected }}
            className={cn(
              "min-h-[84px] w-full flex-row items-start gap-[18px] rounded-[20px] p-5",
              isSelected
                ? "border-[#A89CE0]/30 bg-[#16192E] shadow-[0_8px_24px_-8px_rgba(168,156,224,0.20)]"
                : null,
            )}
            key={option.value}
            onPress={() => {
              setSelectedFamiliarity(option.value);
            }}
          >
            <SelectionIconCircle className="mt-0" selected={isSelected}>
              <Icon
                color={isSelected ? colors.dark.primaryGlow.value : colors.dark.textTertiary.value}
                size={24}
              />
            </SelectionIconCircle>
            <View className="flex-1 gap-1.5 pt-0.5">
              <Text
                className="font-nidoru-primary-semibold text-[17px] leading-[22px] text-nidoru-dark-text-primary"
                selectable={false}
              >
                {optionCopy.label}
              </Text>
              <Text
                className="font-nidoru-primary-regular text-sm leading-[18px] text-nidoru-dark-text-secondary"
                selectable={false}
              >
                {optionCopy.description}
              </Text>
            </View>
          </OnboardingSelectionTile>
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
    <View className="gap-3.5 pt-10">
      <TextInputShell hasError={Boolean(nameError)}>
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
          className="min-h-11 flex-1 p-0 font-nidoru-primary-regular text-lg leading-6 text-nidoru-dark-text-primary"
          value={value}
        />
      </TextInputShell>
      {nameError ? (
        <Text
          accessibilityRole="alert"
          className="font-nidoru-primary-semibold text-[13px] leading-[18px] text-nidoru-dark-danger"
          selectable
        >
          {nameError}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-2 px-2">
        <ShieldCheck color={colors.dark.textTertiary.value} size={16} />
        <Text
          className="font-nidoru-primary-regular text-sm leading-[18px] text-nidoru-dark-text-secondary"
          selectable
        >
          Only used to personalize greetings.
        </Text>
      </View>
    </View>
  );
}

function OnboardingQuestionCard({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <View
      className={cn(
        "relative rounded-[32px] bg-[#14172B] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]",
        className,
      )}
    >
      {children}
    </View>
  );
}

function OnboardingSelectionTile({
  children,
  className,
  ...props
}: ComponentProps<typeof Pressable>) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "will-change-variable overflow-hidden rounded-[24px] border border-transparent bg-[#14172B] active:scale-[0.96]",
        "transition-all duration-300 ease-out",
        className,
      )}
      {...props}
    >
      {children}
    </Pressable>
  );
}

function SelectionIconCircle({
  children,
  className,
  selected,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly selected: boolean;
}) {
  return (
    <View
      className={cn(
        "will-change-variable h-11 w-11 items-center justify-center rounded-full bg-[#1C2040]",
        selected ? "bg-[#7C6FCD]/20 shadow-[0_0_16px_rgba(124,111,205,0.22)]" : null,
        className,
      )}
    >
      {children}
    </View>
  );
}

function TextInputShell({
  children,
  hasError,
}: {
  readonly children: ReactNode;
  readonly hasError: boolean;
}) {
  return (
    <View
      className={cn(
        "h-16 flex-row items-center gap-3 rounded-[20px] border bg-[#14172B] px-5",
        "focus-within:bg-[#1C2040] focus-within:shadow-[0_0_16px_rgba(168,156,224,0.12)]",
        hasError ? "border-nidoru-dark-danger/55" : "border-transparent",
      )}
    >
      {children}
    </View>
  );
}

function OnboardingCardDivider({ className }: { readonly className?: string }) {
  return <View className={cn("h-px w-[80%] bg-[#232743] opacity-75", className)} />;
}

function OnboardingContinueButton({
  disabled,
  hiddenUntilReady,
  isLoading,
  onPress,
  primary,
  testID,
}: {
  readonly disabled: boolean;
  readonly hiddenUntilReady: boolean;
  readonly isLoading: boolean;
  readonly onPress: () => void;
  readonly primary: boolean;
  readonly testID?: string;
}) {
  const visuallyHidden = disabled && hiddenUntilReady;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn(
        "h-[52px] w-full items-center justify-center rounded-[20px] active:scale-[0.98]",
        "transition-all duration-300 ease-out",
        primary ? "bg-[#7C6FCD] shadow-[0_8px_20px_rgba(124,111,205,0.25)]" : "bg-[#1C2040]",
        visuallyHidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100",
      )}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
    >
      <Text
        className={cn(
          "font-nidoru-primary-semibold text-base leading-[22px]",
          disabled && !visuallyHidden ? "text-[#8A8FA8]/50" : "text-nidoru-dark-text-primary",
        )}
        selectable={false}
      >
        {isLoading ? "Saving" : "Continue"}
      </Text>
    </Pressable>
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
