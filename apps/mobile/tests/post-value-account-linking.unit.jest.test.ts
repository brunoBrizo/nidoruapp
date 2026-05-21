import { describe, expect, it, jest } from "@jest/globals";

import {
  linkPostValueAccount,
  loadPostRewardPaywallEligibility,
  restorePostValuePurchase,
  type PostValueAccountDatabase,
} from "../src/paywall/post-value-account-linking";

const eligibleRow = {
  completed_at: "2026-05-20T01:04:00.000Z",
  completed_breath_cycles: 18,
  completion_persisted_at: "2026-05-20T01:04:01.000Z",
  duration_seconds: 240,
  feeling: "better",
  local_install_id: "install_0123456789abcdef",
  reflected_at: "2026-05-20T01:05:00.000Z",
  reflection_id: "reflection_0123456789abcdef",
  session_id: "session_0123456789abcdef",
  started_at: "2026-05-20T01:00:00.000Z",
  status: "completed",
  technique_id: "coherent-breathing",
};

function createMockDatabase(rows: readonly (Record<string, unknown> | null)[] = []) {
  const queuedRows = [...rows];
  const database: PostValueAccountDatabase & {
    readonly getFirstAsync: jest.MockedFunction<PostValueAccountDatabase["getFirstAsync"]>;
    readonly runAsync: jest.MockedFunction<PostValueAccountDatabase["runAsync"]>;
  } = {
    getFirstAsync: jest
      .fn<PostValueAccountDatabase["getFirstAsync"]>()
      .mockImplementation(() => Promise.resolve((queuedRows.shift() ?? null) as never)),
    runAsync: jest.fn<PostValueAccountDatabase["runAsync"]>().mockResolvedValue(undefined),
  };

  return database;
}

describe("post-value account linking and paywall eligibility", () => {
  it("denies account and paywall access before the reward moment", async () => {
    const database = createMockDatabase([
      {
        ...eligibleRow,
        feeling: null,
        reflected_at: null,
        reflection_id: null,
      },
    ]);

    await expect(
      loadPostRewardPaywallEligibility(database, {
        entitlementState: "not_entitled",
        localInstallId: "install_0123456789abcdef",
        paywallExperiment: "show_paywall",
      }),
    ).resolves.toMatchObject({
      canContinueFree: true,
      canLinkAccount: false,
      canShowPaywall: false,
      reason: "reward_required",
      status: "blocked",
    });
    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("post_session_reflections"),
      ["install_0123456789abcdef"],
    );
  });

  it("allows account linking and paywall display only after reflection reward eligibility", async () => {
    const database = createMockDatabase([eligibleRow]);

    await expect(
      loadPostRewardPaywallEligibility(database, {
        entitlementState: "not_entitled",
        localInstallId: "install_0123456789abcdef",
        paywallExperiment: "show_paywall",
      }),
    ).resolves.toEqual({
      canContinueFree: true,
      canLinkAccount: true,
      canShowPaywall: true,
      proof: {
        breathCount: 18,
        durationLabel: "4 min",
        sessionId: "session_0123456789abcdef",
        streakCount: 1,
      },
      reason: "eligible",
      reward: {
        feeling: "better",
        reflectedAt: "2026-05-20T01:05:00.000Z",
      },
      status: "eligible",
    });
  });

  it("keeps the paywall hidden for entitled users and free-only experiments", async () => {
    await expect(
      loadPostRewardPaywallEligibility(createMockDatabase([eligibleRow]), {
        entitlementState: "premium",
        localInstallId: "install_0123456789abcdef",
        paywallExperiment: "show_paywall",
      }),
    ).resolves.toMatchObject({
      canContinueFree: true,
      canLinkAccount: true,
      canShowPaywall: false,
      reason: "already_entitled",
    });

    await expect(
      loadPostRewardPaywallEligibility(createMockDatabase([eligibleRow]), {
        entitlementState: "not_entitled",
        localInstallId: "install_0123456789abcdef",
        paywallExperiment: "free_only",
      }),
    ).resolves.toMatchObject({
      canContinueFree: true,
      canLinkAccount: true,
      canShowPaywall: false,
      reason: "free_only_experiment",
    });
  });

  it("does not start auth/linking before reward eligibility", async () => {
    const database = createMockDatabase([null]);
    const authenticate = jest.fn();

    await expect(
      linkPostValueAccount(database, {
        authenticate,
        localInstallId: "install_0123456789abcdef",
        now: new Date("2026-05-20T01:06:00.000Z"),
        provider: "apple",
        syncLocalRecords: jest.fn(),
      }),
    ).resolves.toMatchObject({
      reason: "first_session_required",
      status: "blocked",
    });
    expect(authenticate).not.toHaveBeenCalled();
    expect(database.runAsync).not.toHaveBeenCalled();
  });

  it("preserves the local first session and queues retry state when auth fails", async () => {
    const database = createMockDatabase([eligibleRow]);

    await expect(
      linkPostValueAccount(database, {
        authenticate: async () => {
          throw new Error("network unavailable");
        },
        localInstallId: "install_0123456789abcdef",
        now: new Date("2026-05-20T01:06:00.000Z"),
        provider: "google",
        syncLocalRecords: jest.fn(),
      }),
    ).resolves.toEqual({
      provider: "google",
      retryQueued: true,
      status: "auth_failed",
    });
    expect(database.runAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO local_account_link_attempts"),
      [
        "install_0123456789abcdef",
        null,
        "google",
        "auth_failed",
        "retry_pending",
        "2026-05-20T01:06:00.000Z",
        "2026-05-20T01:06:00.000Z",
      ],
    );
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM first_session_records"),
      expect.anything(),
    );
  });

  it("syncs authorized records before mapping the server user id onto local records", async () => {
    const database = createMockDatabase([eligibleRow]);
    const syncLocalRecords = jest.fn(() => Promise.resolve());

    await expect(
      linkPostValueAccount(database, {
        authenticate: jest.fn(() =>
          Promise.resolve({
            userId: "11111111-1111-4111-8111-111111111111",
          }),
        ),
        localInstallId: "install_0123456789abcdef",
        now: new Date("2026-05-20T01:06:00.000Z"),
        provider: "apple",
        syncLocalRecords,
      }),
    ).resolves.toEqual({
      provider: "apple",
      status: "linked",
      userId: "11111111-1111-4111-8111-111111111111",
    });
    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO local_account_links"),
      [
        "install_0123456789abcdef",
        "11111111-1111-4111-8111-111111111111",
        "apple",
        "2026-05-20T01:06:00.000Z",
        "pending",
        null,
        "2026-05-20T01:06:00.000Z",
        "2026-05-20T01:06:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE onboarding_responses"),
      ["11111111-1111-4111-8111-111111111111", "install_0123456789abcdef"],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("UPDATE first_session_records"),
      ["11111111-1111-4111-8111-111111111111", "install_0123456789abcdef"],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("UPDATE post_session_reflections"),
      ["11111111-1111-4111-8111-111111111111", "install_0123456789abcdef"],
    );
    expect(syncLocalRecords).toHaveBeenCalledWith({
      localInstallId: "install_0123456789abcdef",
      userId: "11111111-1111-4111-8111-111111111111",
    });
    expect(syncLocalRecords.mock.invocationCallOrder[0]).toBeLessThan(
      database.runAsync.mock.invocationCallOrder[1],
    );
  });

  it("leaves local records unmapped and marks sync retry pending when post-auth sync fails", async () => {
    const database = createMockDatabase([eligibleRow]);

    await expect(
      linkPostValueAccount(database, {
        authenticate: async () => ({
          userId: "11111111-1111-4111-8111-111111111111",
        }),
        localInstallId: "install_0123456789abcdef",
        now: new Date("2026-05-20T01:06:00.000Z"),
        provider: "apple",
        syncLocalRecords: async () => {
          throw new Error("sync down");
        },
      }),
    ).resolves.toEqual({
      provider: "apple",
      retryQueued: true,
      status: "sync_retry_pending",
      userId: "11111111-1111-4111-8111-111111111111",
    });
    expect(database.runAsync).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO local_account_link_attempts"),
      [
        "install_0123456789abcdef",
        "11111111-1111-4111-8111-111111111111",
        "apple",
        "sync_failed",
        "retry_pending",
        "2026-05-20T01:06:00.000Z",
        "2026-05-20T01:06:00.000Z",
      ],
    );
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("UPDATE onboarding_responses"),
      expect.anything(),
    );
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("UPDATE first_session_records"),
      expect.anything(),
    );
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("UPDATE post_session_reflections"),
      expect.anything(),
    );
  });

  it("keeps restore purchase behind post-reward eligibility", async () => {
    const restorePurchases = jest.fn(() => Promise.resolve({ restored: true }));

    await expect(
      restorePostValuePurchase(createMockDatabase([null]), {
        localInstallId: "install_0123456789abcdef",
        restorePurchases,
      }),
    ).resolves.toEqual({
      reason: "first_session_required",
      status: "blocked",
    });
    expect(restorePurchases).not.toHaveBeenCalled();

    await expect(
      restorePostValuePurchase(createMockDatabase([eligibleRow]), {
        localInstallId: "install_0123456789abcdef",
        restorePurchases,
      }),
    ).resolves.toEqual({ restored: true, status: "restored" });
  });
});
