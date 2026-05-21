import { describe, expect, it, jest } from "@jest/globals";

import { syncPostValueLocalRecords } from "../src/sync/post-value-sync";

const userId = "123e4567-e89b-12d3-a456-426614174000";
const localInstallId = "install_0123456789abcdef";

type SyncDatabase = Parameters<typeof syncPostValueLocalRecords>[0]["database"];
type SyncClient = Parameters<typeof syncPostValueLocalRecords>[0]["client"];

function createDatabase(): SyncDatabase & {
  readonly getAllAsync: jest.MockedFunction<SyncDatabase["getAllAsync"]>;
  readonly getFirstAsync: jest.MockedFunction<SyncDatabase["getFirstAsync"]>;
  readonly runAsync: jest.MockedFunction<SyncDatabase["runAsync"]>;
} {
  return {
    getAllAsync: jest.fn<SyncDatabase["getAllAsync"]>().mockImplementation((source) => {
      if (source.includes("FROM first_session_records")) {
        return Promise.resolve([
          {
            completed_at: "2026-05-20T01:04:00.000Z",
            completed_breath_cycles: 20,
            duration_seconds: 240,
            local_install_id: localInstallId,
            session_id: "session_0123456789abcdef",
            technique_id: "4-7-8-sleep",
          },
        ] as never);
      }

      if (source.includes("FROM post_session_reflections")) {
        return Promise.resolve([
          {
            feeling: "better",
            local_install_id: localInstallId,
            reflected_at: "2026-05-20T01:05:00.000Z",
            reflection_id: "reflection_0123456789abcdef",
            session_id: "session_0123456789abcdef",
          },
        ] as never);
      }

      return Promise.resolve([] as never);
    }),
    getFirstAsync: jest.fn<SyncDatabase["getFirstAsync"]>().mockResolvedValue({
      linked_at: "2026-05-20T01:06:00.000Z",
      provider: "anonymous",
    } as never),
    runAsync: jest.fn<SyncDatabase["runAsync"]>().mockResolvedValue(undefined),
  };
}

function createClient(upsertResult: unknown = { error: null }): SyncClient & {
  readonly from: jest.MockedFunction<SyncClient["from"]>;
  readonly upserts: Record<string, jest.Mock>;
} {
  const upserts: Record<string, jest.Mock> = {};

  return {
    from: jest.fn<SyncClient["from"]>().mockImplementation((tableName) => {
      const upsert = jest.fn(() => Promise.resolve(upsertResult));
      upserts[tableName] = upsert;

      return { upsert };
    }),
    upserts,
  };
}

describe("post-value local record sync", () => {
  it("upserts linked install, first session, and reflection records with idempotent conflicts", async () => {
    const database = createDatabase();
    const client = createClient();

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        now: new Date("2026-05-20T01:07:00.000Z"),
        userId,
      }),
    ).resolves.toEqual({ status: "succeeded" });

    expect(client.upserts.local_install_links).toHaveBeenCalledWith(
      {
        auth_provider: "anonymous",
        last_sync_attempt_at: "2026-05-20T01:07:00.000Z",
        linked_at: "2026-05-20T01:06:00.000Z",
        local_install_id: localInstallId,
        sync_status: "succeeded",
        updated_at: "2026-05-20T01:07:00.000Z",
        user_id: userId,
      },
      { onConflict: "local_install_id" },
    );
    expect(client.upserts.first_session_sync_records).toHaveBeenCalledWith(
      [
        {
          completed_at: "2026-05-20T01:04:00.000Z",
          completed_breath_cycles: 20,
          duration_seconds: 240,
          local_install_id: localInstallId,
          local_session_id: "session_0123456789abcdef",
          technique_id: "4-7-8-sleep",
          updated_at: "2026-05-20T01:07:00.000Z",
          user_id: userId,
        },
      ],
      { onConflict: "user_id,local_session_id" },
    );
    expect(client.upserts.post_session_reflection_sync_records).toHaveBeenCalledWith(
      [
        {
          feeling: "better",
          local_install_id: localInstallId,
          local_reflection_id: "reflection_0123456789abcdef",
          local_session_id: "session_0123456789abcdef",
          reflected_at: "2026-05-20T01:05:00.000Z",
          updated_at: "2026-05-20T01:07:00.000Z",
          user_id: userId,
        },
      ],
      { onConflict: "user_id,local_reflection_id" },
    );
  });

  it("classifies offline failures into retry state without exposing raw payloads", async () => {
    const database = createDatabase();
    const client = createClient();
    client.from.mockImplementation(() => ({
      upsert: jest.fn(() => Promise.reject(new TypeError("Network request failed"))),
    }));
    const observeFailure = jest.fn();

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        observeFailure,
        userId,
      }),
    ).resolves.toEqual({ reason: "offline", status: "retry_pending" });

    expect(observeFailure).toHaveBeenCalledWith({
      attemptCount: 1,
      reasonClass: "offline",
      recordType: "local_install_link",
      syncStage: "post_value_sync",
    });
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM first_session_records"),
      expect.anything(),
    );
  });

  it.each([
    [{ code: "42501", message: "new row violates row-level security policy" }, "auth_denied"],
    [{ message: "Service unavailable", status: 503 }, "server_error"],
  ] as const)("classifies Supabase %s errors as %s retry state", async (error, reason) => {
    const database = createDatabase();
    const client = createClient({ error });

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        userId,
      }),
    ).resolves.toEqual({ reason, status: "retry_pending" });
  });
});
