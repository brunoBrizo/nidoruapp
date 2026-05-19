import PostHog, { type PostHogOptions } from "posthog-react-native";

import { getAppEnvironment, isNonProductionEnvironment } from "./environment";
import { sentryRelease } from "./sentry";

export const approvedAnalyticsEventNames = [
  "onboarding_started",
  "onboarding_completed",
  "first_breath_started",
  "first_breath_completed",
  "rescue_me_started",
  "rescue_me_completed",
  "wind_down_started",
  "wind_down_completed",
  "audio_started",
  "audio_failed",
  "sound_mix_saved",
  "morning_check_in_completed",
  "streak_paused",
  "comeback_completed",
  "insight_card_viewed",
  "notification_permission_prompted",
  "notification_permission_accepted",
  "paywall_viewed",
  "trial_started",
  "subscription_started",
  "sync_failed",
] as const;

export type AnalyticsEventName = (typeof approvedAnalyticsEventNames)[number];

type AnalyticsEventProperties = Readonly<
  Partial<{
    app_environment: ReturnType<typeof getAppEnvironment>;
    proof: boolean;
    release: string;
    source: "observability_proof";
  }>
>;

export const posthogProofEventName = "observability_test_event";

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const allowedEventNames = new Set<string>([...approvedAnalyticsEventNames, posthogProofEventName]);

const posthogOptions: PostHogOptions = {
  before_send: (event) => {
    if (!event || typeof event.event !== "string" || !allowedEventNames.has(event.event)) {
      return null;
    }

    return event;
  },
  captureAppLifecycleEvents: false,
  defaultOptIn: true,
  disableGeoip: true,
  disabled: !posthogApiKey,
  enableSessionReplay: false,
  errorTracking: {
    autocapture: false,
  },
  host: posthogHost,
  preloadFeatureFlags: false,
  sendFeatureFlagEvent: false,
};

export const posthogClient = new PostHog(posthogApiKey, posthogOptions);

export function isPostHogConfigured() {
  return Boolean(posthogApiKey);
}

function captureExplicitEvent(
  eventName: AnalyticsEventName | typeof posthogProofEventName,
  properties: AnalyticsEventProperties = {},
) {
  if (!isPostHogConfigured()) {
    return {
      status: "not_configured" as const,
      eventName,
    };
  }

  posthogClient.capture(eventName, {
    ...properties,
    app_environment: getAppEnvironment(),
    release: sentryRelease,
  });

  return {
    status: "queued" as const,
    eventName,
  };
}

export function captureAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsEventProperties = {},
) {
  return captureExplicitEvent(eventName, properties);
}

export async function capturePostHogProofEvent() {
  if (!isNonProductionEnvironment()) {
    return {
      status: "blocked_in_production" as const,
      eventName: posthogProofEventName,
    };
  }

  const result = captureExplicitEvent(posthogProofEventName, {
    proof: true,
    source: "observability_proof",
  });

  if (result.status === "queued") {
    await posthogClient.flush();
  }

  return result;
}
