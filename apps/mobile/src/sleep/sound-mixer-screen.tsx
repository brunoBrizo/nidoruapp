import {
  activateSoundMixerLayer,
  clampSoundMixerVolume,
  createSoundMixerController,
  deactivateSoundMixerLayer,
  getSoundMixerSnapshot,
  launchSoundCatalog,
  setSoundMixerLayerVolume,
  soundMixerLimits,
  startSoundMixerPlayback,
  type LaunchSoundCategoryId,
  type LaunchSoundId,
  type SoundMixerActiveLayer,
  type SoundMixerController,
  type SoundMixerSavedMix as DomainSoundMixerSavedMix,
  type SoundMixerSnapshot,
} from "@nidoru/domain";
import { soundMixerSavedMixRecordSchema, type SoundMixerSavedMixRecord } from "@nidoru/validation";
import * as Haptics from "expo-haptics";
import {
  ChartNoAxesColumn,
  ChevronLeft,
  Cloud,
  CloudLightning,
  CloudRain,
  Coffee,
  Disc3,
  Droplet,
  Flame,
  Headphones,
  Leaf,
  Magnet,
  MoonStar,
  MoreHorizontal,
  Pause,
  PlusCircle,
  Timer,
  Waves,
  Wind,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { AppState, Modal } from "react-native";
import { FadeIn, FadeInUp, FadeOut, FadeOutUp, LinearTransition } from "react-native-reanimated";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { captureSoundMixSavedDeferred } from "../observability/sound-mixer-observability";
import { Animated, Pressable, ScrollView, Text, TextInput, View, cn } from "../tw";
import { createSoundMixerSavedMixId } from "./sound-mixer-local-persistence";

type MixerIconProps = {
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly testID?: string;
};

type MixerIcon = ElementType<MixerIconProps>;

type SavedMix = {
  readonly createdAt?: string;
  readonly layers: readonly SoundMixerActiveLayer[];
  readonly id: string;
  readonly label: string;
  readonly icons: readonly MixerIcon[];
  readonly localInstallId?: string;
  readonly name: string;
  readonly timerLabel?: string;
  readonly timerPreference: DomainSoundMixerSavedMix["timerPreference"];
  readonly updatedAt?: string;
};

type SoundCard = {
  readonly id: LaunchSoundId;
  readonly label: string;
  readonly Icon: MixerIcon;
  readonly volume?: number;
};

type SoundCategory = {
  readonly id: LaunchSoundCategoryId;
  readonly label: string;
  readonly sounds: readonly SoundCard[];
};

type PlaybackMode = "mixer" | "idle" | "controls" | "interrupted";
export type SoundMixerUIVariant =
  | "default"
  | "volume-editing"
  | "empty-mixer"
  | "empty-saved-mixes"
  | "full-saved-mixes"
  | "full-save-mix-sheet";

export const soundMixerUIVariants = [
  "default",
  "volume-editing",
  "empty-mixer",
  "empty-saved-mixes",
  "full-saved-mixes",
  "full-save-mix-sheet",
] as const satisfies readonly SoundMixerUIVariant[];

const soundMixerUIVariantSet = new Set<string>(soundMixerUIVariants);

export function parseSoundMixerUIVariant(
  value: string | readonly string[] | undefined,
): SoundMixerUIVariant {
  const requestedVariant = Array.isArray(value) ? value[0] : value;

  return requestedVariant && soundMixerUIVariantSet.has(requestedVariant)
    ? (requestedVariant as SoundMixerUIVariant)
    : "default";
}

type MixerState = {
  readonly activeSounds: readonly SoundCard[];
  readonly editingSoundId?: string;
  readonly isSavedMixesExpanded: boolean;
  readonly savedMixes: readonly SavedMix[];
  readonly showEmptySavedMixes: boolean;
  readonly soundCategories: readonly SoundCategory[];
};

const colors = {
  active: "#7C6FCD",
  activeSoft: "#A89CE0",
  inactive: "#A1A7C4",
  muted: "#6A7095",
  text: "#EEF0FF",
} as const;

const soundMixerVolumeRingHitAreaSize = 96;
const soundMixerVolumeDragThreshold = 6;
const soundMixerVolumeStep = 10;
export const soundMixerIdleDimmingDelayMs = 30_000;
const soundMixerTimerTickMs = 1_000;

const savedMixes: readonly SavedMix[] = [
  {
    id: "rain-hearth",
    label: "Rain Hearth",
    icons: [CloudRain, Flame],
    layers: [
      { soundId: "light-rain", volume: 72 },
      { soundId: "fireplace-crackling", volume: 34 },
    ],
    name: "Rain Hearth",
    timerLabel: "30 min",
    timerPreference: 30,
  },
  {
    id: "forest-stream",
    label: "Forest Stream",
    icons: [Leaf, Droplet],
    layers: [
      { soundId: "forest", volume: 70 },
      { soundId: "river-stream", volume: 52 },
    ],
    name: "Forest Stream",
    timerLabel: "45 min",
    timerPreference: 45,
  },
] as const;

const fullSavedMixes: readonly SavedMix[] = [
  ...savedMixes,
  {
    id: "ocean-noise",
    label: "Ocean Noise",
    icons: [Waves, ChartNoAxesColumn],
    layers: [
      { soundId: "ocean-waves", volume: 70 },
      { soundId: "brown-noise", volume: 58 },
    ],
    name: "Ocean Noise",
    timerLabel: "60 min",
    timerPreference: 60,
  },
] as const;

const soundCategories: readonly SoundCategory[] = [
  {
    id: "rain",
    label: "Rain",
    sounds: [
      { id: "light-rain", label: "Light Rain", Icon: CloudRain },
      { id: "heavy-rain", label: "Heavy Rain", Icon: Cloud },
      { id: "rain-on-window", label: "Rain on Window", Icon: AppWindowIcon },
      { id: "thunderstorm", label: "Thunderstorm", Icon: CloudLightning },
    ],
  },
  {
    id: "nature",
    label: "Nature",
    sounds: [
      { id: "ocean-waves", label: "Ocean Waves", Icon: Waves },
      { id: "forest", label: "Forest", Icon: Leaf },
      { id: "river-stream", label: "River Stream", Icon: Droplet },
      { id: "wind", label: "Wind", Icon: Wind },
    ],
  },
  {
    id: "noise",
    label: "Noise",
    sounds: [
      { id: "brown-noise", label: "Brown Noise", Icon: ChartNoAxesColumn },
      { id: "pink-noise", label: "Pink Noise", Icon: Disc3 },
    ],
  },
  {
    id: "environment",
    label: "Environment",
    sounds: [
      { id: "fireplace-crackling", label: "Fireplace Crackling", Icon: Flame },
      { id: "cafe-ambience", label: "Cafe Ambience", Icon: Coffee },
    ],
  },
  {
    id: "tones",
    label: "Tones",
    sounds: [
      { id: "432hz-tone", label: "432Hz Tone", Icon: Magnet },
      { id: "delta-wave-binaural", label: "Delta Wave Binaural", Icon: Headphones },
    ],
  },
] as const;

const timerOptions = ["20", "30", "45", "60", "∞"] as const;

function getInitialActiveLayersForVariant(
  variant: SoundMixerUIVariant,
): readonly SoundMixerActiveLayer[] {
  const volumesByVariant: Record<
    SoundMixerUIVariant,
    Readonly<Partial<Record<LaunchSoundId, number>>>
  > = {
    default: {
      "brown-noise": 58,
      "fireplace-crackling": 34,
      "light-rain": 72,
    },
    "empty-mixer": {},
    "empty-saved-mixes": {
      "brown-noise": 58,
      "light-rain": 72,
    },
    "full-save-mix-sheet": {
      "brown-noise": 58,
      "fireplace-crackling": 34,
      "light-rain": 72,
    },
    "full-saved-mixes": {
      "brown-noise": 58,
      "fireplace-crackling": 34,
      "light-rain": 72,
    },
    "volume-editing": {
      "brown-noise": 58,
      "fireplace-crackling": 34,
      "light-rain": 84,
    },
  };

  return launchSoundCatalog
    .map((sound): SoundMixerActiveLayer | null => {
      const volume = volumesByVariant[variant][sound.id];

      return volume === undefined ? null : { soundId: sound.id, volume };
    })
    .filter((layer): layer is SoundMixerActiveLayer => layer !== null);
}

function getSavedMixesForVariant(variant: SoundMixerUIVariant): readonly SavedMix[] {
  if (variant === "empty-saved-mixes") {
    return [];
  }

  return variant === "full-saved-mixes" || variant === "full-save-mix-sheet"
    ? fullSavedMixes
    : savedMixes;
}

function getSavedMixesFromRecords(
  records: readonly SoundMixerSavedMixRecord[] | undefined,
): readonly SavedMix[] | undefined {
  return records?.map(createSavedMixFromRecord);
}

function getInitialSavedMixes({
  records,
  variant,
}: {
  readonly records: readonly SoundMixerSavedMixRecord[] | undefined;
  readonly variant: SoundMixerUIVariant;
}): readonly SavedMix[] {
  return getSavedMixesFromRecords(records) ?? getSavedMixesForVariant(variant);
}

function createSavedMixFromRecord(record: SoundMixerSavedMixRecord): SavedMix {
  return {
    createdAt: record.createdAt,
    icons: getSavedMixIcons(record.layers),
    id: record.mixId,
    label: record.name,
    layers: record.layers,
    localInstallId: record.localInstallId,
    name: record.name,
    timerLabel: formatSoundMixerTimerPreference(record.timerPreference),
    timerPreference: record.timerPreference,
    updatedAt: record.updatedAt,
  };
}

function getSavedMixIcons(layers: readonly SoundMixerActiveLayer[]): readonly MixerIcon[] {
  const icons = layers.map((layer) => getSoundIcon(layer.soundId)).slice(0, 2);

  return icons.length === 0 ? [MoonStar] : icons;
}

function getSoundIcon(soundId: LaunchSoundId): MixerIcon {
  for (const category of soundCategories) {
    const sound = category.sounds.find((candidate) => candidate.id === soundId);

    if (sound) {
      return sound.Icon;
    }
  }

  return MoonStar;
}

function getDomainSavedMixes(mixes: readonly SavedMix[]): readonly DomainSoundMixerSavedMix[] {
  return mixes.map((mix) => ({
    layers: mix.layers,
    name: mix.name,
    timerPreference: mix.timerPreference,
  }));
}

function upsertSavedMix(mixes: readonly SavedMix[], nextMix: SavedMix): readonly SavedMix[] {
  const existingMixIndex = mixes.findIndex((mix) => mix.id === nextMix.id);

  if (existingMixIndex === -1) {
    return mixes.length >= soundMixerLimits.maxSavedMixes ? mixes : [...mixes, nextMix];
  }

  return mixes.map((mix, index) => (index === existingMixIndex ? nextMix : mix));
}

function getInitialEditingSoundId(variant: SoundMixerUIVariant): LaunchSoundId | undefined {
  return variant === "volume-editing" ? "light-rain" : undefined;
}

function createInitialSoundMixerController(
  variant: SoundMixerUIVariant,
  savedMixCatalog = getSavedMixesForVariant(variant),
): SoundMixerController {
  const activeLayers = getInitialActiveLayersForVariant(variant);

  return createSoundMixerController({
    activeLayers,
    savedMixes: getDomainSavedMixes(savedMixCatalog),
    state: activeLayers.length === 0 ? "idle-dark" : "playing",
  });
}

function getMixerState({
  controller,
  editingSoundId,
  savedMixes,
  variant,
}: {
  readonly controller: SoundMixerController;
  readonly editingSoundId?: LaunchSoundId;
  readonly savedMixes: readonly SavedMix[];
  readonly variant: SoundMixerUIVariant;
}): MixerState {
  const volumesBySoundId = new Map(
    controller.activeLayers.map((layer) => [layer.soundId, layer.volume] as const),
  );
  const soundCategoriesForVariant: readonly SoundCategory[] = soundCategories.map((category) => ({
    id: category.id,
    label: category.label,
    sounds: category.sounds.map((sound): SoundCard => {
      const volume = volumesBySoundId.get(sound.id);
      const baseSound = { Icon: sound.Icon, id: sound.id, label: sound.label };

      return volume === undefined ? baseSound : { ...baseSound, volume };
    }),
  }));

  const state: MixerState = {
    activeSounds: soundCategoriesForVariant
      .flatMap((category) => category.sounds)
      .filter((sound) => sound.volume !== undefined),
    isSavedMixesExpanded: variant === "full-saved-mixes",
    savedMixes,
    showEmptySavedMixes: savedMixes.length === 0,
    soundCategories: soundCategoriesForVariant,
  };

  return editingSoundId === undefined ? state : { ...state, editingSoundId };
}

function formatActiveLayerCount(count: number) {
  return `${count} active ${count === 1 ? "layer" : "layers"}`;
}

function formatSoundMixerTimerPreference(preference: SoundMixerSnapshot["timerPreference"]) {
  return preference === "infinity" ? "∞" : `${preference} min`;
}

function formatSoundMixerTimerDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  return `${Math.ceil(totalSeconds / 60)} min`;
}

function getSoundMixerTimerStatus(snapshot: SoundMixerSnapshot) {
  if (snapshot.timerPreference === "infinity" || snapshot.timerDurationMs === null) {
    return {
      primaryLabel: "Sound continues",
      primaryValue: undefined,
      secondaryLabel: "Timer is off",
      timerLabel: "∞",
    };
  }

  if (snapshot.state === "ended") {
    return {
      primaryLabel: "Timer ended",
      primaryValue: undefined,
      secondaryLabel: "Audio will stop",
      timerLabel: formatSoundMixerTimerPreference(snapshot.timerPreference),
    };
  }

  if (snapshot.state === "fading-out") {
    return {
      primaryLabel: "Fading out",
      primaryValue: formatSoundMixerTimerDuration(snapshot.remainingMs ?? 0),
      secondaryLabel: "Audio is lowering softly",
      timerLabel: formatSoundMixerTimerPreference(snapshot.timerPreference),
    };
  }

  const fadeStartsInMs = Math.max(
    0,
    (snapshot.remainingMs ?? 0) - soundMixerLimits.fadeOutDurationSeconds * 1000,
  );

  return {
    primaryLabel: "Fade starts in",
    primaryValue: formatSoundMixerTimerDuration(fadeStartsInMs),
    secondaryLabel: "Then fades out softly",
    timerLabel: formatSoundMixerTimerPreference(snapshot.timerPreference),
  };
}

export function getSoundMixerActiveStripMotionConfig(reduceMotionEnabled: boolean) {
  return reduceMotionEnabled
    ? {
        enabled: false,
        enterDurationMs: 0,
        enterTranslateY: 0,
        exitDurationMs: 0,
        exitTranslateY: 0,
      }
    : {
        enabled: true,
        enterDurationMs: 200,
        enterTranslateY: 12,
        exitDurationMs: 150,
        exitTranslateY: -8,
      };
}

export function getSoundMixerIdleDimmingMotionConfig(reduceMotionEnabled: boolean) {
  return reduceMotionEnabled
    ? {
        enabled: false,
      }
    : {
        enabled: true,
        enterDurationMs: 600,
        exitDurationMs: 400,
      };
}

export function calculateSoundMixerVolumeFromPoint({
  size = soundMixerVolumeRingHitAreaSize,
  x,
  y,
}: {
  readonly size?: number;
  readonly x: number;
  readonly y: number;
}) {
  const center = size / 2;
  const angleFromTop = Math.atan2(y - center, x - center) + Math.PI / 2;
  const normalizedAngle = (angleFromTop + Math.PI * 2) % (Math.PI * 2);

  return clampSoundMixerVolume(Math.round((normalizedAngle / (Math.PI * 2)) * 100));
}

function getSoundMixerVolumeDetent(volume: number) {
  return Math.floor(clampSoundMixerVolume(volume) / soundMixerVolumeStep);
}

export function SoundMixerScreen({
  disableHaptics = false,
  initialSavedMixRecords,
  initialPlaybackMode = "mixer",
  localInstallId,
  onSaveMix,
  reduceMotionOverride,
  uiVariant = "default",
}: {
  readonly disableHaptics?: boolean;
  readonly initialSavedMixRecords?: readonly SoundMixerSavedMixRecord[];
  readonly initialPlaybackMode?: PlaybackMode;
  readonly localInstallId?: string;
  readonly onSaveMix?: (record: SoundMixerSavedMixRecord) => Promise<void> | void;
  readonly reduceMotionOverride?: boolean;
  readonly uiVariant?: SoundMixerUIVariant;
} = {}) {
  const router = useRouter();
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    reduceMotionOverride ??
    (!reduceMotionPreference.isResolved || reduceMotionPreference.reduceMotionEnabled);
  const activeStripMotionConfig = getSoundMixerActiveStripMotionConfig(reduceMotionEnabled);
  const idleDimmingMotionConfig = getSoundMixerIdleDimmingMotionConfig(reduceMotionEnabled);
  const appStateRef = useRef(AppState.currentState);
  const initialSavedMixRecordsRef = useRef(initialSavedMixRecords);
  const [savedMixCatalog, setSavedMixCatalog] = useState(() =>
    getInitialSavedMixes({ records: initialSavedMixRecords, variant: uiVariant }),
  );
  const [controller, setController] = useState(() =>
    createInitialSoundMixerController(
      uiVariant,
      getInitialSavedMixes({ records: initialSavedMixRecords, variant: uiVariant }),
    ),
  );
  const [editingSoundId, setEditingSoundId] = useState<LaunchSoundId | undefined>(() =>
    getInitialEditingSoundId(uiVariant),
  );
  const [mixTitle, setMixTitle] = useState("Rain Hearth");
  const [maxLayerSoundId, setMaxLayerSoundId] = useState<LaunchSoundId | undefined>();
  const isFullSaveMixSheet = uiVariant === "full-save-mix-sheet";
  const [isSaveMixSheetOpen, setIsSaveMixSheetOpen] = useState(isFullSaveMixSheet);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(initialPlaybackMode);
  const [interactionSequence, setInteractionSequence] = useState(0);
  const [observedAtMs, setObservedAtMs] = useState(() => Date.now());
  const [playbackStartedAtMs, setPlaybackStartedAtMs] = useState<number | undefined>(() =>
    getInitialActiveLayersForVariant(uiVariant).length > 0 ? Date.now() : undefined,
  );
  const mixerState = useMemo(
    () =>
      getMixerState({
        controller,
        savedMixes: savedMixCatalog,
        variant: uiVariant,
        ...(editingSoundId === undefined ? {} : { editingSoundId }),
      }),
    [controller, editingSoundId, savedMixCatalog, uiVariant],
  );
  const activeLayerLabel = formatActiveLayerCount(mixerState.activeSounds.length);
  const hasActiveSounds = mixerState.activeSounds.length > 0;
  const showMaxLayerNotice = maxLayerSoundId !== undefined;
  const timerController = useMemo(() => {
    if (!hasActiveSounds || playbackStartedAtMs === undefined) {
      return controller;
    }

    return startSoundMixerPlayback(controller, playbackStartedAtMs);
  }, [controller, hasActiveSounds, playbackStartedAtMs]);
  const timerSnapshot = useMemo(
    () => getSoundMixerSnapshot(timerController, observedAtMs),
    [observedAtMs, timerController],
  );
  const timerStatus = useMemo(() => getSoundMixerTimerStatus(timerSnapshot), [timerSnapshot]);

  const markMixerInteraction = useCallback(() => {
    setObservedAtMs(Date.now());
    setInteractionSequence((currentSequence) => currentSequence + 1);
  }, []);

  const syncPlaybackStartForController = useCallback((nextController: SoundMixerController) => {
    if (nextController.activeLayers.length === 0) {
      setPlaybackStartedAtMs(undefined);
      return;
    }

    setPlaybackStartedAtMs((currentStartedAtMs) => currentStartedAtMs ?? Date.now());
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    setIsSaveMixSheetOpen(isFullSaveMixSheet);
  }, [isFullSaveMixSheet]);

  useEffect(() => {
    initialSavedMixRecordsRef.current = initialSavedMixRecords;
  }, [initialSavedMixRecords]);

  useEffect(() => {
    if (initialSavedMixRecords === undefined) {
      return;
    }

    const nextSavedMixCatalog = getInitialSavedMixes({
      records: initialSavedMixRecords,
      variant: uiVariant,
    });

    setSavedMixCatalog(nextSavedMixCatalog);
    setController((currentController) =>
      createSoundMixerController({
        ...currentController,
        savedMixes: getDomainSavedMixes(nextSavedMixCatalog),
      }),
    );
  }, [initialSavedMixRecords, uiVariant]);

  useEffect(() => {
    const nextSavedMixCatalog = getInitialSavedMixes({
      records: initialSavedMixRecordsRef.current,
      variant: uiVariant,
    });
    const nextController = createInitialSoundMixerController(uiVariant, nextSavedMixCatalog);

    setSavedMixCatalog(nextSavedMixCatalog);
    setController(nextController);
    setEditingSoundId(getInitialEditingSoundId(uiVariant));
    setMixTitle("Rain Hearth");
    setMaxLayerSoundId(undefined);
    setObservedAtMs(Date.now());
    setPlaybackStartedAtMs(nextController.activeLayers.length > 0 ? Date.now() : undefined);
  }, [uiVariant]);

  useEffect(() => {
    if (
      !hasActiveSounds ||
      isSaveMixSheetOpen ||
      (playbackMode !== "mixer" && playbackMode !== "controls")
    ) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setPlaybackMode("idle");
    }, soundMixerIdleDimmingDelayMs);

    return () => clearTimeout(timeout);
  }, [hasActiveSounds, interactionSequence, isSaveMixSheetOpen, playbackMode]);

  useEffect(() => {
    if (!hasActiveSounds || playbackStartedAtMs === undefined) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setObservedAtMs(Date.now());
    }, soundMixerTimerTickMs);

    return () => clearTimeout(timeout);
  }, [hasActiveSounds, observedAtMs, playbackStartedAtMs]);

  const triggerSelectionHaptic = useCallback(() => {
    if (
      disableHaptics ||
      appStateRef.current === "background" ||
      appStateRef.current === "inactive"
    ) {
      return;
    }

    void Haptics.selectionAsync().catch(() => undefined);
  }, [disableHaptics]);

  const triggerVolumeDetentHaptic = useCallback(
    (previousVolume: number, nextVolume: number) => {
      if (getSoundMixerVolumeDetent(previousVolume) !== getSoundMixerVolumeDetent(nextVolume)) {
        triggerSelectionHaptic();
      }
    },
    [triggerSelectionHaptic],
  );

  const updateLayerVolume = useCallback(
    (soundId: LaunchSoundId, volume: number) => {
      markMixerInteraction();
      setController((currentController) => {
        const previousVolume = currentController.activeLayers.find(
          (layer) => layer.soundId === soundId,
        )?.volume;

        if (previousVolume === undefined) {
          return currentController;
        }

        const nextVolume = clampSoundMixerVolume(volume);

        if (previousVolume === nextVolume) {
          return currentController;
        }

        triggerVolumeDetentHaptic(previousVolume, nextVolume);
        return setSoundMixerLayerVolume(currentController, soundId, nextVolume);
      });
      setEditingSoundId(soundId);
      setMaxLayerSoundId(undefined);
    },
    [markMixerInteraction, triggerVolumeDetentHaptic],
  );

  const adjustLayerVolume = useCallback(
    (soundId: LaunchSoundId, delta: number) => {
      markMixerInteraction();
      setController((currentController) => {
        const previousVolume = currentController.activeLayers.find(
          (layer) => layer.soundId === soundId,
        )?.volume;

        if (previousVolume === undefined) {
          return currentController;
        }

        const nextVolume = clampSoundMixerVolume(previousVolume + delta);

        if (previousVolume === nextVolume) {
          return currentController;
        }

        triggerVolumeDetentHaptic(previousVolume, nextVolume);
        return setSoundMixerLayerVolume(currentController, soundId, nextVolume);
      });
      setEditingSoundId(soundId);
      setMaxLayerSoundId(undefined);
    },
    [markMixerInteraction, triggerVolumeDetentHaptic],
  );

  const handleSoundCardPress = useCallback(
    (sound: SoundCard) => {
      markMixerInteraction();
      setController((currentController) => {
        const isActive = currentController.activeLayers.some((layer) => layer.soundId === sound.id);
        let nextController: SoundMixerController;

        if (isActive) {
          setEditingSoundId((currentEditingSoundId) =>
            currentEditingSoundId === sound.id ? undefined : currentEditingSoundId,
          );
          setMaxLayerSoundId(undefined);
          setMixTitle("Tonight mix");
          triggerSelectionHaptic();
          nextController = deactivateSoundMixerLayer(currentController, sound.id);
          syncPlaybackStartForController(nextController);
          return nextController;
        }

        if (currentController.activeLayers.length >= soundMixerLimits.maxActiveLayers) {
          setMaxLayerSoundId(sound.id);
          return currentController;
        }

        setEditingSoundId(undefined);
        setMaxLayerSoundId(undefined);
        setMixTitle("Tonight mix");
        triggerSelectionHaptic();
        nextController = activateSoundMixerLayer(currentController, sound.id);
        syncPlaybackStartForController(nextController);
        return nextController;
      });
    },
    [markMixerInteraction, syncPlaybackStartForController, triggerSelectionHaptic],
  );

  const handleSavedMixPress = useCallback(
    (mix: SavedMix) => {
      markMixerInteraction();
      setController((currentController) => {
        const nextController = createSoundMixerController({
          ...currentController,
          activeLayers: mix.layers,
          state: mix.layers.length === 0 ? "idle-dark" : "playing",
          timerPreference: mix.timerPreference,
        });

        syncPlaybackStartForController(nextController);
        return nextController;
      });
      setEditingSoundId(undefined);
      setMixTitle(mix.name);
      setMaxLayerSoundId(undefined);
      triggerSelectionHaptic();
    },
    [markMixerInteraction, syncPlaybackStartForController, triggerSelectionHaptic],
  );

  const handleSaveMixSubmit = useCallback(
    async ({ name, replaceMixId }: { readonly name: string; readonly replaceMixId?: string }) => {
      if (controller.activeLayers.length === 0) {
        throw new Error("Sound mixer saved mixes require at least one active layer.");
      }

      const existingMix =
        replaceMixId === undefined
          ? undefined
          : savedMixCatalog.find((savedMix) => savedMix.id === replaceMixId);
      const nowIso = new Date().toISOString();
      const savedMixRecord = soundMixerSavedMixRecordSchema.parse({
        createdAt: existingMix?.createdAt ?? nowIso,
        layers: controller.activeLayers,
        localInstallId: localInstallId ?? "install_soundmixerlocal",
        mixId:
          existingMix?.id.startsWith("soundmix_") === true
            ? existingMix.id
            : createSoundMixerSavedMixId(),
        name,
        timerPreference: controller.timerPreference,
        updatedAt: nowIso,
      });
      const nextSavedMix = createSavedMixFromRecord(savedMixRecord);
      const nextSavedMixCatalog = upsertSavedMix(savedMixCatalog, nextSavedMix);

      if (onSaveMix) {
        await onSaveMix(savedMixRecord);
        captureSoundMixSavedDeferred(savedMixRecord);
      }

      setSavedMixCatalog(nextSavedMixCatalog);
      setController((currentController) =>
        createSoundMixerController({
          ...currentController,
          savedMixes: getDomainSavedMixes(nextSavedMixCatalog),
        }),
      );
      setMixTitle(savedMixRecord.name);
      setIsSaveMixSheetOpen(false);
    },
    [controller, localInstallId, onSaveMix, savedMixCatalog],
  );

  if (playbackMode !== "mixer") {
    return (
      <Modal
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible
      >
        <SoundMixerPlaybackScreen
          activeSounds={mixerState.activeSounds}
          idleDimmingMotionConfig={idleDimmingMotionConfig}
          mixTitle={mixTitle}
          mode={playbackMode}
          onReturnToMixer={() => {
            markMixerInteraction();
            setPlaybackMode("mixer");
          }}
          onResumeSound={() => {
            markMixerInteraction();
            setPlaybackMode("controls");
          }}
          onShowIdle={() => {
            setPlaybackMode("idle");
          }}
          onWake={() => {
            markMixerInteraction();
            setPlaybackMode("controls");
          }}
          timerStatus={timerStatus}
        />
      </Modal>
    );
  }

  return (
    <View className="flex-1 bg-[#0D0F1A]" testID="sound-mixer-screen">
      <StatusBar hidden />
      <View
        className={cn(
          "will-change-variable flex-1 bg-[#0D0F1A]",
          isSaveMixSheetOpen ? "opacity-[0.45] blur-[2px]" : null,
        )}
        importantForAccessibility={isSaveMixSheetOpen ? "no-hide-descendants" : "auto"}
        onTouchStart={markMixerInteraction}
        pointerEvents={isSaveMixSheetOpen ? "none" : "auto"}
        testID="sound-mixer-main-content"
      >
        <ScrollView
          className="flex-1 bg-[#0D0F1A]"
          contentContainerClassName="pb-[252px]"
          contentInsetAdjustmentBehavior="automatic"
          scrollEnabled={!isSaveMixSheetOpen}
          showsVerticalScrollIndicator={false}
          testID="sound-mixer-scroll"
        >
          <View className="px-nidoru-screen pt-12 pb-2" testID="sound-mixer-header">
            <View className="mb-1 min-h-8 flex-row items-center justify-between">
              <Pressable
                accessibilityHint="Returns to the previous sleep screen."
                accessibilityLabel="Back to Sleep"
                accessibilityRole="button"
                className="-ml-2 h-11 w-11 items-center justify-center rounded-[14px] active:scale-[0.96]"
                onPress={() => {
                  router.back();
                }}
                testID="sound-mixer-back"
              >
                <ChevronLeft color={colors.text} size={22} strokeWidth={1.5} />
              </Pressable>

              <Text
                accessibilityRole="header"
                className="-ml-1 flex-1 text-center font-nidoru-primary-regular text-[22px] font-medium leading-[28px] text-[#EEF0FF]"
                selectable
              >
                Sound Mixer
              </Text>

              <View
                className="ml-2 min-h-[29px] items-center justify-center rounded-full border border-[#1E2236] bg-[#1C2040] px-2.5 py-[5px]"
                testID="sound-mixer-offline-pill"
              >
                <Text className="font-nidoru-primary-semibold text-[11px] leading-[14px] tracking-wide text-[#A89CE0]">
                  Offline pack
                </Text>
              </View>
            </View>

            <Text
              className="ml-1 mt-0.5 font-nidoru-primary-regular text-sm font-light leading-5 text-[#8A8FA8]"
              selectable
            >
              Layer sounds for tonight.
            </Text>
          </View>

          <SavedMixesSection onSavedMixPress={handleSavedMixPress} state={mixerState} />

          <View className="mt-4 px-nidoru-screen">
            <View
              className="h-[52px] flex-row items-center justify-between rounded-[16px] border border-[#1E2236]/50 bg-[#14172B]/70 px-4"
              testID="sound-mixer-timer-card"
            >
              <View className="flex-row items-center gap-3.5">
                <Timer color={colors.active} size={20} strokeWidth={1.5} />
                <View>
                  <Text className="font-nidoru-primary-regular text-sm leading-[18px] tracking-wide text-[#EEF0FF]">
                    Timer <Text className="text-[#4A4E6A]">·</Text>{" "}
                    <Text className="font-nidoru-data-regular text-[#A89CE0] tabular-nums">
                      {timerStatus.timerLabel}
                    </Text>
                  </Text>
                  <Text className="mt-0.5 font-nidoru-primary-regular text-xs font-light leading-4 tracking-wide text-[#8A8FA8]">
                    {hasActiveSounds
                      ? `${timerStatus.primaryLabel} `
                      : "Starts when a sound plays."}
                    {hasActiveSounds ? (
                      <Text className="font-nidoru-data-regular tabular-nums">
                        {timerStatus.primaryValue}
                      </Text>
                    ) : null}
                  </Text>
                </View>
              </View>
              <View className="h-8 w-8 items-center justify-center">
                <ProgressRing
                  progress={0.93}
                  size={32}
                  strokeColor={colors.active}
                  strokeWidth={2}
                  trackColor="#1E2236"
                />
                <View className="absolute inset-0 items-center justify-center">
                  <MoonStar color={colors.activeSoft} size={14} strokeWidth={1.5} />
                </View>
              </View>
            </View>
          </View>

          <View className="mt-5 gap-6 px-nidoru-screen pb-10">
            {mixerState.soundCategories.map((category) => (
              <View key={category.id}>
                <Text className="ml-1 mb-3 font-nidoru-primary-semibold text-[11px] leading-4 tracking-[0.1em] text-[#4A4E6A]">
                  {category.label.toUpperCase()}
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {category.sounds.map((sound) => (
                    <SoundCardButton
                      isEditing={mixerState.editingSoundId === sound.id}
                      key={sound.id}
                      onPress={() => {
                        handleSoundCardPress(sound);
                      }}
                      onVolumeAdjust={(delta) => {
                        adjustLayerVolume(sound.id, delta);
                      }}
                      onVolumeChange={(volume) => {
                        updateLayerVolume(sound.id, volume);
                      }}
                      onVolumeEditingStart={() => {
                        setEditingSoundId(sound.id);
                        setMaxLayerSoundId(undefined);
                      }}
                      sound={sound}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          className="absolute bottom-[96px] left-nidoru-screen right-nidoru-screen z-40 gap-3.5 rounded-[24px] border border-[#1E2236]/80 bg-[#14172B]/95 p-3.5 shadow-[0_-8px_30px_rgba(13,15,26,0.9)]"
          testID="sound-mixer-active-strip"
        >
          <Pressable
            accessibilityHint="Opens the low-light playback screen."
            accessibilityLabel="Show dark playback mode"
            accessibilityRole="button"
            accessibilityState={hasActiveSounds ? undefined : { disabled: true }}
            className="min-h-11 flex-row items-center justify-between rounded-[14px] px-1 active:scale-[0.98]"
            disabled={hasActiveSounds ? undefined : true}
            onPress={() => {
              markMixerInteraction();
              setPlaybackMode("idle");
            }}
            testID="sound-mixer-show-dark-playback"
          >
            <View>
              <Text className="font-nidoru-primary-semibold text-[15px] leading-5 tracking-wide text-[#EEF0FF]">
                Tonight mix
              </Text>
              <Text className="mt-0.5 font-nidoru-primary-regular text-xs leading-4 tracking-wide text-[#A1A7C4]">
                {hasActiveSounds ? activeLayerLabel : "Choose up to 3 layers"}
              </Text>
            </View>
            <View className="flex-row gap-1.5" testID="sound-mixer-active-icons">
              {mixerState.activeSounds.map((sound) => (
                <ActiveMiniIcon
                  key={sound.id}
                  motionConfig={activeStripMotionConfig}
                  sound={sound}
                />
              ))}
            </View>
          </Pressable>

          {showMaxLayerNotice ? (
            <View
              accessibilityLiveRegion="polite"
              className="-mt-1 rounded-[12px] border border-[#2D3359]/60 bg-[#0D0F1A] px-3 py-2"
              testID="sound-mixer-max-layer-notice"
            >
              <Text className="font-nidoru-primary-regular text-xs leading-4 tracking-wide text-[#A89CE0]">
                3 layers max. Remove one to add another.
              </Text>
            </View>
          ) : null}

          <View className="h-11 flex-row gap-3">
            <View
              className={cn(
                "flex-1 flex-row items-center rounded-[14px] border border-[#1E2236]/60 bg-[#0D0F1A] p-1",
                hasActiveSounds ? null : "opacity-50",
              )}
              testID="sound-mixer-timer-segments"
            >
              {timerOptions.map((option) => {
                const selected = option === "30";

                return (
                  <Pressable
                    accessibilityLabel={`${option} minute timer${selected ? ", selected" : ""}`}
                    accessibilityRole="button"
                    accessibilityState={
                      hasActiveSounds ? { selected } : { disabled: true, selected }
                    }
                    className={cn(
                      "h-full flex-1 items-center justify-center rounded-[10px]",
                      selected ? "border border-[#2D3359]/50 bg-[#1C2040]" : null,
                    )}
                    disabled={hasActiveSounds ? undefined : true}
                    key={option}
                    testID={`sound-mixer-timer-option-${option}`}
                  >
                    <Text
                      className={cn(
                        "font-nidoru-data-regular text-[13px] leading-[18px] tabular-nums",
                        selected ? "text-[#EEF0FF]" : "text-[#6A7095]",
                      )}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityHint="Opens the Save Mix sheet."
              accessibilityLabel="Save Mix"
              accessibilityRole="button"
              accessibilityState={hasActiveSounds ? undefined : { disabled: true }}
              className={cn(
                "h-full shrink-0 items-center justify-center rounded-[14px] px-4 active:scale-[0.96]",
                hasActiveSounds
                  ? "bg-[#7C6FCD] shadow-[0_0_15px_rgba(124,111,205,0.25)]"
                  : "bg-[#1C2040] opacity-60",
              )}
              disabled={hasActiveSounds ? undefined : true}
              onPress={() => {
                markMixerInteraction();
                setIsSaveMixSheetOpen(true);
              }}
              testID="sound-mixer-save-mix"
            >
              <Text className="font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-white">
                Save Mix
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {isSaveMixSheetOpen ? (
        <SaveMixSheet
          activeSounds={mixerState.activeSounds}
          initialName={mixTitle}
          savedMixes={mixerState.savedMixes}
          onDismiss={() => {
            setIsSaveMixSheetOpen(false);
          }}
          onSubmit={handleSaveMixSubmit}
          variant={
            isFullSaveMixSheet || mixerState.savedMixes.length >= soundMixerLimits.maxSavedMixes
              ? "full"
              : "default"
          }
        />
      ) : null}
    </View>
  );
}

function SoundMixerPlaybackScreen({
  activeSounds,
  idleDimmingMotionConfig,
  mixTitle,
  mode,
  onReturnToMixer,
  onResumeSound,
  onShowIdle,
  onWake,
  timerStatus,
}: {
  readonly activeSounds: readonly SoundCard[];
  readonly idleDimmingMotionConfig: ReturnType<typeof getSoundMixerIdleDimmingMotionConfig>;
  readonly mixTitle: string;
  readonly mode: Exclude<PlaybackMode, "mixer">;
  readonly onReturnToMixer: () => void;
  readonly onResumeSound: () => void;
  readonly onShowIdle: () => void;
  readonly onWake: () => void;
  readonly timerStatus: ReturnType<typeof getSoundMixerTimerStatus>;
}) {
  if (mode === "idle") {
    return (
      <SoundMixerIdlePlaybackScreen
        activeSounds={activeSounds}
        idleDimmingMotionConfig={idleDimmingMotionConfig}
        mixTitle={mixTitle}
        onWake={onWake}
        timerStatus={timerStatus}
      />
    );
  }

  if (mode === "interrupted") {
    return (
      <SoundMixerInterruptedPlaybackScreen
        activeSounds={activeSounds}
        onKeepStopped={onReturnToMixer}
        onResumeSound={onResumeSound}
      />
    );
  }

  return (
    <Animated.View
      {...(idleDimmingMotionConfig.enabled
        ? { entering: FadeIn.duration(idleDimmingMotionConfig.enterDurationMs ?? 0) }
        : {})}
      className="flex-1 bg-[#03040A] px-nidoru-screen pt-12 pb-8"
      testID="sound-mixer-dark-playback-controls"
    >
      <StatusBar hidden />
      <View className="absolute inset-0 bg-gradient-to-b from-[#0D0F1A]/25 to-transparent" />

      <View className="min-h-11 flex-row items-center justify-between">
        <Pressable
          accessibilityLabel="Back to mixer"
          accessibilityRole="button"
          className="-ml-2 h-11 w-11 items-center justify-center rounded-[14px] active:scale-[0.96]"
          onPress={onReturnToMixer}
          testID="sound-mixer-playback-back"
        >
          <ChevronLeft color={colors.inactive} size={22} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-nidoru-primary-regular text-sm font-light leading-5 tracking-wide text-[#8A8FA8]">
          Playing softly
        </Text>
        <Pressable
          accessibilityLabel="Dim playback controls"
          accessibilityRole="button"
          className="-mr-2 h-11 w-11 items-center justify-center rounded-[14px] active:scale-[0.96]"
          onPress={onShowIdle}
          testID="sound-mixer-playback-dim"
        >
          <MoonStar color={colors.activeSoft} size={20} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View className="flex-1 justify-between pt-12">
        <View className="items-center">
          <View
            className="mb-7 h-[148px] w-[148px] items-center justify-center"
            testID="sound-mixer-playback-controls-ring"
          >
            <ProgressRing
              progress={0.93}
              progressOpacity={0.42}
              size={148}
              strokeColor={colors.active}
              strokeWidth={2}
              trackColor={colors.muted}
              trackOpacity={0.16}
            />
            <Pressable
              accessibilityHint="Pauses the active sleep sound mix."
              accessibilityLabel="Pause sound"
              accessibilityRole="button"
              className="absolute h-16 w-16 items-center justify-center rounded-full border border-[#2D3359] bg-[#14172B]/80 active:scale-[0.96]"
              testID="sound-mixer-playback-pause"
            >
              <Pause color={colors.text} size={26} strokeWidth={1.6} />
            </Pressable>
          </View>

          <Text
            accessibilityRole="header"
            className="font-nidoru-primary-regular text-[24px] font-medium leading-[30px] text-[#EEF0FF]"
            selectable
          >
            {mixTitle}
          </Text>
          <Text className="mt-2 font-nidoru-primary-regular text-sm font-medium leading-5 tracking-wide text-[#EEF0FF]/60">
            {timerStatus.primaryLabel}
            {timerStatus.primaryValue ? (
              <Text className="font-nidoru-data-regular tabular-nums">
                {" "}
                {timerStatus.primaryValue}
              </Text>
            ) : null}
          </Text>
          <Text className="mt-1 font-nidoru-primary-regular text-xs font-light leading-4 tracking-wide text-[#4A4E6A]">
            Timer <Text>·</Text>{" "}
            <Text className="font-nidoru-data-regular tabular-nums">{timerStatus.timerLabel}</Text>
          </Text>
        </View>

        <View className="gap-4">
          <View
            className="gap-3 rounded-[22px] border border-[#1E2236]/70 bg-[#0D0F1A]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            testID="sound-mixer-playback-layer-tray"
          >
            {activeSounds.map((sound) => (
              <PlaybackLayerRow key={sound.id} sound={sound} />
            ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityLabel="Save Mix"
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-[14px] border border-[#2D3359]/70 bg-[#14172B]/70 active:scale-[0.98]"
              testID="sound-mixer-playback-save"
            >
              <Text className="font-nidoru-primary-semibold text-sm leading-[18px] tracking-wide text-[#A89CE0]">
                Save Mix
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Adjust mix"
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-[14px] bg-[#7C6FCD] shadow-[0_0_15px_rgba(124,111,205,0.18)] active:scale-[0.98]"
              onPress={onReturnToMixer}
              testID="sound-mixer-playback-adjust"
            >
              <Text className="font-nidoru-primary-semibold text-sm leading-[18px] tracking-wide text-white">
                Adjust mix
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function SoundMixerInterruptedPlaybackScreen({
  activeSounds,
  onKeepStopped,
  onResumeSound,
}: {
  readonly activeSounds: readonly SoundCard[];
  readonly onKeepStopped: () => void;
  readonly onResumeSound: () => void;
}) {
  return (
    <View
      className="flex-1 bg-[#03040A] px-nidoru-screen pt-12 pb-8"
      testID="sound-mixer-dark-playback-interrupted"
    >
      <StatusBar hidden />
      <View className="absolute inset-0 bg-gradient-to-b from-[#0D0F1A]/25 to-transparent" />

      <View className="min-h-11 flex-row items-center justify-start">
        <Pressable
          accessibilityLabel="Back to mixer"
          accessibilityRole="button"
          className="-ml-2 h-11 w-11 items-center justify-center rounded-[14px] active:scale-[0.96]"
          onPress={onKeepStopped}
          testID="sound-mixer-interrupted-back"
        >
          <ChevronLeft color={colors.inactive} size={22} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View className="flex-1 justify-between pt-12">
        <View className="items-center">
          <View
            className="mb-7 h-[132px] w-[132px] items-center justify-center opacity-80"
            testID="sound-mixer-interrupted-ring"
          >
            <ProgressRing
              progress={0.72}
              progressOpacity={0.18}
              size={132}
              strokeColor={colors.active}
              strokeWidth={2}
              trackColor={colors.muted}
              trackOpacity={0.16}
            />
            <View className="absolute inset-0 items-center justify-center">
              <View className="h-16 w-16 items-center justify-center rounded-full border border-[#2D3359] bg-[#14172B]/70">
                <Headphones color={colors.activeSoft} size={28} strokeWidth={1.5} />
              </View>
            </View>
          </View>

          <Text
            accessibilityRole="header"
            className="font-nidoru-primary-regular text-[24px] font-medium leading-[30px] text-[#EEF0FF]"
            selectable
          >
            Playback paused
          </Text>
          <Text className="mt-2 font-nidoru-primary-regular text-sm font-light leading-5 tracking-wide text-[#8A8FA8]">
            Audio was interrupted.
          </Text>
          <Text className="mt-1 font-nidoru-primary-regular text-xs font-light leading-4 tracking-wide text-[#4A4E6A]">
            Timer is paused until you resume.
          </Text>

          <View className="mt-9 max-w-[280px] flex-row flex-wrap justify-center gap-2">
            {activeSounds.map((sound) => (
              <PlaybackLayerChip key={sound.id} sound={sound} />
            ))}
          </View>
        </View>

        <View className="gap-4">
          <View className="rounded-[18px] border border-[#1E2236]/60 bg-[#0D0F1A]/70 p-4">
            <Text className="text-center font-nidoru-primary-regular text-xs font-light leading-5 tracking-wide text-[#8A8FA8]">
              Check your audio output if this keeps happening.
            </Text>
          </View>

          <View className="gap-2">
            <Pressable
              accessibilityLabel="Resume sound"
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-[14px] bg-[#7C6FCD] shadow-[0_0_15px_rgba(124,111,205,0.18)] active:scale-[0.98]"
              onPress={onResumeSound}
              testID="sound-mixer-interrupted-resume"
            >
              <Text className="font-nidoru-primary-semibold text-[15px] leading-5 tracking-wide text-white">
                Resume sound
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Keep stopped"
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-[14px] bg-transparent active:scale-[0.98]"
              onPress={onKeepStopped}
              testID="sound-mixer-interrupted-stop"
            >
              <Text className="font-nidoru-primary-semibold text-[15px] leading-5 tracking-wide text-[#8A8FA8]">
                Keep stopped
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function SoundMixerIdlePlaybackScreen({
  activeSounds,
  idleDimmingMotionConfig,
  mixTitle,
  onWake,
  timerStatus,
}: {
  readonly activeSounds: readonly SoundCard[];
  readonly idleDimmingMotionConfig: ReturnType<typeof getSoundMixerIdleDimmingMotionConfig>;
  readonly mixTitle: string;
  readonly onWake: () => void;
  readonly timerStatus: ReturnType<typeof getSoundMixerTimerStatus>;
}) {
  return (
    <Animated.Pressable
      accessibilityLabel="Tap to show controls"
      accessibilityRole="button"
      {...(idleDimmingMotionConfig.enabled
        ? {
            entering: FadeIn.duration(idleDimmingMotionConfig.enterDurationMs ?? 0),
            exiting: FadeOut.duration(idleDimmingMotionConfig.exitDurationMs ?? 0),
          }
        : {})}
      className="relative flex-1 bg-[#03040A] items-center justify-center overflow-hidden active:scale-[0.99]"
      onPress={onWake}
      testID="sound-mixer-dark-playback-idle"
    >
      <StatusBar hidden />
      <View className="absolute inset-0 bg-black" testID="sound-mixer-app-dimming-surface" />
      <View className="absolute inset-0 bg-gradient-to-b from-[#0D0F1A]/20 to-transparent" />

      <View className="relative z-10 -mt-10 w-full items-center px-6">
        <View
          className="mb-8 h-28 w-28 items-center justify-center opacity-80"
          testID="sound-mixer-dark-playback-ring"
        >
          <ProgressRing
            progress={0.93}
            progressOpacity={0.35}
            size={112}
            strokeColor={colors.active}
            strokeWidth={1.5}
            trackColor={colors.muted}
            trackOpacity={0.15}
          />
          <View className="absolute inset-0 items-center justify-center">
            <MoonStar color={colors.active} size={36} strokeWidth={1.5} />
          </View>
        </View>

        <Text
          accessibilityRole="header"
          className="mb-1 font-nidoru-primary-regular text-2xl font-medium leading-[31px] text-[#EEF0FF]/80"
          selectable
        >
          {mixTitle}
        </Text>
        <Text className="mb-10 font-nidoru-primary-regular text-sm font-light leading-5 tracking-wide text-[#8A8FA8]/70">
          Playing softly
        </Text>

        <View className="mb-12 max-w-[280px] flex-row flex-wrap justify-center gap-2">
          {activeSounds.map((sound) => (
            <PlaybackLayerChip key={sound.id} sound={sound} />
          ))}
        </View>

        <Text className="mb-1.5 font-nidoru-primary-regular text-sm font-medium leading-5 tracking-wide text-[#EEF0FF]/60">
          {timerStatus.primaryLabel}
          {timerStatus.primaryValue ? (
            <Text className="font-nidoru-data-regular tabular-nums">
              {" "}
              {timerStatus.primaryValue}
            </Text>
          ) : null}
        </Text>
        <Text className="font-nidoru-primary-regular text-xs font-light leading-4 tracking-wide text-[#4A4E6A]">
          {timerStatus.secondaryLabel}
        </Text>
      </View>

      <View className="absolute bottom-10 left-0 right-0 items-center pb-6">
        <Text className="font-nidoru-primary-semibold text-xs leading-4 tracking-[0.18em] text-[#8A8FA8]/40">
          TAP TO SHOW CONTROLS
        </Text>
      </View>
    </Animated.Pressable>
  );
}

function PlaybackLayerChip({ sound }: { readonly sound: SoundCard }) {
  const Icon = sound.Icon;

  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-[#1E2236]/30 bg-[#0D0F1A]/40 px-3 py-1.5">
      <Icon color={colors.active} size={14} strokeWidth={1.5} />
      <Text className="font-nidoru-primary-semibold text-xs leading-4 tracking-wide text-[#8A8FA8]/60">
        {getPlaybackLayerLabel(sound)}
      </Text>
    </View>
  );
}

function PlaybackLayerRow({ sound }: { readonly sound: SoundCard }) {
  const Icon = sound.Icon;
  const volume = sound.volume ?? 0;
  const volumeWidth = `${volume}%` as const;

  return (
    <View
      accessibilityLabel={`${sound.label} active layer at ${volume}% volume`}
      accessible
      className="min-h-11 flex-row items-center justify-between gap-3"
      testID={`sound-mixer-playback-layer-${sound.id}`}
    >
      <View className="flex-1 flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full border border-[#2D3359] bg-[#1C2040]/70">
          <Icon color={colors.activeSoft} size={16} strokeWidth={1.5} />
        </View>
        <Text className="font-nidoru-primary-regular text-sm leading-[18px] tracking-wide text-[#EEF0FF]/85">
          {sound.label}
        </Text>
      </View>
      <View className="w-[72px] items-end gap-1">
        <Text className="font-nidoru-data-regular text-sm font-medium leading-[18px] text-[#A89CE0] tabular-nums">
          {volumeWidth}
        </Text>
        <View className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E2236]">
          <View className="h-full rounded-full bg-[#7C6FCD]/70" style={{ width: volumeWidth }} />
        </View>
      </View>
    </View>
  );
}

function getPlaybackLayerLabel(sound: SoundCard) {
  if (sound.id === "fireplace-crackling") {
    return "Fireplace";
  }

  return sound.label;
}

function SavedMixesSection({
  onSavedMixPress,
  state,
}: {
  readonly onSavedMixPress?: (mix: SavedMix) => void;
  readonly state: MixerState;
}) {
  if (state.isSavedMixesExpanded) {
    return (
      <View className="mt-1 px-nidoru-screen" testID="sound-mixer-saved-mixes-full-section">
        <View className="mb-3 min-h-4 flex-row items-center justify-between px-1">
          <Text className="font-nidoru-primary-semibold text-[11px] leading-4 tracking-[0.1em] text-[#4A4E6A]">
            SAVED MIXES
          </Text>
          <Text className="font-nidoru-data-regular text-xs font-medium leading-4 text-[#A89CE0] tabular-nums">
            3 of 3 saved
          </Text>
        </View>
        <View
          className="gap-2 rounded-[18px] border border-[#1E2236]/70 bg-[#14172B]/70 p-2.5"
          testID="sound-mixer-saved-mixes-full-panel"
        >
          <View className="flex-row flex-wrap gap-2">
            {state.savedMixes.map((mix) => (
              <SavedMixManagementChip
                key={mix.id}
                mix={mix}
                onPress={() => {
                  onSavedMixPress?.(mix);
                }}
              />
            ))}
            <Pressable
              accessibilityLabel="Saved mixes full"
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              className="h-10 shrink-0 flex-row items-center gap-1.5 rounded-[14px] border border-[#1E2236]/80 bg-[#0D0F1A] px-3.5 opacity-60"
              disabled
              testID="sound-mixer-saved-mixes-full-chip"
            >
              <Text className="font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-[#6A7095]">
                Full
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (state.showEmptySavedMixes) {
    return (
      <View className="mt-1 pl-nidoru-screen" testID="sound-mixer-saved-mixes-empty-section">
        <Text className="ml-1 mb-3 font-nidoru-primary-semibold text-[11px] leading-4 tracking-[0.1em] text-[#4A4E6A]">
          SAVED MIXES
        </Text>
        <View className="min-h-10 flex-row items-center gap-3 pr-nidoru-screen">
          <NewMixChip />
          <Text className="font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#6A7095]">
            No saved mixes yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-1 pl-nidoru-screen">
      <Text className="ml-1 mb-3 font-nidoru-primary-semibold text-[11px] leading-4 tracking-[0.1em] text-[#4A4E6A]">
        SAVED MIXES
      </Text>
      <ScrollView
        className="w-full"
        contentContainerClassName="gap-2 pr-nidoru-screen pb-2"
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="sound-mixer-saved-mixes-row"
      >
        {state.savedMixes.map((mix) => (
          <SavedMixChip
            key={mix.id}
            mix={mix}
            onPress={() => {
              onSavedMixPress?.(mix);
            }}
          />
        ))}
        <NewMixChip />
      </ScrollView>
    </View>
  );
}

function SaveMixSheet({
  activeSounds,
  initialName,
  savedMixes,
  onDismiss,
  onSubmit,
  variant,
}: {
  readonly activeSounds: readonly SoundCard[];
  readonly initialName: string;
  readonly savedMixes: readonly SavedMix[];
  readonly onDismiss: () => void;
  readonly onSubmit: (input: {
    readonly name: string;
    readonly replaceMixId?: string;
  }) => Promise<void>;
  readonly variant: "default" | "full";
}) {
  const isFull = variant === "full";
  const [mixName, setMixName] = useState(initialName);
  const [selectedReplacementMixId, setSelectedReplacementMixId] = useState(() => savedMixes[0]?.id);
  const [saveError, setSaveError] = useState<string | undefined>();

  const handleSubmit = useCallback(async () => {
    setSaveError(undefined);

    try {
      await onSubmit({
        name: mixName,
        ...(isFull && selectedReplacementMixId !== undefined
          ? { replaceMixId: selectedReplacementMixId }
          : {}),
      });
    } catch {
      setSaveError("Check the mix name and try again.");
    }
  }, [isFull, mixName, onSubmit, selectedReplacementMixId]);

  return (
    <Modal
      animationType="none"
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible
    >
      <View
        accessibilityViewIsModal
        className="absolute inset-0 z-[100] justify-end bg-black/45 backdrop-blur-[2px]"
        testID="sound-mixer-save-mix-overlay"
      >
        <View
          className="w-full rounded-t-[24px] border-t border-[#1E2236] bg-[#14172B] px-5 pt-3 pb-11 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          testID="sound-mixer-save-mix-sheet"
        >
          <View
            accessibilityElementsHidden
            className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#2D3359]"
            testID="sound-mixer-save-mix-handle"
          />

          <View className="mb-2 min-h-11 flex-row items-center justify-between">
            <Text
              accessibilityRole="header"
              className="font-nidoru-primary-regular text-[20px] font-medium leading-[26px] text-[#EEF0FF]"
              selectable
            >
              Save mix
            </Text>
            <Pressable
              accessibilityHint="Dismisses the Save Mix sheet."
              accessibilityLabel="Close Save Mix sheet"
              accessibilityRole="button"
              className="-mr-1 h-11 w-11 items-center justify-center rounded-[14px] active:scale-[0.96]"
              hitSlop={6}
              onPress={onDismiss}
              testID="sound-mixer-save-mix-close"
            >
              <View
                className="h-8 w-8 items-center justify-center rounded-full border border-[#2D3359] bg-[#1C2040]"
                testID="sound-mixer-save-mix-close-icon-frame"
              >
                <CloseCircleIcon color={colors.inactive} size={20} strokeWidth={1.5} />
              </View>
            </Pressable>
          </View>

          <Text className="mb-6 font-nidoru-primary-regular text-sm font-light leading-5 text-[#8A8FA8]">
            Keep this sound combination for another night.
          </Text>

          <View
            className="mb-6 min-h-[152px] gap-3.5 rounded-[16px] border border-[#1E2236]/60 bg-[#0D0F1A] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            testID="sound-mixer-save-mix-preview"
          >
            {activeSounds.map((sound) => (
              <SaveMixLayerRow key={sound.id} sound={sound} />
            ))}
          </View>

          <View className="mb-8">
            <Text
              className="ml-1 mb-2 font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-[#EEF0FF]"
              nativeID="sound-mixer-save-mix-name-label"
            >
              Mix name
            </Text>
            <TextInput
              accessibilityLabel="Mix name"
              accessibilityLabelledBy="sound-mixer-save-mix-name-label"
              className="mb-2 h-12 rounded-[14px] border border-[#2D3359] bg-[#0D0F1A] px-4 font-nidoru-primary-semibold text-[15px] leading-5 text-[#EEF0FF]"
              onChangeText={setMixName}
              placeholder="Enter mix name"
              placeholderTextColor="#6A7095"
              returnKeyType="done"
              selectionColor={colors.active}
              testID="sound-mixer-save-mix-name-input"
              value={mixName}
            />
            <View className="flex-row items-center justify-between px-1">
              <Text className="font-nidoru-primary-regular text-xs font-light leading-4 text-[#8A8FA8]">
                You can save up to 3 mixes.
              </Text>
              <Text className="font-nidoru-data-regular text-xs font-medium leading-4 text-[#A89CE0] tabular-nums">
                {`${Math.min(savedMixes.length, soundMixerLimits.maxSavedMixes)} of 3 saved`}
              </Text>
            </View>
            {saveError ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mt-2 px-1 font-nidoru-primary-regular text-xs leading-4 text-[#F6A3A3]"
              >
                {saveError}
              </Text>
            ) : null}
          </View>

          {isFull ? (
            <ReplacementMixSelector
              onSelectMix={setSelectedReplacementMixId}
              savedMixes={savedMixes}
              selectedMixId={selectedReplacementMixId}
            />
          ) : null}

          <View className="gap-2">
            <Pressable
              accessibilityLabel={isFull ? "Replace existing mix" : "Save Mix"}
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-[14px] bg-[#7C6FCD] shadow-[0_0_15px_rgba(124,111,205,0.25)] active:scale-[0.98]"
              onPress={() => {
                void handleSubmit();
              }}
              testID="sound-mixer-save-mix-submit"
            >
              <Text className="font-nidoru-primary-semibold text-[15px] leading-5 tracking-wide text-white">
                {isFull ? "Replace existing" : "Save Mix"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityHint="Dismisses the Save Mix sheet without saving."
              accessibilityLabel="Cancel Save Mix"
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-[14px] bg-transparent active:scale-[0.98]"
              onPress={onDismiss}
              testID="sound-mixer-save-mix-cancel"
            >
              <Text className="font-nidoru-primary-semibold text-[15px] leading-5 tracking-wide text-[#8A8FA8]">
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SaveMixLayerRow({ sound }: { readonly sound: SoundCard }) {
  const Icon = sound.Icon;
  const volume = sound.volume ?? 0;

  return (
    <View
      accessibilityLabel={`${sound.label} active layer at ${volume}% volume`}
      accessible
      className="min-h-8 flex-row items-center justify-between"
      testID={`sound-mixer-save-mix-layer-${sound.id}`}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-full border border-[#2D3359] bg-[#1C2040]">
          <Icon color={colors.activeSoft} size={16} strokeWidth={1.5} />
        </View>
        <Text className="font-nidoru-primary-regular text-sm leading-[18px] tracking-wide text-[#EEF0FF]">
          {sound.label}
        </Text>
      </View>
      <Text className="font-nidoru-data-regular text-sm font-medium leading-[18px] text-[#A89CE0] tabular-nums">
        {`${volume}%`}
      </Text>
    </View>
  );
}

function ReplacementMixSelector({
  onSelectMix,
  savedMixes,
  selectedMixId,
}: {
  readonly onSelectMix: (mixId: string) => void;
  readonly savedMixes: readonly SavedMix[];
  readonly selectedMixId: string | undefined;
}) {
  return (
    <View className="mb-5 gap-2" testID="sound-mixer-replace-mix-selector">
      <View className="flex-row items-center justify-between px-1">
        <Text className="font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-wide text-[#EEF0FF]">
          Replace saved mix
        </Text>
        <Text className="font-nidoru-primary-regular text-xs leading-4 tracking-wide text-[#6A7095]">
          Capacity reached
        </Text>
      </View>
      <View className="gap-2 rounded-[16px] border border-[#1E2236]/60 bg-[#0D0F1A] p-2">
        {savedMixes.map((mix, index) => {
          const selected = selectedMixId === undefined ? index === 0 : mix.id === selectedMixId;

          return (
            <Pressable
              accessibilityLabel={`Replace ${mix.label} saved mix`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={cn(
                "min-h-10 flex-row items-center justify-between rounded-[12px] border px-3 py-2 active:scale-[0.98]",
                selected ? "border-[#7C6FCD]/50 bg-[#1C2040]" : "border-transparent bg-transparent",
              )}
              key={mix.id}
              onPress={() => {
                onSelectMix(mix.id);
              }}
              testID={`sound-mixer-replace-mix-${mix.id}`}
            >
              <SavedMixIconStack icons={mix.icons} size="sm" />
              <Text className="ml-2 flex-1 font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#EEF0FF]">
                {mix.label}
              </Text>
              <Text className="font-nidoru-data-regular text-xs leading-4 text-[#A89CE0] tabular-nums">
                {mix.timerLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SavedMixChip({ mix, onPress }: { readonly mix: SavedMix; readonly onPress?: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`${mix.label} saved mix`}
      accessibilityRole="button"
      className="h-10 shrink-0 flex-row items-center gap-2 rounded-[14px] border border-[#1E2236]/60 bg-[#14172B] px-3.5 active:scale-[0.96]"
      onPress={onPress}
      testID={`sound-mixer-saved-mix-${mix.id}`}
    >
      <SavedMixIconStack icons={mix.icons} size="sm" />
      <Text className="font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#EEF0FF]">
        {mix.label}
      </Text>
    </Pressable>
  );
}

function SavedMixManagementChip({
  mix,
  onPress,
}: {
  readonly mix: SavedMix;
  readonly onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${mix.label} saved mix, ${mix.timerLabel}`}
      accessibilityRole="button"
      className="h-10 shrink-0 flex-row items-center gap-2 rounded-[14px] border border-[#1E2236]/60 bg-[#0D0F1A] pl-3 pr-2 active:scale-[0.96]"
      onPress={onPress}
      testID={`sound-mixer-saved-mix-full-${mix.id}`}
    >
      <SavedMixIconStack icons={mix.icons} size="sm" />
      <Text className="font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#EEF0FF]">
        {mix.label}
      </Text>
      <Text className="font-nidoru-data-regular text-xs leading-4 text-[#A89CE0] tabular-nums">
        {mix.timerLabel}
      </Text>
      <MoreHorizontal color={colors.muted} size={14} strokeWidth={1.5} />
    </Pressable>
  );
}

function NewMixChip() {
  return (
    <Pressable
      accessibilityLabel="Create new saved mix"
      accessibilityRole="button"
      className="h-10 shrink-0 flex-row items-center gap-1.5 rounded-[14px] border border-dashed border-[#1E2236] px-3.5 active:scale-[0.96]"
      testID="sound-mixer-new-mix-chip"
    >
      <PlusCircle color={colors.inactive} size={16} strokeWidth={1.5} />
      <Text className="font-nidoru-primary-regular text-[13px] leading-[18px] tracking-wide text-[#A1A7C4]">
        New mix
      </Text>
    </Pressable>
  );
}

function SavedMixIconStack({
  icons,
  size,
}: {
  readonly icons: readonly MixerIcon[];
  readonly size: "sm";
}) {
  const iconFrameClassName = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const iconSize = size === "sm" ? 10 : 12;

  return (
    <View className="flex-row -space-x-1 opacity-80">
      {icons.map((Icon, index) => (
        <View
          className={cn(
            "items-center justify-center rounded-full border border-[#1E2236] bg-[#1C2040]",
            iconFrameClassName,
          )}
          key={index}
        >
          <Icon color={colors.activeSoft} size={iconSize} strokeWidth={1.5} />
        </View>
      ))}
    </View>
  );
}

function SoundCardButton({
  isEditing,
  onPress,
  onVolumeAdjust,
  onVolumeChange,
  onVolumeEditingStart,
  sound,
}: {
  readonly isEditing: boolean;
  readonly onPress: () => void;
  readonly onVolumeAdjust: (delta: number) => void;
  readonly onVolumeChange: (volume: number) => void;
  readonly onVolumeEditingStart: () => void;
  readonly sound: SoundCard;
}) {
  const isActive = sound.volume !== undefined;
  const Icon = sound.Icon;
  const dragStartPointRef = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const hasDraggedVolumeRef = useRef(false);
  const accessibilityLabel = isEditing
    ? `${sound.label} active sound being edited at ${sound.volume}% volume`
    : isActive
      ? `${sound.label} active sound at ${sound.volume}% volume`
      : `${sound.label} sound`;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      className={cn(
        "h-[128px] grow basis-[47.2%] items-center justify-center rounded-[20px] border p-3.5 active:scale-[0.98]",
        isEditing
          ? "overflow-hidden border-[#A89CE0]/70 bg-[#1C2040] shadow-[0_0_35px_rgba(124,111,205,0.28)]"
          : isActive
            ? "overflow-hidden border-[#7C6FCD]/40 bg-[#1C2040] shadow-[0_0_25px_rgba(124,111,205,0.15)]"
            : "border-[#1E2236]/60 bg-[#14172B]",
      )}
      onPress={onPress}
      testID={`sound-mixer-sound-${sound.id}`}
    >
      {isActive ? (
        <View className="absolute inset-0 bg-gradient-to-b from-[#7C6FCD]/[0.12] to-transparent" />
      ) : null}

      <View
        className={cn(
          "relative mb-2.5 items-center justify-center",
          isActive ? "h-24 w-24" : "h-16 w-16",
        )}
      >
        {isActive ? (
          <View
            accessibilityActions={[
              { label: "Increase volume", name: "increment" },
              { label: "Decrease volume", name: "decrement" },
            ]}
            accessibilityLabel={`Adjust ${sound.label} volume`}
            accessibilityRole="adjustable"
            accessibilityValue={{
              max: soundMixerLimits.maxVolume,
              min: soundMixerLimits.minVolume,
              now: sound.volume ?? 0,
              text: `${sound.volume ?? 0}%`,
            }}
            accessible
            className="h-24 w-24 items-center justify-center rounded-full"
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === "increment") {
                onVolumeAdjust(soundMixerVolumeStep);
              }

              if (event.nativeEvent.actionName === "decrement") {
                onVolumeAdjust(-soundMixerVolumeStep);
              }
            }}
            onResponderGrant={(event) => {
              dragStartPointRef.current = {
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY,
              };
              hasDraggedVolumeRef.current = false;
              onVolumeEditingStart();
            }}
            onResponderMove={(event) => {
              const startPoint = dragStartPointRef.current;

              if (!startPoint) {
                return;
              }

              const currentPoint = {
                x: event.nativeEvent.locationX,
                y: event.nativeEvent.locationY,
              };

              if (
                !hasDraggedVolumeRef.current &&
                getDistanceBetweenPoints(startPoint, currentPoint) < soundMixerVolumeDragThreshold
              ) {
                return;
              }

              hasDraggedVolumeRef.current = true;
              onVolumeChange(calculateSoundMixerVolumeFromPoint(currentPoint));
            }}
            onResponderRelease={() => {
              if (!hasDraggedVolumeRef.current) {
                onPress();
              }

              dragStartPointRef.current = null;
              hasDraggedVolumeRef.current = false;
            }}
            onStartShouldSetResponder={() => true}
            testID={`sound-mixer-volume-ring-${sound.id}-hit-area`}
          >
            <ProgressRing
              progress={(sound.volume ?? 0) / 100}
              size={72}
              strokeColor={colors.active}
              strokeWidth={2.5}
              trackColor={colors.active}
              trackOpacity={isEditing ? 0.28 : 0.2}
              {...(isEditing
                ? {
                    showDetents: true,
                    showKnob: true,
                    testIDPrefix: `sound-mixer-volume-ring-${sound.id}`,
                  }
                : {})}
            />
          </View>
        ) : (
          <ProgressRing
            progress={0}
            size={64}
            strokeColor="transparent"
            strokeWidth={1.5}
            trackColor={colors.muted}
            trackOpacity={0.4}
          />
        )}

        <View className="absolute inset-0 items-center justify-center">
          <Icon
            color={isActive ? colors.text : colors.inactive}
            size={isActive ? 32 : 28}
            strokeWidth={1.5}
          />
        </View>

        {isActive ? (
          <View className="absolute -bottom-1 z-20 rounded-[8px] border border-[#7C6FCD]/60 bg-[#1C2040] px-2 py-1 shadow-sm">
            <Text className="font-nidoru-data-regular text-xs leading-none text-[#EEF0FF] tabular-nums">
              {`${sound.volume}%`}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        className={cn(
          "text-center font-nidoru-primary-regular text-sm leading-[18px] tracking-wide",
          isActive ? "font-nidoru-primary-semibold text-[#EEF0FF]" : "text-[#A1A7C4]",
        )}
        selectable={false}
      >
        {sound.label}
      </Text>
    </Pressable>
  );
}

function ActiveMiniIcon({
  motionConfig,
  sound,
}: {
  readonly motionConfig: ReturnType<typeof getSoundMixerActiveStripMotionConfig>;
  readonly sound: SoundCard;
}) {
  const Icon = sound.Icon;
  const motionProps = motionConfig.enabled
    ? {
        entering: FadeInUp.duration(motionConfig.enterDurationMs),
        exiting: FadeOutUp.duration(motionConfig.exitDurationMs),
        layout: LinearTransition.duration(motionConfig.enterDurationMs),
      }
    : {};

  return (
    <Animated.View
      accessibilityLabel={`${sound.label} active layer`}
      accessibilityRole="image"
      accessible
      className="h-9 w-9 items-center justify-center rounded-full border border-[#2D3359] bg-[#1C2040]"
      testID={`sound-mixer-active-layer-${sound.id}`}
      {...motionProps}
    >
      <Icon color={colors.activeSoft} size={16} strokeWidth={1.5} />
    </Animated.View>
  );
}

function getDistanceBetweenPoints(
  first: { readonly x: number; readonly y: number },
  second: { readonly x: number; readonly y: number },
) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function ProgressRing({
  progress,
  progressOpacity = 1,
  showDetents = false,
  showKnob = false,
  size,
  strokeColor,
  strokeWidth,
  testIDPrefix,
  trackColor,
  trackOpacity = 1,
}: {
  readonly progress: number;
  readonly size: number;
  readonly strokeColor: string;
  readonly strokeWidth: number;
  readonly trackColor: string;
  readonly progressOpacity?: number;
  readonly showDetents?: boolean;
  readonly showKnob?: boolean;
  readonly testIDPrefix?: string;
  readonly trackOpacity?: number;
}) {
  const radius = size / 2 - strokeWidth * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const knobAngle = progress * Math.PI * 2 - Math.PI / 2;
  const knobX = center + radius * Math.cos(knobAngle);
  const knobY = center + radius * Math.sin(knobAngle);

  return (
    <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
      {showDetents
        ? Array.from({ length: 10 }, (_, index) => {
            const angle = (index / 10) * Math.PI * 2 - Math.PI / 2;
            const tickRadius = radius + 4;
            const testProps = testIDPrefix ? { testID: `${testIDPrefix}-detent-${index}` } : {};

            return (
              <Circle
                cx={center + tickRadius * Math.cos(angle)}
                cy={center + tickRadius * Math.sin(angle)}
                fill={strokeColor}
                key={index}
                opacity={0.22}
                r={1}
                {...testProps}
              />
            );
          })
        : null}
      <Circle
        cx={center}
        cy={center}
        fill="none"
        opacity={trackOpacity}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      {progress > 0 ? (
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          opacity={progressOpacity}
          rotation="-90"
          originX={center}
          originY={center}
          stroke={strokeColor}
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      ) : null}
      {showKnob && progress > 0 ? (
        <Circle
          cx={knobX}
          cy={knobY}
          fill={strokeColor}
          r={3.2}
          stroke={colors.text}
          strokeOpacity={0.85}
          strokeWidth={1}
          {...(testIDPrefix ? { testID: `${testIDPrefix}-knob` } : {})}
        />
      ) : null}
    </Svg>
  );
}

function CloseCircleIcon({
  color = "currentColor",
  size = 20,
  strokeWidth = 1.5,
  testID,
}: MixerIconProps) {
  const testProps = testID ? { testID } : {};

  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...testProps}>
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={strokeWidth} />
      <Line
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        x1="9.5"
        x2="14.5"
        y1="9.5"
        y2="14.5"
      />
      <Line
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        x1="14.5"
        x2="9.5"
        y1="9.5"
        y2="14.5"
      />
    </Svg>
  );
}

function AppWindowIcon({
  color = "currentColor",
  size = 24,
  strokeWidth = 1.5,
  testID,
}: MixerIconProps) {
  const testProps = testID ? { testID } : {};

  return (
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...testProps}>
      <Rect height="14" rx="2.5" stroke={color} strokeWidth={strokeWidth} width="16" x="4" y="5" />
      <Line
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
        x1="4"
        x2="20"
        y1="9"
        y2="9"
      />
      <Circle cx="7" cy="7" fill={color} r="0.75" />
      <Circle cx="10" cy="7" fill={color} r="0.75" />
    </Svg>
  );
}
