export type AppEnvironment = "development" | "staging" | "production";

export function getAppEnvironment(): AppEnvironment {
  const value = process.env.EXPO_PUBLIC_APP_ENV;

  if (value === "staging" || value === "production") {
    return value;
  }

  return "development";
}

export function isNonProductionEnvironment() {
  return getAppEnvironment() !== "production";
}

export function isObservabilityProofModeEnabled() {
  return (
    process.env.EXPO_PUBLIC_OBSERVABILITY_PROOF_MODE === "true" && isNonProductionEnvironment()
  );
}
