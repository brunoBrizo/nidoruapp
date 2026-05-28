import {
  audioCueModeIdSchema,
  breathPhaseDurationMsSchema,
  breathSessionDurationSecondsSchema,
  breathSessionPhaseNameSchema,
  breathTechniqueIdSchema,
  firstSessionRecordSchema,
  localInstallIdSchema,
  localInstallIdentitySchema,
  morningCheckInSchema,
  mvpBreathTechniqueIdSchema,
  notificationGateEligibilitySchema,
  onboardingGoalSchema,
  onboardingPlanIdSchema,
  onboardingResponseSchema,
  postSessionReflectionSchema,
  soundMixerActiveLayerSchema,
  soundMixerAnalyticsEventNameSchema,
  soundMixerAnalyticsPropertiesSchema,
  soundMixerSavedMixRecordsSchema,
  soundMixerSavedMixSchema,
  soundMixerSyncRecordTypeSchema,
  soundMixerStateLabelSchema,
  soundMixerTimerPreferenceSchema,
} from "@nidoru/validation";

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const localInstallId = localInstallIdSchema.parse("install_0123456789abcdef");
const localInstallIdentity = localInstallIdentitySchema.parse({
  localInstallId,
  createdAt: "2026-05-18T02:00:00.000Z",
  lastSeenAt: "2026-05-18T02:00:01.000Z",
});
const onboardingResponse = onboardingResponseSchema.parse({
  localInstallId,
  status: "completed",
  startedAt: "2026-05-18T02:00:00.000Z",
  completedAt: "2026-05-18T02:02:00.000Z",
  goal: "curiosity",
  sleepBaseline: 3,
  windDownMinutesAfterMidnight: 1350,
  breathworkFamiliarity: "new_to_me",
  displayName: "Bruno",
  recommendedPlanId: "general_wellness",
  recommendedTechniqueId: "coherent-breathing",
});
const firstSessionRecord = firstSessionRecordSchema.parse({
  localInstallId,
  sessionId: "session_0123456789abcdef",
  status: "completed",
  planId: "general_wellness",
  techniqueId: "coherent-breathing",
  startedAt: "2026-05-18T02:03:00.000Z",
  completedAt: "2026-05-18T02:07:00.000Z",
  durationSeconds: 240,
  completedBreathCycles: 24,
  completionPersistedAt: "2026-05-18T02:07:01.000Z",
});
const postSessionReflection = postSessionReflectionSchema.parse({
  localInstallId,
  sessionId: "session_0123456789abcdef",
  reflectedAt: "2026-05-18T02:08:00.000Z",
  feeling: "better",
});
const notificationGateEligibility = notificationGateEligibilitySchema.parse({
  localInstallId,
  isInOnboarding: false,
  daysSinceFirstActiveDay: 2,
  completedSessionCount: 2,
  permissionState: "not_shown",
  systemPermissionState: "undetermined",
});
const morningCheckIn = morningCheckInSchema.parse({
  localInstallId,
  checkedInAt: "2026-05-18T10:00:00.000Z",
  sleepRating: 4,
  moodTag: "rested",
});
const soundMixerSavedMix = soundMixerSavedMixSchema.parse({
  name: "  Rain Hearth  ",
  layers: [
    { soundId: "light-rain", volume: 70 },
    { soundId: "brown-noise", volume: 58 },
    { soundId: "fireplace-crackling", volume: 34 },
  ],
  timerPreference: 30,
});

void localInstallIdentity;
void onboardingResponse;
void firstSessionRecord;
void postSessionReflection;
void notificationGateEligibility;
void morningCheckIn;
void soundMixerSavedMix;

assertCondition(
  breathTechniqueIdSchema.safeParse("physiological-sigh").success,
  "Known post-MVP technique ids must remain deliberate catalog entries.",
);
assertCondition(
  !mvpBreathTechniqueIdSchema.safeParse("physiological-sigh").success,
  "Post-MVP technique ids must not validate as MVP launch techniques.",
);
assertCondition(
  mvpBreathTechniqueIdSchema.safeParse("diaphragmatic-breathing").success,
  "Diaphragmatic breathing must validate as an MVP launch technique.",
);
assertCondition(
  !breathTechniqueIdSchema.safeParse("unknown-technique").success,
  "Unknown technique ids must be rejected.",
);
assertCondition(
  onboardingGoalSchema.safeParse("anxiety").success,
  "Existing onboarding goal IDs must remain valid internal storage values.",
);
assertCondition(
  !onboardingGoalSchema.safeParse("calm_my_mind").success,
  "Updated public copy must not create a new persisted onboarding goal ID.",
);
assertCondition(
  onboardingPlanIdSchema.safeParse("anxiety_relief").success,
  "Existing onboarding plan IDs must remain valid internal storage values.",
);
assertCondition(
  !onboardingPlanIdSchema.safeParse("calm_mind").success,
  "Updated public copy must not create a new persisted onboarding plan ID.",
);
assertCondition(
  breathSessionPhaseNameSchema.safeParse("second-inhale").success,
  "Second inhale must stay allowlisted for the post-MVP physiological sigh candidate.",
);
assertCondition(
  !breathSessionPhaseNameSchema.safeParse("pause").success,
  "Unknown phase names must be rejected.",
);
assertCondition(
  breathPhaseDurationMsSchema.safeParse(5500).success,
  "Phase durations must support Coherent Breathing's 5.5 second cadence.",
);
assertCondition(
  !breathPhaseDurationMsSchema.safeParse(0).success,
  "Phase durations must reject zero-length phases.",
);
assertCondition(
  !breathPhaseDurationMsSchema.safeParse(60_001).success,
  "Phase durations must reject implausibly long phases.",
);
assertCondition(
  audioCueModeIdSchema.safeParse("gentle-bell").success,
  "Gentle bell must validate as an audio cue mode.",
);
assertCondition(
  !audioCueModeIdSchema.safeParse("voice-coach").success,
  "Unknown audio cue modes must be rejected.",
);
assertCondition(
  breathSessionDurationSecondsSchema.safeParse(600).success,
  "Ten-minute Coherent Breathing sessions must validate.",
);
assertCondition(
  !breathSessionDurationSecondsSchema.safeParse(0).success,
  "Session duration must reject zero seconds.",
);
assertCondition(
  !breathSessionDurationSecondsSchema.safeParse(1801).success,
  "Session duration must stay inside the launch route bounds.",
);
assertCondition(
  !onboardingResponseSchema.safeParse({ ...onboardingResponse, goal: "oversharing" }).success,
  "Onboarding goal must be allowlisted.",
);
assertCondition(
  !onboardingResponseSchema.safeParse({ ...onboardingResponse, sleepBaseline: 6 }).success,
  "Sleep baseline must stay on the 1-5 scale.",
);
assertCondition(
  !onboardingResponseSchema.safeParse({
    ...onboardingResponse,
    displayName: "a".repeat(41),
  }).success,
  "Display name must reject overlong local user input.",
);
assertCondition(
  !firstSessionRecordSchema.safeParse({
    ...firstSessionRecord,
    localInstallId: undefined,
  }).success,
  "First session records must include the local install ID.",
);
assertCondition(
  !firstSessionRecordSchema.safeParse({
    ...firstSessionRecord,
    completedAt: undefined,
  }).success,
  "Completed first sessions must include completedAt.",
);
assertCondition(
  !postSessionReflectionSchema.safeParse({
    ...postSessionReflection,
    feeling: "fixed_everything",
  }).success,
  "Post-session reflection must stay on the three allowed answers.",
);
assertCondition(
  !notificationGateEligibilitySchema.safeParse({
    ...notificationGateEligibility,
    daysSinceFirstActiveDay: -1,
  }).success,
  "Notification gate inputs must reject impossible active-day counts.",
);
assertCondition(
  soundMixerTimerPreferenceSchema.safeParse("infinity").success,
  "Sound mixer timer must allow infinity for product UI flows.",
);
assertCondition(
  !soundMixerTimerPreferenceSchema.safeParse(25).success,
  "Sound mixer timer must reject unsupported minute values.",
);
assertCondition(
  soundMixerStateLabelSchema.safeParse("fading-out").success,
  "Sound mixer state labels must validate for UI persistence.",
);
assertCondition(
  !soundMixerStateLabelSchema.safeParse("buffering").success,
  "Sound mixer state labels must reject unplanned states.",
);
assertCondition(
  soundMixerActiveLayerSchema.safeParse({ soundId: "light-rain", volume: 0 }).success,
  "Sound mixer layers must allow muted active sounds.",
);
assertCondition(
  soundMixerActiveLayerSchema.safeParse({ soundId: "light-rain", volume: 100 }).success,
  "Sound mixer layers must allow full volume.",
);
assertCondition(
  !soundMixerActiveLayerSchema.safeParse({ soundId: "unknown-sound", volume: 70 }).success,
  "Sound mixer layers must reject unknown catalog IDs.",
);
assertCondition(
  !soundMixerActiveLayerSchema.safeParse({ soundId: "light-rain", volume: 101 }).success,
  "Sound mixer layers must reject over-range volume for persisted payloads.",
);
assertCondition(
  soundMixerSavedMix.name === "Rain Hearth",
  "Sound mixer saved mix names must be trimmed before storage.",
);
assertCondition(
  !soundMixerSavedMixSchema.safeParse({ ...soundMixerSavedMix, name: "   " }).success,
  "Sound mixer saved mix names must be non-empty after trim.",
);
assertCondition(
  !soundMixerSavedMixSchema.safeParse({ ...soundMixerSavedMix, name: "a".repeat(41) }).success,
  "Sound mixer saved mix names must stay length-limited.",
);
assertCondition(
  !soundMixerSavedMixSchema.safeParse({
    ...soundMixerSavedMix,
    layers: [
      { soundId: "light-rain", volume: 70 },
      { soundId: "light-rain", volume: 40 },
    ],
  }).success,
  "Sound mixer saved mixes must reject duplicate active layers.",
);
assertCondition(
  !soundMixerSavedMixRecordsSchema.safeParse([
    {
      ...soundMixerSavedMix,
      createdAt: "2026-05-18T02:00:00.000Z",
      localInstallId,
      mixId: "soundmix_0123456789abcdef",
      updatedAt: "2026-05-18T02:00:00.000Z",
    },
    {
      ...soundMixerSavedMix,
      createdAt: "2026-05-18T02:00:00.000Z",
      localInstallId,
      mixId: "soundmix_1123456789abcdef",
      name: "Forest Stream",
      updatedAt: "2026-05-18T02:00:00.000Z",
    },
    {
      ...soundMixerSavedMix,
      createdAt: "2026-05-18T02:00:00.000Z",
      localInstallId,
      mixId: "soundmix_2123456789abcdef",
      name: "Ocean Noise",
      updatedAt: "2026-05-18T02:00:00.000Z",
    },
    {
      ...soundMixerSavedMix,
      createdAt: "2026-05-18T02:00:00.000Z",
      localInstallId,
      mixId: "soundmix_3123456789abcdef",
      name: "River Rain",
      updatedAt: "2026-05-18T02:00:00.000Z",
    },
  ]).success,
  "Sound mixer saved mix persistence must reject more than 3 saved mixes.",
);
const soundMixerAnalyticsProperties = soundMixerAnalyticsPropertiesSchema.parse({
  active_layer_count: 3,
  audio_failure_class: "missing_bundled_asset",
  audio_mode: "sound-mixer",
  record_type: "sound_mix",
  source_surface: "sound_mixer",
  sound_category_ids: ["rain", "noise", "environment"],
  sound_ids: ["light-rain", "brown-noise", "fireplace-crackling"],
  timer_duration_seconds: 1800,
  timer_option: 30,
});
void soundMixerAnalyticsProperties;
assertCondition(
  soundMixerAnalyticsEventNameSchema.safeParse("sound_mix_saved").success,
  "Feature 06 analytics must include the saved-mix event.",
);
assertCondition(
  soundMixerSyncRecordTypeSchema.safeParse("sound_mix").success,
  "Feature 06 sync observability must include saved-mix sync failure record type.",
);
assertCondition(
  !soundMixerAnalyticsPropertiesSchema.safeParse({
    source_surface: "sound_mixer",
    sound_ids: ["/private/var/mobile/Containers/Data/light-rain.m4a"],
  }).success,
  "Sound mixer analytics must reject local file paths as sound IDs.",
);
assertCondition(
  !soundMixerAnalyticsPropertiesSchema.safeParse({
    source_surface: "sound_mixer",
    mix_name: "Rain beside Bruno's window",
  }).success,
  "Sound mixer analytics must reject user-generated mix names.",
);
