import {
  breathTechniqueIds,
  breathworkFamiliarityOptions,
  launchSoundIds,
  onboardingGoalOptions,
  onboardingPlanIds,
  type NotificationPermissionState,
} from "@nidoru/domain";
import { z } from "zod";

export const localInstallIdSchema = z.string().regex(/^install_[A-Za-z0-9_-]{8,64}$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const breathTechniqueIdSchema = z.enum(breathTechniqueIds);
export const launchSoundIdSchema = z.enum(launchSoundIds);
export const onboardingGoalSchema = z.enum(
  onboardingGoalOptions.map((option) => option.value) as [
    (typeof onboardingGoalOptions)[number]["value"],
    ...((typeof onboardingGoalOptions)[number]["value"])[],
  ],
);
export const onboardingPlanIdSchema = z.enum(onboardingPlanIds);
export const breathworkFamiliaritySchema = z.enum(
  breathworkFamiliarityOptions.map((option) => option.value) as [
    (typeof breathworkFamiliarityOptions)[number]["value"],
    ...((typeof breathworkFamiliarityOptions)[number]["value"])[],
  ],
);
export const onboardingStatusSchema = z.enum(["draft", "completed"]);
export const firstSessionStatusSchema = z.enum(["draft", "completed", "abandoned"]);
export const postSessionFeelingSchema = z.enum(["same", "better", "much_better"]);
export const notificationPermissionStateSchema = z.enum([
  "not_shown",
  "shown",
  "declined",
  "accepted",
] satisfies readonly NotificationPermissionState[]);

const localRecordIdSchema = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[A-Za-z0-9_-]{8,64}$`));

export const displayNameSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length === 0 ? undefined : trimmedValue;
  },
  z
    .string()
    .min(1)
    .max(40)
    .refine(
      (value) =>
        Array.from(value).every((character) => {
          const characterCode = character.charCodeAt(0);

          return characterCode > 31 && characterCode !== 127;
        }),
      {
        message: "Display name cannot contain control characters",
      },
    )
    .optional(),
);

export const localInstallIdentitySchema = z.object({
  localInstallId: localInstallIdSchema,
  createdAt: isoDateTimeSchema,
  lastSeenAt: isoDateTimeSchema,
});

export const breathSessionDraftSchema = z.object({
  localInstallId: localInstallIdSchema,
  techniqueId: breathTechniqueIdSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
  completedPhaseCount: z.number().int().min(0).optional(),
});

export const onboardingResponseSchema = z
  .object({
    localInstallId: localInstallIdSchema,
    status: onboardingStatusSchema,
    startedAt: isoDateTimeSchema,
    completedAt: isoDateTimeSchema.optional(),
    goal: onboardingGoalSchema,
    sleepBaseline: z.number().int().min(1).max(5),
    windDownMinutesAfterMidnight: z.number().int().min(0).max(1439),
    breathworkFamiliarity: breathworkFamiliaritySchema,
    displayName: displayNameSchema,
    recommendedPlanId: onboardingPlanIdSchema,
    recommendedTechniqueId: breathTechniqueIdSchema,
  })
  .superRefine((value, context) => {
    if (value.status === "completed" && !value.completedAt) {
      context.addIssue({
        code: "custom",
        message: "completedAt is required for completed onboarding responses",
        path: ["completedAt"],
      });
    }
  });

export const firstSessionRecordSchema = z
  .object({
    localInstallId: localInstallIdSchema,
    sessionId: localRecordIdSchema("session"),
    status: firstSessionStatusSchema,
    planId: onboardingPlanIdSchema,
    techniqueId: breathTechniqueIdSchema,
    startedAt: isoDateTimeSchema,
    completedAt: isoDateTimeSchema.optional(),
    durationSeconds: z.number().int().positive().max(60 * 30),
    completedBreathCycles: z.number().int().min(0).optional(),
    completionPersistedAt: isoDateTimeSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.status !== "completed") {
      return;
    }

    if (!value.completedAt) {
      context.addIssue({
        code: "custom",
        message: "completedAt is required for completed first sessions",
        path: ["completedAt"],
      });
    }

    if (!value.completionPersistedAt) {
      context.addIssue({
        code: "custom",
        message: "completionPersistedAt is required for completed first sessions",
        path: ["completionPersistedAt"],
      });
    }
  });

export const postSessionReflectionSchema = z.object({
  localInstallId: localInstallIdSchema,
  sessionId: localRecordIdSchema("session"),
  reflectedAt: isoDateTimeSchema,
  feeling: postSessionFeelingSchema,
});

export const notificationGateEligibilitySchema = z.object({
  localInstallId: localInstallIdSchema,
  isInOnboarding: z.boolean(),
  daysSinceFirstActiveDay: z.number().int().min(0),
  completedSessionCount: z.number().int().min(0),
  permissionState: notificationPermissionStateSchema,
});

export const soundMixLayerSchema = z.object({
  soundId: launchSoundIdSchema,
  volume: z.number().min(0).max(1),
});

export const morningCheckInSchema = z.object({
  localInstallId: localInstallIdSchema,
  checkedInAt: isoDateTimeSchema,
  sleepRating: z.number().int().min(1).max(5),
  moodTag: z.string().min(1).max(32),
});

export type BreathSessionDraft = z.infer<typeof breathSessionDraftSchema>;
export type LocalInstallIdentity = z.infer<typeof localInstallIdentitySchema>;
export type OnboardingResponse = z.infer<typeof onboardingResponseSchema>;
export type FirstSessionRecord = z.infer<typeof firstSessionRecordSchema>;
export type PostSessionReflection = z.infer<typeof postSessionReflectionSchema>;
export type NotificationGateEligibility = z.infer<typeof notificationGateEligibilitySchema>;
export type SoundMixLayer = z.infer<typeof soundMixLayerSchema>;
export type MorningCheckIn = z.infer<typeof morningCheckInSchema>;
