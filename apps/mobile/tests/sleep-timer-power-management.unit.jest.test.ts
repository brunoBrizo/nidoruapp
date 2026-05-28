import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import {
  createExpoKeepAwakePowerLock,
  createSleepTimerPowerController,
  sleepTimerPowerLockTag,
} from "../src/audio/sleep-timer-power-management";

describe("sleep timer power management", () => {
  let mockActivateKeepAwakeAsync: jest.Mock<() => Promise<void>>;
  let mockDeactivateKeepAwake: jest.Mock<() => Promise<void>>;

  beforeEach(() => {
    mockActivateKeepAwakeAsync = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    mockDeactivateKeepAwake = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  });

  it("uses the same Expo keep-awake tag for acquire and release", async () => {
    const powerLock = createExpoKeepAwakePowerLock({
      adapter: {
        activateKeepAwakeAsync: mockActivateKeepAwakeAsync,
        deactivateKeepAwake: mockDeactivateKeepAwake,
      },
    });
    const controller = createSleepTimerPowerController({ powerLock });

    const playing = await controller.beginTimerPlayback({ appState: "locked" });
    const ended = await controller.endTimerPlayback({
      appState: "locked",
      reason: "timer-ended",
    });

    expect(mockActivateKeepAwakeAsync).toHaveBeenCalledWith(sleepTimerPowerLockTag);
    expect(mockDeactivateKeepAwake).toHaveBeenCalledWith(sleepTimerPowerLockTag);
    expect(playing).toEqual({
      appState: "locked",
      powerLockHeld: true,
      status: "playing",
    });
    expect(ended).toEqual({
      appState: "locked",
      powerLockHeld: false,
      status: "ended",
      stopReason: "timer-ended",
    });
  });

  it("releases an active power lock when timer-ended playback finishes while locked", async () => {
    const powerLock = {
      acquire: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
      release: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    };
    const controller = createSleepTimerPowerController({ powerLock });

    await controller.beginTimerPlayback({ appState: "locked" });
    const snapshot = await controller.endTimerPlayback({
      appState: "locked",
      reason: "timer-ended",
    });

    expect(powerLock.acquire).toHaveBeenCalledTimes(1);
    expect(powerLock.release).toHaveBeenCalledTimes(1);
    expect(snapshot).toEqual({
      appState: "locked",
      powerLockHeld: false,
      status: "ended",
      stopReason: "timer-ended",
    });
  });

  it("does not pretend a power lock exists when no keep-awake adapter is configured", async () => {
    const controller = createSleepTimerPowerController({ powerLock: null });

    await controller.beginTimerPlayback({ appState: "background" });
    const snapshot = await controller.endTimerPlayback({
      appState: "background",
      reason: "timer-ended",
    });

    expect(snapshot).toEqual({
      appState: "background",
      powerLockHeld: false,
      status: "ended",
      stopReason: "timer-ended",
    });
    expect(mockActivateKeepAwakeAsync).not.toHaveBeenCalled();
    expect(mockDeactivateKeepAwake).not.toHaveBeenCalled();
  });

  it("keeps playback cleanup non-blocking when keep-awake acquisition fails", async () => {
    mockActivateKeepAwakeAsync.mockRejectedValueOnce(new Error("native keep-awake unavailable"));
    const controller = createSleepTimerPowerController({
      powerLock: createExpoKeepAwakePowerLock({
        adapter: {
          activateKeepAwakeAsync: mockActivateKeepAwakeAsync,
          deactivateKeepAwake: mockDeactivateKeepAwake,
        },
      }),
    });

    const playing = await controller.beginTimerPlayback({ appState: "active" });
    const ended = await controller.endTimerPlayback({
      appState: "active",
      reason: "manual-stop",
    });

    expect(playing).toEqual({
      appState: "active",
      powerLockHeld: false,
      status: "playing",
    });
    expect(ended).toEqual({
      appState: "active",
      powerLockHeld: false,
      status: "ended",
      stopReason: "manual-stop",
    });
    expect(mockDeactivateKeepAwake).not.toHaveBeenCalled();
  });
});
