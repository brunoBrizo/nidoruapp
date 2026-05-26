import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";

const mockRouterReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    navigate: jest.fn(),
    replace: mockRouterReplace,
  }),
}));

jest.mock("../src/storage/local-database", () => ({
  openMigratedLocalDatabase: jest.fn(),
}));

jest.mock("../src/storage/local-install-identity", () => ({
  getOrCreateLocalInstallIdentity: jest.fn(),
}));

jest.mock("../src/session/breath-session-local-persistence", () => ({
  abandonBreathSessionLocally: jest.fn(() => Promise.resolve()),
  completeBreathSessionLocally: jest.fn(() => Promise.resolve()),
  loadPendingBreathSessionCompletion: jest.fn(),
  loadRecoverableBreathSessionDraft: jest.fn(),
  recordBreathSessionStartedLocally: jest.fn(() => Promise.resolve()),
  saveBreathSessionDraftLocally: jest.fn(() => Promise.resolve()),
}));

jest.mock("../src/rescue/rescue-me-screen", () => ({
  RescueMeActiveSessionScreen: jest.fn(() => null),
  RescueMeScreen: jest.fn(() => null),
}));

import { RescueMeSessionRoute } from "../src/rescue/rescue-me-session-route";
import { RescueMeActiveSessionScreen, RescueMeScreen } from "../src/rescue/rescue-me-screen";
import {
  loadPendingBreathSessionCompletion,
  loadRecoverableBreathSessionDraft,
} from "../src/session/breath-session-local-persistence";
import { getOrCreateLocalInstallIdentity } from "../src/storage/local-install-identity";
import { openMigratedLocalDatabase } from "../src/storage/local-database";

const mockOpenMigratedLocalDatabase = openMigratedLocalDatabase as jest.MockedFunction<
  typeof openMigratedLocalDatabase
>;
const mockGetOrCreateLocalInstallIdentity = getOrCreateLocalInstallIdentity as jest.MockedFunction<
  typeof getOrCreateLocalInstallIdentity
>;
const mockLoadPendingBreathSessionCompletion =
  loadPendingBreathSessionCompletion as jest.MockedFunction<
    typeof loadPendingBreathSessionCompletion
  >;
const mockLoadRecoverableBreathSessionDraft =
  loadRecoverableBreathSessionDraft as jest.MockedFunction<
    typeof loadRecoverableBreathSessionDraft
  >;
const mockRescueMeActiveSessionScreen = RescueMeActiveSessionScreen as jest.MockedFunction<
  typeof RescueMeActiveSessionScreen
>;

describe("RescueMeSessionRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders the active launch orb before local identity bootstrap resolves", () => {
    const { fetchMock, restoreFetch } = mockFetchOffline();
    mockOpenMigratedLocalDatabase.mockReturnValue(new Promise(() => undefined));

    try {
      const { unmount } = render(<RescueMeSessionRoute />);

      expect(RescueMeScreen).toHaveBeenCalledWith({ state: "active-launch" }, undefined);
      expect(mockRescueMeActiveSessionScreen).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();

      unmount();
    } finally {
      restoreFetch();
    }
  });

  it("falls back to an unauthenticated local-only session without network when bootstrap fails", async () => {
    const observedAtMs = Date.parse("2026-05-23T06:15:00.000Z");
    const { fetchMock, restoreFetch } = mockFetchOffline();
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(observedAtMs);

    mockOpenMigratedLocalDatabase.mockRejectedValue(new Error("local bootstrap unavailable"));

    try {
      render(<RescueMeSessionRoute />);

      expect(RescueMeScreen).toHaveBeenCalledWith({ state: "active-launch" }, undefined);

      await act(async () => {
        await flushPromises();
      });

      expect(mockRescueMeActiveSessionScreen).toHaveBeenCalled();

      const [activeProps] = mockRescueMeActiveSessionScreen.mock.calls.at(-1) ?? [];

      expect(activeProps).toEqual(
        expect.objectContaining({
          hasExistingLocalRecord: false,
          localInstallId: "install_rescuefallback",
        }),
      );
      expect(activeProps?.sessionId).toMatch(/^session_[A-Za-z0-9_-]{8,64}$/);
      expect(activeProps?.startedAtMs).toBe(observedAtMs);
      expect(mockGetOrCreateLocalInstallIdentity).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      dateNowSpy.mockRestore();
      restoreFetch();
    }
  });

  it("recovers an in-progress Rescue Me draft without allowing a fresh start rewrite", async () => {
    const observedAtMs = Date.parse("2026-05-23T06:00:00.000Z");
    const database = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };

    jest.useFakeTimers();
    jest.setSystemTime(observedAtMs);
    mockOpenMigratedLocalDatabase.mockResolvedValue(database);
    mockGetOrCreateLocalInstallIdentity.mockResolvedValue("install_0123456789abcdef");
    mockLoadPendingBreathSessionCompletion.mockResolvedValue(null);
    mockLoadRecoverableBreathSessionDraft.mockResolvedValue({
      audioCueModeId: "gentle-bell",
      completedBreathCycles: 2,
      currentPhaseName: "exhale",
      durationSeconds: 209,
      elapsedDurationMs: 42_000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 167_000,
      sessionId: "session_rescuedraft1234",
      source: "rescue_me",
      startedAt: "2026-05-23T05:59:18.000Z",
      status: "draft",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-23T05:59:59.000Z",
    });

    render(<RescueMeSessionRoute />);

    expect(RescueMeScreen).toHaveBeenCalledWith({ state: "active-launch" }, undefined);

    await act(async () => {
      await flushPromises();
    });
    expect(mockRescueMeActiveSessionScreen).toHaveBeenCalled();
    const [activeProps] = mockRescueMeActiveSessionScreen.mock.calls.at(-1) ?? [];

    expect(activeProps).toEqual(
      expect.objectContaining({
        hasExistingLocalRecord: true,
        localInstallId: "install_0123456789abcdef",
        sessionId: "session_rescuedraft1234",
      }),
    );
    expect(activeProps?.startedAtMs).toBeGreaterThanOrEqual(observedAtMs - 42_000);
    expect(activeProps?.startedAtMs).toBeLessThan(observedAtMs - 41_000);
    expect(mockLoadPendingBreathSessionCompletion).not.toHaveBeenCalled();
    expect(mockLoadRecoverableBreathSessionDraft).toHaveBeenCalledWith(expect.any(Object), {
      localInstallId: "install_0123456789abcdef",
      source: "rescue_me",
    });
  });

  it("recovers a no-hold Rescue Me draft with its fallback technique and duration", async () => {
    const observedAtMs = Date.parse("2026-05-23T06:10:00.000Z");
    const database = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };

    jest.useFakeTimers();
    jest.setSystemTime(observedAtMs);
    mockOpenMigratedLocalDatabase.mockResolvedValue(database);
    mockGetOrCreateLocalInstallIdentity.mockResolvedValue("install_0123456789abcdef");
    mockLoadRecoverableBreathSessionDraft.mockResolvedValue({
      audioCueModeId: "gentle-bell",
      completedBreathCycles: 4,
      currentPhaseName: "exhale",
      durationSeconds: 180,
      elapsedDurationMs: 45_000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 135_000,
      sessionId: "session_rescuenohold123",
      source: "rescue_me",
      startedAt: "2026-05-23T06:09:15.000Z",
      status: "draft",
      techniqueId: "diaphragmatic-breathing",
      updatedAt: "2026-05-23T06:09:59.000Z",
    });

    render(<RescueMeSessionRoute />);

    await act(async () => {
      await flushPromises();
    });

    const [activeProps] = mockRescueMeActiveSessionScreen.mock.calls.at(-1) ?? [];

    expect(activeProps).toEqual(
      expect.objectContaining({
        hasExistingLocalRecord: true,
        initialDurationSeconds: 180,
        initialTechniqueId: "diaphragmatic-breathing",
        localInstallId: "install_0123456789abcdef",
        sessionId: "session_rescuenohold123",
      }),
    );
    expect(activeProps?.startedAtMs).toBeGreaterThanOrEqual(observedAtMs - 45_000);
    expect(activeProps?.startedAtMs).toBeLessThan(observedAtMs - 44_000);
  });

  it("starts a fresh Rescue Me session instead of restoring an old completed session", async () => {
    const observedAtMs = Date.parse("2026-05-23T06:15:00.000Z");
    const database = {
      getFirstAsync: jest.fn(),
      runAsync: jest.fn(),
    };

    jest.useFakeTimers();
    jest.setSystemTime(observedAtMs);
    mockOpenMigratedLocalDatabase.mockResolvedValue(database);
    mockGetOrCreateLocalInstallIdentity.mockResolvedValue("install_0123456789abcdef");
    mockLoadPendingBreathSessionCompletion.mockResolvedValue({
      audioCueModeId: "gentle-bell",
      completedAt: "2026-05-23T06:05:00.000Z",
      completedBreathCycles: 5,
      completionPersistedAt: "2026-05-23T06:05:01.000Z",
      currentPhaseName: "exhale",
      durationSeconds: 209,
      elapsedDurationMs: 209_000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 0,
      sessionId: "session_completedrescueme",
      source: "rescue_me",
      startedAt: "2026-05-23T06:01:31.000Z",
      status: "completed",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-23T06:05:01.000Z",
    });
    mockLoadRecoverableBreathSessionDraft.mockResolvedValue(null);

    render(<RescueMeSessionRoute />);

    await act(async () => {
      await flushPromises();
    });

    const [activeProps] = mockRescueMeActiveSessionScreen.mock.calls.at(-1) ?? [];

    expect(activeProps).toEqual(
      expect.objectContaining({
        hasExistingLocalRecord: false,
        localInstallId: "install_0123456789abcdef",
      }),
    );
    expect(activeProps).not.toHaveProperty("initialCompletionMode");
    expect(activeProps?.sessionId).toMatch(/^session_[A-Za-z0-9_-]{8,64}$/);
    expect(activeProps?.sessionId).not.toBe("session_completedrescueme");
    expect(activeProps?.startedAtMs).toBe(observedAtMs);
    expect(mockLoadPendingBreathSessionCompletion).not.toHaveBeenCalled();
  });
});

function mockFetchOffline() {
  const globalWithFetch = globalThis as typeof globalThis & { fetch?: typeof fetch };
  const originalFetch = globalWithFetch.fetch;
  const fetchMock = jest.fn<typeof fetch>(() =>
    Promise.reject(new Error("Network access disabled for Rescue Me launch.")),
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
