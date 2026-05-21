import { useLocalSearchParams } from "expo-router";

import {
  OnboardingFlowScreen,
  type OnboardingFlowStep,
} from "../onboarding/onboarding-flow-screen";

export default function OnboardingRouteScreen() {
  const params = useLocalSearchParams<{ stage?: string }>();
  const initialStep = parseOnboardingStage(params.stage);

  return <OnboardingFlowScreen {...(initialStep ? { initialStep } : {})} />;
}

function parseOnboardingStage(
  value: string | string[] | undefined,
): OnboardingFlowStep | undefined {
  const stage = Array.isArray(value) ? value[0] : value;

  return stage === "personalization" ? "personalization" : undefined;
}
