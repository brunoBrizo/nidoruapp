import {
  breathTechniqueIds,
  onboardingPlanIds,
  type BreathTechniqueId,
  type OnboardingPlanId,
} from "@nidoru/domain";
import { useLocalSearchParams } from "expo-router";

import { FirstSessionRouteScreen } from "../../../session/first-session-screen";

export default function BreatheTechniqueAnchorScreen() {
  const params = useLocalSearchParams<{
    durationSeconds?: string;
    planId?: string;
    technique?: string;
  }>();
  const techniqueId = parseTechniqueId(params.technique);
  const planId = parsePlanId(params.planId);
  const durationSeconds = parseDurationSeconds(params.durationSeconds);

  return (
    <FirstSessionRouteScreen
      {...(durationSeconds === undefined ? {} : { durationSeconds })}
      {...(planId === undefined ? {} : { planId })}
      techniqueId={techniqueId}
    />
  );
}

function parseTechniqueId(value: string | string[] | undefined): BreathTechniqueId {
  const techniqueId = Array.isArray(value) ? value[0] : value;

  return breathTechniqueIds.includes(techniqueId as BreathTechniqueId)
    ? (techniqueId as BreathTechniqueId)
    : "4-7-8-sleep";
}

function parsePlanId(value: string | string[] | undefined): OnboardingPlanId | undefined {
  const planId = Array.isArray(value) ? value[0] : value;

  return onboardingPlanIds.includes(planId as OnboardingPlanId)
    ? (planId as OnboardingPlanId)
    : undefined;
}

function parseDurationSeconds(value: string | string[] | undefined): number | undefined {
  const durationSeconds = Number(Array.isArray(value) ? value[0] : value);

  return Number.isInteger(durationSeconds) && durationSeconds > 0 && durationSeconds <= 30 * 60
    ? durationSeconds
    : undefined;
}
