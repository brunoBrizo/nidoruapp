import { describe, expect, it, jest } from "@jest/globals";

import {
  abandonFirstSessionLocally,
  loadRecoverableFirstSessionDraft,
  saveFirstSessionDraftLocally,
  type LocalFirstOnboardingDatabase,
} from "../src/onboarding/local-first-onboarding";

function createMockDatabase(firstRow: Record<string, unknown> | null = null) {
  const database: LocalFirstOnboardingDatabase & {
    readonly runAsync: jest.MockedFunction<LocalFirstOnboardingDatabase["runAsync"]>;
    readonly getFirstAsync: jest.MockedFunction<LocalFirstOnboardingDatabase["getFirstAsync"]>;
  } = {
    runAsync: jest.fn<LocalFirstOnboardingDatabase["runAsync"]>().mockResolvedValue(undefined),
    getFirstAsync: jest
      .fn<LocalFirstOnboardingDatabase["getFirstAsync"]>()
      .mockResolvedValue(firstRow),
  };

  return database;
}

describe("first-session local persistence", () => {
  it("saves a recoverable draft snapshot without depending on sync or account state", async () => {
    const database = createMockDatabase();

    await saveFirstSessionDraftLocally(database, {
      completedBreathCycles: 12,
      currentPhaseName: "inhale",
      durationSeconds: 240,
      elapsedDurationMs: 230000,
      localInstallId: "install_0123456789abcdef",
      planId: "sleep_focused",
      remainingDurationMs: 10000,
      sessionId: "session_0123456789abcdef",
      startedAt: "2026-05-20T01:00:00.000Z",
      status: "draft",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-20T01:03:50.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO first_session_records"),
      [
        "session_0123456789abcdef",
        "install_0123456789abcdef",
        "draft",
        "sleep_focused",
        "4-7-8-sleep",
        "2026-05-20T01:00:00.000Z",
        null,
        240,
        12,
        null,
        230000,
        10000,
        "inhale",
        null,
        "2026-05-20T01:03:50.000Z",
      ],
    );
  });

  it("loads the latest recoverable draft for crash recovery", async () => {
    const database = createMockDatabase({
      completed_breath_cycles: 12,
      current_phase: "inhale",
      duration_seconds: 240,
      elapsed_ms: 230000,
      local_install_id: "install_0123456789abcdef",
      plan_id: "sleep_focused",
      remaining_ms: 10000,
      session_id: "session_0123456789abcdef",
      started_at: "2026-05-20T01:00:00.000Z",
      status: "draft",
      technique_id: "4-7-8-sleep",
      updated_at: "2026-05-20T01:03:50.000Z",
    });

    await expect(
      loadRecoverableFirstSessionDraft(database, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toEqual({
      completedBreathCycles: 12,
      currentPhaseName: "inhale",
      durationSeconds: 240,
      elapsedDurationMs: 230000,
      localInstallId: "install_0123456789abcdef",
      planId: "sleep_focused",
      remainingDurationMs: 10000,
      sessionId: "session_0123456789abcdef",
      startedAt: "2026-05-20T01:00:00.000Z",
      status: "draft",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-20T01:03:50.000Z",
    });
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE local_install_id = ?"),
      ["install_0123456789abcdef"],
    );
  });

  it("records an abandoned partial session without incrementing completed-session counts", async () => {
    const database = createMockDatabase();

    await abandonFirstSessionLocally(database, {
      abandonedAt: "2026-05-20T01:00:35.000Z",
      completedBreathCycles: 1,
      currentPhaseName: "exhale",
      durationSeconds: 240,
      elapsedDurationMs: 35000,
      localInstallId: "install_0123456789abcdef",
      planId: "sleep_focused",
      remainingDurationMs: 205000,
      sessionId: "session_0123456789abcdef",
      startedAt: "2026-05-20T01:00:00.000Z",
      status: "abandoned",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-20T01:00:35.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.not.stringContaining("completed_session_count"),
      expect.any(Array),
    );
  });
});
