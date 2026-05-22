import { onboardingPlanIds, type BreathTechniqueId, type OnboardingPlanId } from "@nidoru/domain";
import { breathSessionDurationSecondsSchema, mvpBreathTechniqueIdSchema } from "@nidoru/validation";
import { useLocalSearchParams, type Href } from "expo-router";

import { FirstSessionRouteScreen } from "../../../session/first-session-screen";

export default function BreatheTechniqueAnchorScreen() {
  const params = useLocalSearchParams<{
    durationSeconds?: string;
    firstLaunch?: string;
    planId?: string;
    technique?: string;
  }>();
  const techniqueId = parseTechniqueId(params.technique);
  const planId = parsePlanId(params.planId);
  const durationSeconds = parseDurationSeconds(params.durationSeconds);
  const postRewardRoute = parseFirstLaunch(params.firstLaunch)
    ? ({
        params: { stage: "personalization" },
        pathname: "/onboarding",
      } satisfies Href)
    : "/post-value";

  return (
    <FirstSessionRouteScreen
      {...(durationSeconds === undefined ? {} : { durationSeconds })}
      {...(planId === undefined ? {} : { planId })}
      postRewardRoute={postRewardRoute}
      techniqueId={techniqueId}
    />
  );
}

function parseTechniqueId(value: string | string[] | undefined): BreathTechniqueId {
  const techniqueId = Array.isArray(value) ? value[0] : value;
  const parsedTechniqueId = mvpBreathTechniqueIdSchema.safeParse(techniqueId);

  return parsedTechniqueId.success ? parsedTechniqueId.data : "4-7-8-sleep";
}

function parsePlanId(value: string | string[] | undefined): OnboardingPlanId | undefined {
  const planId = Array.isArray(value) ? value[0] : value;

  return onboardingPlanIds.includes(planId as OnboardingPlanId)
    ? (planId as OnboardingPlanId)
    : undefined;
}

function parseDurationSeconds(value: string | string[] | undefined): number | undefined {
  const durationSeconds = Number(Array.isArray(value) ? value[0] : value);
  const parsedDurationSeconds = breathSessionDurationSecondsSchema.safeParse(durationSeconds);

  return parsedDurationSeconds.success ? parsedDurationSeconds.data : undefined;
}

function parseFirstLaunch(value: string | string[] | undefined): boolean {
  const firstLaunch = Array.isArray(value) ? value[0] : value;

  return firstLaunch === "1" || firstLaunch === "true";
}
