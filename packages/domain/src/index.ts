export const breathPhaseNames = ["inhale", "hold", "second-inhale", "exhale"] as const;

export type BreathPhaseName = (typeof breathPhaseNames)[number];

type BreathPhase = {
  readonly name: BreathPhaseName;
  readonly durationMs: number;
};

export const mvpBreathTechniqueIds = [
  "4-7-8-sleep",
  "box-breathing",
  "coherent-breathing",
  "diaphragmatic-breathing",
] as const;

export const postMvpBreathTechniqueIds = ["physiological-sigh"] as const;

export const breathTechniqueIds = [...mvpBreathTechniqueIds, ...postMvpBreathTechniqueIds] as const;

export type MvpBreathTechniqueId = (typeof mvpBreathTechniqueIds)[number];
export type PostMvpBreathTechniqueId = (typeof postMvpBreathTechniqueIds)[number];
export type BreathTechniqueId = (typeof breathTechniqueIds)[number];

export const breathSessionDurationBounds = {
  minSeconds: 1,
  maxSeconds: 30 * 60,
} as const;

export const breathAudioCueModeIds = [
  "none",
  "gentle-bell",
  "soft-whoosh",
  "nature-ambient",
] as const;

export type BreathAudioCueModeId = (typeof breathAudioCueModeIds)[number];

export const breathAudioCueModes = {
  none: {
    id: "none",
    localizationKey: "breath.audioCueModes.none.label",
    requiresNetwork: false,
  },
  "gentle-bell": {
    id: "gentle-bell",
    localizationKey: "breath.audioCueModes.gentleBell.label",
    requiresNetwork: false,
  },
  "soft-whoosh": {
    id: "soft-whoosh",
    localizationKey: "breath.audioCueModes.softWhoosh.label",
    requiresNetwork: false,
  },
  "nature-ambient": {
    id: "nature-ambient",
    localizationKey: "breath.audioCueModes.natureAmbient.label",
    requiresNetwork: false,
  },
} as const satisfies Record<
  BreathAudioCueModeId,
  {
    readonly id: BreathAudioCueModeId;
    readonly localizationKey: string;
    readonly requiresNetwork: false;
  }
>;

type BreathTechniqueAvailability = "free" | "premium";
type BreathTechniqueCatalogStatus = "mvp" | "post_mvp";
type BreathTechniqueSessionRole =
  | "acute_stress_candidate"
  | "anxiety_calm"
  | "daily_practice_hrv"
  | "evening_wind_down"
  | "focus"
  | "regular_practice"
  | "rescue_me"
  | "sleep"
  | "stress_reset";

type BreathTechniqueLocalizationKeys = {
  readonly name: string;
  readonly description: string;
  readonly primaryContext: string;
  readonly phaseLabels: Partial<Record<BreathPhaseName, string>>;
};

const localOnlyStartupRequirements = {
  auth: false,
  network: false,
  payment: false,
  remoteConfig: false,
} as const;

type BreathTechnique = {
  readonly id: BreathTechniqueId;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly primaryContext: string;
  readonly defaultDurationSeconds: number;
  readonly availability: BreathTechniqueAvailability;
  readonly catalogStatus: BreathTechniqueCatalogStatus;
  readonly sessionRoles: readonly BreathTechniqueSessionRole[];
  readonly startupRequirements: typeof localOnlyStartupRequirements;
  readonly localizationKeys: BreathTechniqueLocalizationKeys;
  readonly replacementCandidateFor?: MvpBreathTechniqueId;
  readonly conflictNote?: string;
  readonly phases: readonly BreathPhase[];
};

export const breathTechniques = {
  "4-7-8-sleep": {
    id: "4-7-8-sleep",
    name: "4-7-8 Sleep",
    displayName: "4-7-8 Sleep",
    description: "A bedtime and Rescue Me cadence with a long exhale.",
    primaryContext: "Before bed, Rescue Me",
    defaultDurationSeconds: 300,
    availability: "free",
    catalogStatus: "mvp",
    sessionRoles: ["sleep", "rescue_me"],
    startupRequirements: localOnlyStartupRequirements,
    localizationKeys: {
      name: "breath.techniques.4-7-8-sleep.name",
      description: "breath.techniques.4-7-8-sleep.description",
      primaryContext: "breath.techniques.4-7-8-sleep.primaryContext",
      phaseLabels: {
        inhale: "breath.phaseInhale",
        hold: "breath.phaseHold",
        exhale: "breath.phaseExhale",
      },
    },
    phases: [
      { name: "inhale", durationMs: 4000 },
      { name: "hold", durationMs: 7000 },
      { name: "exhale", durationMs: 8000 },
    ],
  },
  "box-breathing": {
    id: "box-breathing",
    name: "Box Breathing",
    displayName: "Box Breathing",
    description: "A steady square cadence for anxiety, calm, and focus.",
    primaryContext: "Anxiety and stress",
    defaultDurationSeconds: 300,
    availability: "free",
    catalogStatus: "mvp",
    sessionRoles: ["anxiety_calm", "focus"],
    startupRequirements: localOnlyStartupRequirements,
    localizationKeys: {
      name: "breath.techniques.box-breathing.name",
      description: "breath.techniques.box-breathing.description",
      primaryContext: "breath.techniques.box-breathing.primaryContext",
      phaseLabels: {
        inhale: "breath.phaseInhale",
        hold: "breath.phaseHold",
        exhale: "breath.phaseExhale",
      },
    },
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
    displayName: "Coherent Breathing",
    description: "A 5.5-second inhale and exhale practice for Daily Calm HRV training.",
    primaryContext: "Daily Calm / HRV Training",
    defaultDurationSeconds: 600,
    availability: "free",
    catalogStatus: "mvp",
    sessionRoles: ["regular_practice", "evening_wind_down", "daily_practice_hrv"],
    startupRequirements: localOnlyStartupRequirements,
    localizationKeys: {
      name: "breath.techniques.coherent-breathing.name",
      description: "breath.techniques.coherent-breathing.description",
      primaryContext: "breath.techniques.coherent-breathing.primaryContext",
      phaseLabels: {
        inhale: "breath.phaseInhale",
        exhale: "breath.phaseExhale",
      },
    },
    phases: [
      { name: "inhale", durationMs: 5500 },
      { name: "exhale", durationMs: 5500 },
    ],
  },
  "diaphragmatic-breathing": {
    id: "diaphragmatic-breathing",
    name: "Diaphragmatic Breathing",
    displayName: "Diaphragmatic Breathing",
    description: "A simple belly-breathing cadence for stress relief.",
    primaryContext: "Stress relief",
    defaultDurationSeconds: 300,
    availability: "free",
    catalogStatus: "mvp",
    sessionRoles: ["stress_reset"],
    startupRequirements: localOnlyStartupRequirements,
    localizationKeys: {
      name: "breath.techniques.diaphragmatic-breathing.name",
      description: "breath.techniques.diaphragmatic-breathing.description",
      primaryContext: "breath.techniques.diaphragmatic-breathing.primaryContext",
      phaseLabels: {
        inhale: "breath.phaseInhale",
        exhale: "breath.phaseExhale",
      },
    },
    phases: [
      { name: "inhale", durationMs: 4000 },
      { name: "exhale", durationMs: 6000 },
    ],
  },
  "physiological-sigh": {
    id: "physiological-sigh",
    name: "Physiological Sigh",
    displayName: "Physiological Sigh",
    description: "A double-inhale reset kept as a post-MVP replacement candidate.",
    primaryContext: "Panic or acute stress",
    defaultDurationSeconds: 180,
    availability: "free",
    catalogStatus: "post_mvp",
    sessionRoles: ["acute_stress_candidate"],
    startupRequirements: localOnlyStartupRequirements,
    replacementCandidateFor: "diaphragmatic-breathing",
    conflictNote:
      "Feature Deep Specs names Physiological Sigh, while Feature 03 and the MVP roadmap name Diaphragmatic Breathing for launch stress coverage.",
    localizationKeys: {
      name: "breath.techniques.physiological-sigh.name",
      description: "breath.techniques.physiological-sigh.description",
      primaryContext: "breath.techniques.physiological-sigh.primaryContext",
      phaseLabels: {
        inhale: "breath.phaseInhale",
        "second-inhale": "breath.phaseSecondInhale",
        exhale: "breath.phaseExhale",
      },
    },
    phases: [
      { name: "inhale", durationMs: 2000 },
      { name: "second-inhale", durationMs: 1000 },
      { name: "exhale", durationMs: 8000 },
    ],
  },
} as const satisfies Record<string, BreathTechnique>;

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

export type PersonalizedPlanAnswerRowId = "wind_down" | "familiarity" | "sleep_baseline";

export type PersonalizedPlanAnswerRow = {
  readonly id: PersonalizedPlanAnswerRowId;
  readonly label: string;
};

export type PersonalizedFirstSessionRecommendation = FirstSessionRecommendation & {
  readonly guidanceLabel: string;
  readonly subtitle: string;
};

export type PersonalizedOnboardingPlan = {
  readonly id: OnboardingPlanId;
  readonly label: string;
  readonly summary: string;
  readonly greeting: string;
  readonly firstSession: PersonalizedFirstSessionRecommendation;
  readonly answerRows: readonly [
    PersonalizedPlanAnswerRow,
    PersonalizedPlanAnswerRow,
    PersonalizedPlanAnswerRow,
  ];
};

export type PersonalizedOnboardingPlanInput = {
  readonly breathworkFamiliarity: BreathworkFamiliarity;
  readonly displayName?: string | undefined;
  readonly goal: OnboardingGoal;
  readonly sleepBaseline: SleepBaseline;
  readonly windDownMinutesAfterMidnight: number;
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
    summary: "A steady diaphragmatic session for stress relief.",
    firstSession: {
      techniqueId: "diaphragmatic-breathing",
      durationSeconds: 240,
      title: "4 min guided breathing",
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

const sleepBaselinePlanCopy = {
  1: "Start extra gentle",
  2: "Start gently",
  3: "Start balanced",
  4: "Start simple",
  5: "Keep it light",
} as const satisfies Record<SleepBaseline, string>;

const familiarityPlanCopy = {
  yes: {
    guidanceLabel: "Light guidance",
    label: "Breathwork familiar",
    subtitlePrefix: "Light cues",
  },
  new_to_me: {
    guidanceLabel: "Gentle guidance",
    label: "New to breathwork",
    subtitlePrefix: "Gentle cues",
  },
} as const satisfies Record<
  BreathworkFamiliarity,
  {
    readonly guidanceLabel: string;
    readonly label: string;
    readonly subtitlePrefix: string;
  }
>;

export function createPersonalizedOnboardingPlan({
  breathworkFamiliarity,
  displayName,
  goal,
  sleepBaseline,
  windDownMinutesAfterMidnight,
}: PersonalizedOnboardingPlanInput): PersonalizedOnboardingPlan {
  const plan = getOnboardingPlanForGoal(goal);
  const familiarityCopy = familiarityPlanCopy[breathworkFamiliarity];
  const windDownTime = formatWindDownTime(windDownMinutesAfterMidnight);
  const normalizedDisplayName = normalizeOptionalDisplayName(displayName);

  return {
    id: plan.id,
    label: plan.label,
    summary: plan.summary,
    greeting: normalizedDisplayName
      ? `${normalizedDisplayName}, your first session is ready`
      : "Your first session is ready",
    firstSession: {
      ...plan.firstSession,
      guidanceLevel: getInstructionDepthForFamiliarity(breathworkFamiliarity),
      guidanceLabel: familiarityCopy.guidanceLabel,
      subtitle: `${familiarityCopy.subtitlePrefix} for your ${windDownTime} wind-down`,
    },
    answerRows: [
      { id: "wind_down", label: `Wind-down around ${windDownTime}` },
      { id: "familiarity", label: familiarityCopy.label },
      { id: "sleep_baseline", label: sleepBaselinePlanCopy[sleepBaseline] },
    ],
  };
}

function getInstructionDepthForFamiliarity(
  breathworkFamiliarity: BreathworkFamiliarity,
): BreathworkInstructionDepth {
  return (
    breathworkFamiliarityOptions.find((option) => option.value === breathworkFamiliarity)
      ?.instructionDepth ?? "gentle"
  );
}

function formatWindDownTime(minutesAfterMidnight: number): string {
  const boundedMinutes = Math.max(0, Math.min(1439, Math.trunc(minutesAfterMidnight)));
  const hour24 = Math.floor(boundedMinutes / 60);
  const minute = boundedMinutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}

function normalizeOptionalDisplayName(displayName: string | undefined): string | undefined {
  const trimmedDisplayName = displayName?.trim();

  if (!trimmedDisplayName) {
    return undefined;
  }

  const hasControlCharacter = Array.from(trimmedDisplayName).some((character) => {
    const characterCode = character.charCodeAt(0);

    return characterCode <= 31 || characterCode === 127;
  });

  return hasControlCharacter ? undefined : trimmedDisplayName.slice(0, 40);
}

export const firstBreathDemo = {
  durationSeconds: 30,
  techniqueId: "coherent-breathing",
  eventNames: ["first_breath_started", "first_breath_completed"],
} as const;

export type NotificationPermissionState = "not_shown" | "shown" | "declined" | "accepted";
export type SystemNotificationPermissionState = "undetermined" | "granted" | "denied";

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
  readonly systemPermissionState: SystemNotificationPermissionState;
};

export type EveningReminderScheduleInput = {
  readonly now: Date;
  readonly lastOpenedAt: Date | null;
  readonly windDownMinutesAfterMidnight?: number | null;
};

export const eveningReminderNotificationContent = {
  title: "Your wind-down is ready.",
  body: "A quiet evening reminder is here when you want it.",
} as const;

export const eveningReminderWindow = {
  earliestMinuteOfDay: 19 * 60,
  latestMinuteOfDay: 21 * 60 + 30,
  defaultMinuteOfDay: 20 * 60 + 30,
  suppressionStartMinuteOfDay: 7 * 60,
  suppressionEndMinuteOfDay: 22 * 60,
} as const;

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
  systemPermissionState,
}: NotificationPermissionGate) {
  return (
    !isInOnboarding &&
    daysSinceFirstActiveDay >= 2 &&
    completedSessionCount >= 2 &&
    permissionState === "not_shown" &&
    systemPermissionState === "undetermined"
  );
}

export function clampEveningReminderMinuteOfDay(minutesAfterMidnight: number) {
  return Math.min(
    eveningReminderWindow.latestMinuteOfDay,
    Math.max(eveningReminderWindow.earliestMinuteOfDay, minutesAfterMidnight),
  );
}

export function hasOpenedInReminderSuppressionWindow({
  lastOpenedAt,
  now,
}: Pick<EveningReminderScheduleInput, "lastOpenedAt" | "now">) {
  if (!lastOpenedAt || !isSameLocalCalendarDay(lastOpenedAt, now)) {
    return false;
  }

  const openedMinuteOfDay = getLocalMinuteOfDay(lastOpenedAt);

  return (
    openedMinuteOfDay >= eveningReminderWindow.suppressionStartMinuteOfDay &&
    openedMinuteOfDay <= eveningReminderWindow.suppressionEndMinuteOfDay
  );
}

export function getNextEveningReminderDate({
  lastOpenedAt,
  now,
  windDownMinutesAfterMidnight,
}: EveningReminderScheduleInput) {
  const reminderMinuteOfDay = clampEveningReminderMinuteOfDay(
    windDownMinutesAfterMidnight ?? eveningReminderWindow.defaultMinuteOfDay,
  );
  const candidate = createLocalDateAtMinuteOfDay(now, reminderMinuteOfDay);

  if (candidate <= now || hasOpenedInReminderSuppressionWindow({ lastOpenedAt, now })) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

function createLocalDateAtMinuteOfDay(baseDate: Date, minuteOfDay: number) {
  const scheduledAt = new Date(baseDate);

  scheduledAt.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);

  return scheduledAt;
}

function getLocalMinuteOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isSameLocalCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
