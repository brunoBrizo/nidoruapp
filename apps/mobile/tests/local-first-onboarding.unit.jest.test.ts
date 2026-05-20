import { describe, expect, it, jest } from "@jest/globals";

import {
  completeOnboardingPersonalizationLocally,
  completeFirstSessionLocally,
  createLocalInstallId,
  getOrCreateLocalInstallIdentity,
  type LocalFirstOnboardingDatabase,
} from "../src/onboarding/local-first-onboarding";

function createMockDatabase(firstRow: { local_install_id: string } | null = null) {
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

describe("local-first onboarding persistence", () => {
  it("creates local install identity without invoking network, auth, or permissions", async () => {
    const database = createMockDatabase();
    const localInstallId = await getOrCreateLocalInstallIdentity({
      database,
      now: new Date("2026-05-18T02:00:00.000Z"),
      createId: () => "install_0123456789abcdef",
    });

    expect(localInstallId).toBe("install_0123456789abcdef");
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      "SELECT local_install_id FROM local_install_identity ORDER BY created_at LIMIT 1;",
    );
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO local_install_identity"),
      ["install_0123456789abcdef", "2026-05-18T02:00:00.000Z", "2026-05-18T02:00:00.000Z"],
    );
  });

  it("loads and validates an existing local install identity", async () => {
    const database = createMockDatabase({ local_install_id: "install_existing123" });
    const createId = jest.fn(() => "install_new12345678");

    await expect(
      getOrCreateLocalInstallIdentity({
        database,
        now: new Date("2026-05-18T02:00:00.000Z"),
        createId,
      }),
    ).resolves.toBe("install_existing123");
    expect(createId).not.toHaveBeenCalled();
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("builds install IDs in the allowlisted local format", () => {
    expect(createLocalInstallId(() => "ABC_123-xyz")).toBe("install_ABC_123-xyz");
  });

  it("persists first-session completion before post-value gates or sync can run", async () => {
    const database = createMockDatabase();

    await completeFirstSessionLocally(database, {
      localInstallId: "install_0123456789abcdef",
      sessionId: "session_0123456789abcdef",
      status: "completed",
      planId: "general_wellness",
      techniqueId: "coherent-breathing",
      startedAt: "2026-05-18T02:03:00.000Z",
      completedAt: "2026-05-18T02:07:00.000Z",
      durationSeconds: 240,
      completedBreathCycles: 24,
      completionPersistedAt: "2026-05-18T02:07:01.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO first_session_records"),
      [
        "session_0123456789abcdef",
        "install_0123456789abcdef",
        "completed",
        "general_wellness",
        "coherent-breathing",
        "2026-05-18T02:03:00.000Z",
        "2026-05-18T02:07:00.000Z",
        240,
        24,
        "2026-05-18T02:07:01.000Z",
      ],
    );
  });

  it("persists completed personalization answers with a typed local plan recommendation", async () => {
    const database = createMockDatabase();

    await expect(
      completeOnboardingPersonalizationLocally(database, {
        localInstallId: "install_0123456789abcdef",
        startedAt: "2026-05-20T01:00:00.000Z",
        completedAt: "2026-05-20T01:02:00.000Z",
        goal: "anxiety",
        sleepBaseline: 2,
        windDownMinutesAfterMidnight: 21 * 60 + 30,
        breathworkFamiliarity: "yes",
        displayName: " Bruno ",
      }),
    ).resolves.toMatchObject({
      breathworkFamiliarity: "yes",
      displayName: "Bruno",
      goal: "anxiety",
      recommendedPlanId: "anxiety_relief",
      recommendedTechniqueId: "box-breathing",
      sleepBaseline: 2,
      windDownMinutesAfterMidnight: 21 * 60 + 30,
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO onboarding_responses"),
      [
        "install_0123456789abcdef",
        "completed",
        "2026-05-20T01:00:00.000Z",
        "2026-05-20T01:02:00.000Z",
        "anxiety",
        2,
        21 * 60 + 30,
        "yes",
        "Bruno",
        "anxiety_relief",
        "box-breathing",
        240,
        "2026-05-20T01:02:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        expect.stringMatching(/^event_[A-Za-z0-9_-]{8,64}$/),
        "install_0123456789abcdef",
        "onboarding_completed",
        "onboarding_response",
        "install_0123456789abcdef",
        "{}",
        "2026-05-20T01:02:00.000Z",
        "2026-05-20T01:02:00.000Z",
      ],
    );
  });

  it("allows display-name skip but rejects unsafe display names before persistence", async () => {
    const database = createMockDatabase();

    await expect(
      completeOnboardingPersonalizationLocally(database, {
        localInstallId: "install_0123456789abcdef",
        startedAt: "2026-05-20T01:00:00.000Z",
        completedAt: "2026-05-20T01:02:00.000Z",
        goal: "curiosity",
        sleepBaseline: 4,
        windDownMinutesAfterMidnight: 22 * 60 + 30,
        breathworkFamiliarity: "new_to_me",
        displayName: "   ",
      }),
    ).resolves.toMatchObject({
      displayName: undefined,
      recommendedPlanId: "general_wellness",
      recommendedTechniqueId: "coherent-breathing",
    });

    expect(database.runAsync).toHaveBeenCalledTimes(2);

    await expect(
      completeOnboardingPersonalizationLocally(database, {
        localInstallId: "install_0123456789abcdef",
        startedAt: "2026-05-20T01:00:00.000Z",
        completedAt: "2026-05-20T01:02:00.000Z",
        goal: "curiosity",
        sleepBaseline: 4,
        windDownMinutesAfterMidnight: 22 * 60 + 30,
        breathworkFamiliarity: "new_to_me",
        displayName: "A".repeat(41),
      }),
    ).rejects.toThrow();

    expect(database.runAsync).toHaveBeenCalledTimes(2);
  });
});
