import {
  breathAudioCueModeIds,
  breathAudioCueModes,
  breathSessionDurationBounds,
  breathTechniques,
  breathworkFamiliarityOptions,
  canPromptForNotificationPermission,
  canShowAccountPrompt,
  canShowPaywall,
  canStartDeferredAnonymousAuth,
  createPersonalizedOnboardingPlan,
  eveningReminderNotificationContent,
  eveningReminderWindow,
  firstBreathDemo,
  getNextEveningReminderDate,
  getOnboardingPlanForGoal,
  hasOpenedInReminderSuppressionWindow,
  initialInsightRuleTypes,
  launchSoundIds,
  mvpBreathTechniqueIds,
  onboardingGoalOptions,
  onboardingPlanIds,
  onboardingPlans,
  onboardingQuestionLimit,
  onboardingQuestions,
  onboardingQuestionIds,
  postMvpBreathTechniqueIds,
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
const firstMvpTechnique: "4-7-8-sleep" = mvpBreathTechniqueIds[0];
const firstPostMvpTechnique: "physiological-sigh" = postMvpBreathTechniqueIds[0];
const noAudioCueMode: "none" = breathAudioCueModeIds[0];
const missedDayPauses: true = streakRules.missedDayPausesStreak;
const firstInsightRule: "bedtime_correlation" = initialInsightRuleTypes[0];
const firstOnboardingQuestion: "goal" = onboardingQuestionIds[0];

void rescueInhaleMs;
void firstLaunchSound;
void firstMvpTechnique;
void firstPostMvpTechnique;
void noAudioCueMode;
void missedDayPauses;
void firstInsightRule;
void firstOnboardingQuestion;

assertEquals(mvpBreathTechniqueIds, [
  "4-7-8-sleep",
  "box-breathing",
  "coherent-breathing",
  "diaphragmatic-breathing",
]);
assertEquals(postMvpBreathTechniqueIds, ["physiological-sigh"]);
assertEquals(
  mvpBreathTechniqueIds.map((techniqueId) => {
    const technique = breathTechniques[techniqueId];

    return {
      id: technique.id,
      displayName: technique.displayName,
      defaultDurationSeconds: technique.defaultDurationSeconds,
      availability: technique.availability,
      catalogStatus: technique.catalogStatus,
      primaryContext: technique.primaryContext,
      sessionRoles: technique.sessionRoles,
      startupRequirements: technique.startupRequirements,
      localizationKeys: technique.localizationKeys,
    };
  }),
  [
    {
      id: "4-7-8-sleep",
      displayName: "4-7-8 Sleep",
      defaultDurationSeconds: 300,
      availability: "free",
      catalogStatus: "mvp",
      primaryContext: "Before bed, Rescue Me",
      sessionRoles: ["sleep", "rescue_me"],
      startupRequirements: {
        auth: false,
        network: false,
        payment: false,
        remoteConfig: false,
      },
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
    },
    {
      id: "box-breathing",
      displayName: "Box Breathing",
      defaultDurationSeconds: 300,
      availability: "free",
      catalogStatus: "mvp",
      primaryContext: "Anxiety and stress",
      sessionRoles: ["anxiety_calm", "focus"],
      startupRequirements: {
        auth: false,
        network: false,
        payment: false,
        remoteConfig: false,
      },
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
    },
    {
      id: "coherent-breathing",
      displayName: "Coherent Breathing",
      defaultDurationSeconds: 600,
      availability: "free",
      catalogStatus: "mvp",
      primaryContext: "Daily Calm / HRV Training",
      sessionRoles: ["regular_practice", "evening_wind_down", "daily_practice_hrv"],
      startupRequirements: {
        auth: false,
        network: false,
        payment: false,
        remoteConfig: false,
      },
      localizationKeys: {
        name: "breath.techniques.coherent-breathing.name",
        description: "breath.techniques.coherent-breathing.description",
        primaryContext: "breath.techniques.coherent-breathing.primaryContext",
        phaseLabels: {
          inhale: "breath.phaseInhale",
          exhale: "breath.phaseExhale",
        },
      },
    },
    {
      id: "diaphragmatic-breathing",
      displayName: "Diaphragmatic Breathing",
      defaultDurationSeconds: 300,
      availability: "free",
      catalogStatus: "mvp",
      primaryContext: "Stress relief",
      sessionRoles: ["stress_reset"],
      startupRequirements: {
        auth: false,
        network: false,
        payment: false,
        remoteConfig: false,
      },
      localizationKeys: {
        name: "breath.techniques.diaphragmatic-breathing.name",
        description: "breath.techniques.diaphragmatic-breathing.description",
        primaryContext: "breath.techniques.diaphragmatic-breathing.primaryContext",
        phaseLabels: {
          inhale: "breath.phaseInhale",
          exhale: "breath.phaseExhale",
        },
      },
    },
  ],
);
assertEquals(
  mvpBreathTechniqueIds.map((techniqueId) => [techniqueId, breathTechniques[techniqueId].phases]),
  [
    [
      "4-7-8-sleep",
      [
        { name: "inhale", durationMs: 4000 },
        { name: "hold", durationMs: 7000 },
        { name: "exhale", durationMs: 8000 },
      ],
    ],
    [
      "box-breathing",
      [
        { name: "inhale", durationMs: 4000 },
        { name: "hold", durationMs: 4000 },
        { name: "exhale", durationMs: 4000 },
        { name: "hold", durationMs: 4000 },
      ],
    ],
    [
      "coherent-breathing",
      [
        { name: "inhale", durationMs: 5500 },
        { name: "exhale", durationMs: 5500 },
      ],
    ],
    [
      "diaphragmatic-breathing",
      [
        { name: "inhale", durationMs: 4000 },
        { name: "exhale", durationMs: 6000 },
      ],
    ],
  ],
);
assertEquals(breathTechniques["physiological-sigh"].catalogStatus, "post_mvp");
assertEquals(
  breathTechniques["physiological-sigh"].replacementCandidateFor,
  "diaphragmatic-breathing",
);
assertCondition(
  breathTechniques["physiological-sigh"].conflictNote.includes("Feature Deep Specs"),
  "Physiological Sigh conflict must stay explicit in catalog metadata.",
);
assertEquals(breathSessionDurationBounds, {
  minSeconds: 1,
  maxSeconds: 1800,
});
assertEquals(breathAudioCueModeIds, ["none", "gentle-bell", "soft-whoosh", "nature-ambient"]);
assertEquals(
  breathAudioCueModeIds.map((modeId) => breathAudioCueModes[modeId]),
  [
    {
      id: "none",
      localizationKey: "breath.audioCueModes.none.label",
      requiresNetwork: false,
    },
    {
      id: "gentle-bell",
      localizationKey: "breath.audioCueModes.gentleBell.label",
      requiresNetwork: false,
    },
    {
      id: "soft-whoosh",
      localizationKey: "breath.audioCueModes.softWhoosh.label",
      requiresNetwork: false,
    },
    {
      id: "nature-ambient",
      localizationKey: "breath.audioCueModes.natureAmbient.label",
      requiresNetwork: false,
    },
  ],
);
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
  breathworkFamiliarityOptions.map((option) => [
    option.value,
    option.label,
    option.instructionDepth,
  ]),
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
assertEquals(
  onboardingGoalOptions.map(
    (option) =>
      createPersonalizedOnboardingPlan({
        breathworkFamiliarity: "new_to_me",
        goal: option.value,
        sleepBaseline: 4,
        windDownMinutesAfterMidnight: 22 * 60 + 30,
      }).id,
  ),
  ["sleep_focused", "anxiety_relief", "stress_reset", "general_wellness"],
);
assertEquals(
  createPersonalizedOnboardingPlan({
    breathworkFamiliarity: "yes",
    displayName: "Riley",
    goal: "anxiety",
    sleepBaseline: 2,
    windDownMinutesAfterMidnight: 21 * 60 + 30,
  }),
  {
    id: "anxiety_relief",
    label: "Anxiety Relief",
    summary: "A steady box-breathing session to make the next breath easier.",
    greeting: "Riley, your first session is ready",
    firstSession: {
      techniqueId: "box-breathing",
      durationSeconds: 240,
      title: "4 min guided breathing",
      guidanceLevel: "light",
      guidanceLabel: "Light guidance",
      subtitle: "Light cues for your 9:30 PM wind-down",
    },
    answerRows: [
      { id: "wind_down", label: "Wind-down around 9:30 PM" },
      { id: "familiarity", label: "Breathwork familiar" },
      { id: "sleep_baseline", label: "Start gently" },
    ],
  },
);
assertEquals(
  createPersonalizedOnboardingPlan({
    breathworkFamiliarity: "new_to_me",
    goal: "curiosity",
    sleepBaseline: 4,
    windDownMinutesAfterMidnight: 22 * 60 + 30,
  }).firstSession,
  {
    techniqueId: "coherent-breathing",
    durationSeconds: 240,
    title: "4 min guided breathing",
    guidanceLevel: "gentle",
    guidanceLabel: "Gentle guidance",
    subtitle: "Gentle cues for your 10:30 PM wind-down",
  },
);
assertEquals(firstBreathDemo.durationSeconds, 30);
assertEquals(onboardingPlans.general_wellness.firstSession, {
  techniqueId: "coherent-breathing",
  durationSeconds: 240,
  title: "4 min guided breathing",
  guidanceLevel: "gentle",
});
assertEquals(onboardingPlans.stress_reset.firstSession.techniqueId, "diaphragmatic-breathing");

assertEquals(canShowAccountPrompt({ hasCompletedFirstFullSession: false }), false);
assertEquals(canShowAccountPrompt({ hasCompletedFirstFullSession: true }), true);
assertEquals(
  canShowPaywall({ hasCompletedFirstFullSession: true, rewardMomentSeen: false }),
  false,
);
assertEquals(canShowPaywall({ hasCompletedFirstFullSession: true, rewardMomentSeen: true }), true);
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
    systemPermissionState: "undetermined",
  }),
  false,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 1,
    completedSessionCount: 2,
    permissionState: "not_shown",
    systemPermissionState: "undetermined",
  }),
  false,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 2,
    completedSessionCount: 2,
    permissionState: "not_shown",
    systemPermissionState: "undetermined",
  }),
  true,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 2,
    completedSessionCount: 1,
    permissionState: "not_shown",
    systemPermissionState: "undetermined",
  }),
  false,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 2,
    completedSessionCount: 2,
    permissionState: "declined",
    systemPermissionState: "undetermined",
  }),
  false,
);
assertEquals(
  canPromptForNotificationPermission({
    isInOnboarding: false,
    daysSinceFirstActiveDay: 2,
    completedSessionCount: 2,
    permissionState: "not_shown",
    systemPermissionState: "granted",
  }),
  false,
);

const dayThreeMorning = new Date(2026, 0, 3, 8, 0);
const openedThatMorning = new Date(2026, 0, 3, 8, 5);
const nextReminderAfterOpen = getNextEveningReminderDate({
  lastOpenedAt: openedThatMorning,
  now: dayThreeMorning,
  windDownMinutesAfterMidnight: 20 * 60 + 30,
});

assertEquals(
  hasOpenedInReminderSuppressionWindow({
    lastOpenedAt: openedThatMorning,
    now: dayThreeMorning,
  }),
  true,
);
assertEquals(nextReminderAfterOpen.getDate(), 4);
assertEquals(nextReminderAfterOpen.getHours(), 20);
assertEquals(nextReminderAfterOpen.getMinutes(), 30);
assertEquals(
  getNextEveningReminderDate({
    lastOpenedAt: null,
    now: new Date(2026, 0, 3, 6, 30),
    windDownMinutesAfterMidnight: 5 * 60,
  }).getHours(),
  eveningReminderWindow.earliestMinuteOfDay / 60,
);
assertEquals(
  getNextEveningReminderDate({
    lastOpenedAt: null,
    now: new Date(2026, 0, 3, 6, 30),
    windDownMinutesAfterMidnight: 23 * 60,
  }).getHours(),
  Math.floor(eveningReminderWindow.latestMinuteOfDay / 60),
);
assertEquals(
  /sleep|session|streak|sale|discount|badge/i.test(eveningReminderNotificationContent.body),
  false,
);
