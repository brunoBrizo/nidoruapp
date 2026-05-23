import type { AudioPlayer, AudioSource } from "expo-audio";

import natureAmbientLoopAsset from "../../assets/audio/breath/nature-ambient-loop.m4a";
import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";

export type RescueMeSoundHandoffAudioFailureContext = {
  readonly assetId?: "nature-ambient-loop";
  readonly failureClass: "ambient_playback_failed" | "audio_mode_configuration";
};

type RescueMeSoundHandoffAudioAdapter = {
  readonly createAudioPlayer: typeof import("expo-audio").createAudioPlayer;
  readonly setAudioModeAsync: typeof import("expo-audio").setAudioModeAsync;
  readonly setIsAudioActiveAsync: typeof import("expo-audio").setIsAudioActiveAsync;
};

export type RescueMeSoundHandoffAudioController = {
  readonly pause: () => Promise<void>;
  readonly release: () => void;
  readonly resume: () => Promise<void>;
  readonly start: () => Promise<void>;
};

export type RescueMeSoundHandoffAudioControllerOptions = {
  readonly adapter?: RescueMeSoundHandoffAudioAdapter;
  readonly assetSource?: AudioSource;
  readonly captureAudioFailed?: (context: RescueMeSoundHandoffAudioFailureContext) => void;
};

export function createRescueMeSoundHandoffAudioController({
  adapter,
  assetSource = natureAmbientLoopAsset,
  captureAudioFailed = captureRescueMeSoundHandoffAudioFailedDeferred,
}: RescueMeSoundHandoffAudioControllerOptions = {}): RescueMeSoundHandoffAudioController {
  let audioModeConfigured = false;
  let player: AudioPlayer | undefined;
  let playing = false;
  let resolvedAdapter = adapter;

  async function getAdapter() {
    if (resolvedAdapter) {
      return resolvedAdapter;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Lazy-load native audio only when handoff playback starts.
    const expoAudio = require("expo-audio") as typeof import("expo-audio");
    resolvedAdapter = {
      createAudioPlayer: expoAudio.createAudioPlayer,
      setAudioModeAsync: expoAudio.setAudioModeAsync,
      setIsAudioActiveAsync: expoAudio.setIsAudioActiveAsync,
    };

    return resolvedAdapter;
  }

  async function configureAudio(audioAdapter: RescueMeSoundHandoffAudioAdapter) {
    if (audioModeConfigured) {
      return true;
    }

    try {
      await audioAdapter.setAudioModeAsync({
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

  function getPlayer(audioAdapter: RescueMeSoundHandoffAudioAdapter) {
    if (player) {
      return player;
    }

    player = audioAdapter.createAudioPlayer(assetSource, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    player.loop = true;
    player.volume = 0.32;
    player.setActiveForLockScreen(
      true,
      {
        artist: "Nidoru",
        title: "Rain",
      },
      { showSeekBackward: false, showSeekForward: false },
    );

    return player;
  }

  async function playFromStart(shouldSeekToStart: boolean) {
    let audioAdapter: RescueMeSoundHandoffAudioAdapter;

    try {
      audioAdapter = await getAdapter();
    } catch {
      captureAudioFailed({ failureClass: "audio_mode_configuration" });
      return;
    }

    const configured = await configureAudio(audioAdapter);

    if (!configured) {
      return;
    }

    try {
      await audioAdapter.setIsAudioActiveAsync(true);
      const nextPlayer = getPlayer(audioAdapter);

      if (shouldSeekToStart) {
        await nextPlayer.seekTo(0);
      }

      nextPlayer.play();
      playing = true;
    } catch {
      captureAudioFailed({
        assetId: "nature-ambient-loop",
        failureClass: "ambient_playback_failed",
      });
    }
  }

  return {
    async pause() {
      if (!player || !playing) {
        return;
      }

      try {
        player.pause();
        await resolvedAdapter?.setIsAudioActiveAsync(false);
      } catch {
        captureAudioFailed({
          assetId: "nature-ambient-loop",
          failureClass: "ambient_playback_failed",
        });
      } finally {
        playing = false;
      }
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
        // Release should never block returning home or unmounting the route.
      } finally {
        player = undefined;
        playing = false;
      }

      void resolvedAdapter?.setIsAudioActiveAsync(false).catch(() => undefined);
    },

    async resume() {
      await playFromStart(false);
    },

    async start() {
      await playFromStart(true);
    },
  };
}

function captureRescueMeSoundHandoffAudioFailedDeferred({
  assetId,
  failureClass,
}: RescueMeSoundHandoffAudioFailureContext) {
  try {
    captureAnalyticsEventDeferred("audio_failed", {
      ...(assetId === undefined ? {} : { audio_asset_id: assetId }),
      audio_failure_class: failureClass,
      audio_mode: "nature-ambient",
    });
  } catch {
    // Audio observability must never affect the local handoff.
  }
}
