import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

const mockUseLocalSearchParams = jest.fn(() => ({}));
const mockAppStateListeners = new Set<(state: AppStateStatus) => void>();
const mockAppStateAddEventListener = jest.spyOn(AppState, "addEventListener");

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const Link = (props: Record<string, unknown>) => React.createElement("Link", props);

  Link.Trigger = (props: Record<string, unknown>) => React.createElement("LinkTrigger", props);
  Link.Menu = (props: Record<string, unknown>) => React.createElement("LinkMenu", props);
  Link.MenuAction = (props: Record<string, unknown>) =>
    React.createElement("LinkMenuAction", props);
  Link.Preview = (props: Record<string, unknown>) => React.createElement("LinkPreview", props);

  return {
    Link,
    useLocalSearchParams: () => mockUseLocalSearchParams(),
  };
});

jest.mock("../src/storage/local-database", () => ({
  openMigratedLocalDatabase: jest.fn(),
}));

jest.mock("../src/storage/local-install-identity", () => ({
  getOrCreateLocalInstallIdentity: jest.fn(),
}));

jest.mock("../src/audio/active-session-audio-controller", () => ({
  createActiveSessionAudioController: jest.fn(() => ({
    handleAppWake: jest.fn(() => Promise.resolve()),
    handleAudioInterruption: jest.fn(() => Promise.resolve()),
    handleRouteChange: jest.fn(() => Promise.resolve()),
    handleSnapshot: jest.fn(() => Promise.resolve()),
    release: jest.fn(),
    setMode: jest.fn(),
  })),
}));

jest.mock("../src/session/breath-session-local-persistence", () => ({
  completeBreathSessionLocally: jest.fn(() => Promise.resolve()),
  loadPendingBreathSessionCompletion: jest.fn(() => Promise.resolve(null)),
  loadRecoverableBreathSessionDraft: jest.fn(() => Promise.resolve(null)),
  recordBreathSessionStartedLocally: jest.fn(() => Promise.resolve()),
  saveBreathSessionDraftLocally: jest.fn(() => Promise.resolve()),
}));

jest.mock("../src/wind-down/wind-down-local-persistence", () => ({
  completeWindDownRunLocally: jest.fn(() => Promise.resolve()),
  loadRememberedWindDownContextChoiceLocally: jest.fn(),
  recordWindDownStartedLocally: jest.fn(() => Promise.resolve()),
  saveRememberedWindDownContextChoiceLocally: jest.fn(() => Promise.resolve()),
  saveWindDownStepProgressLocally: jest.fn(() => Promise.resolve()),
  stopWindDownRunLocally: jest.fn(() => Promise.resolve()),
}));

import { getOrCreateLocalInstallIdentity } from "../src/storage/local-install-identity";
import { openMigratedLocalDatabase } from "../src/storage/local-database";
import {
  completeBreathSessionLocally,
  recordBreathSessionStartedLocally,
  saveBreathSessionDraftLocally,
} from "../src/session/breath-session-local-persistence";
import {
  completeWindDownRunLocally,
  loadRememberedWindDownContextChoiceLocally,
  recordWindDownStartedLocally,
  saveRememberedWindDownContextChoiceLocally,
  saveWindDownStepProgressLocally,
  stopWindDownRunLocally,
} from "../src/wind-down/wind-down-local-persistence";
import { WindDownRoute } from "../src/wind-down/wind-down-route";

const mockOpenMigratedLocalDatabase = openMigratedLocalDatabase as jest.MockedFunction<
  typeof openMigratedLocalDatabase
>;
const mockGetOrCreateLocalInstallIdentity = getOrCreateLocalInstallIdentity as jest.MockedFunction<
  typeof getOrCreateLocalInstallIdentity
>;
const mockRecordBreathSessionStartedLocally =
  recordBreathSessionStartedLocally as jest.MockedFunction<
    typeof recordBreathSessionStartedLocally
  >;
const mockSaveBreathSessionDraftLocally = saveBreathSessionDraftLocally as jest.MockedFunction<
  typeof saveBreathSessionDraftLocally
>;
const mockCompleteBreathSessionLocally = completeBreathSessionLocally as jest.MockedFunction<
  typeof completeBreathSessionLocally
>;
const mockLoadRememberedWindDownContextChoiceLocally =
  loadRememberedWindDownContextChoiceLocally as jest.MockedFunction<
    typeof loadRememberedWindDownContextChoiceLocally
  >;
const mockRecordWindDownStartedLocally = recordWindDownStartedLocally as jest.MockedFunction<
  typeof recordWindDownStartedLocally
>;
const mockSaveRememberedWindDownContextChoiceLocally =
  saveRememberedWindDownContextChoiceLocally as jest.MockedFunction<
    typeof saveRememberedWindDownContextChoiceLocally
  >;
const mockSaveWindDownStepProgressLocally = saveWindDownStepProgressLocally as jest.MockedFunction<
  typeof saveWindDownStepProgressLocally
>;
const mockCompleteWindDownRunLocally = completeWindDownRunLocally as jest.MockedFunction<
  typeof completeWindDownRunLocally
>;
const mockStopWindDownRunLocally = stopWindDownRunLocally as jest.MockedFunction<
  typeof stopWindDownRunLocally
>;

const database = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

describe("WindDownRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppStateListeners.clear();
    mockAppStateAddEventListener.mockImplementation((eventName, listener) => {
      if (eventName === "change") {
        mockAppStateListeners.add(listener as (state: AppStateStatus) => void);
      }

      return {
        remove: () => {
          mockAppStateListeners.delete(listener as (state: AppStateStatus) => void);
        },
      };
    });
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-05-25T23:18:00.000Z"));
    mockOpenMigratedLocalDatabase.mockResolvedValue(database);
    mockGetOrCreateLocalInstallIdentity.mockResolvedValue("install_0123456789abcdef");
    mockUseLocalSearchParams.mockReturnValue({});
  });

  it("renders a dev-only visual proof state without bootstrapping local storage", () => {
    mockUseLocalSearchParams.mockReturnValue({ windDownState: "ambient_handoff" });

    render(<WindDownRoute />);

    expect(screen.getByTestId("wind-down-state-ambient_handoff")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Rain is playing" })).toBeTruthy();
    expect(mockOpenMigratedLocalDatabase).not.toHaveBeenCalled();
  });

  it("renders the dev-only busy-mind body cue proof state without bootstrapping local storage", () => {
    mockUseLocalSearchParams.mockReturnValue({
      windDownGoal: "calm_racing_thoughts",
      windDownState: "body_cue",
    });

    render(<WindDownRoute />);

    expect(screen.getByTestId("wind-down-state-body_cue")).toBeTruthy();
    expect(screen.getByText("BODY SCAN")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Give your busy mind a body scan." })).toBeTruthy();
    expect(screen.getByText("Move from forehead to feet, then release the tension.")).toBeTruthy();
    expect(mockOpenMigratedLocalDatabase).not.toHaveBeenCalled();
  });

  it("renders a calm fallback before local bootstrap resolves", () => {
    const { fetchMock, restoreFetch } = mockFetchOffline();
    mockOpenMigratedLocalDatabase.mockReturnValue(new Promise(() => undefined));

    try {
      render(<WindDownRoute />);

      expect(screen.getByRole("header", { name: "Settling the room." })).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockRecordWindDownStartedLocally).not.toHaveBeenCalled();
    } finally {
      restoreFetch();
    }
  });

  it("skips context and persists run start before active state when a remembered choice exists", async () => {
    const { fetchMock, restoreFetch } = mockFetchOffline();
    mockLoadRememberedWindDownContextChoiceLocally.mockResolvedValue({
      contextGoal: "calm_racing_thoughts",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_racing_thoughts",
      selectedAt: "2026-05-24T23:18:00.000Z",
    });

    try {
      render(<WindDownRoute />);

      await act(async () => {
        await flushPromises();
      });

      expect(mockLoadRememberedWindDownContextChoiceLocally).toHaveBeenCalledWith(
        expect.any(Object),
        {
          localInstallId: "install_0123456789abcdef",
        },
      );
      expect(mockRecordWindDownStartedLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ambientSoundId: "light-rain",
          contextGoal: "calm_racing_thoughts",
          localInstallId: "install_0123456789abcdef",
          routineId: "wind_down_racing_thoughts",
          startedAt: "2026-05-25T23:18:00.000Z",
        }),
      );
      expect(mockRecordWindDownStartedLocally.mock.calls[0]?.[1].runId).toMatch(
        /^winddown_[A-Za-z0-9_-]{8,64}$/,
      );
      expect(mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId).toMatch(
        /^session_[A-Za-z0-9_-]{8,64}$/,
      );
      expect(mockRecordBreathSessionStartedLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          currentPhaseName: "inhale",
          durationSeconds: 300,
          localInstallId: "install_0123456789abcdef",
          sessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
          source: "wind_down",
          startedAt: "2026-05-25T23:18:00.000Z",
          status: "started",
          techniqueId: "box-breathing",
          windDownRunId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].runId,
        }),
      );
      expect(mockRecordWindDownStartedLocally.mock.invocationCallOrder[0]).toBeLessThan(
        mockRecordBreathSessionStartedLocally.mock.invocationCallOrder[0],
      );
      expect(screen.queryByText("What’s your goal tonight?")).toBeNull();
      expect(screen.getByRole("header", { name: "Let's wind down." })).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      restoreFetch();
    }
  });

  it("routes the remembered racing-thoughts branch into a body-scan body cue", async () => {
    const { fetchMock, restoreFetch } = mockFetchOffline();
    mockLoadRememberedWindDownContextChoiceLocally.mockResolvedValue({
      contextGoal: "calm_racing_thoughts",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_racing_thoughts",
      selectedAt: "2026-05-24T23:18:00.000Z",
    });

    try {
      render(<WindDownRoute />);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        jest.advanceTimersByTime(300_000);
        await flushPromises();
      });

      await act(async () => {
        jest.advanceTimersByTime(5_000);
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-body_cue")).toBeTruthy();
      expect(screen.getByText("BODY SCAN")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Give your busy mind a body scan." })).toBeTruthy();
      expect(
        screen.getByText("Move from forehead to feet, then release the tension."),
      ).toBeTruthy();
      expect(
        screen.queryByText(/insomnia treatment|anxiety relief|panic relief|CBT-I/i),
      ).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      restoreFetch();
    }
  });

  it("shows first-run context, remembers the choice, and then persists before active state", async () => {
    mockLoadRememberedWindDownContextChoiceLocally.mockResolvedValue(null);

    render(<WindDownRoute />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByRole("header", { name: "What’s your goal tonight?" })).toBeTruthy();
    expect(mockRecordWindDownStartedLocally).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Wake up fewer times" }));
      await flushPromises();
    });

    expect(mockSaveRememberedWindDownContextChoiceLocally).toHaveBeenCalledWith(
      expect.any(Object),
      {
        contextGoal: "wake_up_fewer_times",
        localInstallId: "install_0123456789abcdef",
        routineId: "wind_down_daily_calm",
        selectedAt: "2026-05-25T23:18:00.000Z",
      },
    );
    expect(mockRecordWindDownStartedLocally).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        contextGoal: "wake_up_fewer_times",
        localInstallId: "install_0123456789abcdef",
        routineId: "wind_down_daily_calm",
      }),
    );
    expect(mockSaveRememberedWindDownContextChoiceLocally.mock.invocationCallOrder[0]).toBeLessThan(
      mockRecordWindDownStartedLocally.mock.invocationCallOrder[0],
    );
    expect(screen.getByRole("header", { name: "Daily Calm" })).toBeTruthy();
    expect(screen.getByText("10:00")).toBeTruthy();
  });

  it("advances the local-first Wind-Down UI through the accepted recovery and audio states", async () => {
    const { fetchMock, restoreFetch } = mockFetchOffline();
    mockLoadRememberedWindDownContextChoiceLocally.mockResolvedValue({
      contextGoal: "fall_asleep_faster",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_sleep_starter",
      selectedAt: "2026-05-24T23:18:00.000Z",
    });

    try {
      render(<WindDownRoute />);

      await act(async () => {
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-active_winddown")).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(15_000);
        await flushPromises();
      });

      expect(mockSaveBreathSessionDraftLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          currentPhaseName: expect.any(String),
          durationSeconds: 300,
          localInstallId: "install_0123456789abcdef",
          sessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
          source: "wind_down",
          status: "draft",
          techniqueId: "4-7-8-sleep",
          windDownRunId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].runId,
        }),
      );
      expect(mockSaveWindDownStepProgressLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          breathSessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
          recoveryState: "active_winddown",
          status: "started",
        }),
      );

      await act(async () => {
        jest.advanceTimersByTime(285_000);
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-transition_card")).toBeTruthy();
      expect(mockCompleteBreathSessionLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          currentPhaseName: expect.any(String),
          durationSeconds: 300,
          elapsedDurationMs: 300_000,
          localInstallId: "install_0123456789abcdef",
          remainingDurationMs: 0,
          sessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
          source: "wind_down",
          status: "completed",
          techniqueId: "4-7-8-sleep",
          windDownRunId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].runId,
        }),
      );
      expect(mockSaveWindDownStepProgressLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          breathSessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
          recoveryState: "transition_card",
          status: "breath_completed",
        }),
      );
      const breathCompletedOrder = mockCompleteBreathSessionLocally.mock.invocationCallOrder[0];
      const windDownBreathCompletedOrder =
        mockSaveWindDownStepProgressLocally.mock.invocationCallOrder.find((order, index) => {
          const progress = mockSaveWindDownStepProgressLocally.mock.calls[index]?.[1];

          return progress?.status === "breath_completed";
        });

      expect(breathCompletedOrder).toBeLessThan(windDownBreathCompletedOrder ?? 0);

      await act(async () => {
        jest.advanceTimersByTime(5_000);
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-body_cue")).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(120_000);
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-ambient_handoff")).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByRole("button", { name: "Continue" }));
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-dimmed_idle")).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByTestId("wind-down-state-dimmed_idle"));
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-tap_to_wake")).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByRole("button", { name: "Fade now" }));
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-audio_interruption")).toBeTruthy();

      await act(async () => {
        fireEvent.press(screen.getByRole("button", { name: "Keep playing" }));
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-dimmed_idle")).toBeTruthy();

      await act(async () => {
        jest.advanceTimersByTime(1_800_000);
        await flushPromises();
      });

      expect(screen.getByTestId("wind-down-state-completion")).toBeTruthy();
      expect(mockCompleteWindDownRunLocally).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          recoveryState: "completion",
          totalDurationSeconds: 1_800,
        }),
      );
      expect(mockStopWindDownRunLocally).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      restoreFetch();
    }
  });

  it("saves breathwork completion on app wake before showing the transition state", async () => {
    mockLoadRememberedWindDownContextChoiceLocally.mockResolvedValue({
      contextGoal: "fall_asleep_faster",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_sleep_starter",
      selectedAt: "2026-05-24T23:18:00.000Z",
    });

    render(<WindDownRoute />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByTestId("wind-down-state-active_winddown")).toBeTruthy();

    jest.setSystemTime(Date.parse("2026-05-25T23:23:01.000Z"));

    await act(async () => {
      for (const listener of mockAppStateListeners) {
        listener("active");
      }

      await flushPromises();
    });

    expect(mockCompleteBreathSessionLocally).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        elapsedDurationMs: 300_000,
        remainingDurationMs: 0,
        sessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
        source: "wind_down",
        status: "completed",
        windDownRunId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].runId,
      }),
    );
    expect(mockSaveWindDownStepProgressLocally).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        breathSessionId: mockRecordWindDownStartedLocally.mock.calls[0]?.[1].breathSessionId,
        recoveryState: "transition_card",
        status: "breath_completed",
      }),
    );
    expect(screen.getByTestId("wind-down-state-transition_card")).toBeTruthy();
  });

  it("switches remembered hold-based Wind-Down breathing to the no-hold fallback for tonight only", async () => {
    mockLoadRememberedWindDownContextChoiceLocally.mockResolvedValue({
      contextGoal: "fall_asleep_faster",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_sleep_starter",
      selectedAt: "2026-05-24T23:18:00.000Z",
    });

    render(<WindDownRoute />);

    await act(async () => {
      await flushPromises();
    });

    expect(screen.getByRole("button", { name: "Switch to no-hold breathing" })).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Switch to no-hold breathing" }));
      await flushPromises();
    });

    expect(screen.getByRole("header", { name: "No-hold breathing" })).toBeTruthy();
    expect(screen.getByText("Diaphragmatic breathing for wind-down")).toBeTruthy();
    expect(mockSaveRememberedWindDownContextChoiceLocally).not.toHaveBeenCalled();
    expect(mockSaveWindDownStepProgressLocally).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        recoveryState: "no_hold_fallback",
        status: "started",
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(300_000);
      await flushPromises();
    });

    expect(screen.getByTestId("wind-down-state-transition_card")).toBeTruthy();
    expect(mockSaveWindDownStepProgressLocally).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        recoveryState: "transition_card",
        status: "breath_completed",
      }),
    );
  });
});

function mockFetchOffline() {
  const globalWithFetch = globalThis as typeof globalThis & { fetch?: typeof fetch };
  const originalFetch = globalWithFetch.fetch;
  const fetchMock = jest.fn<typeof fetch>(() =>
    Promise.reject(new Error("Network access disabled for Wind-Down launch.")),
  );

  globalWithFetch.fetch = fetchMock;

  return {
    fetchMock,
    restoreFetch: () => {
      if (originalFetch) {
        globalWithFetch.fetch = originalFetch;
      } else {
        delete globalWithFetch.fetch;
      }
    },
  };
}

async function flushPromises() {
  for (let index = 0; index < 8; index += 1) {
    await Promise.resolve();
  }
}
