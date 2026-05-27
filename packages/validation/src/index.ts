import {
  breathAudioCueModeIds,
  breathPhaseNames,
  breathSessionDurationBounds,
  breathTechniqueIds,
  breathworkFamiliarityOptions,
  launchSoundIds,
  mvpBreathTechniqueIds,
  onboardingGoalOptions,
  onboardingPlanIds,
  windDownContextGoals,
  windDownRoutineIds,
  type NotificationPermissionState,
  type SystemNotificationPermissionState,
} from "@nidoru/domain";
import { z } from "zod";

export const localInstallIdSchema = z.string().regex(/^install_[A-Za-z0-9_-]{8,64}$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const breathTechniqueIdSchema = z.enum(breathTechniqueIds);
export const mvpBreathTechniqueIdSchema = z.enum(mvpBreathTechniqueIds);
export const launchSoundIdSchema = z.enum(launchSoundIds);
export const breathSessionPhaseNameSchema = z.enum(breathPhaseNames);
export const breathPhaseDurationMsSchema = z.number().int().positive().max(60_000);
export const audioCueModeIdSchema = z.enum(breathAudioCueModeIds);
export const breathSessionDurationSecondsSchema = z
  .number()
  .int()
  .min(breathSessionDurationBounds.minSeconds)
  .max(breathSessionDurationBounds.maxSeconds);
export const onboardingGoalSchema = z.enum(
  onboardingGoalOptions.map((option) => option.value) as [
    (typeof onboardingGoalOptions)[number]["value"],
    ...(typeof onboardingGoalOptions)[number]["value"][],
  ],
);
export const onboardingPlanIdSchema = z.enum(onboardingPlanIds);
export const breathworkFamiliaritySchema = z.enum(
  breathworkFamiliarityOptions.map((option) => option.value) as [
    (typeof breathworkFamiliarityOptions)[number]["value"],
    ...(typeof breathworkFamiliarityOptions)[number]["value"][],
  ],
);
const localRecordIdSchema = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[A-Za-z0-9_-]{8,64}$`));

export const onboardingStatusSchema = z.enum(["draft", "completed"]);
export const firstSessionStatusSchema = z.enum(["draft", "completed", "abandoned"]);
export const breathSessionSourceSchema = z.enum([
  "breathe_tab",
  "first_session",
  "morning_check_in",
  "rescue_me",
  "wind_down",
]);
export const breathSessionStatusSchema = z.enum(["started", "draft", "completed", "abandoned"]);
export const breathSessionStopReasonSchema = z.enum([
  "app_backgrounded",
  "interrupted",
  "unknown",
  "user_ended",
]);
export const windDownRunIdSchema = localRecordIdSchema("winddown");
export const windDownContextGoalSchema = z.enum(windDownContextGoals);
export const windDownRoutineIdSchema = z.enum(windDownRoutineIds);
export const windDownRunStatusSchema = z.enum([
  "started",
  "breath_completed",
  "body_cue_completed",
  "ambient_playing",
  "completed",
  "stopped",
]);
export const windDownRunStopReasonSchema = z.enum([
  "user_stop",
  "app_backgrounded_after_main_exercise",
  "interrupted",
  "timer_ended",
  "unknown",
]);
export const windDownRecoveryStateSchema = z.enum([
  "quick_context",
  "active_winddown",
  "no_hold_fallback",
  "daily_calm",
  "transition_card",
  "body_cue",
  "ambient_handoff",
  "dimmed_idle",
  "tap_to_wake",
  "audio_interruption",
  "completion",
  "partial_stop",
  "background_recovery",
]);
export const postSessionFeelingSchema = z.enum(["same", "better", "much_better"]);
export const notificationPermissionStateSchema = z.enum([
  "not_shown",
  "shown",
  "declined",
  "accepted",
] satisfies readonly NotificationPermissionState[]);
export const systemNotificationPermissionStateSchema = z.enum([
  "undetermined",
  "granted",
  "denied",
] satisfies readonly SystemNotificationPermissionState[]);

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
    durationSeconds: breathSessionDurationSecondsSchema,
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

export const recoverableFirstSessionDraftSchema = z.object({
  localInstallId: localInstallIdSchema,
  sessionId: localRecordIdSchema("session"),
  status: z.literal("draft"),
  planId: onboardingPlanIdSchema,
  techniqueId: breathTechniqueIdSchema,
  startedAt: isoDateTimeSchema,
  durationSeconds: breathSessionDurationSecondsSchema,
  completedBreathCycles: z.number().int().min(0),
  elapsedDurationMs: z.number().int().min(0),
  remainingDurationMs: z.number().int().min(1),
  currentPhaseName: breathSessionPhaseNameSchema,
  updatedAt: isoDateTimeSchema,
});

export const abandonedFirstSessionRecordSchema = recoverableFirstSessionDraftSchema.extend({
  abandonedAt: isoDateTimeSchema,
  remainingDurationMs: z.number().int().min(0),
  status: z.literal("abandoned"),
});

const breathSessionProgressFields = {
  completedBreathCycles: z.number().int().min(0),
  currentPhaseName: breathSessionPhaseNameSchema,
  elapsedDurationMs: z.number().int().min(0),
  remainingDurationMs: z.number().int().min(0),
} as const;

const breathSessionBaseRecordSchema = z.object({
  audioCueModeId: audioCueModeIdSchema.optional(),
  durationSeconds: breathSessionDurationSecondsSchema,
  localInstallId: localInstallIdSchema,
  planId: onboardingPlanIdSchema.optional(),
  sessionId: localRecordIdSchema("session"),
  source: breathSessionSourceSchema,
  startedAt: isoDateTimeSchema,
  techniqueId: breathTechniqueIdSchema,
  windDownRunId: windDownRunIdSchema.optional(),
});

function refineBreathSessionProgress(
  value: {
    readonly durationSeconds: number;
    readonly elapsedDurationMs?: number;
    readonly remainingDurationMs?: number;
  },
  context: z.RefinementCtx,
): void {
  if (value.elapsedDurationMs === undefined || value.remainingDurationMs === undefined) {
    return;
  }

  const durationMs = value.durationSeconds * 1000;

  if (value.elapsedDurationMs > durationMs) {
    context.addIssue({
      code: "custom",
      message: "elapsedDurationMs cannot exceed the session duration",
      path: ["elapsedDurationMs"],
    });
  }

  if (value.remainingDurationMs > durationMs) {
    context.addIssue({
      code: "custom",
      message: "remainingDurationMs cannot exceed the session duration",
      path: ["remainingDurationMs"],
    });
  }

  if (value.elapsedDurationMs + value.remainingDurationMs > durationMs) {
    context.addIssue({
      code: "custom",
      message: "elapsedDurationMs and remainingDurationMs cannot exceed the session duration",
      path: ["remainingDurationMs"],
    });
  }
}

export const breathSessionStartedRecordSchema = breathSessionBaseRecordSchema
  .extend({
    currentPhaseName: breathSessionPhaseNameSchema,
    eventId: localRecordIdSchema("event").optional(),
    status: z.literal("started"),
  })
  .superRefine(refineBreathSessionProgress);

export const recoverableBreathSessionDraftSchema = breathSessionBaseRecordSchema
  .extend({
    ...breathSessionProgressFields,
    status: z.enum(["started", "draft"]),
    updatedAt: isoDateTimeSchema,
  })
  .superRefine(refineBreathSessionProgress);

export const completedBreathSessionRecordSchema = breathSessionBaseRecordSchema
  .extend({
    ...breathSessionProgressFields,
    completedAt: isoDateTimeSchema,
    completionPersistedAt: isoDateTimeSchema,
    eventId: localRecordIdSchema("event").optional(),
    status: z.literal("completed"),
    updatedAt: isoDateTimeSchema.optional(),
  })
  .superRefine((value, context) => {
    refineBreathSessionProgress(value, context);

    if (value.remainingDurationMs !== 0) {
      context.addIssue({
        code: "custom",
        message: "remainingDurationMs must be 0 for completed breath sessions",
        path: ["remainingDurationMs"],
      });
    }
  });

export const abandonedBreathSessionRecordSchema = breathSessionBaseRecordSchema
  .extend({
    ...breathSessionProgressFields,
    abandonedAt: isoDateTimeSchema,
    status: z.literal("abandoned"),
    stopReason: breathSessionStopReasonSchema,
    updatedAt: isoDateTimeSchema,
  })
  .superRefine(refineBreathSessionProgress);

export const windDownQueuedEventSchema = z.object({
  eventId: localRecordIdSchema("event").optional(),
  eventName: z.enum(["audio_started", "audio_failed"]),
  occurredAt: isoDateTimeSchema,
});

const windDownTimestampFields = {
  ambientCompletedAt: isoDateTimeSchema.optional(),
  ambientStartedAt: isoDateTimeSchema.optional(),
  bodyCueCompletedAt: isoDateTimeSchema.optional(),
  bodyCueStartedAt: isoDateTimeSchema.optional(),
  breathSessionId: localRecordIdSchema("session").optional(),
  breathworkCompletedAt: isoDateTimeSchema.optional(),
  breathworkStartedAt: isoDateTimeSchema.optional(),
  completedAt: isoDateTimeSchema.optional(),
  stoppedAt: isoDateTimeSchema.optional(),
} as const;

function refineWindDownRunTerminalState(
  value: {
    readonly ambientCompletedAt?: string | undefined;
    readonly ambientStartedAt?: string | undefined;
    readonly bodyCueCompletedAt?: string | undefined;
    readonly breathworkCompletedAt?: string | undefined;
    readonly completedAt?: string | undefined;
    readonly status: z.infer<typeof windDownRunStatusSchema>;
    readonly stopReason?: z.infer<typeof windDownRunStopReasonSchema> | undefined;
    readonly stoppedAt?: string | undefined;
    readonly totalDurationSeconds?: number | undefined;
  },
  context: z.RefinementCtx,
): void {
  if (value.status === "breath_completed" && !value.breathworkCompletedAt) {
    context.addIssue({
      code: "custom",
      message: "breathworkCompletedAt is required after breathwork completion",
      path: ["breathworkCompletedAt"],
    });
  }

  if (value.status === "body_cue_completed" && !value.bodyCueCompletedAt) {
    context.addIssue({
      code: "custom",
      message: "bodyCueCompletedAt is required after body cue completion",
      path: ["bodyCueCompletedAt"],
    });
  }

  if (value.status === "ambient_playing" && !value.ambientStartedAt) {
    context.addIssue({
      code: "custom",
      message: "ambientStartedAt is required while ambient audio is playing",
      path: ["ambientStartedAt"],
    });
  }

  if (value.status === "completed") {
    if (!value.completedAt) {
      context.addIssue({
        code: "custom",
        message: "completedAt is required for completed wind-down runs",
        path: ["completedAt"],
      });
    }

    if (!value.ambientCompletedAt) {
      context.addIssue({
        code: "custom",
        message: "ambientCompletedAt is required for completed wind-down runs",
        path: ["ambientCompletedAt"],
      });
    }

    if (value.totalDurationSeconds === undefined) {
      context.addIssue({
        code: "custom",
        message: "totalDurationSeconds is required for completed wind-down runs",
        path: ["totalDurationSeconds"],
      });
    }
  }

  if (value.status === "stopped") {
    if (!value.stoppedAt) {
      context.addIssue({
        code: "custom",
        message: "stoppedAt is required for stopped wind-down runs",
        path: ["stoppedAt"],
      });
    }

    if (!value.stopReason) {
      context.addIssue({
        code: "custom",
        message: "stopReason is required for stopped wind-down runs",
        path: ["stopReason"],
      });
    }

    if (value.totalDurationSeconds === undefined) {
      context.addIssue({
        code: "custom",
        message: "totalDurationSeconds is required for stopped wind-down runs",
        path: ["totalDurationSeconds"],
      });
    }
  }

  if (value.status !== "stopped" && value.stopReason !== undefined) {
    context.addIssue({
      code: "custom",
      message: "stopReason can only be stored for stopped wind-down runs",
      path: ["stopReason"],
    });
  }
}

export const windDownRunRecordSchema = z
  .object({
    ambientSoundId: launchSoundIdSchema,
    contextGoal: windDownContextGoalSchema,
    localInstallId: localInstallIdSchema,
    recoveryState: windDownRecoveryStateSchema,
    routineId: windDownRoutineIdSchema,
    runId: windDownRunIdSchema,
    startedAt: isoDateTimeSchema,
    status: windDownRunStatusSchema,
    stopReason: windDownRunStopReasonSchema.optional(),
    totalDurationSeconds: z.number().int().min(0).max(28_800).optional(),
    updatedAt: isoDateTimeSchema,
    ...windDownTimestampFields,
  })
  .superRefine(refineWindDownRunTerminalState);

export const windDownRunStartSchema = z.object({
  ambientSoundId: launchSoundIdSchema,
  breathSessionId: localRecordIdSchema("session").optional(),
  contextGoal: windDownContextGoalSchema,
  eventId: localRecordIdSchema("event").optional(),
  localInstallId: localInstallIdSchema,
  routineId: windDownRoutineIdSchema,
  runId: windDownRunIdSchema,
  startedAt: isoDateTimeSchema,
});

export const windDownStepProgressSchema = z
  .object({
    localInstallId: localInstallIdSchema,
    queuedEvent: windDownQueuedEventSchema.optional(),
    recoveryState: windDownRecoveryStateSchema,
    runId: windDownRunIdSchema,
    status: z.enum(["started", "breath_completed", "body_cue_completed", "ambient_playing"]),
    updatedAt: isoDateTimeSchema,
    ...windDownTimestampFields,
  })
  .superRefine(refineWindDownRunTerminalState);

export const windDownCompletionSchema = z
  .object({
    ambientCompletedAt: isoDateTimeSchema,
    completedAt: isoDateTimeSchema,
    eventId: localRecordIdSchema("event").optional(),
    localInstallId: localInstallIdSchema,
    recoveryState: windDownRecoveryStateSchema,
    runId: windDownRunIdSchema,
    status: z.literal("completed").default("completed"),
    totalDurationSeconds: z.number().int().min(0).max(28_800),
    updatedAt: isoDateTimeSchema,
  })
  .superRefine(refineWindDownRunTerminalState);

export const windDownStopSchema = z
  .object({
    localInstallId: localInstallIdSchema,
    recoveryState: windDownRecoveryStateSchema,
    runId: windDownRunIdSchema,
    status: z.literal("stopped").default("stopped"),
    stopReason: windDownRunStopReasonSchema,
    stoppedAt: isoDateTimeSchema,
    totalDurationSeconds: z.number().int().min(0).max(28_800),
    updatedAt: isoDateTimeSchema,
  })
  .superRefine(refineWindDownRunTerminalState);

export const rememberedWindDownContextChoiceSchema = z.object({
  contextGoal: windDownContextGoalSchema,
  localInstallId: localInstallIdSchema,
  routineId: windDownRoutineIdSchema,
  selectedAt: isoDateTimeSchema,
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
  systemPermissionState: systemNotificationPermissionStateSchema,
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
export type RecoverableFirstSessionDraft = z.infer<typeof recoverableFirstSessionDraftSchema>;
export type AbandonedFirstSessionRecord = z.infer<typeof abandonedFirstSessionRecordSchema>;
export type BreathSessionStartedRecord = z.infer<typeof breathSessionStartedRecordSchema>;
export type RecoverableBreathSessionDraft = z.infer<typeof recoverableBreathSessionDraftSchema>;
export type CompletedBreathSessionRecord = z.infer<typeof completedBreathSessionRecordSchema>;
export type AbandonedBreathSessionRecord = z.infer<typeof abandonedBreathSessionRecordSchema>;
export type WindDownRunRecord = z.infer<typeof windDownRunRecordSchema>;
export type WindDownRunStart = z.infer<typeof windDownRunStartSchema>;
export type WindDownStepProgress = z.infer<typeof windDownStepProgressSchema>;
export type WindDownCompletion = z.infer<typeof windDownCompletionSchema>;
export type WindDownStop = z.infer<typeof windDownStopSchema>;
export type RememberedWindDownContextChoice = z.infer<
  typeof rememberedWindDownContextChoiceSchema
>;
export type PostSessionReflection = z.infer<typeof postSessionReflectionSchema>;
export type NotificationGateEligibility = z.infer<typeof notificationGateEligibilitySchema>;
export type SoundMixLayer = z.infer<typeof soundMixLayerSchema>;
export type MorningCheckIn = z.infer<typeof morningCheckInSchema>;
