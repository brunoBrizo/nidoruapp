import { describe, expect, it, jest } from "@jest/globals";

import {
  completeWindDownRunLocally,
  loadRememberedWindDownContextChoiceLocally,
  loadLatestRecoverableWindDownRun,
  recordWindDownStartedLocally,
  saveRememberedWindDownContextChoiceLocally,
  saveWindDownStepProgressLocally,
  stopWindDownRunLocally,
  type WindDownLocalPersistenceDatabase,
} from "../src/wind-down/wind-down-local-persistence";

function createMockDatabase(firstRow: Record<string, unknown> | null = null) {
  const database: WindDownLocalPersistenceDatabase & {
    readonly runAsync: jest.MockedFunction<WindDownLocalPersistenceDatabase["runAsync"]>;
    readonly getFirstAsync: jest.MockedFunction<WindDownLocalPersistenceDatabase["getFirstAsync"]>;
  } = {
    runAsync: jest.fn<WindDownLocalPersistenceDatabase["runAsync"]>().mockResolvedValue(undefined),
    getFirstAsync: jest
      .fn<WindDownLocalPersistenceDatabase["getFirstAsync"]>()
      .mockResolvedValue(firstRow),
  };

  return database;
}

describe("wind-down local persistence", () => {
  it("persists a run start before queueing the started event", async () => {
    const database = createMockDatabase();

    await recordWindDownStartedLocally(database, {
      ambientSoundId: "light-rain",
      breathSessionId: "session_winddown123456",
      contextGoal: "fall_asleep_faster",
      eventId: "event_wind_down_started",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_sleep_starter",
      runId: "winddown_0123456789abcdef",
      startedAt: "2026-05-25T01:00:00.000Z",
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO wind_down_runs"),
      [
        "winddown_0123456789abcdef",
        "install_0123456789abcdef",
        "wind_down_sleep_starter",
        "fall_asleep_faster",
        "session_winddown123456",
        "light-rain",
        "started",
        null,
        "active_winddown",
        "2026-05-25T01:00:00.000Z",
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        "2026-05-25T01:00:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        "event_wind_down_started",
        "install_0123456789abcdef",
        "wind_down_started",
        "wind_down_run",
        "winddown_0123456789abcdef",
        "{}",
        "2026-05-25T01:00:00.000Z",
        "2026-05-25T01:00:00.000Z",
      ],
    );
  });

  it("saves remembered context choice and independent step recovery state", async () => {
    const database = createMockDatabase();

    await saveRememberedWindDownContextChoiceLocally(database, {
      contextGoal: "wake_up_fewer_times",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_daily_calm",
      selectedAt: "2026-05-25T01:00:00.000Z",
    });
    await saveWindDownStepProgressLocally(database, {
      ambientStartedAt: "2026-05-25T01:08:10.000Z",
      bodyCueCompletedAt: "2026-05-25T01:08:00.000Z",
      bodyCueStartedAt: "2026-05-25T01:06:00.000Z",
      breathSessionId: "session_winddown123456",
      breathworkCompletedAt: "2026-05-25T01:05:00.000Z",
      breathworkStartedAt: "2026-05-25T01:00:00.000Z",
      localInstallId: "install_0123456789abcdef",
      queuedEvent: {
        eventId: "event_audio_started",
        eventName: "audio_started",
        occurredAt: "2026-05-25T01:08:10.000Z",
      },
      recoveryState: "dimmed_idle",
      runId: "winddown_0123456789abcdef",
      status: "ambient_playing",
      updatedAt: "2026-05-25T01:08:10.000Z",
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO wind_down_context_preferences"),
      [
        "install_0123456789abcdef",
        "wake_up_fewer_times",
        "wind_down_daily_calm",
        "2026-05-25T01:00:00.000Z",
        "2026-05-25T01:00:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("UPDATE wind_down_runs"),
      expect.arrayContaining([
        "ambient_playing",
        "dimmed_idle",
        "session_winddown123456",
        "2026-05-25T01:05:00.000Z",
        "2026-05-25T01:08:00.000Z",
        "2026-05-25T01:08:10.000Z",
        "winddown_0123456789abcdef",
        "install_0123456789abcdef",
      ]),
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO local_event_queue"),
      expect.arrayContaining(["audio_started", "wind_down_run", "winddown_0123456789abcdef", "{}"]),
    );
  });

  it("loads the remembered context choice with local-install scoping", async () => {
    const database = createMockDatabase();
    database.getFirstAsync.mockResolvedValue({
      context_goal: "wake_up_fewer_times",
      local_install_id: "install_0123456789abcdef",
      routine_id: "wind_down_daily_calm",
      selected_at: "2026-05-25T22:30:00.000Z",
    });

    await expect(
      loadRememberedWindDownContextChoiceLocally(database, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toEqual({
      contextGoal: "wake_up_fewer_times",
      localInstallId: "install_0123456789abcdef",
      routineId: "wind_down_daily_calm",
      selectedAt: "2026-05-25T22:30:00.000Z",
    });

    expect(database.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE local_install_id = ?"),
      ["install_0123456789abcdef"],
    );
  });

  it("completes a run with terminal timestamps before queueing completion", async () => {
    const database = createMockDatabase();

    await completeWindDownRunLocally(database, {
      ambientCompletedAt: "2026-05-25T01:30:00.000Z",
      completedAt: "2026-05-25T01:30:00.000Z",
      eventId: "event_wind_down_completed",
      localInstallId: "install_0123456789abcdef",
      recoveryState: "completion",
      runId: "winddown_0123456789abcdef",
      totalDurationSeconds: 1800,
      updatedAt: "2026-05-25T01:30:01.000Z",
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("UPDATE wind_down_runs"),
      expect.arrayContaining([
        "completed",
        "completion",
        "2026-05-25T01:30:00.000Z",
        "2026-05-25T01:30:00.000Z",
        1800,
        "2026-05-25T01:30:01.000Z",
      ]),
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO local_event_queue"),
      expect.arrayContaining([
        "event_wind_down_completed",
        "wind_down_completed",
        "wind_down_run",
        "winddown_0123456789abcdef",
        "{}",
      ]),
    );
  });

  it("saves a partial body-cue stop without queueing completion or guilt copy", async () => {
    const database = createMockDatabase();

    await stopWindDownRunLocally(database, {
      localInstallId: "install_0123456789abcdef",
      recoveryState: "partial_stop",
      runId: "winddown_0123456789abcdef",
      stopReason: "user_stop",
      stoppedAt: "2026-05-25T01:06:20.000Z",
      totalDurationSeconds: 380,
      updatedAt: "2026-05-25T01:06:20.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.not.stringMatching(/wind_down_completed|guilt|shame/i),
      expect.arrayContaining(["stopped", "user_stop", "partial_stop", 380]),
    );
  });

  it("loads the latest recoverable run with UI recovery state intact", async () => {
    const database = createMockDatabase({
      ambient_completed_at: null,
      ambient_sound_id: "light-rain",
      ambient_started_at: null,
      body_cue_completed_at: null,
      body_cue_started_at: null,
      breath_session_id: "session_winddown123456",
      breathwork_completed_at: "2026-05-25T01:05:00.000Z",
      breathwork_started_at: "2026-05-25T01:00:00.000Z",
      completed_at: null,
      context_goal: "fall_asleep_faster",
      local_install_id: "install_0123456789abcdef",
      recovery_state: "background_recovery",
      routine_id: "wind_down_sleep_starter",
      run_id: "winddown_0123456789abcdef",
      started_at: "2026-05-25T01:00:00.000Z",
      status: "breath_completed",
      stop_reason: null,
      stopped_at: null,
      total_duration_seconds: null,
      updated_at: "2026-05-25T01:05:01.000Z",
    });

    await expect(
      loadLatestRecoverableWindDownRun(database, {
        localInstallId: "install_0123456789abcdef",
      }),
    ).resolves.toEqual({
      ambientSoundId: "light-rain",
      breathSessionId: "session_winddown123456",
      breathworkCompletedAt: "2026-05-25T01:05:00.000Z",
      breathworkStartedAt: "2026-05-25T01:00:00.000Z",
      contextGoal: "fall_asleep_faster",
      localInstallId: "install_0123456789abcdef",
      recoveryState: "background_recovery",
      routineId: "wind_down_sleep_starter",
      runId: "winddown_0123456789abcdef",
      startedAt: "2026-05-25T01:00:00.000Z",
      status: "breath_completed",
      updatedAt: "2026-05-25T01:05:01.000Z",
    });
  });

  it("rejects invalid ids, routine state, stop state, and negative durations before writing", async () => {
    const database = createMockDatabase();

    await expect(
      stopWindDownRunLocally(database, {
        localInstallId: "install_0123456789abcdef",
        recoveryState: "completion",
        runId: "bad-run",
        stopReason: "because I failed",
        stoppedAt: "2026-05-25T01:06:20.000Z",
        totalDurationSeconds: -1,
        updatedAt: "2026-05-25T01:06:20.000Z",
      }),
    ).rejects.toThrow();
    expect(database.runAsync).not.toHaveBeenCalled();
  });
});
