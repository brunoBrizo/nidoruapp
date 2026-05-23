import { describe, expect, it } from "@jest/globals";

import {
  completeBreathSessionIfDue,
  createBreathSessionController,
  endBreathSessionEarly,
  getBreathSessionSnapshot,
  pauseBreathSession,
  resumeBreathSession,
} from "../src/session/breath-session-runtime";

const startedAtMs = Date.parse("2026-05-20T01:00:00.000Z");

const baseInput = {
  localInstallId: "install_0123456789abcdef",
  planId: "sleep_focused",
  sessionId: "session_0123456789abcdef",
  source: "first_session",
  startedAtMs,
  techniqueId: "4-7-8-sleep",
  totalDurationSeconds: 300,
} as const;

describe("breath session runtime", () => {
  it("uses exact 4-7-8 phase boundaries from absolute elapsed time", () => {
    const controller = createBreathSessionController(baseInput);

    expect(getBreathSessionSnapshot(controller, startedAtMs)).toMatchObject({
      completedBreathCycles: 0,
      elapsedDurationMs: 0,
      phaseDurationMs: 4000,
      phaseElapsedMs: 0,
      phaseIndex: 0,
      phaseName: "inhale",
      phaseProgress: 0,
      phaseStartedAtElapsedMs: 0,
      phaseStartedAtMs: startedAtMs,
      remainingDurationMs: 300000,
      status: "active",
      totalDurationMs: 300000,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 3999)).toMatchObject({
      phaseElapsedMs: 3999,
      phaseIndex: 0,
      phaseName: "inhale",
      phaseProgress: 3999 / 4000,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 4000)).toMatchObject({
      phaseDurationMs: 7000,
      phaseElapsedMs: 0,
      phaseIndex: 1,
      phaseName: "hold",
      phaseProgress: 0,
      phaseStartedAtElapsedMs: 4000,
      phaseStartedAtMs: startedAtMs + 4000,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 11000)).toMatchObject({
      phaseDurationMs: 8000,
      phaseElapsedMs: 0,
      phaseIndex: 2,
      phaseName: "exhale",
      phaseStartedAtElapsedMs: 11000,
      phaseStartedAtMs: startedAtMs + 11000,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 19000)).toMatchObject({
      completedBreathCycles: 1,
      phaseIndex: 0,
      phaseName: "inhale",
      phaseStartedAtElapsedMs: 19000,
      phaseStartedAtMs: startedAtMs + 19000,
    });
  });

  it("keeps Box Breathing hold phases distinct for visuals and labels", () => {
    const controller = createBreathSessionController({
      ...baseInput,
      techniqueId: "box-breathing",
    });

    expect(getBreathSessionSnapshot(controller, startedAtMs + 4000)).toMatchObject({
      phaseIndex: 1,
      phaseName: "hold",
      phaseStartedAtElapsedMs: 4000,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 12000)).toMatchObject({
      phaseIndex: 3,
      phaseName: "hold",
      phaseStartedAtElapsedMs: 12000,
    });
  });

  it("supports Coherent 5.5 second phases without rounding drift over 10 minutes", () => {
    const controller = createBreathSessionController({
      ...baseInput,
      techniqueId: "coherent-breathing",
      totalDurationSeconds: 600,
    });

    expect(getBreathSessionSnapshot(controller, startedAtMs + 5499)).toMatchObject({
      phaseElapsedMs: 5499,
      phaseIndex: 0,
      phaseName: "inhale",
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 5500)).toMatchObject({
      phaseDurationMs: 5500,
      phaseElapsedMs: 0,
      phaseIndex: 1,
      phaseName: "exhale",
      phaseStartedAtElapsedMs: 5500,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 599999)).toMatchObject({
      completedBreathCycles: 54,
      elapsedDurationMs: 599999,
      phaseElapsedMs: 499,
      phaseIndex: 1,
      phaseName: "exhale",
      remainingDurationMs: 1,
      status: "active",
    });
    expect(completeBreathSessionIfDue(controller, startedAtMs + 600000)).toMatchObject({
      completedAt: "2026-05-20T01:10:00.000Z",
      completedBreathCycles: 54,
      durationSeconds: 600,
      source: "first_session",
      status: "completed",
      techniqueId: "coherent-breathing",
    });
  });

  it("supports 5-minute 4-7-8 sessions without accumulating drift", () => {
    const controller = createBreathSessionController(baseInput);

    expect(getBreathSessionSnapshot(controller, startedAtMs + 299999)).toMatchObject({
      completedBreathCycles: 15,
      elapsedDurationMs: 299999,
      phaseElapsedMs: 3999,
      phaseIndex: 2,
      phaseName: "exhale",
      remainingDurationMs: 1,
      status: "active",
    });
    expect(completeBreathSessionIfDue(controller, startedAtMs + 300000)).toMatchObject({
      completedBreathCycles: 15,
      completedAt: "2026-05-20T01:05:00.000Z",
      durationSeconds: 300,
      status: "completed",
      techniqueId: "4-7-8-sleep",
    });
  });

  it("supports a fixed five-cycle Rescue Me session scaled to the accepted 03:29 timer", () => {
    const controller = createBreathSessionController({
      ...baseInput,
      planId: undefined,
      source: "rescue_me",
      targetBreathCycles: 5,
      totalDurationSeconds: 209,
    });

    expect(getBreathSessionSnapshot(controller, startedAtMs)).toMatchObject({
      completedBreathCycles: 0,
      phaseDurationMs: 8800,
      phaseName: "inhale",
      remainingDurationMs: 209000,
      totalDurationMs: 209000,
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 8800)).toMatchObject({
      phaseDurationMs: 15400,
      phaseName: "hold",
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 24200)).toMatchObject({
      phaseDurationMs: 17600,
      phaseName: "exhale",
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 83600)).toMatchObject({
      completedBreathCycles: 2,
      phaseName: "inhale",
      status: "active",
    });
    expect(completeBreathSessionIfDue(controller, startedAtMs + 209000)).toMatchObject({
      completedBreathCycles: 5,
      durationSeconds: 209,
      source: "rescue_me",
      status: "completed",
      techniqueId: "4-7-8-sleep",
    });
  });

  it("uses the configured Diaphragmatic cadence", () => {
    const controller = createBreathSessionController({
      ...baseInput,
      techniqueId: "diaphragmatic-breathing",
    });

    expect(getBreathSessionSnapshot(controller, startedAtMs + 3999)).toMatchObject({
      phaseIndex: 0,
      phaseName: "inhale",
    });
    expect(getBreathSessionSnapshot(controller, startedAtMs + 4000)).toMatchObject({
      phaseDurationMs: 6000,
      phaseIndex: 1,
      phaseName: "exhale",
      phaseStartedAtElapsedMs: 4000,
    });
  });

  it("pauses and resumes without double-counting elapsed time", () => {
    const controller = createBreathSessionController(baseInput);
    const paused = pauseBreathSession(controller, startedAtMs + 5000);

    expect(getBreathSessionSnapshot(paused, startedAtMs + 25000)).toMatchObject({
      elapsedDurationMs: 5000,
      isPaused: true,
      phaseName: "hold",
      remainingDurationMs: 295000,
      status: "paused",
    });

    const resumed = resumeBreathSession(paused, startedAtMs + 25000);

    expect(getBreathSessionSnapshot(resumed, startedAtMs + 26000)).toMatchObject({
      elapsedDurationMs: 6000,
      isPaused: false,
      phaseName: "hold",
      remainingDurationMs: 294000,
      status: "active",
    });
  });

  it("returns abandoned state from the current snapshot without completion timestamps", () => {
    const controller = createBreathSessionController(baseInput);

    expect(endBreathSessionEarly(controller, startedAtMs + 35000)).toEqual({
      abandonedAt: "2026-05-20T01:00:35.000Z",
      completedBreathCycles: 1,
      currentPhaseName: "exhale",
      durationSeconds: 300,
      elapsedDurationMs: 35000,
      localInstallId: "install_0123456789abcdef",
      planId: "sleep_focused",
      remainingDurationMs: 265000,
      sessionId: "session_0123456789abcdef",
      source: "first_session",
      startedAt: "2026-05-20T01:00:00.000Z",
      status: "abandoned",
      techniqueId: "4-7-8-sleep",
      updatedAt: "2026-05-20T01:00:35.000Z",
    });
  });

  it("computes wake-after-background phase from absolute elapsed time", () => {
    const controller = createBreathSessionController(baseInput);

    expect(getBreathSessionSnapshot(controller, startedAtMs + 4 * 60 * 1000 + 17000)).toMatchObject(
      {
        completedBreathCycles: 13,
        elapsedDurationMs: 257000,
        phaseElapsedMs: 6000,
        phaseIndex: 1,
        phaseName: "hold",
        phaseStartedAtElapsedMs: 251000,
        phaseStartedAtMs: startedAtMs + 251000,
        status: "active",
      },
    );
  });
});
