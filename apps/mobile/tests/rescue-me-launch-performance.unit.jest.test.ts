import { describe, expect, it, jest } from "@jest/globals";

import {
  RESCUE_ME_TAP_TO_ORB_TARGET_MS,
  markRescueMeHomeTap,
  recordRescueMeOrbVisible,
  resetRescueMeLaunchPerformanceProof,
} from "../src/rescue/rescue-me-launch-performance";

describe("Rescue Me launch performance proof", () => {
  it("measures tap-to-orb latency against the 300 ms target without identifiers", () => {
    const log = jest.fn();

    markRescueMeHomeTap(1000);

    expect(recordRescueMeOrbVisible(1184, log)).toEqual({
      latencyMs: 184,
      meetsTarget: true,
      targetMs: RESCUE_ME_TAP_TO_ORB_TARGET_MS,
    });
    expect(log).toHaveBeenCalledWith(
      "[rescue-me-performance] tap_to_orb_ms=184 target_ms=300 meets_target=true",
    );
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/install_|session_|user_|token|account/i);
  });

  it("clears the pending marker after the first orb-visible record", () => {
    markRescueMeHomeTap(1000);

    expect(recordRescueMeOrbVisible(1301, jest.fn())).toEqual({
      latencyMs: 301,
      meetsTarget: false,
      targetMs: RESCUE_ME_TAP_TO_ORB_TARGET_MS,
    });
    expect(recordRescueMeOrbVisible(1350, jest.fn())).toEqual({
      status: "no_pending_tap",
    });
  });

  it("can reset stale proof state between launches", () => {
    markRescueMeHomeTap(1000);
    resetRescueMeLaunchPerformanceProof();

    expect(recordRescueMeOrbVisible(1100, jest.fn())).toEqual({
      status: "no_pending_tap",
    });
  });
});
