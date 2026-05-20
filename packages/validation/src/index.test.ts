import {
  firstSessionRecordSchema,
  localInstallIdSchema,
  localInstallIdentitySchema,
  morningCheckInSchema,
  notificationGateEligibilitySchema,
  onboardingResponseSchema,
  postSessionReflectionSchema,
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
});
const morningCheckIn = morningCheckInSchema.parse({
  localInstallId,
  checkedInAt: "2026-05-18T10:00:00.000Z",
  sleepRating: 4,
  moodTag: "rested",
});

void localInstallIdentity;
void onboardingResponse;
void firstSessionRecord;
void postSessionReflection;
void notificationGateEligibility;
void morningCheckIn;

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
