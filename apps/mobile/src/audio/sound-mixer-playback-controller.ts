import type { LaunchSoundId, SoundMixerActiveLayer } from "@nidoru/domain";
import { clampSoundMixerVolume, soundMixerLimits } from "@nidoru/domain";
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from "expo-audio";

import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";
import {
  createSoundMixerLayerAnalyticsProperties,
  createSoundMixerSoundAnalyticsProperties,
} from "../observability/sound-mixer-observability";
import {
  createSleepTimerPowerController,
  type SleepTimerAppState,
  type SleepTimerPowerController,
  type SleepTimerStopReason,
} from "./sleep-timer-power-management";

export type SoundMixerPlaybackFailureClass =
  | "audio_mode_configuration"
  | "interruption_handling_failed"
  | "layer_playback_failed"
  | "lock_screen_metadata_failed"
  | "missing_bundled_asset";

export type SoundMixerPlaybackFailureContext = {
  readonly failureClass: SoundMixerPlaybackFailureClass;
  readonly soundId?: LaunchSoundId;
};

export type SoundMixerPlaybackStatus =
  | "idle"
  | "playing"
  | "fading"
  | "interrupted"
  | "blocked"
  | "stopped"
  | "completed";

export type SoundMixerPlaybackLifecycleOutcome =
  | "continued"
  | "faded"
  | "resumed"
  | "stopped";

export type SoundMixerPlaybackLifecycleReason =
  | "app-backgrounded"
  | "audio-output-change"
  | "lock-screen"
  | "system-interruption";

export type SoundMixerPlaybackSnapshot = {
  readonly activeLayerCount: number;
  readonly fadeProgress: number;
  readonly lastLifecycleOutcome?: SoundMixerPlaybackLifecycleOutcome;
  readonly lastLifecycleReason?: SoundMixerPlaybackLifecycleReason;
  readonly playingLayerCount: number;
  readonly remainingSeconds: number | null;
  readonly status: SoundMixerPlaybackStatus;
  readonly stopReason?: SleepTimerStopReason;
  readonly timerDurationSeconds: number | null;
  readonly volumesBySoundId: Readonly<Partial<Record<LaunchSoundId, number>>>;
};

type SoundMixerPlaybackAdapter = {
  readonly createAudioPlayer: typeof createAudioPlayer;
  readonly setAudioModeAsync: typeof setAudioModeAsync;
  readonly setIsAudioActiveAsync: typeof setIsAudioActiveAsync;
};

export type SoundMixerPlaybackAssetSources = Readonly<Partial<Record<LaunchSoundId, AudioSource>>>;

export type SoundMixerPlaybackStartInput = {
  readonly activeLayers: readonly SoundMixerActiveLayer[];
  readonly appState: SleepTimerAppState;
  readonly fadeOutDurationSeconds?: number;
  readonly mixTitle?: string;
  readonly nowMs: number;
  readonly timerDurationSeconds: number | null;
};

export type SoundMixerPlaybackControllerOptions = {
  readonly adapter?: SoundMixerPlaybackAdapter;
  readonly assetSources?: SoundMixerPlaybackAssetSources;
  readonly captureAudioFailed?: (context: SoundMixerPlaybackFailureContext) => void;
  readonly captureAudioStarted?: (context: {
    readonly activeLayers: readonly SoundMixerActiveLayer[];
    readonly timerDurationSeconds: number | null;
  }) => void;
  readonly powerController?: SleepTimerPowerController;
};

export type SoundMixerPlaybackController = {
  readonly getSnapshot: (nowMs?: number) => SoundMixerPlaybackSnapshot;
  readonly handleAppStateChange: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) => Promise<SoundMixerPlaybackSnapshot>;
  readonly handleAudioInterruption: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
    readonly shouldResume?: boolean;
    readonly type: "began" | "ended";
  }) => Promise<SoundMixerPlaybackSnapshot>;
  readonly handleAudioOutputChange: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) => Promise<SoundMixerPlaybackSnapshot>;
  readonly handleTimerTick: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) => Promise<SoundMixerPlaybackSnapshot>;
  readonly release: () => void;
  readonly start: (input: SoundMixerPlaybackStartInput) => Promise<SoundMixerPlaybackSnapshot>;
  readonly stop: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
    readonly reason: SleepTimerStopReason;
  }) => Promise<SoundMixerPlaybackSnapshot>;
  readonly syncActiveLayers: (input: {
    readonly activeLayers: readonly SoundMixerActiveLayer[];
    readonly nowMs: number;
  }) => Promise<SoundMixerPlaybackSnapshot>;
};

const defaultAdapter = {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} as const satisfies SoundMixerPlaybackAdapter;

export function createSoundMixerPlaybackController({
  adapter = defaultAdapter,
  assetSources = {},
  captureAudioFailed = captureSoundMixerAudioFailedDeferred,
  captureAudioStarted = captureSoundMixerAudioStartedDeferred,
  powerController = createSleepTimerPowerController(),
}: SoundMixerPlaybackControllerOptions = {}): SoundMixerPlaybackController {
  const playersBySoundId = new Map<LaunchSoundId, AudioPlayer>();
  let activeLayers: readonly SoundMixerActiveLayer[] = [];
  let audioModeConfigured = false;
  let fadeOutDurationSeconds: number = soundMixerLimits.fadeOutDurationSeconds;
  let lastLifecycleOutcome: SoundMixerPlaybackLifecycleOutcome | undefined;
  let lastLifecycleReason: SoundMixerPlaybackLifecycleReason | undefined;
  let mixTitle = "Sleep mix";
  let playbackStartedAtMs: number | undefined;
  let status: SoundMixerPlaybackStatus = "idle";
  let stopReason: SleepTimerStopReason | undefined;
  let timerDurationSeconds: number | null = null;
  let timerPlaybackActive = false;

  async function configureAudio() {
    if (audioModeConfigured) {
      return true;
    }

    try {
      await adapter.setAudioModeAsync({
        allowsRecording: false,
        interruptionMode: "doNotMix",
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      });
      audioModeConfigured = true;
      return true;
    } catch {
      captureAudioFailed({ failureClass: "audio_mode_configuration" });
      return false;
    }
  }

  async function beginPowerPlayback(appState: SleepTimerAppState) {
    if (timerPlaybackActive) {
      return;
    }

    await powerController.beginTimerPlayback({ appState });
    timerPlaybackActive = true;
  }

  async function endPowerPlayback(appState: SleepTimerAppState, reason: SleepTimerStopReason) {
    if (!timerPlaybackActive) {
      return;
    }

    await powerController.endTimerPlayback({ appState, reason });
    timerPlaybackActive = false;
  }

  function setLifecycleOutcome({
    outcome,
    reason,
  }: {
    readonly outcome: SoundMixerPlaybackLifecycleOutcome;
    readonly reason: SoundMixerPlaybackLifecycleReason;
  }) {
    lastLifecycleOutcome = outcome;
    lastLifecycleReason = reason;
  }

  function clearLifecycleOutcome() {
    lastLifecycleOutcome = undefined;
    lastLifecycleReason = undefined;
  }

  function getLifecycleReasonForAppState(
    appState: SleepTimerAppState,
  ): SoundMixerPlaybackLifecycleReason {
    return appState === "locked" ? "lock-screen" : "app-backgrounded";
  }

  function getAssetSource(soundId: LaunchSoundId) {
    const source = assetSources[soundId];

    if (source === undefined) {
      captureAudioFailed({ failureClass: "missing_bundled_asset", soundId });
    }

    return source;
  }

  function getPlayer(soundId: LaunchSoundId) {
    const existingPlayer = playersBySoundId.get(soundId);

    if (existingPlayer) {
      return existingPlayer;
    }

    const source = getAssetSource(soundId);

    if (source === undefined) {
      return undefined;
    }

    try {
      const player = adapter.createAudioPlayer(source, {
        keepAudioSessionActive: true,
        updateInterval: 1000,
      });
      player.loop = true;
      setLockScreenMetadata(player, soundId);
      playersBySoundId.set(soundId, player);
      return player;
    } catch {
      captureAudioFailed({ failureClass: "layer_playback_failed", soundId });
      return undefined;
    }
  }

  function setLockScreenMetadata(player: AudioPlayer, soundId: LaunchSoundId) {
    try {
      player.setActiveForLockScreen(
        true,
        {
          artist: "Nidoru",
          title: mixTitle,
        },
        { showSeekBackward: false, showSeekForward: false },
      );
    } catch {
      captureAudioFailed({ failureClass: "lock_screen_metadata_failed", soundId });
    }
  }

  async function ensurePlayerForLayer(layer: SoundMixerActiveLayer, shouldSeekToStart: boolean) {
    const player = getPlayer(layer.soundId);

    if (!player) {
      return false;
    }

    try {
      if (shouldSeekToStart) {
        await player.seekTo(0);
      }

      player.volume = getCurrentLayerVolume(layer);
      player.play();
      return true;
    } catch {
      captureAudioFailed({ failureClass: "layer_playback_failed", soundId: layer.soundId });
      return false;
    }
  }

  function applyCurrentVolumes(nowMs: number) {
    for (const layer of activeLayers) {
      const player = playersBySoundId.get(layer.soundId);

      if (player) {
        player.volume = getCurrentLayerVolume(layer, nowMs);
      }
    }
  }

  function getCurrentLayerVolume(layer: SoundMixerActiveLayer, nowMs = playbackStartedAtMs ?? 0) {
    return (
      (clampSoundMixerVolume(layer.volume) / soundMixerLimits.maxVolume) * getFadeFactor(nowMs)
    );
  }

  function getFadeFactor(nowMs = playbackStartedAtMs ?? 0) {
    if (timerDurationSeconds === null || playbackStartedAtMs === undefined) {
      return 1;
    }

    const remainingSeconds = getRemainingSeconds(nowMs);

    if (remainingSeconds === null || remainingSeconds > fadeOutDurationSeconds) {
      return 1;
    }

    return clamp(remainingSeconds / Math.max(1, fadeOutDurationSeconds), 0, 1);
  }

  async function stopInternal({
    appState,
    nowMs,
    reason,
    terminalStatus,
  }: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
    readonly reason: SleepTimerStopReason;
    readonly terminalStatus: Extract<SoundMixerPlaybackStatus, "completed" | "stopped">;
  }) {
    stopReason = reason;
    status = terminalStatus;

    for (const [soundId, player] of playersBySoundId) {
      try {
        player.volume = 0;
        player.pause();
      } catch {
        captureAudioFailed({ failureClass: "layer_playback_failed", soundId });
      }

      try {
        player.clearLockScreenControls();
        player.remove();
      } catch {
        captureAudioFailed({ failureClass: "layer_playback_failed", soundId });
      }
    }

    playersBySoundId.clear();

    try {
      await adapter.setIsAudioActiveAsync(false);
    } catch {
      captureAudioFailed({ failureClass: "layer_playback_failed" });
    }

    await endPowerPlayback(appState, reason);
    return getSnapshot(nowMs);
  }

  async function pauseForInterruption({
    appState,
    nowMs,
  }: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) {
    if (playersBySoundId.size === 0) {
      status = "stopped";
      stopReason = "interrupted";
      setLifecycleOutcome({
        outcome: "stopped",
        reason: "system-interruption",
      });
      return getSnapshot(nowMs);
    }

    for (const [soundId, player] of playersBySoundId) {
      try {
        player.pause();
      } catch {
        captureAudioFailed({ failureClass: "interruption_handling_failed", soundId });
      }
    }

    try {
      await adapter.setIsAudioActiveAsync(false);
    } catch {
      captureAudioFailed({ failureClass: "interruption_handling_failed" });
    }

    await endPowerPlayback(appState, "interrupted");
    status = "interrupted";
    stopReason = "interrupted";
    setLifecycleOutcome({
      outcome: "stopped",
      reason: "system-interruption",
    });
    return getSnapshot(nowMs);
  }

  async function resumeAfterInterruption({
    appState,
    nowMs,
  }: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) {
    if (activeLayers.length === 0) {
      status = "idle";
      stopReason = undefined;
      return getSnapshot(nowMs);
    }

    const remainingSeconds = getRemainingSeconds(nowMs);

    if (timerDurationSeconds !== null && remainingSeconds === 0) {
      setLifecycleOutcome({
        outcome: "faded",
        reason: "system-interruption",
      });
      return stopInternal({
        appState,
        nowMs,
        reason: "timer-ended",
        terminalStatus: "completed",
      });
    }

    const configured = await configureAudio();

    if (!configured) {
      status = "blocked";
      return getSnapshot(nowMs);
    }

    try {
      await adapter.setIsAudioActiveAsync(true);
    } catch {
      captureAudioFailed({ failureClass: "interruption_handling_failed" });
      status = "blocked";
      return getSnapshot(nowMs);
    }

    const resumedLayers: SoundMixerActiveLayer[] = [];

    for (const layer of activeLayers) {
      if (await ensurePlayerForLayer(layer, false)) {
        resumedLayers.push(layer);
      }
    }

    if (resumedLayers.length === 0) {
      status = "blocked";
      await adapter.setIsAudioActiveAsync(false).catch(() => undefined);
      return getSnapshot(nowMs);
    }

    status =
      remainingSeconds !== null && remainingSeconds <= fadeOutDurationSeconds
        ? "fading"
        : "playing";
    stopReason = undefined;
    setLifecycleOutcome({
      outcome: "resumed",
      reason: "system-interruption",
    });
    applyCurrentVolumes(nowMs);
    await beginPowerPlayback(appState);
    return getSnapshot(nowMs);
  }

  async function handleTimerTickInternal(input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) {
    if (status !== "playing" && status !== "fading") {
      return getSnapshot(input.nowMs);
    }

    const remainingSeconds = getRemainingSeconds(input.nowMs);

    if (remainingSeconds === 0) {
      if (input.appState !== "active") {
        setLifecycleOutcome({
          outcome: "faded",
          reason: getLifecycleReasonForAppState(input.appState),
        });
      }

      return stopInternal({
        appState: input.appState,
        nowMs: input.nowMs,
        reason: "timer-ended",
        terminalStatus: "completed",
      });
    }

    status =
      remainingSeconds !== null && remainingSeconds <= fadeOutDurationSeconds
        ? "fading"
        : "playing";
    applyCurrentVolumes(input.nowMs);
    return getSnapshot(input.nowMs);
  }

  function getSnapshot(nowMs = playbackStartedAtMs ?? 0): SoundMixerPlaybackSnapshot {
    const remainingSeconds = getRemainingSeconds(nowMs);
    const volumesBySoundId: Partial<Record<LaunchSoundId, number>> = {};
    const playingLayerCount =
      status === "playing" || status === "fading" ? playersBySoundId.size : 0;

    for (const layer of activeLayers) {
      volumesBySoundId[layer.soundId] = getCurrentLayerVolume(layer, nowMs);
    }

    return {
      activeLayerCount: activeLayers.length,
      fadeProgress: 1 - getFadeFactor(nowMs),
      ...(lastLifecycleOutcome === undefined || lastLifecycleReason === undefined
        ? {}
        : { lastLifecycleOutcome, lastLifecycleReason }),
      playingLayerCount,
      remainingSeconds,
      status,
      ...(stopReason === undefined ? {} : { stopReason }),
      timerDurationSeconds,
      volumesBySoundId,
    };
  }

  function getRemainingSeconds(nowMs: number): number | null {
    if (timerDurationSeconds === null) {
      return null;
    }

    if (playbackStartedAtMs === undefined) {
      return timerDurationSeconds;
    }

    return Math.max(0, timerDurationSeconds - Math.floor((nowMs - playbackStartedAtMs) / 1000));
  }

  return {
    getSnapshot,

    async handleAppStateChange(input) {
      if (status !== "playing" && status !== "fading") {
        return getSnapshot(input.nowMs);
      }

      try {
        if (input.appState === "active") {
          await adapter.setIsAudioActiveAsync(true);
        } else {
          setLifecycleOutcome({
            outcome: "continued",
            reason: getLifecycleReasonForAppState(input.appState),
          });
        }
      } catch {
        captureAudioFailed({ failureClass: "interruption_handling_failed" });
      }

      return handleTimerTickInternal(input);
    },

    async handleAudioInterruption(input) {
      try {
        if (input.type === "began") {
          return await pauseForInterruption(input);
        }

        if (input.shouldResume) {
          return await resumeAfterInterruption(input);
        }

        setLifecycleOutcome({
          outcome: "stopped",
          reason: "system-interruption",
        });
        return await stopInternal({
          appState: input.appState,
          nowMs: input.nowMs,
          reason: "interrupted",
          terminalStatus: "stopped",
        });
      } catch {
        captureAudioFailed({ failureClass: "interruption_handling_failed" });
        return getSnapshot(input.nowMs);
      }
    },

    async handleAudioOutputChange(input) {
      try {
        if (status !== "playing" && status !== "fading" && status !== "interrupted") {
          return getSnapshot(input.nowMs);
        }

        setLifecycleOutcome({
          outcome: "stopped",
          reason: "audio-output-change",
        });
        return await stopInternal({
          appState: input.appState,
          nowMs: input.nowMs,
          reason: "interrupted",
          terminalStatus: "stopped",
        });
      } catch {
        captureAudioFailed({ failureClass: "interruption_handling_failed" });
        return getSnapshot(input.nowMs);
      }
    },

    async handleTimerTick(input) {
      return handleTimerTickInternal(input);
    },

    release() {
      if (playersBySoundId.size === 0) {
        return;
      }

      for (const player of playersBySoundId.values()) {
        try {
          player.volume = 0;
          player.pause();
          player.clearLockScreenControls();
          player.remove();
        } catch {
          // Release must never block route unmount or returning to the mixer.
        }
      }

      playersBySoundId.clear();
      status = status === "completed" ? "completed" : "stopped";
      void adapter.setIsAudioActiveAsync(false).catch(() => undefined);
      void endPowerPlayback("background", stopReason ?? "manual-stop").catch(() => undefined);
    },

    async start(input) {
      activeLayers = normalizeActiveLayers(input.activeLayers);
      fadeOutDurationSeconds =
        input.fadeOutDurationSeconds ?? soundMixerLimits.fadeOutDurationSeconds;
      mixTitle = input.mixTitle ?? "Sleep mix";
      playbackStartedAtMs = input.nowMs;
      stopReason = undefined;
      clearLifecycleOutcome();
      timerDurationSeconds = input.timerDurationSeconds;

      const playableLayers = activeLayers.filter(
        (layer) => getAssetSource(layer.soundId) !== undefined,
      );

      if (activeLayers.length === 0 || playableLayers.length === 0) {
        status = activeLayers.length === 0 ? "idle" : "blocked";
        return getSnapshot(input.nowMs);
      }

      const configured = await configureAudio();

      if (!configured) {
        status = "blocked";
        return getSnapshot(input.nowMs);
      }

      try {
        await adapter.setIsAudioActiveAsync(true);
      } catch {
        captureAudioFailed({ failureClass: "layer_playback_failed" });
        status = "blocked";
        return getSnapshot(input.nowMs);
      }

      const startedLayers: SoundMixerActiveLayer[] = [];

      for (const layer of activeLayers) {
        if (await ensurePlayerForLayer(layer, true)) {
          startedLayers.push(layer);
        }
      }

      if (startedLayers.length === 0) {
        status = "blocked";
        await adapter.setIsAudioActiveAsync(false).catch(() => undefined);
        return getSnapshot(input.nowMs);
      }

      status = "playing";
      await beginPowerPlayback(input.appState);
      captureAudioStarted({
        activeLayers: startedLayers,
        timerDurationSeconds,
      });
      return getSnapshot(input.nowMs);
    },

    async stop(input) {
      return stopInternal({
        appState: input.appState,
        nowMs: input.nowMs,
        reason: input.reason,
        terminalStatus: input.reason === "timer-ended" ? "completed" : "stopped",
      });
    },

    async syncActiveLayers(input) {
      const nextLayers = normalizeActiveLayers(input.activeLayers);
      const nextSoundIds = new Set(nextLayers.map((layer) => layer.soundId));

      for (const [soundId, player] of playersBySoundId) {
        if (!nextSoundIds.has(soundId)) {
          try {
            player.volume = 0;
            player.pause();
            player.clearLockScreenControls();
            player.remove();
          } catch {
            captureAudioFailed({ failureClass: "layer_playback_failed", soundId });
          }
          playersBySoundId.delete(soundId);
        }
      }

      activeLayers = nextLayers;

      if (status === "playing" || status === "fading") {
        for (const layer of activeLayers) {
          if (playersBySoundId.has(layer.soundId)) {
            continue;
          }

          await ensurePlayerForLayer(layer, true);
        }
        applyCurrentVolumes(input.nowMs);
      }

      if (activeLayers.length === 0 && playersBySoundId.size === 0) {
        status = "idle";
      } else if (activeLayers.length > 0 && playersBySoundId.size === 0) {
        status = "blocked";
      }

      return getSnapshot(input.nowMs);
    },
  };
}

function normalizeActiveLayers(
  layers: readonly SoundMixerActiveLayer[],
): readonly SoundMixerActiveLayer[] {
  if (layers.length > soundMixerLimits.maxActiveLayers) {
    throw new Error("Sound mixer supports at most 3 active layers.");
  }

  const seenSoundIds = new Set<LaunchSoundId>();

  return layers.map((layer) => {
    if (seenSoundIds.has(layer.soundId)) {
      throw new Error(`Duplicate sound mixer layer: ${layer.soundId}`);
    }

    seenSoundIds.add(layer.soundId);

    return {
      soundId: layer.soundId,
      volume: clampSoundMixerVolume(layer.volume),
    };
  });
}

function captureSoundMixerAudioFailedDeferred({
  failureClass,
  soundId,
}: SoundMixerPlaybackFailureContext) {
  try {
    captureAnalyticsEventDeferred("audio_failed", {
      audio_failure_class: failureClass,
      audio_mode: "sound-mixer",
      ...createSoundMixerSoundAnalyticsProperties(soundId),
    });
  } catch {
    // Audio observability must never block local playback.
  }
}

function captureSoundMixerAudioStartedDeferred({
  activeLayers,
  timerDurationSeconds,
}: {
  readonly activeLayers: readonly SoundMixerActiveLayer[];
  readonly timerDurationSeconds: number | null;
}) {
  try {
    captureAnalyticsEventDeferred("audio_started", {
      audio_mode: "sound-mixer",
      ...createSoundMixerLayerAnalyticsProperties({
        layers: activeLayers,
        timerDurationSeconds,
      }),
    });
  } catch {
    // Audio observability must never block local playback.
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
