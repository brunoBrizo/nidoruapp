import { describe, expect, it, jest } from "@jest/globals";

import {
  abandonBreathSessionLocally,
  completeBreathSessionLocally,
  loadPendingBreathSessionCompletion,
  loadRecoverableBreathSessionDraft,
  recordBreathSessionStartedLocally,
  saveBreathSessionDraftLocally,
  type BreathSessionLocalPersistenceDatabase,
} from "../src/session/breath-session-local-persistence";

function createMockDatabase(firstRow: Record<string, unknown> | null = null) {
  const database: BreathSessionLocalPersistenceDatabase & {
    readonly runAsync: jest.MockedFunction<BreathSessionLocalPersistenceDatabase["runAsync"]>;
    readonly getFirstAsync: jest.MockedFunction<
      BreathSessionLocalPersistenceDatabase["getFirstAsync"]
    >;
  } = {
    runAsync: jest
      .fn<BreathSessionLocalPersistenceDatabase["runAsync"]>()
      .mockResolvedValue(undefined),
    getFirstAsync: jest
      .fn<BreathSessionLocalPersistenceDatabase["getFirstAsync"]>()
      .mockResolvedValue(firstRow),
  };

  return database;
}

describe("breath-session local persistence", () => {
  it("persists session start before queueing analytics with a privacy-empty payload", async () => {
    const database = createMockDatabase();

    await recordBreathSessionStartedLocally(database, {
      audioCueModeId: "gentle-bell",
      currentPhaseName: "inhale",
      durationSeconds: 300,
      eventId: "event_breath_started",
      localInstallId: "install_0123456789abcdef",
      sessionId: "session_0123456789abcdef",
      source: "breathe_tab",
      startedAt: "2026-05-21T01:00:00.000Z",
      status: "started",
      techniqueId: "coherent-breathing",
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO breath_session_records"),
      [
        "session_0123456789abcdef",
        "install_0123456789abcdef",
        "breathe_tab",
        null,
        null,
        "coherent-breathing",
        "gentle-bell",
        "started",
        "2026-05-21T01:00:00.000Z",
        null,
        300,
        0,
        null,
        0,
        300000,
        "inhale",
        null,
        null,
        "2026-05-21T01:00:00.000Z",
      ],
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO local_event_queue"),
      [
        "event_breath_started",
        "install_0123456789abcdef",
        "breath_session_started",
        "breath_session_record",
        "session_0123456789abcdef",
        "{}",
        "2026-05-21T01:00:00.000Z",
        "2026-05-21T01:00:00.000Z",
      ],
    );
  });

  it("saves a recoverable draft snapshot from elapsed time and phase state", async () => {
    const database = createMockDatabase();

    await saveBreathSessionDraftLocally(database, {
      audioCueModeId: "none",
      completedBreathCycles: 6,
      currentPhaseName: "exhale",
      durationSeconds: 300,
      elapsedDurationMs: 120000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 180000,
      sessionId: "session_0123456789abcdef",
      source: "breathe_tab",
      startedAt: "2026-05-21T01:00:00.000Z",
      status: "draft",
      techniqueId: "coherent-breathing",
      updatedAt: "2026-05-21T01:02:00.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("ON CONFLICT(session_id) DO UPDATE SET"),
      expect.arrayContaining([
        "session_0123456789abcdef",
        "install_0123456789abcdef",
        "breathe_tab",
        null,
        "coherent-breathing",
        "none",
        "draft",
        120000,
        180000,
        "exhale",
      ]),
    );
  });

  it("persists completion before queueing the completed event", async () => {
    const database = createMockDatabase();

    await completeBreathSessionLocally(database, {
      audioCueModeId: "soft-whoosh",
      completedAt: "2026-05-21T01:05:00.000Z",
      completedBreathCycles: 27,
      completionPersistedAt: "2026-05-21T01:05:01.000Z",
      currentPhaseName: "exhale",
      durationSeconds: 300,
      elapsedDurationMs: 300000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 0,
      sessionId: "session_0123456789abcdef",
      source: "rescue_me",
      startedAt: "2026-05-21T01:00:00.000Z",
      status: "completed",
      techniqueId: "4-7-8-sleep",
    });

    expect(database.runAsync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO breath_session_records"),
      expect.arrayContaining([
        "completed",
        "2026-05-21T01:05:00.000Z",
        300,
        27,
        "2026-05-21T01:05:01.000Z",
        300000,
        0,
        "exhale",
      ]),
    );
    expect(database.runAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO local_event_queue"),
      expect.arrayContaining([
        "breath_session_completed",
        "breath_session_record",
        "session_0123456789abcdef",
        "{}",
        "2026-05-21T01:05:01.000Z",
      ]),
    );
  });

  it("loads recoverable drafts and pending completed sessions for crash recovery", async () => {
    const draftDatabase = createMockDatabase({
      audio_cue_mode_id: "gentle-bell",
      completed_breath_cycles: 6,
      current_phase: "exhale",
      duration_seconds: 300,
      elapsed_ms: 120000,
      local_install_id: "install_0123456789abcdef",
      plan_id: null,
      remaining_ms: 180000,
      session_id: "session_0123456789abcdef",
      source: "breathe_tab",
      started_at: "2026-05-21T01:00:00.000Z",
      status: "draft",
      technique_id: "coherent-breathing",
      updated_at: "2026-05-21T01:02:00.000Z",
    });
    const completedDatabase = createMockDatabase({
      audio_cue_mode_id: "soft-whoosh",
      completed_at: "2026-05-21T01:05:00.000Z",
      completed_breath_cycles: 27,
      completion_persisted_at: "2026-05-21T01:05:01.000Z",
      current_phase: "exhale",
      duration_seconds: 300,
      elapsed_ms: 300000,
      local_install_id: "install_0123456789abcdef",
      plan_id: null,
      remaining_ms: 0,
      session_id: "session_completed1234",
      source: "rescue_me",
      started_at: "2026-05-21T01:00:00.000Z",
      status: "completed",
      technique_id: "4-7-8-sleep",
      updated_at: "2026-05-21T01:05:01.000Z",
    });

    await expect(
      loadRecoverableBreathSessionDraft(draftDatabase, {
        localInstallId: "install_0123456789abcdef",
        source: "breathe_tab",
      }),
    ).resolves.toEqual({
      audioCueModeId: "gentle-bell",
      completedBreathCycles: 6,
      currentPhaseName: "exhale",
      durationSeconds: 300,
      elapsedDurationMs: 120000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 180000,
      sessionId: "session_0123456789abcdef",
      source: "breathe_tab",
      startedAt: "2026-05-21T01:00:00.000Z",
      status: "draft",
      techniqueId: "coherent-breathing",
      updatedAt: "2026-05-21T01:02:00.000Z",
    });
    await expect(
      loadPendingBreathSessionCompletion(completedDatabase, {
        localInstallId: "install_0123456789abcdef",
        source: "rescue_me",
      }),
    ).resolves.toEqual({
      audioCueModeId: "soft-whoosh",
      completedAt: "2026-05-21T01:05:00.000Z",
      completedBreathCycles: 27,
      completionPersistedAt: "2026-05-21T01:05:01.000Z",
      currentPhaseName: "exhale",
      durationSeconds: 300,
      elapsedDurationMs: 300000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 0,
      sessionId: "session_completed1234",
      source: "rescue_me",
      startedAt: "2026-05-21T01:00:00.000Z",
      status: "completed",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-21T01:05:01.000Z",
    });
  });

  it("records abandoned partial stops without queueing completion or counters", async () => {
    const database = createMockDatabase();

    await abandonBreathSessionLocally(database, {
      abandonedAt: "2026-05-21T01:02:00.000Z",
      audioCueModeId: "none",
      completedBreathCycles: 6,
      currentPhaseName: "exhale",
      durationSeconds: 300,
      elapsedDurationMs: 120000,
      localInstallId: "install_0123456789abcdef",
      remainingDurationMs: 180000,
      sessionId: "session_0123456789abcdef",
      source: "breathe_tab",
      startedAt: "2026-05-21T01:00:00.000Z",
      status: "abandoned",
      stopReason: "user_ended",
      techniqueId: "coherent-breathing",
      updatedAt: "2026-05-21T01:02:00.000Z",
    });

    expect(database.runAsync).toHaveBeenCalledTimes(1);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.not.stringMatching(/breath_session_completed|completed_session_count/),
      expect.arrayContaining(["abandoned", "user_ended"]),
    );
  });

  it("rejects invalid local ids, technique ids, durations, phases, cue modes, and stop reasons", async () => {
    const database = createMockDatabase();

    await expect(
      saveBreathSessionDraftLocally(database, {
        audioCueModeId: "full-raw-audio-state",
        completedBreathCycles: 0,
        currentPhaseName: "sleepy",
        durationSeconds: 5000,
        elapsedDurationMs: 0,
        localInstallId: "bad-install",
        remainingDurationMs: 300000,
        sessionId: "bad-session",
        source: "network_required",
        startedAt: "2026-05-21T01:00:00.000Z",
        status: "draft",
        stopReason: "because I felt bad",
        techniqueId: "unknown",
        updatedAt: "2026-05-21T01:00:00.000Z",
      }),
    ).rejects.toThrow();
    expect(database.runAsync).not.toHaveBeenCalled();
  });
});
