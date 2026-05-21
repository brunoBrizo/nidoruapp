import { localInstallIdSchema } from "@nidoru/validation";

export type PostValueAccountDatabase = {
  getFirstAsync<Row>(
    source: string,
    params?: readonly (string | number | null)[],
  ): Promise<Row | null>;
  runAsync(source: string, params?: readonly (string | number | null)[]): Promise<unknown>;
};

export type PostValueAuthProvider = "anonymous" | "apple" | "google";
export type PostValuePlanId = "annual" | "monthly";
export type PostValueEntitlementState = "not_entitled" | "premium" | "unknown";
export type PostValuePaywallExperiment = "show_paywall" | "free_only";

export type PostRewardBlockedReason = "first_session_required" | "reward_required";
export type PostRewardEligibleReason =
  | "eligible"
  | "already_entitled"
  | "entitlement_unknown"
  | "free_only_experiment";

export type PostRewardSessionProof = {
  readonly breathCount: number;
  readonly durationLabel: string;
  readonly sessionId: string;
  readonly streakCount: number;
};

export type PostRewardPaywallEligibility =
  | {
      readonly canContinueFree: true;
      readonly canLinkAccount: false;
      readonly canShowPaywall: false;
      readonly reason: PostRewardBlockedReason;
      readonly status: "blocked";
    }
  | {
      readonly canContinueFree: true;
      readonly canLinkAccount: true;
      readonly canShowPaywall: boolean;
      readonly proof: PostRewardSessionProof;
      readonly reason: PostRewardEligibleReason;
      readonly reward: {
        readonly feeling: "same" | "better" | "much_better";
        readonly reflectedAt: string;
      };
      readonly status: "eligible";
    };

export type LoadPostRewardPaywallEligibilityInput = {
  readonly entitlementState?: PostValueEntitlementState;
  readonly localInstallId: string;
  readonly paywallExperiment?: PostValuePaywallExperiment;
};

export type PostValueAuthenticate = (input: {
  readonly provider: PostValueAuthProvider;
}) => Promise<{ readonly userId: string }>;

export type LinkPostValueAccountInput = {
  readonly authenticate: PostValueAuthenticate;
  readonly entitlementState?: PostValueEntitlementState;
  readonly localInstallId: string;
  readonly now?: Date;
  readonly paywallExperiment?: PostValuePaywallExperiment;
  readonly provider: PostValueAuthProvider;
  readonly syncLocalRecords: (input: {
    readonly localInstallId: string;
    readonly userId: string;
  }) => Promise<void>;
};

export type LinkPostValueAccountResult =
  | {
      readonly provider: PostValueAuthProvider;
      readonly reason: PostRewardBlockedReason;
      readonly status: "blocked";
    }
  | {
      readonly provider: PostValueAuthProvider;
      readonly retryQueued: true;
      readonly status: "auth_failed";
    }
  | {
      readonly provider: PostValueAuthProvider;
      readonly status: "linked";
      readonly userId: string;
    }
  | {
      readonly provider: PostValueAuthProvider;
      readonly retryQueued: true;
      readonly status: "sync_retry_pending";
      readonly userId: string;
    };

export type RestorePostValuePurchaseInput<RestoreResult> = {
  readonly entitlementState?: PostValueEntitlementState;
  readonly localInstallId: string;
  readonly paywallExperiment?: PostValuePaywallExperiment;
  readonly restorePurchases: () => Promise<RestoreResult>;
};

type PostRewardEligibilityRow = {
  readonly completed_breath_cycles: number | null;
  readonly duration_seconds: number;
  readonly feeling: string | null;
  readonly local_install_id: string;
  readonly reflected_at: string | null;
  readonly reflection_id: string | null;
  readonly session_id: string;
};

const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function loadPostRewardPaywallEligibility(
  database: PostValueAccountDatabase,
  {
    entitlementState = "not_entitled",
    localInstallId,
    paywallExperiment = "show_paywall",
  }: LoadPostRewardPaywallEligibilityInput,
): Promise<PostRewardPaywallEligibility> {
  const parsedLocalInstallId = localInstallIdSchema.parse(localInstallId);
  const row = await database.getFirstAsync<PostRewardEligibilityRow>(
    `
      SELECT
        first_session_records.session_id,
        first_session_records.local_install_id,
        first_session_records.duration_seconds,
        first_session_records.completed_breath_cycles,
        post_session_reflections.reflection_id,
        post_session_reflections.reflected_at,
        post_session_reflections.feeling
      FROM first_session_records
      LEFT JOIN post_session_reflections
        ON post_session_reflections.session_id = first_session_records.session_id
       AND post_session_reflections.local_install_id = first_session_records.local_install_id
      WHERE first_session_records.local_install_id = ?
        AND first_session_records.status = 'completed'
        AND first_session_records.completed_at IS NOT NULL
        AND first_session_records.completion_persisted_at IS NOT NULL
      ORDER BY first_session_records.completed_at DESC
      LIMIT 1;
    `,
    [parsedLocalInstallId],
  );

  if (!row) {
    return createBlockedEligibility("first_session_required");
  }

  if (!row.reflection_id || !row.reflected_at || !isPostSessionFeeling(row.feeling)) {
    return createBlockedEligibility("reward_required");
  }

  const reason = getEligibleReason(entitlementState, paywallExperiment);

  return {
    canContinueFree: true,
    canLinkAccount: true,
    canShowPaywall: reason === "eligible",
    proof: {
      breathCount: row.completed_breath_cycles ?? 0,
      durationLabel: formatDurationLabel(row.duration_seconds),
      sessionId: row.session_id,
      streakCount: 1,
    },
    reason,
    reward: {
      feeling: row.feeling,
      reflectedAt: row.reflected_at,
    },
    status: "eligible",
  };
}

export async function linkPostValueAccount(
  database: PostValueAccountDatabase,
  input: LinkPostValueAccountInput,
): Promise<LinkPostValueAccountResult> {
  const eligibility = await loadPostRewardPaywallEligibility(database, input);

  if (eligibility.status === "blocked") {
    return {
      provider: input.provider,
      reason: eligibility.reason,
      status: "blocked",
    };
  }

  const localInstallId = localInstallIdSchema.parse(input.localInstallId);
  const nowIso = (input.now ?? new Date()).toISOString();

  let userId: string;
  try {
    userId = parseUserId((await input.authenticate({ provider: input.provider })).userId);
  } catch {
    await recordAccountLinkAttempt(database, {
      localInstallId,
      provider: input.provider,
      stage: "auth_failed",
      status: "retry_pending",
      userId: null,
      nowIso,
    });

    return {
      provider: input.provider,
      retryQueued: true,
      status: "auth_failed",
    };
  }

  await persistLocalAccountLink(database, {
    localInstallId,
    provider: input.provider,
    syncStatus: "pending",
    userId,
    nowIso,
  });
  await mapLocalRecordsToUser(database, { localInstallId, userId });

  try {
    await input.syncLocalRecords({ localInstallId, userId });
  } catch {
    await updateLocalAccountLinkSyncStatus(database, {
      localInstallId,
      nowIso,
      syncStatus: "retry_pending",
    });

    return {
      provider: input.provider,
      retryQueued: true,
      status: "sync_retry_pending",
      userId,
    };
  }

  await updateLocalAccountLinkSyncStatus(database, {
    localInstallId,
    nowIso,
    syncStatus: "succeeded",
  });

  return {
    provider: input.provider,
    status: "linked",
    userId,
  };
}

export async function restorePostValuePurchase<RestoreResult>(
  database: PostValueAccountDatabase,
  input: RestorePostValuePurchaseInput<RestoreResult>,
): Promise<
  | { readonly reason: PostRewardBlockedReason; readonly status: "blocked" }
  | (RestoreResult & { readonly status: "restored" })
> {
  const eligibility = await loadPostRewardPaywallEligibility(database, input);

  if (eligibility.status === "blocked") {
    return {
      reason: eligibility.reason,
      status: "blocked",
    };
  }

  return {
    ...(await input.restorePurchases()),
    status: "restored",
  };
}

function createBlockedEligibility(reason: PostRewardBlockedReason): PostRewardPaywallEligibility {
  return {
    canContinueFree: true,
    canLinkAccount: false,
    canShowPaywall: false,
    reason,
    status: "blocked",
  };
}

function getEligibleReason(
  entitlementState: PostValueEntitlementState,
  paywallExperiment: PostValuePaywallExperiment,
): PostRewardEligibleReason {
  if (entitlementState === "premium") {
    return "already_entitled";
  }

  if (entitlementState === "unknown") {
    return "entitlement_unknown";
  }

  if (paywallExperiment === "free_only") {
    return "free_only_experiment";
  }

  return "eligible";
}

function isPostSessionFeeling(value: string | null): value is "same" | "better" | "much_better" {
  return value === "same" || value === "better" || value === "much_better";
}

function formatDurationLabel(durationSeconds: number): string {
  const roundedMinutes = Math.max(1, Math.round(durationSeconds / 60));

  return `${roundedMinutes} min`;
}

function parseUserId(userId: string): string {
  if (!userIdPattern.test(userId)) {
    throw new Error("Invalid Supabase user id.");
  }

  return userId;
}

async function persistLocalAccountLink(
  database: PostValueAccountDatabase,
  input: {
    readonly localInstallId: string;
    readonly nowIso: string;
    readonly provider: PostValueAuthProvider;
    readonly syncStatus: "pending" | "succeeded" | "retry_pending";
    readonly userId: string;
  },
): Promise<void> {
  await database.runAsync(
    `
      INSERT INTO local_account_links (
        local_install_id,
        user_id,
        provider,
        linked_at,
        sync_status,
        last_sync_attempt_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(local_install_id) DO UPDATE SET
        user_id = excluded.user_id,
        provider = excluded.provider,
        linked_at = excluded.linked_at,
        sync_status = excluded.sync_status,
        last_sync_attempt_at = excluded.last_sync_attempt_at,
        updated_at = excluded.updated_at;
    `,
    [
      input.localInstallId,
      input.userId,
      input.provider,
      input.nowIso,
      input.syncStatus,
      null,
      input.nowIso,
      input.nowIso,
    ],
  );
}

async function mapLocalRecordsToUser(
  database: PostValueAccountDatabase,
  input: { readonly localInstallId: string; readonly userId: string },
): Promise<void> {
  await database.runAsync(
    `
      UPDATE onboarding_responses
      SET user_id = ?
      WHERE local_install_id = ?;
    `,
    [input.userId, input.localInstallId],
  );
  await database.runAsync(
    `
      UPDATE first_session_records
      SET user_id = ?
      WHERE local_install_id = ?;
    `,
    [input.userId, input.localInstallId],
  );
  await database.runAsync(
    `
      UPDATE post_session_reflections
      SET user_id = ?
      WHERE local_install_id = ?;
    `,
    [input.userId, input.localInstallId],
  );
}

async function updateLocalAccountLinkSyncStatus(
  database: PostValueAccountDatabase,
  input: {
    readonly localInstallId: string;
    readonly nowIso: string;
    readonly syncStatus: "succeeded" | "retry_pending";
  },
): Promise<void> {
  await database.runAsync(
    `
      UPDATE local_account_links
      SET sync_status = ?,
          last_sync_attempt_at = ?,
          updated_at = ?
      WHERE local_install_id = ?;
    `,
    [input.syncStatus, input.nowIso, input.nowIso, input.localInstallId],
  );
}

async function recordAccountLinkAttempt(
  database: PostValueAccountDatabase,
  input: {
    readonly localInstallId: string;
    readonly nowIso: string;
    readonly provider: PostValueAuthProvider;
    readonly stage: "auth_failed" | "sync_failed";
    readonly status: "retry_pending" | "resolved";
    readonly userId: string | null;
  },
): Promise<void> {
  await database.runAsync(
    `
      INSERT INTO local_account_link_attempts (
        local_install_id,
        user_id,
        provider,
        stage,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [
      input.localInstallId,
      input.userId,
      input.provider,
      input.stage,
      input.status,
      input.nowIso,
      input.nowIso,
    ],
  );
}
