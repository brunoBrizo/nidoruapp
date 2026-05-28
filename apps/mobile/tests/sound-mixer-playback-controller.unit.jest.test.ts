import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockCreateAudioPlayer = jest.fn();
const mockSetAudioModeAsync = jest.fn(() => Promise.resolve());
const mockSetIsAudioActiveAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-audio", () => ({
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
}));

jest.mock("../src/observability/deferred-capture", () => ({
  captureAnalyticsEventDeferred: jest.fn(),
}));

import { captureAnalyticsEventDeferred } from "../src/observability/deferred-capture";
import {
  createSoundMixerPlaybackController,
  type SoundMixerPlaybackFailureContext,
} from "../src/audio/sound-mixer-playback-controller";

type MockAudioPlayer = {
  clearLockScreenControls: jest.Mock;
  loop: boolean;
  pause: jest.Mock;
  play: jest.Mock;
  remove: jest.Mock;
  seekTo: jest.Mock;
  setActiveForLockScreen: jest.Mock;
  volume: number;
};

const assetSources = {
  "brown-noise": 202,
  "fireplace-crackling": 203,
  "light-rain": 201,
} as const;

const mockAudioAdapter = {
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
};

const mockCaptureAnalyticsEventDeferred = captureAnalyticsEventDeferred as jest.MockedFunction<
  typeof captureAnalyticsEventDeferred
>;

function createMockPlayer(): MockAudioPlayer {
  return {
    clearLockScreenControls: jest.fn(),
    loop: false,
    pause: jest.fn(),
    play: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setActiveForLockScreen: jest.fn(),
    volume: 1,
  };
}

function createMockPowerController() {
  return {
    beginTimerPlayback: jest.fn(() =>
      Promise.resolve({
        appState: "active" as const,
        powerLockHeld: true,
        status: "playing" as const,
      }),
    ),
    endTimerPlayback: jest.fn((input: { readonly appState: "active"; readonly reason: string }) =>
      Promise.resolve({
        appState: input.appState,
        powerLockHeld: false,
        status: "ended" as const,
        stopReason: input.reason,
      }),
    ),
    getSnapshot: jest.fn(() => ({
      appState: "active" as const,
      powerLockHeld: true,
      status: "playing" as const,
    })),
  };
}

describe("Sound Mixer playback controller", () => {
  beforeEach(() => {
    mockCreateAudioPlayer.mockReset();
    mockSetAudioModeAsync.mockReset();
    mockSetAudioModeAsync.mockImplementation(() => Promise.resolve());
    mockSetIsAudioActiveAsync.mockReset();
    mockSetIsAudioActiveAsync.mockImplementation(() => Promise.resolve());
    mockCaptureAnalyticsEventDeferred.mockReset();
  });

  it("starts three bundled offline layers with independent player volumes", async () => {
    const playersBySource = new Map<number, MockAudioPlayer>();
    const powerController = createMockPowerController();
    mockCreateAudioPlayer.mockImplementation((source: number) => {
      const player = createMockPlayer();
      playersBySource.set(source, player);
      return player;
    });
    const controller = createSoundMixerPlaybackController({
      adapter: mockAudioAdapter,
      assetSources,
      powerController,
    });

    const snapshot = await controller.start({
      activeLayers: [
        { soundId: "light-rain", volume: 72 },
        { soundId: "brown-noise", volume: 58 },
        { soundId: "fireplace-crackling", volume: 34 },
      ],
      appState: "active",
      mixTitle: "Rain Hearth",
      nowMs: 0,
      timerDurationSeconds: 1_800,
    });

    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsRecording: false,
        interruptionMode: "doNotMix",
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      }),
    );
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(true);
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(3);
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith(201, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith(202, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith(203, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    expect(playersBySource.get(201)?.loop).toBe(true);
    expect(playersBySource.get(202)?.loop).toBe(true);
    expect(playersBySource.get(203)?.loop).toBe(true);
    expect(playersBySource.get(201)?.volume).toBeCloseTo(0.72, 2);
    expect(playersBySource.get(202)?.volume).toBeCloseTo(0.58, 2);
    expect(playersBySource.get(203)?.volume).toBeCloseTo(0.34, 2);
    expect(playersBySource.get(201)?.play).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(202)?.play).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(203)?.play).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(201)?.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ artist: "Nidoru", title: "Rain Hearth" }),
      { showSeekBackward: false, showSeekForward: false },
    );
    expect(powerController.beginTimerPlayback).toHaveBeenCalledWith({ appState: "active" });
    expect(snapshot).toEqual(
      expect.objectContaining({
        activeLayerCount: 3,
        playingLayerCount: 3,
        remainingSeconds: 1_800,
        status: "playing",
      }),
    );
    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("audio_started", {
      active_layer_count: 3,
      audio_mode: "sound-mixer",
      source_surface: "sound_mixer",
      sound_category_ids: ["rain", "noise", "environment"],
      sound_ids: ["light-rain", "brown-noise", "fireplace-crackling"],
      timer_option: 30,
      timer_duration_seconds: 1_800,
    });

    const synced = await controller.syncActiveLayers({
      activeLayers: [
        { soundId: "light-rain", volume: 40 },
        { soundId: "brown-noise", volume: 58 },
        { soundId: "fireplace-crackling", volume: 34 },
      ],
      nowMs: 1_000,
    });

    expect(playersBySource.get(201)?.volume).toBeCloseTo(0.4, 2);
    expect(playersBySource.get(202)?.volume).toBeCloseTo(0.58, 2);
    expect(playersBySource.get(203)?.volume).toBeCloseTo(0.34, 2);
    expect(synced.activeLayerCount).toBe(3);
    expect(synced.playingLayerCount).toBe(3);
  });

  it("fails closed for missing bundled assets without using network or leaking file paths", async () => {
    const captureAudioFailed = jest.fn();
    const controller = createSoundMixerPlaybackController({
      adapter: mockAudioAdapter,
      assetSources: {},
      captureAudioFailed,
    });

    const snapshot = await controller.start({
      activeLayers: [{ soundId: "light-rain", volume: 72 }],
      appState: "active",
      nowMs: 0,
      timerDurationSeconds: 1_800,
    });

    expect(snapshot).toEqual(
      expect.objectContaining({
        activeLayerCount: 1,
        playingLayerCount: 0,
        status: "blocked",
      }),
    );
    expect(mockSetAudioModeAsync).not.toHaveBeenCalled();
    expect(mockSetIsAudioActiveAsync).not.toHaveBeenCalledWith(true);
    expect(mockCreateAudioPlayer).not.toHaveBeenCalled();
    expect(captureAudioFailed).toHaveBeenCalledWith({
      failureClass: "missing_bundled_asset",
      soundId: "light-rain",
    } satisfies SoundMixerPlaybackFailureContext);
    expect(JSON.stringify(captureAudioFailed.mock.calls)).not.toMatch(
      /private|Containers|\.m4a|https?:\/\//i,
    );
  });

  it("emits deferred privacy-safe audio_failed metadata by default", async () => {
    const controller = createSoundMixerPlaybackController({
      adapter: mockAudioAdapter,
      assetSources: {},
    });

    await controller.start({
      activeLayers: [{ soundId: "light-rain", volume: 72 }],
      appState: "active",
      nowMs: 0,
      timerDurationSeconds: 1_800,
    });

    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("audio_failed", {
      audio_failure_class: "missing_bundled_asset",
      audio_mode: "sound-mixer",
      source_surface: "sound_mixer",
      sound_category_id: "rain",
      sound_id: "light-rain",
    });
    expect(JSON.stringify(mockCaptureAnalyticsEventDeferred.mock.calls)).not.toMatch(
      /private|Containers|\.m4a|https?:\/\//i,
    );
  });

  it("linearly fades every active layer and releases power when the timer ends", async () => {
    const playersBySource = new Map<number, MockAudioPlayer>();
    const powerController = createMockPowerController();
    mockCreateAudioPlayer.mockImplementation((source: number) => {
      const player = createMockPlayer();
      playersBySource.set(source, player);
      return player;
    });
    const controller = createSoundMixerPlaybackController({
      adapter: mockAudioAdapter,
      assetSources,
      powerController,
    });

    await controller.start({
      activeLayers: [
        { soundId: "light-rain", volume: 72 },
        { soundId: "brown-noise", volume: 58 },
      ],
      appState: "active",
      nowMs: 0,
      timerDurationSeconds: 1_800,
    });

    const halfwayFade = await controller.handleTimerTick({
      appState: "active",
      nowMs: 1_740_000,
    });

    expect(halfwayFade).toEqual(
      expect.objectContaining({
        fadeProgress: 0.5,
        remainingSeconds: 60,
        status: "fading",
      }),
    );
    expect(halfwayFade.volumesBySoundId["light-rain"]).toBeCloseTo(0.36, 2);
    expect(halfwayFade.volumesBySoundId["brown-noise"]).toBeCloseTo(0.29, 2);
    expect(playersBySource.get(201)?.volume).toBeCloseTo(0.36, 2);
    expect(playersBySource.get(202)?.volume).toBeCloseTo(0.29, 2);

    const ended = await controller.handleTimerTick({
      appState: "active",
      nowMs: 1_800_000,
    });

    expect(ended).toEqual(
      expect.objectContaining({
        fadeProgress: 1,
        playingLayerCount: 0,
        remainingSeconds: 0,
        status: "completed",
        stopReason: "timer-ended",
      }),
    );
    expect(playersBySource.get(201)?.pause).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(202)?.pause).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(201)?.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(202)?.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(201)?.remove).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(202)?.remove).toHaveBeenCalledTimes(1);
    expect(powerController.endTimerPlayback).toHaveBeenCalledWith({
      appState: "active",
      reason: "timer-ended",
    });
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(false);
  });
});
