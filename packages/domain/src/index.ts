type BreathPhase = {
  readonly name: "inhale" | "hold" | "second-inhale" | "exhale";
  readonly durationMs: number;
};

type BreathTechnique = {
  readonly id: string;
  readonly name: string;
  readonly primaryContext: string;
  readonly phases: readonly BreathPhase[];
};

export const breathTechniques = {
  "4-7-8-sleep": {
    id: "4-7-8-sleep",
    name: "4-7-8 Sleep",
    primaryContext: "Before bed, Rescue Me",
    phases: [
      { name: "inhale", durationMs: 4000 },
      { name: "hold", durationMs: 7000 },
      { name: "exhale", durationMs: 8000 },
    ],
  },
  "box-breathing": {
    id: "box-breathing",
    name: "Box Breathing",
    primaryContext: "Anxiety and stress",
    phases: [
      { name: "inhale", durationMs: 4000 },
      { name: "hold", durationMs: 4000 },
      { name: "exhale", durationMs: 4000 },
      { name: "hold", durationMs: 4000 },
    ],
  },
  "coherent-breathing": {
    id: "coherent-breathing",
    name: "Coherent Breathing",
    primaryContext: "Daytime calm and balance",
    phases: [
      { name: "inhale", durationMs: 5000 },
      { name: "exhale", durationMs: 5000 },
    ],
  },
  "physiological-sigh": {
    id: "physiological-sigh",
    name: "Physiological Sigh",
    primaryContext: "Panic or acute stress",
    phases: [
      { name: "inhale", durationMs: 2000 },
      { name: "second-inhale", durationMs: 1000 },
      { name: "exhale", durationMs: 8000 },
    ],
  },
} as const satisfies Record<string, BreathTechnique>;

export const breathTechniqueIds = Object.keys(breathTechniques) as [
  keyof typeof breathTechniques,
  ...(keyof typeof breathTechniques)[],
];

export const launchSoundIds = [
  "light-rain",
  "heavy-rain",
  "rain-on-window",
  "thunderstorm",
  "ocean-waves",
  "forest",
  "river-stream",
  "wind",
  "white-noise",
  "brown-noise",
  "pink-noise",
  "fireplace-crackling",
  "cafe-ambience",
  "fan",
  "432hz-tone",
  "delta-wave-binaural",
] as const;

export const streakRules = {
  completionIncludes: ["breathwork", "wind-down"] as const,
  missedDayPausesStreak: true,
  resetOnMissedDay: false,
  weeklySummaryDay: "monday",
  ghostModeAllowed: true,
  milestoneSessionCounts: [3, 7, 14, 30, 60, 100, 365],
} as const;

export const initialInsightRuleTypes = [
  "bedtime_correlation",
  "streak_effect",
  "sound_preference",
  "breathing_technique_impact",
  "weekend_pattern",
  "session_duration_effect",
] as const;

export type BreathTechniqueId = (typeof breathTechniqueIds)[number];
export type LaunchSoundId = (typeof launchSoundIds)[number];
export type InitialInsightRuleType = (typeof initialInsightRuleTypes)[number];

export const onboardingQuestionLimit = 5;

export const onboardingQuestionIds = [
  "goal",
  "sleep_baseline",
  "wind_down_time",
  "breathwork_familiarity",
  "display_name",
] as const;

export type OnboardingQuestionId = (typeof onboardingQuestionIds)[number];

export type OnboardingTraceTarget =
  | "plan"
  | "copy"
  | "timing"
  | "instruction_depth"
  | "greeting"
  | "first_session_recommendation";

export type OnboardingQuestionDefinition = {
  readonly id: OnboardingQuestionId;
  readonly prompt: string;
  readonly tracesTo: readonly [OnboardingTraceTarget, ...OnboardingTraceTarget[]];
};

export const onboardingQuestions = [
  {
    id: "goal",
    prompt: "What brings you here?",
    tracesTo: ["plan", "first_session_recommendation"],
  },
  {
    id: "sleep_baseline",
    prompt: "How do you sleep most nights?",
    tracesTo: ["copy"],
  },
  {
    id: "wind_down_time",
    prompt: "When do you usually wind down?",
    tracesTo: ["timing", "copy"],
  },
  {
    id: "breathwork_familiarity",
    prompt: "Have you tried breathwork before?",
    tracesTo: ["instruction_depth"],
  },
  {
    id: "display_name",
    prompt: "What should we call you?",
    tracesTo: ["greeting"],
  },
] as const satisfies readonly OnboardingQuestionDefinition[];

export const onboardingPlanIds = [
  "sleep_focused",
  "anxiety_relief",
  "stress_reset",
  "general_wellness",
] as const;

export type OnboardingPlanId = (typeof onboardingPlanIds)[number];

export const onboardingGoalOptions = [
  {
    value: "sleep",
    label: "Sleep better",
    planId: "sleep_focused",
  },
  {
    value: "anxiety",
    label: "Ease anxiety",
    planId: "anxiety_relief",
  },
  {
    value: "stress",
    label: "Reset stress",
    planId: "stress_reset",
  },
  {
    value: "curiosity",
    label: "Just exploring",
    planId: "general_wellness",
  },
] as const satisfies readonly {
  readonly value: string;
  readonly label: string;
  readonly planId: OnboardingPlanId;
}[];

export type OnboardingGoal = (typeof onboardingGoalOptions)[number]["value"];

export const sleepBaselineOptions = [
  { value: 1, label: "Rough" },
  { value: 2, label: "Restless" },
  { value: 3, label: "Mixed" },
  { value: 4, label: "Okay" },
  { value: 5, label: "Rested" },
] as const;

export type SleepBaseline = (typeof sleepBaselineOptions)[number]["value"];

export const windDownTimePresets = [
  { value: 21 * 60 + 30, label: "9:30 PM" },
  { value: 22 * 60, label: "10:00 PM" },
  { value: 22 * 60 + 30, label: "10:30 PM" },
] as const;

export type BreathworkInstructionDepth = "light" | "gentle";

export const breathworkFamiliarityOptions = [
  { value: "yes", label: "Yes", instructionDepth: "light" },
  { value: "new_to_me", label: "New to me", instructionDepth: "gentle" },
] as const satisfies readonly {
  readonly value: string;
  readonly label: string;
  readonly instructionDepth: BreathworkInstructionDepth;
}[];

export type BreathworkFamiliarity = (typeof breathworkFamiliarityOptions)[number]["value"];

export type FirstSessionRecommendation = {
  readonly techniqueId: BreathTechniqueId;
  readonly durationSeconds: number;
  readonly title: string;
  readonly guidanceLevel: BreathworkInstructionDepth;
};

export type OnboardingPlan = {
  readonly id: OnboardingPlanId;
  readonly label: string;
  readonly summary: string;
  readonly firstSession: FirstSessionRecommendation;
};

export const onboardingPlans = {
  sleep_focused: {
    id: "sleep_focused",
    label: "Sleep Focused",
    summary: "A short wind-down routine built around 4-7-8 breathing.",
    firstSession: {
      techniqueId: "4-7-8-sleep",
      durationSeconds: 240,
      title: "4 min guided breathing",
      guidanceLevel: "gentle",
    },
  },
  anxiety_relief: {
    id: "anxiety_relief",
    label: "Anxiety Relief",
    summary: "A steady box-breathing session to make the next breath easier.",
    firstSession: {
      techniqueId: "box-breathing",
      durationSeconds: 240,
      title: "4 min guided breathing",
      guidanceLevel: "gentle",
    },
  },
  stress_reset: {
    id: "stress_reset",
    label: "Stress Reset",
    summary: "A fast reset that starts with a physiological sigh.",
    firstSession: {
      techniqueId: "physiological-sigh",
      durationSeconds: 180,
      title: "3 min guided breathing",
      guidanceLevel: "gentle",
    },
  },
  general_wellness: {
    id: "general_wellness",
    label: "General Wellness",
    summary: "A simple coherent-breathing start for exploring the app.",
    firstSession: {
      techniqueId: "coherent-breathing",
      durationSeconds: 240,
      title: "4 min guided breathing",
      guidanceLevel: "gentle",
    },
  },
} as const satisfies Record<OnboardingPlanId, OnboardingPlan>;

const onboardingPlanIdByGoal = Object.fromEntries(
  onboardingGoalOptions.map((option) => [option.value, option.planId]),
) as Record<OnboardingGoal, OnboardingPlanId>;

export function getOnboardingPlanForGoal(goal: OnboardingGoal): OnboardingPlan {
  return onboardingPlans[onboardingPlanIdByGoal[goal]];
}

export const firstBreathDemo = {
  durationSeconds: 30,
  techniqueId: "coherent-breathing",
  eventNames: ["first_breath_started", "first_breath_completed"],
} as const;

export type NotificationPermissionState = "not_shown" | "shown" | "declined" | "accepted";

export type FirstValueCompletionGate = {
  readonly hasCompletedFirstFullSession: boolean;
};

export type PaywallGate = FirstValueCompletionGate & {
  readonly rewardMomentSeen: boolean;
};

export type DeferredAnonymousAuthGate = FirstValueCompletionGate & {
  readonly completionPersistedLocally: boolean;
};

export type NotificationPermissionGate = {
  readonly isInOnboarding: boolean;
  readonly daysSinceFirstActiveDay: number;
  readonly completedSessionCount: number;
  readonly permissionState: NotificationPermissionState;
};

export function canShowAccountPrompt({ hasCompletedFirstFullSession }: FirstValueCompletionGate) {
  return hasCompletedFirstFullSession;
}

export function canShowPaywall({ hasCompletedFirstFullSession, rewardMomentSeen }: PaywallGate) {
  return hasCompletedFirstFullSession && rewardMomentSeen;
}

export function canStartDeferredAnonymousAuth({
  completionPersistedLocally,
  hasCompletedFirstFullSession,
}: DeferredAnonymousAuthGate) {
  return hasCompletedFirstFullSession && completionPersistedLocally;
}

export function canPromptForNotificationPermission({
  completedSessionCount,
  daysSinceFirstActiveDay,
  isInOnboarding,
  permissionState,
}: NotificationPermissionGate) {
  return (
    !isInOnboarding &&
    daysSinceFirstActiveDay >= 2 &&
    completedSessionCount >= 2 &&
    permissionState === "not_shown"
  );
}
