import { describe, expect, it, jest } from "@jest/globals";

import { createSleepTimerPowerController } from "../src/audio/sleep-timer-power-management";

describe("sleep timer power management", () => {
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
    const controller = createSleepTimerPowerController();

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
  });
});
