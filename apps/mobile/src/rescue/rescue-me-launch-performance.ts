export const RESCUE_ME_TAP_TO_ORB_TARGET_MS = 300;

type RescueMeTapToOrbMeasurement = {
  readonly latencyMs: number;
  readonly meetsTarget: boolean;
  readonly targetMs: typeof RESCUE_ME_TAP_TO_ORB_TARGET_MS;
};

type RescueMeTapToOrbSkipped = {
  readonly status: "no_pending_tap";
};

type RescueMePerformanceLogger = (message: string) => void;

let pendingHomeTapAtMs: number | undefined;

export function markRescueMeHomeTap(observedAtMs = getMonotonicNowMs()) {
  pendingHomeTapAtMs = observedAtMs;
}

export function recordRescueMeOrbVisible(
  observedAtMs = getMonotonicNowMs(),
  log: RescueMePerformanceLogger = console.info,
): RescueMeTapToOrbMeasurement | RescueMeTapToOrbSkipped {
  if (pendingHomeTapAtMs === undefined) {
    return { status: "no_pending_tap" };
  }

  const latencyMs = Math.max(0, Math.round(observedAtMs - pendingHomeTapAtMs));
  const measurement: RescueMeTapToOrbMeasurement = {
    latencyMs,
    meetsTarget: latencyMs <= RESCUE_ME_TAP_TO_ORB_TARGET_MS,
    targetMs: RESCUE_ME_TAP_TO_ORB_TARGET_MS,
  };

  pendingHomeTapAtMs = undefined;
  log(
    `[rescue-me-performance] tap_to_orb_ms=${measurement.latencyMs} target_ms=${measurement.targetMs} meets_target=${measurement.meetsTarget}`,
  );

  return measurement;
}

export function resetRescueMeLaunchPerformanceProof() {
  pendingHomeTapAtMs = undefined;
}

function getMonotonicNowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
}
