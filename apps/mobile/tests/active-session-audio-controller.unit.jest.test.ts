import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import type { BreathAudioCueModeId, BreathPhaseName } from "@nidoru/domain";

const mockCreateAudioPlayer = jest.fn();
const mockSetAudioModeAsync = jest.fn(() => Promise.resolve());
const mockSetIsAudioActiveAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-audio", () => ({
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
}));

import {
  createActiveSessionAudioController,
  type ActiveSessionAudioFailureContext,
} from "../src/audio/active-session-audio-controller";
import type { BreathSessionSnapshot } from "../src/session/breath-session-runtime";

type MockAudioPlayer = {
  clearLockScreenControls: jest.Mock;
  loop: boolean;
  pause: jest.Mock;
  play: jest.Mock;
  remove: jest.Mock;
  seekTo: jest.Mock;
  setActiveForLockScreen: jest.Mock;
  updateLockScreenMetadata: jest.Mock;
  volume: number;
};

const assetSources = {
  gentleBellTransition: 101,
  natureAmbientLoop: 104,
  softWhooshExhale: 103,
  softWhooshInhale: 102,
} as const;

const mockAudioAdapter = {
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
};

function createMockPlayer(): MockAudioPlayer {
  return {
    clearLockScreenControls: jest.fn(),
    loop: false,
    pause: jest.fn(),
    play: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    volume: 1,
  };
}

function createSnapshot({
  observedAtMs = 1_000,
  phaseIndex = 0,
  phaseName = "inhale",
  phaseStartedAtElapsedMs = 0,
  phaseStartedAtMs = 1_000,
  status = "active",
}: {
  readonly observedAtMs?: number;
  readonly phaseIndex?: number;
  readonly phaseName?: BreathPhaseName;
  readonly phaseStartedAtElapsedMs?: number;
  readonly phaseStartedAtMs?: number;
  readonly status?: BreathSessionSnapshot["status"];
}): BreathSessionSnapshot {
  return {
    completedBreathCycles: 0,
    currentPhase: {
      durationMs: 4000,
      elapsedMs: 0,
      index: phaseIndex,
      name: phaseName,
      progress: 0,
      startedAtElapsedMs: phaseStartedAtElapsedMs,
      startedAtMs: phaseStartedAtMs,
    },
    elapsedDurationMs: phaseStartedAtElapsedMs,
    elapsedSeconds: Math.floor(phaseStartedAtElapsedMs / 1000),
    isPaused: status === "paused",
    observedAtMs,
    phaseDurationMs: 4000,
    phaseElapsedMs: 0,
    phaseIndex,
    phaseName,
    phaseProgress: 0,
    phaseStartedAtElapsedMs,
    phaseStartedAtMs,
    remainingDurationMs: 60_000,
    remainingSeconds: 60,
    status,
    totalDurationMs: 60_000,
    totalDurationSeconds: 60,
  };
}

describe("active session audio controller", () => {
  beforeEach(() => {
    mockCreateAudioPlayer.mockReset();
    mockSetAudioModeAsync.mockReset();
    mockSetAudioModeAsync.mockImplementation(() => Promise.resolve());
    mockSetIsAudioActiveAsync.mockReset();
    mockSetIsAudioActiveAsync.mockImplementation(() => Promise.resolve());
  });

  it("configures background-capable audio once and plays bell cues on controller phase transitions", async () => {
    const players: MockAudioPlayer[] = [];
    mockCreateAudioPlayer.mockImplementation(() => {
      const player = createMockPlayer();
      players.push(player);
      return player;
    });
    const captureAudioFailed = jest.fn();
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
      captureAudioFailed,
    });

    controller.setMode("gentle-bell");
    await controller.handleSnapshot(createSnapshot({ phaseName: "inhale" }));
    await controller.handleSnapshot(createSnapshot({ phaseName: "inhale" }));
    await controller.handleSnapshot(
      createSnapshot({
        observedAtMs: 5_000,
        phaseIndex: 1,
        phaseName: "hold",
        phaseStartedAtElapsedMs: 4000,
        phaseStartedAtMs: 5_000,
      }),
    );

    expect(mockSetAudioModeAsync).toHaveBeenCalledTimes(1);
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsRecording: false,
        interruptionMode: "doNotMix",
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      }),
    );
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith(101, {
      keepAudioSessionActive: true,
      updateInterval: 1000,
    });
    expect(players[0]?.seekTo).toHaveBeenCalledTimes(2);
    expect(players[0]?.play).toHaveBeenCalledTimes(2);
    expect(players[0]?.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ artist: "Nidoru", title: "Gentle bell" }),
      { showSeekBackward: false, showSeekForward: false },
    );
    expect(captureAudioFailed).not.toHaveBeenCalled();
  });

  it("lets mode changes cue the current phase without depending on a restarted phase controller", async () => {
    const playersBySource = new Map<number, MockAudioPlayer>();
    mockCreateAudioPlayer.mockImplementation((source: number) => {
      const player = createMockPlayer();
      playersBySource.set(source, player);
      return player;
    });
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
    });
    const inhaleSnapshot = createSnapshot({
      phaseIndex: 0,
      phaseName: "inhale",
      phaseStartedAtElapsedMs: 0,
    });
    const exhaleSnapshot = createSnapshot({
      observedAtMs: 12_000,
      phaseIndex: 2,
      phaseName: "exhale",
      phaseStartedAtElapsedMs: 11_000,
      phaseStartedAtMs: 12_000,
    });

    controller.setMode("gentle-bell");
    await controller.handleSnapshot(inhaleSnapshot);
    controller.setMode("soft-whoosh");
    await controller.handleSnapshot(inhaleSnapshot);
    await controller.handleSnapshot(exhaleSnapshot);

    expect(playersBySource.get(101)?.play).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(102)?.play).toHaveBeenCalledTimes(1);
    expect(playersBySource.get(103)?.play).toHaveBeenCalledTimes(1);
  });

  it("keeps nature ambient local, looping, and non-blocking across pause and wake lifecycles", async () => {
    const playersBySource = new Map<number, MockAudioPlayer>();
    mockCreateAudioPlayer.mockImplementation((source: number) => {
      const player = createMockPlayer();
      playersBySource.set(source, player);
      return player;
    });
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
    });
    const inhaleSnapshot = createSnapshot({
      phaseIndex: 0,
      phaseName: "inhale",
      phaseStartedAtElapsedMs: 0,
    });

    controller.setMode("nature-ambient");
    await controller.handleSnapshot(inhaleSnapshot);
    await controller.handleSnapshot(createSnapshot({ status: "paused" }));
    await controller.handleAppWake(inhaleSnapshot);

    const ambientPlayer = playersBySource.get(104);
    expect(ambientPlayer?.loop).toBe(true);
    expect(ambientPlayer?.volume).toBeLessThan(0.5);
    expect(ambientPlayer?.play).toHaveBeenCalledTimes(2);
    expect(ambientPlayer?.pause).toHaveBeenCalledTimes(1);
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(true);
  });

  it("does not replay the same phase cue on repeated app wake events", async () => {
    const playersBySource = new Map<number, MockAudioPlayer>();
    mockCreateAudioPlayer.mockImplementation((source: number) => {
      const player = createMockPlayer();
      playersBySource.set(source, player);
      return player;
    });
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
    });
    const inhaleSnapshot = createSnapshot({
      phaseIndex: 0,
      phaseName: "inhale",
      phaseStartedAtElapsedMs: 0,
    });

    controller.setMode("gentle-bell");
    await controller.handleSnapshot(inhaleSnapshot);
    await controller.handleAppWake(inhaleSnapshot);
    await controller.handleAppWake(inhaleSnapshot);

    expect(playersBySource.get(101)?.play).toHaveBeenCalledTimes(1);
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledTimes(2);
    expect(mockSetIsAudioActiveAsync).toHaveBeenCalledWith(true);
  });

  it("stops nature ambient immediately when switching to another mode", async () => {
    const playersBySource = new Map<number, MockAudioPlayer>();
    mockCreateAudioPlayer.mockImplementation((source: number) => {
      const player = createMockPlayer();
      playersBySource.set(source, player);
      return player;
    });
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
    });

    controller.setMode("nature-ambient");
    await controller.handleSnapshot(createSnapshot({ phaseName: "inhale" }));
    controller.setMode("soft-whoosh");

    expect(playersBySource.get(104)?.pause).toHaveBeenCalledTimes(1);
  });

  it("captures privacy-safe audio_failed metadata and never throws when playback fails", async () => {
    const failingPlayer = createMockPlayer();
    failingPlayer.play.mockImplementation(() => {
      throw new Error(
        "failed to play /private/var/mobile/Containers/Data/session_0123456789abcdef/cue.m4a",
      );
    });
    mockCreateAudioPlayer.mockReturnValue(failingPlayer);
    const captureAudioFailed = jest.fn();
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
      captureAudioFailed,
    });

    controller.setMode("gentle-bell");
    await expect(controller.handleSnapshot(createSnapshot({ phaseName: "inhale" }))).resolves.toBe(
      undefined,
    );

    expect(captureAudioFailed).toHaveBeenCalledWith({
      assetId: "gentle-bell-transition",
      failureClass: "cue_playback_failed",
      mode: "gentle-bell",
      phaseName: "inhale",
    } satisfies ActiveSessionAudioFailureContext);
    expect(JSON.stringify(captureAudioFailed.mock.calls)).not.toMatch(
      /session_0123456789abcdef|private|cue\.m4a/,
    );
  });

  it("captures privacy-safe audio_failed metadata and never throws when player creation fails", async () => {
    mockCreateAudioPlayer.mockImplementation(() => {
      throw new Error(
        "failed to create /private/var/mobile/Containers/Data/session_0123456789abcdef/cue.m4a",
      );
    });
    const captureAudioFailed = jest.fn();
    const controller = createActiveSessionAudioController({
      adapter: mockAudioAdapter,
      assetSources,
      captureAudioFailed,
    });

    controller.setMode("gentle-bell");
    await expect(controller.handleSnapshot(createSnapshot({ phaseName: "inhale" }))).resolves.toBe(
      undefined,
    );

    expect(captureAudioFailed).toHaveBeenCalledWith({
      assetId: "gentle-bell-transition",
      failureClass: "cue_playback_failed",
      mode: "gentle-bell",
      phaseName: "inhale",
    } satisfies ActiveSessionAudioFailureContext);
    expect(JSON.stringify(captureAudioFailed.mock.calls)).not.toMatch(
      /session_0123456789abcdef|private|cue\.m4a/,
    );
  });

  it.each(["none", "gentle-bell", "soft-whoosh", "nature-ambient"] as BreathAudioCueModeId[])(
    "accepts %s as an active session mode",
    (mode) => {
      const controller = createActiveSessionAudioController({
        adapter: mockAudioAdapter,
        assetSources,
      });

      expect(() => {
        controller.setMode(mode);
      }).not.toThrow();
    },
  );
});
