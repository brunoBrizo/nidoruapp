import { describe, expect, it } from "@jest/globals";

import {
  completeFirstSessionIfDue,
  createFirstSessionController,
  createFirstSessionDraftFromSnapshot,
  endFirstSessionEarly,
  getFirstSessionSnapshot,
  pauseFirstSession,
  resumeFirstSession,
} from "../src/session/first-session-runtime";

const startedAtMs = Date.parse("2026-05-20T01:00:00.000Z");

const baseInput = {
  localInstallId: "install_0123456789abcdef",
  planId: "sleep_focused",
  sessionId: "session_0123456789abcdef",
  startedAtMs,
  techniqueId: "4-7-8-sleep",
  totalDurationSeconds: 240,
} as const;

describe("first full session runtime", () => {
  it("uses the 4-7-8 phase timer as the source of truth", () => {
    const controller = createFirstSessionController(baseInput);

    expect(getFirstSessionSnapshot(controller, startedAtMs)).toMatchObject({
      completedBreathCycles: 0,
      phaseDurationMs: 4000,
      phaseElapsedMs: 0,
      phaseName: "inhale",
      remainingSeconds: 240,
      status: "active",
    });
    expect(getFirstSessionSnapshot(controller, startedAtMs + 3999)).toMatchObject({
      phaseName: "inhale",
      phaseElapsedMs: 3999,
    });
    expect(getFirstSessionSnapshot(controller, startedAtMs + 4000)).toMatchObject({
      phaseDurationMs: 7000,
      phaseElapsedMs: 0,
      phaseName: "hold",
    });
    expect(getFirstSessionSnapshot(controller, startedAtMs + 11000)).toMatchObject({
      phaseDurationMs: 8000,
      phaseElapsedMs: 0,
      phaseName: "exhale",
    });
    expect(getFirstSessionSnapshot(controller, startedAtMs + 19000)).toMatchObject({
      completedBreathCycles: 1,
      phaseName: "inhale",
    });
  });

  it("pauses and resumes without losing or double-counting elapsed time", () => {
    const controller = createFirstSessionController(baseInput);
    const paused = pauseFirstSession(controller, startedAtMs + 5000);

    expect(getFirstSessionSnapshot(paused, startedAtMs + 25000)).toMatchObject({
      elapsedSeconds: 5,
      isPaused: true,
      phaseName: "hold",
      remainingSeconds: 235,
      status: "paused",
    });

    const resumed = resumeFirstSession(paused, startedAtMs + 25000);

    expect(getFirstSessionSnapshot(resumed, startedAtMs + 26000)).toMatchObject({
      elapsedSeconds: 6,
      isPaused: false,
      phaseName: "hold",
      remainingSeconds: 234,
      status: "active",
    });
  });

  it("creates a completed record only after the full local duration has elapsed", () => {
    const controller = createFirstSessionController(baseInput);

    expect(completeFirstSessionIfDue(controller, startedAtMs + 239999)).toBeUndefined();
    expect(completeFirstSessionIfDue(controller, startedAtMs + 240000)).toEqual({
      completedAt: "2026-05-20T01:04:00.000Z",
      completedBreathCycles: 12,
      completionPersistedAt: "2026-05-20T01:04:00.000Z",
      durationSeconds: 240,
      localInstallId: "install_0123456789abcdef",
      planId: "sleep_focused",
      sessionId: "session_0123456789abcdef",
      startedAt: "2026-05-20T01:00:00.000Z",
      status: "completed",
      techniqueId: "4-7-8-sleep",
    });
  });

  it("records an early end as abandoned without completion timestamps", () => {
    const controller = createFirstSessionController(baseInput);

    expect(endFirstSessionEarly(controller, startedAtMs + 35000)).toEqual({
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
  });

  it("builds a crash-recovery draft with enough progress to restore the session", () => {
    const controller = createFirstSessionController(baseInput);
    const snapshot = getFirstSessionSnapshot(controller, startedAtMs + 230000);

    expect(createFirstSessionDraftFromSnapshot(controller, snapshot)).toEqual({
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
  });
});
