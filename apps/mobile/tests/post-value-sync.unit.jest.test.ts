import { describe, expect, it, jest } from "@jest/globals";

import { syncPostValueLocalRecords } from "../src/sync/post-value-sync";

const userId = "123e4567-e89b-12d3-a456-426614174000";
const localInstallId = "install_0123456789abcdef";

type SyncDatabase = Parameters<typeof syncPostValueLocalRecords>[0]["database"];
type SyncClient = Parameters<typeof syncPostValueLocalRecords>[0]["client"];
type SyncRow = Record<string, unknown>;

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

      if (source.includes("FROM breath_session_records")) {
        return Promise.resolve([
          {
            audio_cue_mode_id: "gentle-bell",
            completed_at: "2026-05-20T01:04:30.000Z",
            completed_breath_cycles: 18,
            completion_persisted_at: "2026-05-20T01:04:31.000Z",
            current_phase: "exhale",
            duration_seconds: 240,
            elapsed_ms: 240000,
            local_install_id: localInstallId,
            plan_id: "sleep_focused",
            remaining_ms: 0,
            session_id: "session_generic012345",
            source: "breathe_tab",
            started_at: "2026-05-20T01:00:30.000Z",
            technique_id: "coherent-breathing",
            updated_at: "2026-05-20T01:04:31.000Z",
          },
        ] as never);
      }

      if (source.includes("FROM wind_down_runs")) {
        return Promise.resolve([] as never);
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

function createCompletedRescueMeSyncRow() {
  return {
    audio_cue_mode_id: "gentle-bell",
    completed_at: "2026-05-23T05:03:29.000Z",
    completed_breath_cycles: 5,
    completion_persisted_at: "2026-05-23T05:03:30.000Z",
    current_phase: "exhale",
    duration_seconds: 209,
    elapsed_ms: 209000,
    local_install_id: localInstallId,
    plan_id: null,
    remaining_ms: 0,
    session_id: "session_rescueme0123456789",
    source: "rescue_me",
    started_at: "2026-05-23T05:00:00.000Z",
    technique_id: "4-7-8-sleep",
    updated_at: "2026-05-23T05:03:30.000Z",
  };
}

function createCompletedWindDownSyncRow(overrides: SyncRow = {}) {
  return {
    ambient_completed_at: "2026-05-27T02:20:00.000Z",
    ambient_sound_id: "light-rain",
    ambient_started_at: "2026-05-27T02:10:00.000Z",
    body_cue_completed_at: "2026-05-27T02:10:00.000Z",
    body_cue_started_at: "2026-05-27T02:08:00.000Z",
    breath_session_id: "session_winddown0123456789",
    breathwork_completed_at: "2026-05-27T02:08:00.000Z",
    breathwork_started_at: "2026-05-27T02:00:00.000Z",
    completed_at: "2026-05-27T02:20:00.000Z",
    context_goal: "calm_racing_thoughts",
    local_install_id: localInstallId,
    recovery_state: "completion",
    routine_id: "wind_down_racing_thoughts",
    run_id: "winddown_0123456789abcdef",
    started_at: "2026-05-27T02:00:00.000Z",
    status: "completed",
    stop_reason: null,
    stopped_at: null,
    total_duration_seconds: 1200,
    updated_at: "2026-05-27T02:20:00.000Z",
    ...overrides,
  };
}

function createStoppedWindDownSyncRow(overrides: SyncRow = {}) {
  return createCompletedWindDownSyncRow({
    ambient_completed_at: null,
    completed_at: null,
    recovery_state: "partial_stop",
    run_id: "winddown_stopped0123456789",
    status: "stopped",
    stop_reason: "user_stop",
    stopped_at: "2026-05-27T02:14:00.000Z",
    total_duration_seconds: 840,
    updated_at: "2026-05-27T02:14:00.000Z",
    ...overrides,
  });
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
    expect(client.upserts.breath_sessions).toHaveBeenCalledWith(
      [
        {
          audio_cue_mode_id: "gentle-bell",
          completed_at: "2026-05-20T01:04:30.000Z",
          completed_breath_cycles: 18,
          completion_persisted_at: "2026-05-20T01:04:31.000Z",
          duration_seconds: 240,
          local_install_id: localInstallId,
          local_session_id: "session_generic012345",
          source: "breathe_tab",
          started_at: "2026-05-20T01:00:30.000Z",
          technique_id: "coherent-breathing",
          updated_at: "2026-05-20T01:07:00.000Z",
          user_id: userId,
        },
      ],
      { onConflict: "user_id,local_session_id" },
    );
    expect(JSON.stringify(client.upserts.breath_sessions.mock.calls)).not.toMatch(
      /current_phase|elapsed_ms|payload_json|plan_id|raw_reflection/,
    );
  });

  it("redacts health-adjacent plan taxonomy from generic breath-session sync payloads", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM breath_session_records")) {
        return Promise.resolve([
          {
            audio_cue_mode_id: "none",
            completed_at: "2026-05-20T01:04:30.000Z",
            completed_breath_cycles: 15,
            completion_persisted_at: "2026-05-20T01:04:31.000Z",
            current_phase: "exhale",
            duration_seconds: 240,
            elapsed_ms: 240000,
            local_install_id: localInstallId,
            plan_id: "anxiety_relief",
            remaining_ms: 0,
            session_id: "session_generic012345",
            source: "breathe_tab",
            started_at: "2026-05-20T01:00:30.000Z",
            technique_id: "box-breathing",
            updated_at: "2026-05-20T01:04:31.000Z",
          },
        ] as never);
      }

      return Promise.resolve([] as never);
    });
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

    expect(JSON.stringify(client.upserts.breath_sessions.mock.calls)).not.toMatch(
      /anxiety_relief|plan_id/,
    );
  });

  it("syncs completed Rescue Me records later without sensitive runtime fields", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM breath_session_records")) {
        return Promise.resolve([createCompletedRescueMeSyncRow()] as never);
      }

      return Promise.resolve([] as never);
    });
    const client = createClient();

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        now: new Date("2026-05-23T05:04:00.000Z"),
        userId,
      }),
    ).resolves.toEqual({ status: "succeeded" });

    expect(client.upserts.breath_sessions).toHaveBeenCalledWith(
      [
        {
          audio_cue_mode_id: "gentle-bell",
          completed_at: "2026-05-23T05:03:29.000Z",
          completed_breath_cycles: 5,
          completion_persisted_at: "2026-05-23T05:03:30.000Z",
          duration_seconds: 209,
          local_install_id: localInstallId,
          local_session_id: "session_rescueme0123456789",
          source: "rescue_me",
          started_at: "2026-05-23T05:00:00.000Z",
          technique_id: "4-7-8-sleep",
          updated_at: "2026-05-23T05:04:00.000Z",
          user_id: userId,
        },
      ],
      { onConflict: "user_id,local_session_id" },
    );
    expect(JSON.stringify(client.upserts.breath_sessions.mock.calls)).not.toMatch(
      /current_phase|elapsed_ms|payload_json|raw_reflection/,
    );
  });

  it("syncs terminal Wind-Down runs with idempotent conflicts and structured insight fields", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM wind_down_runs")) {
        return Promise.resolve([
          createCompletedWindDownSyncRow(),
          createStoppedWindDownSyncRow(),
        ] as never);
      }

      return Promise.resolve([] as never);
    });
    const client = createClient();

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        now: new Date("2026-05-27T02:21:00.000Z"),
        userId,
      }),
    ).resolves.toEqual({ status: "succeeded" });

    expect(client.upserts.wind_down_runs).toHaveBeenCalledWith(
      [
        {
          ambient_sound_id: "light-rain",
          completed_at: "2026-05-27T02:20:00.000Z",
          completion_state: "completed",
          context_goal: "calm_racing_thoughts",
          local_breath_session_id: "session_winddown0123456789",
          local_install_id: localInstallId,
          local_run_id: "winddown_0123456789abcdef",
          routine_id: "wind_down_racing_thoughts",
          started_at: "2026-05-27T02:00:00.000Z",
          stop_reason: null,
          stopped_at: null,
          total_duration_seconds: 1200,
          updated_at: "2026-05-27T02:21:00.000Z",
          user_id: userId,
        },
        {
          ambient_sound_id: "light-rain",
          completed_at: null,
          completion_state: "stopped",
          context_goal: "calm_racing_thoughts",
          local_breath_session_id: "session_winddown0123456789",
          local_install_id: localInstallId,
          local_run_id: "winddown_stopped0123456789",
          routine_id: "wind_down_racing_thoughts",
          started_at: "2026-05-27T02:00:00.000Z",
          stop_reason: "user_stop",
          stopped_at: "2026-05-27T02:14:00.000Z",
          total_duration_seconds: 840,
          updated_at: "2026-05-27T02:21:00.000Z",
          user_id: userId,
        },
      ],
      { onConflict: "user_id,local_run_id" },
    );
    expect(JSON.stringify(client.upserts.wind_down_runs.mock.calls)).not.toMatch(
      /recovery_state|body_cue|raw|display_name|device_id|local_install_id_install_/i,
    );
  });

  it("rejects invalid completed breath-session rows before any network upsert", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM breath_session_records")) {
        return Promise.resolve([
          {
            audio_cue_mode_id: "none",
            completed_at: "2026-05-20T01:04:30.000Z",
            completed_breath_cycles: 18,
            completion_persisted_at: "2026-05-20T01:04:31.000Z",
            current_phase: "exhale",
            duration_seconds: 240,
            elapsed_ms: 240000,
            local_install_id: localInstallId,
            plan_id: null,
            remaining_ms: 0,
            session_id: "session_generic012345",
            source: "breathe_tab",
            started_at: "2026-05-20T01:00:30.000Z",
            technique_id: "unknown-technique",
            updated_at: "2026-05-20T01:04:31.000Z",
          },
        ] as never);
      }

      return Promise.resolve([] as never);
    });
    const client = createClient();
    const observeFailure = jest.fn();

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        observeFailure,
        userId,
      }),
    ).resolves.toEqual({ reason: "validation_error", status: "retry_pending" });

    expect(client.from).not.toHaveBeenCalled();
    expect(observeFailure).toHaveBeenCalledWith({
      attemptCount: 1,
      reasonClass: "validation_error",
      recordType: "breath_session",
      syncStage: "post_value_sync",
    });
  });

  it("rejects invalid terminal Wind-Down rows before any network upsert", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM wind_down_runs")) {
        return Promise.resolve([
          createCompletedWindDownSyncRow({
            context_goal: "panic_treatment",
          }),
        ] as never);
      }

      return Promise.resolve([] as never);
    });
    const client = createClient();
    const observeFailure = jest.fn();

    await expect(
      syncPostValueLocalRecords({
        client,
        database,
        localInstallId,
        observeFailure,
        userId,
      }),
    ).resolves.toEqual({ reason: "validation_error", status: "retry_pending" });

    expect(client.from).not.toHaveBeenCalled();
    expect(observeFailure).toHaveBeenCalledWith({
      attemptCount: 1,
      reasonClass: "validation_error",
      recordType: "wind_down_run",
      syncStage: "post_value_sync",
    });
  });

  it("classifies later Rescue Me sync failures as retryable without deleting local rows", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM breath_session_records")) {
        return Promise.resolve([createCompletedRescueMeSyncRow()] as never);
      }

      return Promise.resolve([] as never);
    });
    const client = createClient();
    client.from.mockImplementation((tableName) => ({
      upsert: jest.fn(() => {
        if (tableName === "breath_sessions") {
          return Promise.reject(new TypeError("Network request failed"));
        }

        return Promise.resolve({ error: null });
      }),
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
      recordType: "breath_session",
      syncStage: "post_value_sync",
    });
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringMatching(/DELETE FROM breath_session_records|UPDATE breath_session_records/),
      expect.anything(),
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

  it("classifies Wind-Down sync failures without deleting local history", async () => {
    const database = createDatabase();
    database.getAllAsync.mockImplementation((source) => {
      if (source.includes("FROM wind_down_runs")) {
        return Promise.resolve([createCompletedWindDownSyncRow()] as never);
      }

      return Promise.resolve([] as never);
    });
    const client = createClient();
    client.from.mockImplementation((tableName) => ({
      upsert: jest.fn(() => {
        if (tableName === "wind_down_runs") {
          return Promise.reject(new TypeError("Network request failed"));
        }

        return Promise.resolve({ error: null });
      }),
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
      recordType: "wind_down_run",
      syncStage: "post_value_sync",
    });
    expect(database.runAsync).not.toHaveBeenCalledWith(
      expect.stringMatching(/DELETE FROM wind_down_runs|UPDATE wind_down_runs/),
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
