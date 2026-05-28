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
    description: "A steady square cadence for calm, grounding, and focus.",
    primaryContext: "Calm and focus",
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
    description: "A 5.5-second inhale and 5.5-second exhale practice for Daily Calm.",
    primaryContext: "Daily Calm / steady practice",
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
    description: "A simple belly-breathing cadence for a stress reset.",
    primaryContext: "Stress reset",
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
    primaryContext: "Short reset candidate",
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

export const breathTechniqueNoHoldFallbacks = {
  "4-7-8-sleep": "diaphragmatic-breathing",
  "box-breathing": "diaphragmatic-breathing",
} as const satisfies Partial<Record<MvpBreathTechniqueId, MvpBreathTechniqueId>>;

export const breathTechniqueRhythmLabels = {
  "4-7-8-sleep": "4 in · 7 hold · 8 out",
  "box-breathing": "4 in · 4 hold · 4 out · 4 hold",
  "coherent-breathing": "5.5 in · 5.5 out",
  "diaphragmatic-breathing": "4 in · 6 out",
} as const satisfies Record<MvpBreathTechniqueId, string>;

export function getNoHoldFallbackTechniqueId(
  techniqueId: BreathTechniqueId,
): MvpBreathTechniqueId | null {
  return (
    breathTechniqueNoHoldFallbacks[techniqueId as keyof typeof breathTechniqueNoHoldFallbacks] ??
    null
  );
}

export const launchSoundIds = [
  "light-rain",
  "heavy-rain",
  "rain-on-window",
  "thunderstorm",
  "ocean-waves",
  "forest",
  "river-stream",
  "wind",
  "brown-noise",
  "pink-noise",
  "fireplace-crackling",
  "cafe-ambience",
  "432hz-tone",
  "delta-wave-binaural",
] as const;

export const launchSoundCategoryIds = ["rain", "nature", "noise", "environment", "tones"] as const;

export type LaunchSoundId = (typeof launchSoundIds)[number];
export type LaunchSoundCategoryId = (typeof launchSoundCategoryIds)[number];

export type LaunchSoundCatalogItem = {
  readonly id: LaunchSoundId;
  readonly displayName: string;
  readonly categoryId: LaunchSoundCategoryId;
  readonly categoryLabel: string;
  readonly defaultVolume: number;
  readonly defaultVolumeBehavior: "activate_at_70_percent";
  readonly bundledAssetPath: `apps/mobile/assets/audio/sleep/${LaunchSoundId}.m4a`;
  readonly audioFormat: "aac-lc-m4a";
  readonly minimumDurationSeconds: 240;
  readonly durationSeconds: number | null;
  readonly loop: true;
  readonly loopReviewStatus: "blocked_missing_audio" | "passed";
  readonly licenseStatus: "blocked_missing_license" | "licensed";
  readonly licenseSource: string;
  readonly shipStatus: "blocked_missing_licensed_audio" | "bundled_verified";
  readonly evidenceSafeNote?: string;
};

const missingLaunchAudioLicenseSource =
  "BLOCKED: no licensed launch sleep loop source is committed for this asset.";

function createBlockedLaunchSoundCatalogItem({
  categoryId,
  categoryLabel,
  displayName,
  evidenceSafeNote,
  id,
}: {
  readonly categoryId: LaunchSoundCategoryId;
  readonly categoryLabel: string;
  readonly displayName: string;
  readonly evidenceSafeNote?: string;
  readonly id: LaunchSoundId;
}): LaunchSoundCatalogItem {
  return {
    audioFormat: "aac-lc-m4a",
    bundledAssetPath: `apps/mobile/assets/audio/sleep/${id}.m4a`,
    categoryId,
    categoryLabel,
    defaultVolume: 0.7,
    defaultVolumeBehavior: "activate_at_70_percent",
    displayName,
    durationSeconds: null,
    ...(evidenceSafeNote === undefined ? {} : { evidenceSafeNote }),
    id,
    licenseSource: missingLaunchAudioLicenseSource,
    licenseStatus: "blocked_missing_license",
    loop: true,
    loopReviewStatus: "blocked_missing_audio",
    minimumDurationSeconds: 240,
    shipStatus: "blocked_missing_licensed_audio",
  };
}

export const launchSoundCatalog = [
  createBlockedLaunchSoundCatalogItem({
    categoryId: "rain",
    categoryLabel: "Rain",
    displayName: "Light Rain",
    id: "light-rain",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "rain",
    categoryLabel: "Rain",
    displayName: "Heavy Rain",
    id: "heavy-rain",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "rain",
    categoryLabel: "Rain",
    displayName: "Rain on Window",
    id: "rain-on-window",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "rain",
    categoryLabel: "Rain",
    displayName: "Thunderstorm",
    id: "thunderstorm",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "nature",
    categoryLabel: "Nature",
    displayName: "Ocean Waves",
    id: "ocean-waves",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "nature",
    categoryLabel: "Nature",
    displayName: "Forest",
    id: "forest",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "nature",
    categoryLabel: "Nature",
    displayName: "River Stream",
    id: "river-stream",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "nature",
    categoryLabel: "Nature",
    displayName: "Wind",
    id: "wind",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "noise",
    categoryLabel: "Noise",
    displayName: "Brown Noise",
    evidenceSafeNote: "Preference and masking audio only; no clinical sleep efficacy claim.",
    id: "brown-noise",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "noise",
    categoryLabel: "Noise",
    displayName: "Pink Noise",
    evidenceSafeNote: "Preference and masking audio only; no clinical sleep efficacy claim.",
    id: "pink-noise",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "environment",
    categoryLabel: "Environment",
    displayName: "Fireplace Crackling",
    id: "fireplace-crackling",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "environment",
    categoryLabel: "Environment",
    displayName: "Cafe Ambience",
    id: "cafe-ambience",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "tones",
    categoryLabel: "Tones",
    displayName: "432Hz Tone",
    evidenceSafeNote:
      "Experimental preference audio only; no clinical sleep efficacy claim or premium proof point.",
    id: "432hz-tone",
  }),
  createBlockedLaunchSoundCatalogItem({
    categoryId: "tones",
    categoryLabel: "Tones",
    displayName: "Delta Wave Binaural",
    evidenceSafeNote:
      "Experimental preference audio only; no clinical sleep efficacy claim or premium proof point.",
    id: "delta-wave-binaural",
  }),
] as const satisfies readonly LaunchSoundCatalogItem[];

export const soundMixerFiniteTimerOptions = [20, 30, 45, 60] as const;
export const soundMixerTimerOptions = [...soundMixerFiniteTimerOptions, "infinity"] as const;
export const soundMixerStateLabels = [
  "playing",
  "idle-dark",
  "fade-pending",
  "fading-out",
  "interrupted",
  "ended",
] as const;

export type SoundMixerTimerPreference = (typeof soundMixerTimerOptions)[number];
export type SoundMixerStateLabel = (typeof soundMixerStateLabels)[number];

export const soundMixerLimits = {
  defaultActivationVolume: 70,
  fadeOutDurationSeconds: 120,
  maxActiveLayers: 3,
  maxSavedMixes: 3,
  maxSavedMixNameLength: 40,
  maxVolume: 100,
  minVolume: 0,
} as const;

export type SoundMixerActiveLayer = {
  readonly soundId: LaunchSoundId;
  readonly volume: number;
};

export type SoundMixerSavedMix = {
  readonly layers: readonly SoundMixerActiveLayer[];
  readonly name: string;
  readonly timerPreference: SoundMixerTimerPreference;
};

export type SoundMixerController = {
  readonly activeLayers: readonly SoundMixerActiveLayer[];
  readonly playbackStartedAtMs?: number;
  readonly savedMixes: readonly SoundMixerSavedMix[];
  readonly state: SoundMixerStateLabel;
  readonly timerPreference: SoundMixerTimerPreference;
};

export type SoundMixerSnapshot = {
  readonly activeLayers: readonly SoundMixerActiveLayer[];
  readonly elapsedMs: number;
  readonly fadeProgress: number;
  readonly observedAtMs: number;
  readonly remainingMs: number | null;
  readonly shouldReleasePowerLock: boolean;
  readonly state: SoundMixerStateLabel;
  readonly timerDurationMs: number | null;
  readonly timerPreference: SoundMixerTimerPreference;
};

const launchSoundIdSet = new Set<string>(launchSoundIds);
const soundMixerTimerOptionSet = new Set<SoundMixerTimerPreference>(soundMixerTimerOptions);
const soundMixerStateLabelSet = new Set<SoundMixerStateLabel>(soundMixerStateLabels);

export function isLaunchSoundId(value: unknown): value is LaunchSoundId {
  return typeof value === "string" && launchSoundIdSet.has(value);
}

export function clampSoundMixerVolume(volume: number) {
  if (!Number.isFinite(volume)) {
    throw new Error("Sound mixer volume must be finite.");
  }

  return Math.min(soundMixerLimits.maxVolume, Math.max(soundMixerLimits.minVolume, volume));
}

export function createSoundMixerController({
  activeLayers = [],
  playbackStartedAtMs,
  savedMixes = [],
  state,
  timerPreference = 30,
}: Partial<SoundMixerController> = {}): SoundMixerController {
  const normalizedActiveLayers = normalizeSoundMixerActiveLayers(activeLayers);
  const normalizedSavedMixes = normalizeSoundMixerSavedMixes(savedMixes);
  const normalizedState = state ?? (normalizedActiveLayers.length === 0 ? "idle-dark" : "playing");

  assertSoundMixerTimerPreference(timerPreference);
  assertSoundMixerStateLabel(normalizedState);

  if (playbackStartedAtMs !== undefined && !Number.isFinite(playbackStartedAtMs)) {
    throw new Error("Sound mixer playback start time must be finite.");
  }

  return {
    activeLayers: normalizedActiveLayers,
    ...(playbackStartedAtMs === undefined ? {} : { playbackStartedAtMs }),
    savedMixes: normalizedSavedMixes,
    state: normalizedState,
    timerPreference,
  };
}

export function activateSoundMixerLayer(
  controller: SoundMixerController,
  soundId: LaunchSoundId,
  {
    lastMix,
    volume,
  }: {
    readonly lastMix?: SoundMixerSavedMix;
    readonly volume?: number;
  } = {},
): SoundMixerController {
  assertLaunchSoundId(soundId);

  if (controller.activeLayers.some((layer) => layer.soundId === soundId)) {
    return controller;
  }

  if (controller.activeLayers.length >= soundMixerLimits.maxActiveLayers) {
    throw new Error("Sound mixer supports at most 3 active layers.");
  }

  const normalizedVolume =
    volume === undefined
      ? (getLastMixVolume(lastMix, soundId) ?? getDefaultSoundMixerActivationVolume(soundId))
      : clampSoundMixerVolume(volume);

  return createSoundMixerController({
    ...controller,
    activeLayers: [...controller.activeLayers, { soundId, volume: normalizedVolume }],
    state: controller.state === "idle-dark" ? "playing" : controller.state,
  });
}

export function setSoundMixerLayerVolume(
  controller: SoundMixerController,
  soundId: LaunchSoundId,
  volume: number,
): SoundMixerController {
  assertLaunchSoundId(soundId);

  if (!controller.activeLayers.some((layer) => layer.soundId === soundId)) {
    throw new Error(`Sound mixer layer is not active: ${soundId}`);
  }

  return createSoundMixerController({
    ...controller,
    activeLayers: controller.activeLayers.map((layer) =>
      layer.soundId === soundId ? { ...layer, volume: clampSoundMixerVolume(volume) } : layer,
    ),
  });
}

export function deactivateSoundMixerLayer(
  controller: SoundMixerController,
  soundId: LaunchSoundId,
): SoundMixerController {
  assertLaunchSoundId(soundId);

  const activeLayers = controller.activeLayers.filter((layer) => layer.soundId !== soundId);

  if (activeLayers.length === 0) {
    const { playbackStartedAtMs, ...idleController } = controller;

    void playbackStartedAtMs;

    return createSoundMixerController({
      ...idleController,
      activeLayers,
      state: "idle-dark",
    });
  }

  return createSoundMixerController({
    ...controller,
    activeLayers,
  });
}

export function saveSoundMixerMix(
  controller: SoundMixerController,
  { name }: { readonly name: string },
): SoundMixerController {
  if (controller.savedMixes.length >= soundMixerLimits.maxSavedMixes) {
    throw new Error("Sound mixer supports up to 3 saved mixes.");
  }

  const savedMix = normalizeSoundMixerSavedMix({
    layers: controller.activeLayers,
    name,
    timerPreference: controller.timerPreference,
  });

  return createSoundMixerController({
    ...controller,
    savedMixes: [...controller.savedMixes, savedMix],
  });
}

export function startSoundMixerPlayback(
  controller: SoundMixerController,
  startedAtMs: number,
): SoundMixerController {
  if (!Number.isFinite(startedAtMs)) {
    throw new Error("Sound mixer playback start time must be finite.");
  }

  if (controller.activeLayers.length === 0) {
    const { playbackStartedAtMs, ...idleController } = controller;

    void playbackStartedAtMs;

    return createSoundMixerController({
      ...idleController,
      state: "idle-dark",
    });
  }

  return createSoundMixerController({
    ...controller,
    playbackStartedAtMs: startedAtMs,
    state: controller.timerPreference === "infinity" ? "playing" : "fade-pending",
  });
}

export function interruptSoundMixerPlayback(
  controller: SoundMixerController,
): SoundMixerController {
  return createSoundMixerController({
    ...controller,
    state: "interrupted",
  });
}

export function endSoundMixerPlayback(controller: SoundMixerController): SoundMixerController {
  return createSoundMixerController({
    ...controller,
    state: "ended",
  });
}

export function getSoundMixerSnapshot(
  controller: SoundMixerController,
  observedAtMs: number,
): SoundMixerSnapshot {
  if (!Number.isFinite(observedAtMs)) {
    throw new Error("Sound mixer snapshot time must be finite.");
  }

  if (controller.activeLayers.length === 0 || controller.playbackStartedAtMs === undefined) {
    return createSoundMixerSnapshot(controller, observedAtMs, {
      elapsedMs: 0,
      fadeProgress: 0,
      remainingMs: null,
      shouldReleasePowerLock: controller.state === "ended",
      state: controller.activeLayers.length === 0 ? "idle-dark" : controller.state,
      timerDurationMs: getSoundMixerTimerDurationMs(controller.timerPreference),
    });
  }

  if (
    controller.state === "interrupted" ||
    controller.state === "ended" ||
    controller.timerPreference === "infinity"
  ) {
    const state = controller.timerPreference === "infinity" ? controller.state : controller.state;

    return createSoundMixerSnapshot(controller, observedAtMs, {
      elapsedMs: Math.max(0, observedAtMs - controller.playbackStartedAtMs),
      fadeProgress: state === "ended" ? 1 : 0,
      remainingMs: null,
      shouldReleasePowerLock: state === "ended",
      state,
      timerDurationMs: null,
    });
  }

  const timerDurationMs = controller.timerPreference * 60 * 1000;
  const fadeOutDurationMs = soundMixerLimits.fadeOutDurationSeconds * 1000;
  const elapsedMs = Math.min(
    timerDurationMs,
    Math.max(0, observedAtMs - controller.playbackStartedAtMs),
  );
  const fadeStartsAtMs = Math.max(0, timerDurationMs - fadeOutDurationMs);
  const state: SoundMixerStateLabel =
    elapsedMs >= timerDurationMs
      ? "ended"
      : elapsedMs >= fadeStartsAtMs
        ? "fading-out"
        : "fade-pending";
  const fadeProgress =
    state === "ended"
      ? 1
      : state === "fading-out"
        ? Math.min(1, (elapsedMs - fadeStartsAtMs) / fadeOutDurationMs)
        : 0;

  return createSoundMixerSnapshot(controller, observedAtMs, {
    elapsedMs,
    fadeProgress,
    remainingMs: timerDurationMs - elapsedMs,
    shouldReleasePowerLock: state === "ended",
    state,
    timerDurationMs,
  });
}

function assertLaunchSoundId(soundId: LaunchSoundId): void {
  if (!isLaunchSoundId(soundId)) {
    throw new Error(`Unknown sound mixer sound: ${String(soundId)}`);
  }
}

function assertSoundMixerTimerPreference(timerPreference: SoundMixerTimerPreference): void {
  if (!soundMixerTimerOptionSet.has(timerPreference)) {
    throw new Error(`Unsupported sound mixer timer: ${String(timerPreference)}`);
  }
}

function assertSoundMixerStateLabel(state: SoundMixerStateLabel): void {
  if (!soundMixerStateLabelSet.has(state)) {
    throw new Error(`Unsupported sound mixer state: ${String(state)}`);
  }
}

function assertSoundMixerLayerVolume(volume: number): void {
  if (
    !Number.isFinite(volume) ||
    volume < soundMixerLimits.minVolume ||
    volume > soundMixerLimits.maxVolume
  ) {
    throw new Error("Sound mixer layer volume must be between 0 and 100.");
  }
}

function normalizeSoundMixerActiveLayers(
  layers: readonly SoundMixerActiveLayer[],
): readonly SoundMixerActiveLayer[] {
  if (layers.length > soundMixerLimits.maxActiveLayers) {
    throw new Error("Sound mixer supports at most 3 active layers.");
  }

  const seenSoundIds = new Set<LaunchSoundId>();

  return layers.map((layer) => {
    assertLaunchSoundId(layer.soundId);
    assertSoundMixerLayerVolume(layer.volume);

    if (seenSoundIds.has(layer.soundId)) {
      throw new Error(`Duplicate sound mixer layer: ${layer.soundId}`);
    }

    seenSoundIds.add(layer.soundId);

    return {
      soundId: layer.soundId,
      volume: layer.volume,
    };
  });
}

function normalizeSoundMixerSavedMixes(
  savedMixes: readonly SoundMixerSavedMix[],
): readonly SoundMixerSavedMix[] {
  if (savedMixes.length > soundMixerLimits.maxSavedMixes) {
    throw new Error("Sound mixer supports up to 3 saved mixes.");
  }

  return savedMixes.map(normalizeSoundMixerSavedMix);
}

function normalizeSoundMixerSavedMix(savedMix: SoundMixerSavedMix): SoundMixerSavedMix {
  assertSoundMixerTimerPreference(savedMix.timerPreference);

  return {
    layers: normalizeSoundMixerActiveLayers(savedMix.layers),
    name: normalizeSoundMixerSavedMixName(savedMix.name),
    timerPreference: savedMix.timerPreference,
  };
}

function normalizeSoundMixerSavedMixName(name: string): string {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new Error("Sound mixer saved mix name must be non-empty after trim.");
  }

  if (trimmedName.length > soundMixerLimits.maxSavedMixNameLength) {
    throw new Error("Sound mixer saved mix name must be at most 40 characters.");
  }

  if (
    !Array.from(trimmedName).every((character) => {
      const characterCode = character.charCodeAt(0);

      return characterCode > 31 && characterCode !== 127;
    })
  ) {
    throw new Error("Sound mixer saved mix name cannot contain control characters.");
  }

  return trimmedName;
}

function getDefaultSoundMixerActivationVolume(soundId: LaunchSoundId): number {
  const catalogItem = launchSoundCatalog.find((sound) => sound.id === soundId);

  return clampSoundMixerVolume(
    Math.round((catalogItem?.defaultVolume ?? 0.7) * soundMixerLimits.maxVolume),
  );
}

function getLastMixVolume(
  lastMix: SoundMixerSavedMix | undefined,
  soundId: LaunchSoundId,
): number | undefined {
  const matchingLayer = lastMix?.layers.find((layer) => layer.soundId === soundId);

  return matchingLayer === undefined ? undefined : clampSoundMixerVolume(matchingLayer.volume);
}

function getSoundMixerTimerDurationMs(timerPreference: SoundMixerTimerPreference): number | null {
  return timerPreference === "infinity" ? null : timerPreference * 60 * 1000;
}

function createSoundMixerSnapshot(
  controller: SoundMixerController,
  observedAtMs: number,
  snapshot: Omit<SoundMixerSnapshot, "activeLayers" | "observedAtMs" | "timerPreference">,
): SoundMixerSnapshot {
  return {
    activeLayers: controller.activeLayers,
    observedAtMs,
    timerPreference: controller.timerPreference,
    ...snapshot,
  };
}

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

export type InitialInsightRuleType = (typeof initialInsightRuleTypes)[number];

export const windDownContextGoals = [
  "fall_asleep_faster",
  "calm_racing_thoughts",
  "wake_up_fewer_times",
] as const;

export type WindDownContextGoal = (typeof windDownContextGoals)[number];

export const windDownContextGoalOptions = [
  {
    value: "fall_asleep_faster",
    label: "Fall asleep faster",
    subtitle: "4-7-8 breath · sleep sounds",
  },
  {
    value: "calm_racing_thoughts",
    label: "Calm racing thoughts",
    subtitle: "Box breathing · body scan",
  },
  {
    value: "wake_up_fewer_times",
    label: "Wake up fewer times",
    subtitle: "Daily Calm · longer audio",
  },
] as const satisfies readonly {
  readonly value: WindDownContextGoal;
  readonly label: string;
  readonly subtitle: string;
}[];

export const windDownRoutineIds = [
  "wind_down_sleep_starter",
  "wind_down_racing_thoughts",
  "wind_down_daily_calm",
] as const;

export type WindDownRoutineId = (typeof windDownRoutineIds)[number];

export const windDownRoutineStepIds = [
  "breathwork",
  "transition",
  "body_relaxation",
  "ambient_sound",
] as const;

export type WindDownRoutineStepId = (typeof windDownRoutineStepIds)[number];

export type WindDownRoutineUiState =
  | "active_winddown"
  | "daily_calm"
  | "no_hold_fallback"
  | "transition_card"
  | "body_cue"
  | "ambient_handoff";

export const windDownStartupRequirements = {
  account: false,
  auth: false,
  brightnessPermission: false,
  network: false,
  notificationPermission: false,
  paywall: false,
  remoteConfig: false,
} as const;

export type WindDownStartupRequirements = typeof windDownStartupRequirements;

export type WindDownBreathworkStep = {
  readonly techniqueId: BreathTechniqueId;
  readonly durationSeconds: number;
  readonly rhythmLabel: (typeof breathTechniqueRhythmLabels)[MvpBreathTechniqueId];
  readonly uiState: Extract<
    WindDownRoutineUiState,
    "active_winddown" | "daily_calm" | "no_hold_fallback"
  >;
  readonly holdSafety?: {
    readonly safetyCopy: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.";
    readonly noHoldActionLabel: "Switch to no-hold breathing";
  };
  readonly fallbackForTechniqueId?: MvpBreathTechniqueId;
};

export type WindDownTransitionStep = {
  readonly durationSeconds: 5;
  readonly uiState: "transition_card";
  readonly copy: "Good. Now let your body relax.";
};

export type WindDownBodyCueStep = {
  readonly durationSeconds: 120;
  readonly uiState: "body_cue";
  readonly relaxationMode: "general_relaxation" | "body_scan_pmr";
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
};

export type WindDownAmbientStep = {
  readonly soundId: LaunchSoundId;
  readonly soundLabel: string;
  readonly startsUnderBreathwork: boolean;
  readonly timerDurationSeconds: number;
  readonly fadeOutDurationSeconds: 120;
  readonly uiState: "ambient_handoff";
  readonly requiresNetwork: false;
};

export type WindDownRoutine = {
  readonly id: WindDownRoutineId;
  readonly contextGoal: WindDownContextGoal;
  readonly steps: readonly WindDownRoutineStepId[];
  readonly breathwork: WindDownBreathworkStep;
  readonly transition: WindDownTransitionStep;
  readonly bodyCue: WindDownBodyCueStep;
  readonly ambient: WindDownAmbientStep;
  readonly startupRequirements: WindDownStartupRequirements;
};

const defaultWindDownRoutineSteps = [
  "breathwork",
  "transition",
  "body_relaxation",
  "ambient_sound",
] as const satisfies readonly WindDownRoutineStepId[];

const defaultWindDownTransition = {
  durationSeconds: 5,
  uiState: "transition_card",
  copy: "Good. Now let your body relax.",
} as const satisfies WindDownTransitionStep;

const defaultWindDownBodyCue = {
  durationSeconds: 120,
  uiState: "body_cue",
  relaxationMode: "general_relaxation",
  eyebrow: "BODY RELAXATION",
  title: "Soften your shoulders.",
  subtitle: "Let the weight of the day drop a little.",
} as const satisfies WindDownBodyCueStep;

const busyMindWindDownBodyCue = {
  durationSeconds: 120,
  uiState: "body_cue",
  relaxationMode: "body_scan_pmr",
  eyebrow: "BODY SCAN",
  title: "Give your busy mind a body scan.",
  subtitle: "Move from forehead to feet, then release the tension.",
} as const satisfies WindDownBodyCueStep;

const defaultWindDownAmbient = {
  soundId: "light-rain",
  soundLabel: "Rain",
  startsUnderBreathwork: true,
  timerDurationSeconds: 30 * 60,
  fadeOutDurationSeconds: 120,
  uiState: "ambient_handoff",
  requiresNetwork: false,
} as const satisfies WindDownAmbientStep;

export const windDownRoutines = {
  fall_asleep_faster: {
    id: "wind_down_sleep_starter",
    contextGoal: "fall_asleep_faster",
    steps: defaultWindDownRoutineSteps,
    breathwork: {
      techniqueId: "4-7-8-sleep",
      durationSeconds: 300,
      rhythmLabel: breathTechniqueRhythmLabels["4-7-8-sleep"],
      uiState: "active_winddown",
      holdSafety: {
        safetyCopy: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.",
        noHoldActionLabel: "Switch to no-hold breathing",
      },
    },
    transition: defaultWindDownTransition,
    bodyCue: defaultWindDownBodyCue,
    ambient: defaultWindDownAmbient,
    startupRequirements: windDownStartupRequirements,
  },
  calm_racing_thoughts: {
    id: "wind_down_racing_thoughts",
    contextGoal: "calm_racing_thoughts",
    steps: defaultWindDownRoutineSteps,
    breathwork: {
      techniqueId: "box-breathing",
      durationSeconds: 300,
      rhythmLabel: breathTechniqueRhythmLabels["box-breathing"],
      uiState: "active_winddown",
      holdSafety: {
        safetyCopy: "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.",
        noHoldActionLabel: "Switch to no-hold breathing",
      },
    },
    transition: defaultWindDownTransition,
    bodyCue: busyMindWindDownBodyCue,
    ambient: defaultWindDownAmbient,
    startupRequirements: windDownStartupRequirements,
  },
  wake_up_fewer_times: {
    id: "wind_down_daily_calm",
    contextGoal: "wake_up_fewer_times",
    steps: defaultWindDownRoutineSteps,
    breathwork: {
      techniqueId: "coherent-breathing",
      durationSeconds: 600,
      rhythmLabel: breathTechniqueRhythmLabels["coherent-breathing"],
      uiState: "daily_calm",
    },
    transition: defaultWindDownTransition,
    bodyCue: defaultWindDownBodyCue,
    ambient: {
      ...defaultWindDownAmbient,
      timerDurationSeconds: 45 * 60,
    },
    startupRequirements: windDownStartupRequirements,
  },
} as const satisfies Record<WindDownContextGoal, WindDownRoutine>;

export type WindDownRoutineSelectionSource = "selected_goal" | "remembered_goal" | "default";

export type WindDownRoutineResolutionInput = {
  readonly preferNoHoldBreathwork?: boolean;
  readonly rememberedGoal?: WindDownContextGoal | null;
  readonly selectedGoal?: WindDownContextGoal | null;
};

export type WindDownRoutineResolution = {
  readonly selectionSource: WindDownRoutineSelectionSource;
  readonly maxTapsFromHome: 1 | 2;
  readonly requiresQuickContextCheck: boolean;
  readonly routine: WindDownRoutine;
};

export function parseWindDownContextGoalInput(value: unknown): WindDownContextGoal | null {
  if (typeof value !== "string") {
    return null;
  }

  return windDownContextGoals.includes(value as WindDownContextGoal)
    ? (value as WindDownContextGoal)
    : null;
}

export function resolveWindDownRoutine({
  preferNoHoldBreathwork,
  rememberedGoal,
  selectedGoal,
}: WindDownRoutineResolutionInput = {}): WindDownRoutineResolution {
  if (selectedGoal) {
    return {
      selectionSource: "selected_goal",
      maxTapsFromHome: 2,
      requiresQuickContextCheck: false,
      routine: resolveNoHoldWindDownBreathwork(
        windDownRoutines[selectedGoal],
        preferNoHoldBreathwork,
      ),
    };
  }

  if (rememberedGoal) {
    return {
      selectionSource: "remembered_goal",
      maxTapsFromHome: 1,
      requiresQuickContextCheck: false,
      routine: resolveNoHoldWindDownBreathwork(
        windDownRoutines[rememberedGoal],
        preferNoHoldBreathwork,
      ),
    };
  }

  return {
    selectionSource: "default",
    maxTapsFromHome: 2,
    requiresQuickContextCheck: true,
    routine: resolveNoHoldWindDownBreathwork(
      windDownRoutines.fall_asleep_faster,
      preferNoHoldBreathwork,
    ),
  };
}

function resolveNoHoldWindDownBreathwork(
  routine: WindDownRoutine,
  preferNoHoldBreathwork: boolean | undefined,
): WindDownRoutine {
  if (!preferNoHoldBreathwork) {
    return routine;
  }

  const fallbackTechniqueId = getNoHoldFallbackTechniqueId(routine.breathwork.techniqueId);

  if (!fallbackTechniqueId) {
    return routine;
  }

  return {
    ...routine,
    breathwork: {
      techniqueId: fallbackTechniqueId,
      durationSeconds: routine.breathwork.durationSeconds,
      rhythmLabel: breathTechniqueRhythmLabels[fallbackTechniqueId],
      uiState: "no_hold_fallback",
      fallbackForTechniqueId: routine.breathwork.techniqueId as MvpBreathTechniqueId,
    },
  };
}

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
    label: "Calm my mind",
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
    label: "Calm Mind",
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
    summary: "A steady diaphragmatic session for a stress reset.",
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
