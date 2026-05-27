import type { LaunchSoundId } from "@nidoru/domain";
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from "expo-audio";

import natureAmbientLoopAsset from "../../assets/audio/breath/nature-ambient-loop.m4a";
import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";
import {
  createSleepTimerPowerController,
  type SleepTimerAppState,
  type SleepTimerPowerController,
  type SleepTimerStopReason,
} from "./sleep-timer-power-management";

export type WindDownAmbientAudioFailureClass =
  | "ambient_playback_failed"
  | "audio_mode_configuration"
  | "interruption_handling_failed"
  | "lock_screen_metadata_failed";

export type WindDownAmbientAudioFailureContext = {
  readonly assetId?: "nature-ambient-loop";
  readonly failureClass: WindDownAmbientAudioFailureClass;
};

export type WindDownAmbientAudioStatus =
  | "idle"
  | "playing"
  | "fading"
  | "stopped"
  | "completed";

export type WindDownAmbientAudioSnapshot = {
  readonly elapsedSeconds: number;
  readonly fadeOutDurationSeconds: number;
  readonly remainingSeconds: number;
  readonly status: WindDownAmbientAudioStatus;
  readonly stopReason?: SleepTimerStopReason;
  readonly timerDurationSeconds: number;
  readonly volume: number;
};

type WindDownAmbientAudioAdapter = {
  readonly createAudioPlayer: typeof createAudioPlayer;
  readonly setAudioModeAsync: typeof setAudioModeAsync;
  readonly setIsAudioActiveAsync: typeof setIsAudioActiveAsync;
};

export type WindDownAmbientAudioControllerOptions = {
  readonly adapter?: WindDownAmbientAudioAdapter;
  readonly assetSource?: AudioSource;
  readonly baseVolume?: number;
  readonly captureAudioFailed?: (context: WindDownAmbientAudioFailureContext) => void;
  readonly captureAudioStarted?: (context: WindDownAmbientAudioStartedContext) => void;
  readonly powerController?: SleepTimerPowerController;
};

export type WindDownAmbientAudioStartInput = {
  readonly appState: SleepTimerAppState;
  readonly fadeOutDurationSeconds: number;
  readonly nowMs: number;
  readonly soundId: LaunchSoundId;
  readonly soundLabel: string;
  readonly timerDurationSeconds: number;
};

export type WindDownAmbientAudioStartedContext = {
  readonly assetId: "nature-ambient-loop";
  readonly soundId: LaunchSoundId;
  readonly timerDurationSeconds: number;
};

export type WindDownAmbientAudioController = {
  readonly fadeNow: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) => Promise<WindDownAmbientAudioSnapshot>;
  readonly getSnapshot: (nowMs?: number) => WindDownAmbientAudioSnapshot;
  readonly handleAudioInterruption: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
    readonly type: "began" | "ended";
  }) => Promise<WindDownAmbientAudioSnapshot>;
  readonly handleTimerTick: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
  }) => Promise<WindDownAmbientAudioSnapshot>;
  readonly release: () => void;
  readonly start: (input: WindDownAmbientAudioStartInput) => Promise<WindDownAmbientAudioSnapshot>;
  readonly stop: (input: {
    readonly appState: SleepTimerAppState;
    readonly nowMs: number;
    readonly reason: SleepTimerStopReason;
  }) => Promise<WindDownAmbientAudioSnapshot>;
};

const defaultAdapter = {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} as const satisfies WindDownAmbientAudioAdapter;

const defaultBaseVolume = 0.32;

export function createWindDownAmbientAudioController({
  adapter = defaultAdapter,
  assetSource = natureAmbientLoopAsset,
  baseVolume = defaultBaseVolume,
  captureAudioFailed = captureWindDownAmbientAudioFailedDeferred,
  captureAudioStarted = captureWindDownAmbientAudioStartedDeferred,
  powerController = createSleepTimerPowerController(),
}: WindDownAmbientAudioControllerOptions = {}): WindDownAmbientAudioController {
  let audioModeConfigured = false;
  let currentVolume = 0;
  let fadeNowStartedAtMs: number | undefined;
  let player: AudioPlayer | undefined;
  let playbackStartedAtMs: number | undefined;
  let soundLabel = "Rain";
  let status: WindDownAmbientAudioStatus = "idle";
  let stopReason: SleepTimerStopReason | undefined;
  let timerDurationSeconds = 0;
  let fadeOutDurationSeconds = 0;
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

  function getPlayer() {
    if (player) {
      return player;
    }

    const nextPlayer = adapter.createAudioPlayer(assetSource, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    nextPlayer.loop = true;
    nextPlayer.volume = baseVolume;

    try {
      nextPlayer.setActiveForLockScreen(
        true,
        {
          artist: "Nidoru",
          title: soundLabel,
        },
        { showSeekBackward: false, showSeekForward: false },
      );
    } catch {
      captureAudioFailed({
        assetId: "nature-ambient-loop",
        failureClass: "lock_screen_metadata_failed",
      });
    }

    player = nextPlayer;
    return nextPlayer;
  }

  async function endPowerPlayback(appState: SleepTimerAppState, reason: SleepTimerStopReason) {
    if (!timerPlaybackActive) {
      return;
    }

    await powerController.endTimerPlayback({ appState, reason });
    timerPlaybackActive = false;
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
    readonly terminalStatus: Extract<WindDownAmbientAudioStatus, "completed" | "stopped">;
  }) {
    currentVolume = 0;
    stopReason = reason;
    status = terminalStatus;

    if (player) {
      const currentPlayer = player;
      player = undefined;

      try {
        currentPlayer.volume = 0;
        currentPlayer.pause();
      } catch {
        captureAudioFailed({
          assetId: "nature-ambient-loop",
          failureClass: "ambient_playback_failed",
        });
      }

      try {
        currentPlayer.clearLockScreenControls();
        currentPlayer.remove();
      } catch {
        captureAudioFailed({
          assetId: "nature-ambient-loop",
          failureClass: "ambient_playback_failed",
        });
      }
    }

    try {
      await adapter.setIsAudioActiveAsync(false);
    } catch {
      captureAudioFailed({
        assetId: "nature-ambient-loop",
        failureClass: "ambient_playback_failed",
      });
    }

    await endPowerPlayback(appState, reason);
    return getSnapshot(nowMs);
  }

  return {
    async fadeNow(input) {
      if (status !== "playing" && status !== "fading") {
        return getSnapshot(input.nowMs);
      }

      fadeNowStartedAtMs = input.nowMs;
      status = "fading";
      return this.handleTimerTick(input);
    },

    getSnapshot,

    async handleAudioInterruption(input) {
      try {
        if (input.type === "began") {
          return await stopInternal({
            appState: input.appState,
            nowMs: input.nowMs,
            reason: "interrupted",
            terminalStatus: "stopped",
          });
        }

        if (playbackStartedAtMs === undefined) {
          return getSnapshot(input.nowMs);
        }

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
      if (status !== "playing" && status !== "fading") {
        return getSnapshot(input.nowMs);
      }

      const remainingSeconds = getRemainingSeconds(input.nowMs);

      if (remainingSeconds <= 0) {
        return stopInternal({
          appState: input.appState,
          nowMs: input.nowMs,
          reason: "timer-ended",
          terminalStatus: "completed",
        });
      }

      const fadeRemainingSeconds = getFadeRemainingSeconds(input.nowMs, remainingSeconds);
      const shouldFade =
        fadeNowStartedAtMs !== undefined || remainingSeconds <= fadeOutDurationSeconds;

      if (shouldFade && fadeRemainingSeconds <= 0) {
        return stopInternal({
          appState: input.appState,
          nowMs: input.nowMs,
          reason: "manual-stop",
          terminalStatus: "stopped",
        });
      }

      const nextVolume = shouldFade
        ? baseVolume * clamp(fadeRemainingSeconds / Math.max(1, fadeOutDurationSeconds), 0, 1)
        : baseVolume;

      currentVolume = nextVolume;
      status = shouldFade ? "fading" : "playing";

      if (player) {
        player.volume = nextVolume;
      }

      return getSnapshot(input.nowMs);
    },

    release() {
      if (!player) {
        return;
      }

      try {
        player.clearLockScreenControls();
        player.pause();
        player.remove();
      } catch {
        // Release should never block route unmount or app navigation.
      } finally {
        player = undefined;
        currentVolume = 0;
        status = status === "completed" ? "completed" : "stopped";
      }

      void adapter.setIsAudioActiveAsync(false).catch(() => undefined);
      void endPowerPlayback("background", stopReason ?? "manual-stop").catch(() => undefined);
    },

    async start(input) {
      soundLabel = input.soundLabel;
      timerDurationSeconds = input.timerDurationSeconds;
      fadeOutDurationSeconds = input.fadeOutDurationSeconds;
      playbackStartedAtMs = input.nowMs;
      fadeNowStartedAtMs = undefined;
      stopReason = undefined;

      const configured = await configureAudio();

      if (!configured) {
        return getSnapshot(input.nowMs);
      }

      try {
        await adapter.setIsAudioActiveAsync(true);
        const nextPlayer = getPlayer();

        await nextPlayer.seekTo(0);
        currentVolume = baseVolume;
        nextPlayer.volume = currentVolume;
        nextPlayer.play();
        status = "playing";
        await powerController.beginTimerPlayback({ appState: input.appState });
        timerPlaybackActive = true;
        captureAudioStarted({
          assetId: "nature-ambient-loop",
          soundId: input.soundId,
          timerDurationSeconds: input.timerDurationSeconds,
        });
      } catch {
        captureAudioFailed({
          assetId: "nature-ambient-loop",
          failureClass: "ambient_playback_failed",
        });
      }

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
  };

  function getSnapshot(nowMs = playbackStartedAtMs ?? 0): WindDownAmbientAudioSnapshot {
    return {
      elapsedSeconds: getElapsedSeconds(nowMs),
      fadeOutDurationSeconds,
      remainingSeconds: getRemainingSeconds(nowMs),
      status,
      ...(stopReason === undefined ? {} : { stopReason }),
      timerDurationSeconds,
      volume: currentVolume,
    };
  }

  function getElapsedSeconds(nowMs: number) {
    if (playbackStartedAtMs === undefined) {
      return 0;
    }

    return Math.min(
      timerDurationSeconds,
      Math.max(0, Math.floor((nowMs - playbackStartedAtMs) / 1000)),
    );
  }

  function getRemainingSeconds(nowMs: number) {
    return Math.max(0, timerDurationSeconds - getElapsedSeconds(nowMs));
  }

  function getFadeRemainingSeconds(nowMs: number, timerRemainingSeconds: number) {
    if (fadeNowStartedAtMs === undefined) {
      return timerRemainingSeconds;
    }

    return Math.max(0, fadeOutDurationSeconds - Math.floor((nowMs - fadeNowStartedAtMs) / 1000));
  }
}

function captureWindDownAmbientAudioFailedDeferred({
  assetId,
  failureClass,
}: WindDownAmbientAudioFailureContext) {
  try {
    captureAnalyticsEventDeferred("audio_failed", {
      ...(assetId === undefined ? {} : { audio_asset_id: assetId }),
      audio_failure_class: failureClass,
      audio_mode: "nature-ambient",
    });
  } catch {
    // Audio observability must never block local playback.
  }
}

function captureWindDownAmbientAudioStartedDeferred({
  assetId,
  soundId,
  timerDurationSeconds,
}: WindDownAmbientAudioStartedContext) {
  try {
    captureAnalyticsEventDeferred("audio_started", {
      ambient_sound_id: soundId,
      audio_asset_id: assetId,
      audio_mode: "nature-ambient",
      timer_duration_seconds: timerDurationSeconds,
    });
  } catch {
    // Audio observability must never block local playback.
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
