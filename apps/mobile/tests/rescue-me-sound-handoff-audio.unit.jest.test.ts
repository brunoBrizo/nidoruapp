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
  createRescueMeSoundHandoffAudioController,
  type RescueMeSoundHandoffAudioFailureContext,
} from "../src/audio/rescue-me-sound-handoff-audio";

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

describe("Rescue Me sound handoff audio", () => {
  beforeEach(() => {
    mockCreateAudioPlayer.mockReset();
    mockSetAudioModeAsync.mockReset();
    mockSetAudioModeAsync.mockImplementation(() => Promise.resolve());
    mockSetIsAudioActiveAsync.mockReset();
    mockSetIsAudioActiveAsync.mockImplementation(() => Promise.resolve());
    mockCaptureAnalyticsEventDeferred.mockReset();
  });

  it("starts bundled Rain audio locally with background-safe playback settings", async () => {
    const player = createMockPlayer();
    mockCreateAudioPlayer.mockReturnValue(player);
    const captureAudioFailed = jest.fn();
    const controller = createRescueMeSoundHandoffAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
      captureAudioFailed,
    });

    await controller.start();

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
    expect(captureAudioFailed).not.toHaveBeenCalled();
  });

  it("pauses, resumes, and releases without restarting the local asset", async () => {
    const player = createMockPlayer();
    mockCreateAudioPlayer.mockReturnValue(player);
    const controller = createRescueMeSoundHandoffAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
    });

    await controller.start();
    await controller.pause();
    await controller.resume();
    controller.release();

    expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
    expect(player.seekTo).toHaveBeenCalledTimes(1);
    expect(player.pause).toHaveBeenCalledTimes(2);
    expect(player.play).toHaveBeenCalledTimes(2);
    expect(player.clearLockScreenControls).toHaveBeenCalledTimes(1);
    expect(player.remove).toHaveBeenCalledTimes(1);
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(false);
  });

  it("captures privacy-safe audio_failed metadata and never throws when playback setup fails", async () => {
    mockCreateAudioPlayer.mockImplementation(() => {
      throw new Error(
        "failed to create /private/var/mobile/Containers/Data/session_0123456789abcdef/rain.m4a",
      );
    });
    const captureAudioFailed = jest.fn();
    const controller = createRescueMeSoundHandoffAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
      captureAudioFailed,
    });

    await expect(controller.start()).resolves.toBeUndefined();

    expect(captureAudioFailed).toHaveBeenCalledWith({
      assetId: "nature-ambient-loop",
      failureClass: "ambient_playback_failed",
    } satisfies RescueMeSoundHandoffAudioFailureContext);
    expect(JSON.stringify(captureAudioFailed.mock.calls)).not.toMatch(
      /session_0123456789abcdef|private|rain\.m4a/,
    );
  });

  it("emits deferred privacy-safe audio_failed metadata by default", async () => {
    mockCreateAudioPlayer.mockImplementation(() => {
      throw new Error(
        "failed to create /private/var/mobile/Containers/Data/session_0123456789abcdef/rain.m4a",
      );
    });
    const controller = createRescueMeSoundHandoffAudioController({
      adapter: mockAudioAdapter,
      assetSource: 104,
    });

    await expect(controller.start()).resolves.toBeUndefined();

    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("audio_failed", {
      audio_asset_id: "nature-ambient-loop",
      audio_failure_class: "ambient_playback_failed",
      audio_mode: "nature-ambient",
    });
    expect(JSON.stringify(mockCaptureAnalyticsEventDeferred.mock.calls)).not.toMatch(
      /session_0123456789abcdef|private|rain\.m4a/,
    );
  });
});
