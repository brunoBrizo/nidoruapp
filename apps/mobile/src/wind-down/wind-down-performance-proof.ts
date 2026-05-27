type WindDownPerformanceMark =
  | "ambient_handoff_start"
  | "context_choice"
  | "dimmed_tap"
  | "entry_tap";

let currentMark:
  | {
      readonly name: WindDownPerformanceMark;
      readonly startedAtMs: number;
    }
  | undefined;

export function markWindDownPerformanceStart(name: WindDownPerformanceMark) {
  if (!isWindDownPerformanceProofEnabled()) {
    return;
  }

  currentMark = {
    name,
    startedAtMs: getNowMs(),
  };
}

export function recordWindDownPerformanceMeasure(
  label: string,
  details: Record<string, string | number>,
) {
  if (!isWindDownPerformanceProofEnabled() || !currentMark) {
    return;
  }

  const elapsedMs = getNowMs() - currentMark.startedAtMs;
  const detailText = Object.entries({
    start: currentMark.name,
    ...details,
    elapsedMs: Number(elapsedMs.toFixed(1)),
  })
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  console.info(`[WindDownPerf] ${label} ${detailText}`);
  currentMark = undefined;
}

function isWindDownPerformanceProofEnabled() {
  return __DEV__ && process.env.NODE_ENV !== "test";
}

function getNowMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}
