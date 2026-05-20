import {
  breathTechniques,
  breathworkFamiliarityOptions,
  canPromptForNotificationPermission,
  canShowAccountPrompt,
  canShowPaywall,
  canStartDeferredAnonymousAuth,
  firstBreathDemo,
  getOnboardingPlanForGoal,
  initialInsightRuleTypes,
  launchSoundIds,
  onboardingGoalOptions,
  onboardingPlanIds,
  onboardingPlans,
  onboardingQuestionLimit,
  onboardingQuestions,
  onboardingQuestionIds,
  sleepBaselineOptions,
  streakRules,
  windDownTimePresets,
} from "@nidoru/domain";

function assertEquals<T>(actual: T, expected: T): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const rescueTechnique = breathTechniques["4-7-8-sleep"];
const rescueInhaleMs: 4000 = rescueTechnique.phases[0].durationMs;
const firstLaunchSound: "light-rain" = launchSoundIds[0];
const missedDayPauses: true = streakRules.missedDayPausesStreak;
const firstInsightRule: "bedtime_correlation" = initialInsightRuleTypes[0];
const firstOnboardingQuestion: "goal" = onboardingQuestionIds[0];

void rescueInhaleMs;
void firstLaunchSound;
void missedDayPauses;
void firstInsightRule;
void firstOnboardingQuestion;

assertEquals(onboardingQuestionIds, [
  "goal",
  "sleep_baseline",
  "wind_down_time",
  "breathwork_familiarity",
  "display_name",
]);
assertCondition(
  onboardingQuestionIds.length <= onboardingQuestionLimit,
  "Feature 02 onboarding must stay capped at five questions.",
);
assertEquals(
  onboardingQuestions.map((question) => ({
    id: question.id,
    trace: question.tracesTo,
  })),
  [
    { id: "goal", trace: ["plan", "first_session_recommendation"] },
    { id: "sleep_baseline", trace: ["copy"] },
    { id: "wind_down_time", trace: ["timing", "copy"] },
    { id: "breathwork_familiarity", trace: ["instruction_depth"] },
    { id: "display_name", trace: ["greeting"] },
  ],
);
assertEquals(
  onboardingGoalOptions.map((option) => [option.value, option.label, option.planId]),
  [
    ["sleep", "Sleep better", "sleep_focused"],
    ["anxiety", "Ease anxiety", "anxiety_relief"],
    ["stress", "Reset stress", "stress_reset"],
    ["curiosity", "Just exploring", "general_wellness"],
  ],
);
assertEquals(
  sleepBaselineOptions.map((option) => [option.value, option.label]),
  [
    [1, "Rough"],
    [2, "Restless"],
    [3, "Mixed"],
    [4, "Okay"],
    [5, "Rested"],
  ],
);
assertEquals(
  windDownTimePresets.map((preset) => [preset.value, preset.label]),
  [
    [1290, "9:30 PM"],
    [1320, "10:00 PM"],
    [1350, "10:30 PM"],
  ],
);
assertEquals(
  breathworkFamiliarityOptions.map((option) => [option.value, option.label, option.instructionDepth]),
  [
    ["yes", "Yes", "light"],
    ["new_to_me", "New to me", "gentle"],
  ],
);
assertEquals(onboardingPlanIds, [
  "sleep_focused",
  "anxiety_relief",
  "stress_reset",
  "general_wellness",
]);
assertEquals(getOnboardingPlanForGoal("sleep").id, "sleep_focused");
assertEquals(getOnboardingPlanForGoal("anxiety").id, "anxiety_relief");
assertEquals(getOnboardingPlanForGoal("stress").id, "stress_reset");
assertEquals(getOnboardingPlanForGoal("curiosity").id, "general_wellness");
assertEquals(firstBreathDemo.durationSeconds, 30);
assertEquals(onboardingPlans.general_wellness.firstSession, {
  techniqueId: "coherent-breathing",
  durationSeconds: 240,
  title: "4 min guided breathing",
  guidanceLevel: "gentle",
});

assertEquals(canShowAccountPrompt({ hasCompletedFirstFullSession: false }), false);
assertEquals(canShowAccountPrompt({ hasCompletedFirstFullSession: true }), true);
assertEquals(
  canShowPaywall({ hasCompletedFirstFullSession: true, rewardMomentSeen: false }),
  false,
);
assertEquals(
  canShowPaywall({ hasCompletedFirstFullSession: true, rewardMomentSeen: true }),
  true,
);
assertEquals(
  canStartDeferredAnonymousAuth({
    hasCompletedFirstFullSession: true,
    completionPersistedLocally: false,
  }),
  false,
);
assertEquals(
  canStartDeferredAnonymousAuth({
    hasCompletedFirstFullSession: true,
    completionPersistedLocally: true,
  }),
  true,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: true,
    daysSinceFirstActiveDay: 3,
    completedSessionCount: 2,
    permissionState: "not_shown",
  }),
  false,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 1,
    completedSessionCount: 2,
    permissionState: "not_shown",
  }),
  false,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 2,
    completedSessionCount: 2,
    permissionState: "not_shown",
  }),
  true,
);
