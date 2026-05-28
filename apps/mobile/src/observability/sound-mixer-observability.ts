import {
  launchSoundCatalog,
  soundMixerFiniteTimerOptions,
  type LaunchSoundCategoryId,
  type LaunchSoundId,
  type SoundMixerActiveLayer,
  type SoundMixerTimerPreference,
} from "@nidoru/domain";
import type { SoundMixerSavedMixRecord } from "@nidoru/validation";

import { captureAnalyticsEventDeferred } from "./deferred-capture";

const soundCategoryById = new Map<LaunchSoundId, LaunchSoundCategoryId>(
  launchSoundCatalog.map((sound) => [sound.id, sound.categoryId]),
);
type SoundMixerFiniteTimerPreference = (typeof soundMixerFiniteTimerOptions)[number];

export function createSoundMixerLayerAnalyticsProperties({
  layers,
  timerDurationSeconds,
  timerPreference,
}: {
  readonly layers: readonly SoundMixerActiveLayer[];
  readonly timerDurationSeconds?: number | null;
  readonly timerPreference?: SoundMixerTimerPreference;
}) {
  const soundIds = layers.map((layer) => layer.soundId);
  const soundCategoryIds = soundIds
    .map((soundId) => soundCategoryById.get(soundId))
    .filter((categoryId): categoryId is LaunchSoundCategoryId => categoryId !== undefined);
  const resolvedTimerOption =
    timerPreference ?? getSoundMixerTimerOptionFromDurationSeconds(timerDurationSeconds);

  return {
    active_layer_count: layers.length,
    source_surface: "sound_mixer",
    ...(soundCategoryIds.length === 0 ? {} : { sound_category_ids: soundCategoryIds }),
    ...(soundIds.length === 0 ? {} : { sound_ids: soundIds }),
    ...(resolvedTimerOption === undefined ? {} : { timer_option: resolvedTimerOption }),
    ...(typeof timerDurationSeconds === "number"
      ? { timer_duration_seconds: timerDurationSeconds }
      : {}),
  } as const;
}

export function createSoundMixerSoundAnalyticsProperties(soundId: LaunchSoundId | undefined) {
  const soundCategoryId = soundId === undefined ? undefined : soundCategoryById.get(soundId);

  return {
    source_surface: "sound_mixer",
    ...(soundCategoryId === undefined ? {} : { sound_category_id: soundCategoryId }),
    ...(soundId === undefined ? {} : { sound_id: soundId }),
  } as const;
}

export function captureSoundMixSavedDeferred(savedMixRecord: SoundMixerSavedMixRecord): void {
  try {
    captureAnalyticsEventDeferred(
      "sound_mix_saved",
      createSoundMixerLayerAnalyticsProperties({
        layers: savedMixRecord.layers,
        timerPreference: savedMixRecord.timerPreference,
      }),
    );
  } catch {
    // Saved-mix observability must never block local persistence or UI updates.
  }
}

function getSoundMixerTimerOptionFromDurationSeconds(
  timerDurationSeconds: number | null | undefined,
): SoundMixerTimerPreference | undefined {
  if (timerDurationSeconds === null) {
    return "infinity";
  }

  if (typeof timerDurationSeconds !== "number") {
    return undefined;
  }

  const timerMinutes = timerDurationSeconds / 60;

  return isSoundMixerFiniteTimerPreference(timerMinutes) ? timerMinutes : undefined;
}

function isSoundMixerFiniteTimerPreference(
  value: number,
): value is SoundMixerFiniteTimerPreference {
  return soundMixerFiniteTimerOptions.some((option) => option === value);
}
