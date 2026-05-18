import { breathTechniqueIds, launchSoundIds } from "@nidoru/domain";
import { z } from "zod";

export const localInstallIdSchema = z.string().regex(/^install_[A-Za-z0-9_-]{8,64}$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const breathTechniqueIdSchema = z.enum(breathTechniqueIds);
export const launchSoundIdSchema = z.enum(launchSoundIds);

export const breathSessionDraftSchema = z.object({
  localInstallId: localInstallIdSchema,
  techniqueId: breathTechniqueIdSchema,
  startedAt: isoDateTimeSchema,
  completedAt: isoDateTimeSchema.optional(),
  completedPhaseCount: z.number().int().min(0).optional(),
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
export type SoundMixLayer = z.infer<typeof soundMixLayerSchema>;
export type MorningCheckIn = z.infer<typeof morningCheckInSchema>;
