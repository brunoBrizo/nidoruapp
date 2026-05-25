import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("../src/storage/local-database", () => ({
  openMigratedLocalDatabase: jest.fn(),
}));

jest.mock("../src/storage/local-install-identity", () => ({
  getOrCreateLocalInstallIdentity: jest.fn(),
}));

jest.mock("../src/wind-down/wind-down-local-persistence", () => ({
  loadRememberedWindDownContextChoiceLocally: jest.fn(),
  recordWindDownStartedLocally: jest.fn(() => Promise.resolve()),
  saveRememberedWindDownContextChoiceLocally: jest.fn(() => Promise.resolve()),
}));

import { getOrCreateLocalInstallIdentity } from "../src/storage/local-install-identity";
import { openMigratedLocalDatabase } from "../src/storage/local-database";
import {
  loadRememberedWindDownContextChoiceLocally,
  recordWindDownStartedLocally,
  saveRememberedWindDownContextChoiceLocally,
} from "../src/wind-down/wind-down-local-persistence";
import { WindDownRoute } from "../src/wind-down/wind-down-route";

const mockOpenMigratedLocalDatabase = openMigratedLocalDatabase as jest.MockedFunction<
  typeof openMigratedLocalDatabase
>;
const mockGetOrCreateLocalInstallIdentity = getOrCreateLocalInstallIdentity as jest.MockedFunction<
  typeof getOrCreateLocalInstallIdentity
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

const database = {
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
};

describe("WindDownRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-05-25T23:18:00.000Z"));
    mockOpenMigratedLocalDatabase.mockResolvedValue(database);
    mockGetOrCreateLocalInstallIdentity.mockResolvedValue("install_0123456789abcdef");
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
      expect(screen.queryByText("What’s your goal tonight?")).toBeNull();
      expect(screen.getByRole("header", { name: "Let’s wind down." })).toBeTruthy();
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
    expect(screen.getByRole("header", { name: "Let’s wind down." })).toBeTruthy();
    expect(screen.getByText("10:00")).toBeTruthy();
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
