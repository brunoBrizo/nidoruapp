import type { BreathAudioCueModeId, BreathPhaseName } from "@nidoru/domain";
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type AudioSource,
} from "expo-audio";

import gentleBellTransitionAsset from "../../assets/audio/breath/gentle-bell-transition.m4a";
import natureAmbientLoopAsset from "../../assets/audio/breath/nature-ambient-loop.m4a";
import softWhooshExhaleAsset from "../../assets/audio/breath/soft-whoosh-exhale.m4a";
import softWhooshInhaleAsset from "../../assets/audio/breath/soft-whoosh-inhale.m4a";
import { captureAnalyticsEventDeferred } from "../observability/deferred-capture";
import type { BreathSessionSnapshot } from "../session/breath-session-runtime";

export type ActiveSessionAudioAssetId =
  | "gentle-bell-transition"
  | "nature-ambient-loop"
  | "soft-whoosh-exhale"
  | "soft-whoosh-inhale";

export type ActiveSessionAudioFailureClass =
  | "ambient_playback_failed"
  | "audio_mode_configuration"
  | "cue_playback_failed"
  | "interruption_handling_failed"
  | "lock_screen_metadata_failed"
  | "route_change_handling_failed";

export type ActiveSessionAudioFailureContext = {
  readonly assetId?: ActiveSessionAudioAssetId;
  readonly failureClass: ActiveSessionAudioFailureClass;
  readonly mode: BreathAudioCueModeId;
  readonly phaseName: BreathPhaseName;
};

export type ActiveSessionAudioAssetSources = {
  readonly gentleBellTransition: AudioSource;
  readonly natureAmbientLoop: AudioSource;
  readonly softWhooshExhale: AudioSource;
  readonly softWhooshInhale: AudioSource;
};

type ActiveSessionAudioAdapter = {
  readonly createAudioPlayer: (
    source: AudioSource,
    options: { readonly keepAudioSessionActive: boolean; readonly updateInterval: number },
  ) => AudioPlayer;
  readonly setAudioModeAsync: typeof setAudioModeAsync;
  readonly setIsAudioActiveAsync: typeof setIsAudioActiveAsync;
};

export type ActiveSessionAudioControllerOptions = {
  readonly adapter?: ActiveSessionAudioAdapter;
  readonly assetSources?: ActiveSessionAudioAssetSources;
  readonly captureAudioFailed?: (context: ActiveSessionAudioFailureContext) => void;
};

export type ActiveSessionAudioController = {
  readonly handleAppWake: (snapshot: BreathSessionSnapshot) => Promise<void>;
  readonly handleAudioInterruption: (input: {
    readonly snapshot?: BreathSessionSnapshot;
    readonly type: "began" | "ended";
  }) => Promise<void>;
  readonly handleRouteChange: (snapshot: BreathSessionSnapshot) => Promise<void>;
  readonly handleSnapshot: (snapshot: BreathSessionSnapshot) => Promise<void>;
  readonly release: () => void;
  readonly setMode: (mode: BreathAudioCueModeId) => void;
};

const defaultAssetSources = {
  gentleBellTransition: gentleBellTransitionAsset,
  natureAmbientLoop: natureAmbientLoopAsset,
  softWhooshExhale: softWhooshExhaleAsset,
  softWhooshInhale: softWhooshInhaleAsset,
} as const satisfies ActiveSessionAudioAssetSources;

const defaultAdapter: ActiveSessionAudioAdapter = {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
};

export function createActiveSessionAudioController({
  adapter = defaultAdapter,
  assetSources = defaultAssetSources,
  captureAudioFailed = captureAudioFailedDeferred,
}: ActiveSessionAudioControllerOptions = {}): ActiveSessionAudioController {
  const players = new Map<ActiveSessionAudioAssetId, AudioPlayer>();
  let ambientPlaying = false;
  let audioModeConfigured = false;
  let lastCueKey: string | undefined;
  let lastSnapshot: BreathSessionSnapshot | undefined;
  let mode: BreathAudioCueModeId = "gentle-bell";

  function captureFailure(context: ActiveSessionAudioFailureContext) {
    captureAudioFailed(context);
  }

  async function configureAudio(phaseName: BreathPhaseName) {
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
      captureFailure({
        failureClass: "audio_mode_configuration",
        mode,
        phaseName,
      });
      return false;
    }
  }

  function getPlayer(assetId: ActiveSessionAudioAssetId) {
    const existingPlayer = players.get(assetId);

    if (existingPlayer) {
      return existingPlayer;
    }

    const player = adapter.createAudioPlayer(getAssetSource(assetSources, assetId), {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    players.set(assetId, player);
    return player;
  }

  function getPlayerOrCapture(
    assetId: ActiveSessionAudioAssetId,
    failureClass: "ambient_playback_failed" | "cue_playback_failed",
    phaseName: BreathPhaseName,
  ) {
    try {
      return getPlayer(assetId);
    } catch {
      captureFailure({
        assetId,
        failureClass,
        mode,
        phaseName,
      });
      return undefined;
    }
  }

  function setLockScreenMetadata(
    player: AudioPlayer,
    title: string,
    phaseName: BreathPhaseName,
    assetId: ActiveSessionAudioAssetId,
  ) {
    try {
      player.setActiveForLockScreen(
        true,
        {
          artist: "Nidoru",
          title,
        },
        { showSeekBackward: false, showSeekForward: false },
      );
    } catch {
      captureFailure({
        assetId,
        failureClass: "lock_screen_metadata_failed",
        mode,
        phaseName,
      });
    }
  }

  async function playCue(snapshot: BreathSessionSnapshot, forceCue: boolean) {
    const cueAssetId = getCueAssetId(mode, snapshot.phaseName);

    if (!cueAssetId) {
      return;
    }

    const cueKey = [
      mode,
      snapshot.phaseStartedAtElapsedMs,
      snapshot.phaseIndex,
      snapshot.phaseName,
    ].join(":");

    if (!forceCue && lastCueKey === cueKey) {
      return;
    }

    lastCueKey = cueKey;
    const player = getPlayerOrCapture(cueAssetId, "cue_playback_failed", snapshot.phaseName);

    if (!player) {
      return;
    }

    try {
      setLockScreenMetadata(player, getModeLockScreenTitle(mode), snapshot.phaseName, cueAssetId);
      await player.seekTo(0);
      player.play();
    } catch {
      captureFailure({
        assetId: cueAssetId,
        failureClass: "cue_playback_failed",
        mode,
        phaseName: snapshot.phaseName,
      });
    }
  }

  async function ensureAmbient(snapshot: BreathSessionSnapshot) {
    if (mode !== "nature-ambient") {
      pauseAmbient(snapshot.phaseName);
      return;
    }

    const ambientAssetId = "nature-ambient-loop";
    const player = getPlayerOrCapture(
      ambientAssetId,
      "ambient_playback_failed",
      snapshot.phaseName,
    );

    if (!player) {
      return;
    }

    player.loop = true;
    player.volume = 0.32;
    setLockScreenMetadata(player, "Nature ambient", snapshot.phaseName, ambientAssetId);

    if (ambientPlaying) {
      return;
    }

    try {
      await player.seekTo(0);
      player.play();
      ambientPlaying = true;
    } catch {
      captureFailure({
        assetId: ambientAssetId,
        failureClass: "ambient_playback_failed",
        mode,
        phaseName: snapshot.phaseName,
      });
    }
  }

  function pauseAmbient(phaseName: BreathPhaseName = lastSnapshot?.phaseName ?? "inhale") {
    const player = players.get("nature-ambient-loop");

    if (!player || !ambientPlaying) {
      return;
    }

    try {
      player.pause();
    } catch {
      captureFailure({
        assetId: "nature-ambient-loop",
        failureClass: "ambient_playback_failed",
        mode,
        phaseName,
      });
    } finally {
      ambientPlaying = false;
    }
  }

  async function handleSnapshotInternal(snapshot: BreathSessionSnapshot, forceCue = false) {
    lastSnapshot = snapshot;

    if (snapshot.status === "completed") {
      pauseAmbient(snapshot.phaseName);
      return;
    }

    if (mode === "none" || snapshot.status === "paused") {
      pauseAmbient(snapshot.phaseName);
      return;
    }

    const configured = await configureAudio(snapshot.phaseName);

    if (!configured) {
      return;
    }

    await ensureAmbient(snapshot);
    await playCue(snapshot, forceCue);
  }

  return {
    async handleAppWake(snapshot) {
      try {
        await adapter.setIsAudioActiveAsync(true);
      } catch {
        captureFailure({
          failureClass: "interruption_handling_failed",
          mode,
          phaseName: snapshot.phaseName,
        });
      }

      await handleSnapshotInternal(snapshot);
    },

    async handleAudioInterruption(input) {
      const phaseName = input.snapshot?.phaseName ?? lastSnapshot?.phaseName ?? "inhale";

      try {
        if (input.type === "began") {
          pauseAmbient(phaseName);
          await adapter.setIsAudioActiveAsync(false);
          return;
        }

        await adapter.setIsAudioActiveAsync(true);

        if (input.snapshot) {
          await handleSnapshotInternal(input.snapshot, true);
        }
      } catch {
        captureFailure({
          failureClass: "interruption_handling_failed",
          mode,
          phaseName,
        });
      }
    },

    async handleRouteChange(snapshot) {
      try {
        await handleSnapshotInternal(snapshot, true);
      } catch {
        captureFailure({
          failureClass: "route_change_handling_failed",
          mode,
          phaseName: snapshot.phaseName,
        });
      }
    },

    async handleSnapshot(snapshot) {
      await handleSnapshotInternal(snapshot);
    },

    release() {
      for (const player of players.values()) {
        try {
          player.clearLockScreenControls();
          player.pause();
          player.remove();
        } catch {
          // Release should never surface into session completion or navigation.
        }
      }
      players.clear();
      ambientPlaying = false;
    },

    setMode(nextMode) {
      if (nextMode === mode) {
        return;
      }

      if (mode === "nature-ambient" && nextMode !== "nature-ambient") {
        pauseAmbient();
      }

      mode = nextMode;
    },
  };
}

function getCueAssetId(
  mode: BreathAudioCueModeId,
  phaseName: BreathPhaseName,
): ActiveSessionAudioAssetId | undefined {
  if (mode === "none") {
    return undefined;
  }

  if (mode === "soft-whoosh") {
    if (phaseName === "inhale" || phaseName === "second-inhale") {
      return "soft-whoosh-inhale";
    }

    if (phaseName === "exhale") {
      return "soft-whoosh-exhale";
    }
  }

  return "gentle-bell-transition";
}

function getAssetSource(
  assetSources: ActiveSessionAudioAssetSources,
  assetId: ActiveSessionAudioAssetId,
) {
  switch (assetId) {
    case "gentle-bell-transition":
      return assetSources.gentleBellTransition;
    case "nature-ambient-loop":
      return assetSources.natureAmbientLoop;
    case "soft-whoosh-exhale":
      return assetSources.softWhooshExhale;
    case "soft-whoosh-inhale":
      return assetSources.softWhooshInhale;
  }
}

function getModeLockScreenTitle(mode: BreathAudioCueModeId) {
  switch (mode) {
    case "gentle-bell":
      return "Gentle bell";
    case "nature-ambient":
      return "Nature ambient";
    case "none":
      return "No audio";
    case "soft-whoosh":
      return "Soft whoosh";
  }
}

function captureAudioFailedDeferred(context: ActiveSessionAudioFailureContext) {
  captureAnalyticsEventDeferred("audio_failed", {
    ...(context.assetId === undefined ? {} : { audio_asset_id: context.assetId }),
    audio_failure_class: context.failureClass,
    audio_mode: context.mode,
    breath_phase: context.phaseName,
  });
}
