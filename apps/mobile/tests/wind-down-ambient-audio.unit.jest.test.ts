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
  createWindDownAmbientAudioController,
  type WindDownAmbientAudioFailureContext,
} from "../src/audio/wind-down-ambient-audio";

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

describe("Wind-Down ambient audio", () => {
  beforeEach(() => {
    mockCreateAudioPlayer.mockReset();
    mockSetAudioModeAsync.mockReset();
    mockSetAudioModeAsync.mockImplementation(() => Promise.resolve());
    mockSetIsAudioActiveAsync.mockReset();
    mockSetIsAudioActiveAsync.mockImplementation(() => Promise.resolve());
    mockCaptureAnalyticsEventDeferred.mockReset();
  });

  it("starts bundled Rain audio offline with background-safe playback and privacy-safe audio_started metadata", async () => {
    const player = createMockPlayer();
    const powerController = createMockPowerController();
    mockCreateAudioPlayer.mockReturnValue(player);
    const controller = createWindDownAmbientAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
      powerController,
    });

    const snapshot = await controller.start({
      appState: "active",
      fadeOutDurationSeconds: 120,
      nowMs: 0,
      soundId: "light-rain",
      soundLabel: "Rain",
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
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith(104, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    expect(player.loop).toBe(true);
    expect(player.volume).toBeLessThan(0.5);
    expect(player.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ artist: "Nidoru", title: "Rain" }),
      { showSeekBackward: false, showSeekForward: false },
    );
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(powerController.beginTimerPlayback).toHaveBeenCalledWith({ appState: "active" });
    expect(snapshot).toEqual(
      expect.objectContaining({
        remainingSeconds: 1_800,
        status: "playing",
        timerDurationSeconds: 1_800,
      }),
    );
    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("audio_started", {
      ambient_sound_id: "light-rain",
      audio_asset_id: "nature-ambient-loop",
      audio_mode: "nature-ambient",
      timer_duration_seconds: 1_800,
    });
  });

  it("linearly fades during the final two minutes and releases power when the timer ends", async () => {
    const player = createMockPlayer();
    const powerController = createMockPowerController();
    mockCreateAudioPlayer.mockReturnValue(player);
    const controller = createWindDownAmbientAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
      powerController,
    });

    await controller.start({
      appState: "active",
      fadeOutDurationSeconds: 120,
      nowMs: 0,
      soundId: "light-rain",
      soundLabel: "Rain",
      timerDurationSeconds: 1_800,
    });
    const halfwayFade = await controller.handleTimerTick({ appState: "active", nowMs: 1_740_000 });

    expect(halfwayFade.status).toBe("fading");
    expect(halfwayFade.remainingSeconds).toBe(60);
    expect(halfwayFade.volume).toBeCloseTo(0.16, 2);
    expect(player.volume).toBeCloseTo(0.16, 2);

    const ended = await controller.handleTimerTick({ appState: "active", nowMs: 1_800_000 });

    expect(ended).toEqual(
      expect.objectContaining({
        remainingSeconds: 0,
        status: "completed",
        stopReason: "timer-ended",
        volume: 0,
      }),
    );
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(player.remove).toHaveBeenCalledTimes(1);
    expect(powerController.endTimerPlayback).toHaveBeenCalledWith({
      appState: "active",
      reason: "timer-ended",
    });
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(false);
  });

  it("leaves interrupted audio stopped and does not reacquire power on interruption end", async () => {
    const player = createMockPlayer();
    const powerController = createMockPowerController();
    mockCreateAudioPlayer.mockReturnValue(player);
    const controller = createWindDownAmbientAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
      powerController,
    });

    await controller.start({
      appState: "active",
      fadeOutDurationSeconds: 120,
      nowMs: 0,
      soundId: "light-rain",
      soundLabel: "Rain",
      timerDurationSeconds: 1_800,
    });

    const interrupted = await controller.handleAudioInterruption({
      appState: "background",
      nowMs: 10_000,
      type: "began",
    });
    const ended = await controller.handleAudioInterruption({
      appState: "active",
      nowMs: 11_000,
      type: "ended",
    });

    expect(interrupted).toEqual(
      expect.objectContaining({
        status: "stopped",
        stopReason: "interrupted",
        volume: 0,
      }),
    );
    expect(ended).toEqual(expect.objectContaining({ status: "stopped" }));
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(player.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(player.remove).toHaveBeenCalledTimes(1);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
    expect(powerController.beginTimerPlayback).toHaveBeenCalledTimes(1);
    expect(powerController.endTimerPlayback).toHaveBeenCalledTimes(1);
    expect(powerController.endTimerPlayback).toHaveBeenCalledWith({
      appState: "background",
      reason: "interrupted",
    });
  });

  it("releases audio and power on manual stop without leaking file paths in failure metadata", async () => {
    const player = createMockPlayer();
    const powerController = createMockPowerController();
    const captureAudioFailed = jest.fn();
    mockCreateAudioPlayer.mockReturnValue(player);
    player.pause.mockImplementationOnce(() => {
      throw new Error("/private/var/mobile/session_0123456789abcdef/rain.m4a stopped");
    });
    const controller = createWindDownAmbientAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
      captureAudioFailed,
      powerController,
    });

    await controller.start({
      appState: "active",
      fadeOutDurationSeconds: 120,
      nowMs: 0,
      soundId: "light-rain",
      soundLabel: "Rain",
      timerDurationSeconds: 1_800,
    });
    await expect(
      controller.stop({ appState: "active", nowMs: 1_000, reason: "manual-stop" }),
    ).resolves.toEqual(expect.objectContaining({ status: "stopped", stopReason: "manual-stop" }));

    expect(powerController.endTimerPlayback).toHaveBeenCalledWith({
      appState: "active",
      reason: "manual-stop",
    });
    expect(player.remove).toHaveBeenCalledTimes(1);
    expect(captureAudioFailed).toHaveBeenCalledWith({
      assetId: "nature-ambient-loop",
      failureClass: "ambient_playback_failed",
    } satisfies WindDownAmbientAudioFailureContext);
    expect(JSON.stringify(captureAudioFailed.mock.calls)).not.toMatch(
      /session_0123456789abcdef|private|rain\.m4a/,
    );
  });
});
