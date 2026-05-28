import {
  breathAudioCueModeIds,
  breathAudioCueModes,
  breathSessionDurationBounds,
  breathTechniqueNoHoldFallbacks,
  breathTechniqueIds,
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
  getNoHoldFallbackTechniqueId,
  getNextEveningReminderDate,
  getOnboardingPlanForGoal,
  hasOpenedInReminderSuppressionWindow,
  initialInsightRuleTypes,
  launchSoundCatalog,
  launchSoundCategoryIds,
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
  parseWindDownContextGoalInput,
  resolveWindDownRoutine,
  windDownContextGoalOptions,
  windDownContextGoals,
  windDownRoutineIds,
  windDownStartupRequirements,
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

function assertNoAuditRiskPublicCopy(values: readonly string[]): void {
  const auditRiskPattern =
    /\b(anxiety|panic|hrv|cbt-i|medical care)\b|stress\s+relief|insomnia[-\s]+treatment|guaranteed\s+sleep[-\s]+improvement/i;
  const exposedValue = values.find((value) => auditRiskPattern.test(value));

  assertEquals(exposedValue, undefined);
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
assertEquals(launchSoundIds, [
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
]);
assertEquals(launchSoundCategoryIds, ["rain", "nature", "noise", "environment", "tones"]);
assertEquals(
  launchSoundCatalog.map((sound) => sound.id),
  [...launchSoundIds],
);
assertEquals(
  launchSoundCatalog.map((sound) => sound.displayName),
  [
    "Light Rain",
    "Heavy Rain",
    "Rain on Window",
    "Thunderstorm",
    "Ocean Waves",
    "Forest",
    "River Stream",
    "Wind",
    "White Noise",
    "Brown Noise",
    "Pink Noise",
    "Fireplace Crackling",
    "Cafe Ambience",
    "Fan",
    "432Hz Tone",
    "Delta Wave Binaural",
  ],
);
assertCondition(
  new Set(launchSoundCatalog.map((sound) => sound.bundledAssetPath)).size ===
    launchSoundCatalog.length,
  "launch sound asset paths must be unique",
);
assertCondition(
  launchSoundCatalog.every(
    (sound) =>
      sound.bundledAssetPath === `apps/mobile/assets/audio/sleep/${sound.id}.m4a` &&
      sound.audioFormat === "aac-lc-m4a" &&
      sound.defaultVolume === 0.7 &&
      sound.defaultVolumeBehavior === "activate_at_70_percent" &&
      sound.durationSeconds === null &&
      sound.licenseStatus === "blocked_missing_license" &&
      sound.licenseSource.startsWith("BLOCKED:") &&
      sound.loop &&
      sound.loopReviewStatus === "blocked_missing_audio" &&
      sound.minimumDurationSeconds === 240 &&
      sound.shipStatus === "blocked_missing_licensed_audio",
  ),
  "missing launch sleep loops must stay blocked until licensed AAC-LC files are committed",
);
assertNoAuditRiskPublicCopy(
  launchSoundCatalog.flatMap((sound) => [
    sound.displayName,
    ...(sound.evidenceSafeNote === undefined ? [] : [sound.evidenceSafeNote]),
  ]),
);
assertCondition(
  launchSoundCatalog
    .filter((sound) => sound.categoryId === "tones" || sound.categoryId === "noise")
    .every((sound) => sound.evidenceSafeNote?.includes("no clinical sleep efficacy claim")),
  "tones and colored noise need explicit evidence-safe notes",
);
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
      primaryContext: "Calm and focus",
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
      primaryContext: "Daily Calm / steady practice",
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
      primaryContext: "Stress reset",
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
assertNoAuditRiskPublicCopy([
  ...breathTechniqueIds.flatMap((techniqueId) => {
    const technique = breathTechniques[techniqueId];

    return [technique.name, technique.displayName, technique.description, technique.primaryContext];
  }),
  ...onboardingGoalOptions.map((option) => option.label),
  ...windDownContextGoalOptions.flatMap((option) => [option.label, option.subtitle]),
  ...windDownContextGoals.flatMap((goal) => {
    const routine = resolveWindDownRoutine({ selectedGoal: goal }).routine;
    const noHoldRoutine = resolveWindDownRoutine({
      preferNoHoldBreathwork: true,
      selectedGoal: goal,
    }).routine;

    return [
      routine.breathwork.rhythmLabel,
      routine.breathwork.holdSafety?.safetyCopy ?? "",
      routine.breathwork.holdSafety?.noHoldActionLabel ?? "",
      routine.transition.copy,
      routine.bodyCue.eyebrow,
      routine.bodyCue.title,
      routine.bodyCue.subtitle,
      noHoldRoutine.breathwork.rhythmLabel,
    ];
  }),
  ...Object.values(onboardingPlans).flatMap((plan) => [
    plan.label,
    plan.summary,
    plan.firstSession.title,
  ]),
]);
assertEquals(
  {
    goalValue: onboardingGoalOptions.find((option) => option.planId === "anxiety_relief")?.value,
    planId: onboardingPlans.anxiety_relief.id,
    sessionRole: breathTechniques["box-breathing"].sessionRoles[0],
  },
  {
    goalValue: "anxiety",
    planId: "anxiety_relief",
    sessionRole: "anxiety_calm",
  },
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
assertEquals(breathTechniqueNoHoldFallbacks, {
  "4-7-8-sleep": "diaphragmatic-breathing",
  "box-breathing": "diaphragmatic-breathing",
});
assertEquals(getNoHoldFallbackTechniqueId("4-7-8-sleep"), "diaphragmatic-breathing");
assertEquals(getNoHoldFallbackTechniqueId("box-breathing"), "diaphragmatic-breathing");
assertEquals(getNoHoldFallbackTechniqueId("coherent-breathing"), null);
for (const [holdTechniqueId, fallbackTechniqueId] of Object.entries(
  breathTechniqueNoHoldFallbacks,
)) {
  const holdTechnique = breathTechniques[holdTechniqueId as keyof typeof breathTechniques];
  const fallbackTechnique = breathTechniques[fallbackTechniqueId as keyof typeof breathTechniques];

  assertCondition(
    holdTechnique.phases.some((phase) => phase.name === "hold"),
    `${holdTechniqueId} must remain a hold-based technique if it has a no-hold fallback.`,
  );
  assertEquals(fallbackTechnique.catalogStatus, "mvp");
  assertCondition(
    !fallbackTechnique.phases.some((phase) => phase.name === "hold"),
    `${fallbackTechniqueId} must not include hold phases.`,
  );
}
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
    ["anxiety", "Calm my mind", "anxiety_relief"],
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
assertEquals(windDownContextGoals, [
  "fall_asleep_faster",
  "calm_racing_thoughts",
  "wake_up_fewer_times",
]);
assertEquals(
  windDownContextGoalOptions.map((option) => [option.value, option.label, option.subtitle]),
  [
    ["fall_asleep_faster", "Fall asleep faster", "4-7-8 breath · sleep sounds"],
    ["calm_racing_thoughts", "Calm racing thoughts", "Box breathing · body scan"],
    ["wake_up_fewer_times", "Wake up fewer times", "Daily Calm · longer audio"],
  ],
);
assertEquals(windDownRoutineIds, [
  "wind_down_sleep_starter",
  "wind_down_racing_thoughts",
  "wind_down_daily_calm",
]);
assertEquals(windDownStartupRequirements, {
  account: false,
  auth: false,
  brightnessPermission: false,
  network: false,
  notificationPermission: false,
  paywall: false,
  remoteConfig: false,
});
assertEquals(parseWindDownContextGoalInput("fall_asleep_faster"), "fall_asleep_faster");
assertEquals(parseWindDownContextGoalInput("wake_up_fewer_times"), "wake_up_fewer_times");
assertEquals(parseWindDownContextGoalInput("sleep_story"), null);
assertEquals(parseWindDownContextGoalInput(""), null);
assertEquals(parseWindDownContextGoalInput({ value: "fall_asleep_faster" }), null);
assertEquals(resolveWindDownRoutine().selectionSource, "default");
assertEquals(resolveWindDownRoutine().maxTapsFromHome, 2);
assertEquals(resolveWindDownRoutine().requiresQuickContextCheck, true);
assertEquals(resolveWindDownRoutine().routine, {
  id: "wind_down_sleep_starter",
  contextGoal: "fall_asleep_faster",
  steps: ["breathwork", "transition", "body_relaxation", "ambient_sound"],
  breathwork: {
    techniqueId: "4-7-8-sleep",
    durationSeconds: 300,
    rhythmLabel: "4 in · 7 hold · 8 out",
    uiState: "active_winddown",
    holdSafety: {
      safetyCopy: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.",
      noHoldActionLabel: "Switch to no-hold breathing",
    },
  },
  transition: {
    durationSeconds: 5,
    uiState: "transition_card",
    copy: "Good. Now let your body relax.",
  },
  bodyCue: {
    durationSeconds: 120,
    uiState: "body_cue",
    relaxationMode: "general_relaxation",
    eyebrow: "BODY RELAXATION",
    title: "Soften your shoulders.",
    subtitle: "Let the weight of the day drop a little.",
  },
  ambient: {
    soundId: "light-rain",
    soundLabel: "Rain",
    startsUnderBreathwork: true,
    timerDurationSeconds: 1800,
    fadeOutDurationSeconds: 120,
    uiState: "ambient_handoff",
    requiresNetwork: false,
  },
  startupRequirements: windDownStartupRequirements,
});
assertEquals(resolveWindDownRoutine({ selectedGoal: "calm_racing_thoughts" }), {
  selectionSource: "selected_goal",
  maxTapsFromHome: 2,
  requiresQuickContextCheck: false,
  routine: {
    id: "wind_down_racing_thoughts",
    contextGoal: "calm_racing_thoughts",
    steps: ["breathwork", "transition", "body_relaxation", "ambient_sound"],
    breathwork: {
      techniqueId: "box-breathing",
      durationSeconds: 300,
      rhythmLabel: "4 in · 4 hold · 4 out · 4 hold",
      uiState: "active_winddown",
      holdSafety: {
        safetyCopy: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.",
        noHoldActionLabel: "Switch to no-hold breathing",
      },
    },
    transition: {
      durationSeconds: 5,
      uiState: "transition_card",
      copy: "Good. Now let your body relax.",
    },
    bodyCue: {
      durationSeconds: 120,
      uiState: "body_cue",
      relaxationMode: "body_scan_pmr",
      eyebrow: "BODY SCAN",
      title: "Give your busy mind a body scan.",
      subtitle: "Move from forehead to feet, then release the tension.",
    },
    ambient: {
      soundId: "light-rain",
      soundLabel: "Rain",
      startsUnderBreathwork: true,
      timerDurationSeconds: 1800,
      fadeOutDurationSeconds: 120,
      uiState: "ambient_handoff",
      requiresNetwork: false,
    },
    startupRequirements: windDownStartupRequirements,
  },
});
assertEquals(resolveWindDownRoutine({ selectedGoal: "calm_racing_thoughts" }).routine.breathwork, {
  techniqueId: "box-breathing",
  durationSeconds: 300,
  rhythmLabel: "4 in · 4 hold · 4 out · 4 hold",
  uiState: "active_winddown",
  holdSafety: {
    safetyCopy: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.",
    noHoldActionLabel: "Switch to no-hold breathing",
  },
});
assertCondition(
  !/insomnia treatment|anxiety relief|panic relief|CBT-I/i.test(
    JSON.stringify(resolveWindDownRoutine({ selectedGoal: "calm_racing_thoughts" }).routine),
  ),
  "Wind-Down busy-mind routine must avoid clinical treatment labels.",
);
assertEquals(resolveWindDownRoutine({ selectedGoal: "wake_up_fewer_times" }).routine.breathwork, {
  techniqueId: "coherent-breathing",
  durationSeconds: 600,
  rhythmLabel: "5.5 in · 5.5 out",
  uiState: "daily_calm",
});
assertEquals(
  resolveWindDownRoutine({
    preferNoHoldBreathwork: true,
    selectedGoal: "fall_asleep_faster",
  }).routine.breathwork,
  {
    techniqueId: "diaphragmatic-breathing",
    durationSeconds: 300,
    rhythmLabel: "4 in · 6 out",
    uiState: "no_hold_fallback",
    fallbackForTechniqueId: "4-7-8-sleep",
  },
);
assertEquals(
  resolveWindDownRoutine({
    preferNoHoldBreathwork: true,
    selectedGoal: "calm_racing_thoughts",
  }).routine.breathwork,
  {
    techniqueId: "diaphragmatic-breathing",
    durationSeconds: 300,
    rhythmLabel: "4 in · 6 out",
    uiState: "no_hold_fallback",
    fallbackForTechniqueId: "box-breathing",
  },
);
assertEquals(
  resolveWindDownRoutine({
    preferNoHoldBreathwork: true,
    selectedGoal: "wake_up_fewer_times",
  }).routine.breathwork,
  {
    techniqueId: "coherent-breathing",
    durationSeconds: 600,
    rhythmLabel: "5.5 in · 5.5 out",
    uiState: "daily_calm",
  },
);
assertCondition(
  resolveWindDownRoutine({ selectedGoal: "wake_up_fewer_times" }).routine.ambient
    .timerDurationSeconds >
    resolveWindDownRoutine({ selectedGoal: "fall_asleep_faster" }).routine.ambient
      .timerDurationSeconds,
  "Wake-up-fewer-times routine must use longer ambient playback than the default timer.",
);
assertEquals(
  resolveWindDownRoutine({ rememberedGoal: "wake_up_fewer_times" }).selectionSource,
  "remembered_goal",
);
assertEquals(resolveWindDownRoutine({ rememberedGoal: "wake_up_fewer_times" }).maxTapsFromHome, 1);
assertEquals(
  resolveWindDownRoutine({
    rememberedGoal: "wake_up_fewer_times",
    selectedGoal: "calm_racing_thoughts",
  }).routine.contextGoal,
  "calm_racing_thoughts",
);
const fallAsleepFasterStepIds: readonly string[] = resolveWindDownRoutine({
  selectedGoal: "fall_asleep_faster",
}).routine.steps;

assertEquals(fallAsleepFasterStepIds.includes("sleep_story"), false);
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
    label: "Calm Mind",
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
