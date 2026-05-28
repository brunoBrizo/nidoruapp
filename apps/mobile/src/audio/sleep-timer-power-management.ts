import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

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

type ExpoKeepAwakePowerLockAdapter = {
  readonly activateKeepAwakeAsync: (tag?: string) => Promise<void>;
  readonly deactivateKeepAwake: (tag?: string) => Promise<void>;
};

export type SleepTimerPowerControllerOptions = {
  readonly powerLock?: SleepTimerPowerLock | null;
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

export const sleepTimerPowerLockTag = "nidoru-sleep-timer-playback";

const defaultKeepAwakeAdapter = {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} as const satisfies ExpoKeepAwakePowerLockAdapter;

export function createExpoKeepAwakePowerLock({
  adapter = defaultKeepAwakeAdapter,
  tag = sleepTimerPowerLockTag,
}: {
  readonly adapter?: ExpoKeepAwakePowerLockAdapter;
  readonly tag?: string;
} = {}): SleepTimerPowerLock {
  return {
    acquire: () => adapter.activateKeepAwakeAsync(tag),
    release: () => adapter.deactivateKeepAwake(tag),
  };
}

const defaultPowerLock = createExpoKeepAwakePowerLock();

export function createSleepTimerPowerController({
  powerLock = defaultPowerLock,
}: SleepTimerPowerControllerOptions = {}): SleepTimerPowerController {
  let snapshot: SleepTimerPowerSnapshot = {
    appState: "active",
    powerLockHeld: false,
    status: "idle",
  };

  return {
    async beginTimerPlayback(input) {
      let powerLockHeld = snapshot.powerLockHeld;

      if (powerLock && !snapshot.powerLockHeld) {
        try {
          await powerLock.acquire();
          powerLockHeld = true;
        } catch {
          powerLockHeld = false;
        }
      }

      snapshot = {
        appState: input.appState,
        powerLockHeld,
        status: "playing",
      };

      return snapshot;
    },

    async endTimerPlayback(input) {
      if (powerLock && snapshot.powerLockHeld) {
        try {
          await powerLock.release();
        } catch {
          // Power release failures must not block audio cleanup or route unmount.
        }
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
