export type SleepTimerAppState = "active" | "background" | "locked";

export type SleepTimerStopReason = "manual-stop" | "timer-ended" | "interrupted";

export type SleepTimerPowerSnapshot = {
  readonly appState: SleepTimerAppState;
  readonly powerLockHeld: boolean;
  readonly status: "idle" | "playing" | "ended";
  readonly stopReason?: SleepTimerStopReason;
};

export type SleepTimerPowerLock = {
  readonly acquire: () => Promise<void> | void;
  readonly release: () => Promise<void> | void;
};

export type SleepTimerPowerControllerOptions = {
  readonly powerLock?: SleepTimerPowerLock;
};

export type BeginSleepTimerPlaybackInput = {
  readonly appState: SleepTimerAppState;
};

export type EndSleepTimerPlaybackInput = {
  readonly appState: SleepTimerAppState;
  readonly reason: SleepTimerStopReason;
};

export type SleepTimerPowerController = {
  readonly beginTimerPlayback: (
    input: BeginSleepTimerPlaybackInput,
  ) => Promise<SleepTimerPowerSnapshot>;
  readonly endTimerPlayback: (
    input: EndSleepTimerPlaybackInput,
  ) => Promise<SleepTimerPowerSnapshot>;
  readonly getSnapshot: () => SleepTimerPowerSnapshot;
};

export function createSleepTimerPowerController(
  options: SleepTimerPowerControllerOptions = {},
): SleepTimerPowerController {
  let snapshot: SleepTimerPowerSnapshot = {
    appState: "active",
    powerLockHeld: false,
    status: "idle",
  };

  return {
    async beginTimerPlayback(input) {
      if (options.powerLock && !snapshot.powerLockHeld) {
        await options.powerLock.acquire();
      }

      snapshot = {
        appState: input.appState,
        powerLockHeld: options.powerLock !== undefined,
        status: "playing",
      };

      return snapshot;
    },

    async endTimerPlayback(input) {
      if (options.powerLock && snapshot.powerLockHeld) {
        await options.powerLock.release();
      }

      snapshot = {
        appState: input.appState,
        powerLockHeld: false,
        status: "ended",
        stopReason: input.reason,
      };

      return snapshot;
    },

    getSnapshot() {
      return snapshot;
    },
  };
}
