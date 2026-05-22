import PostHog, { type PostHogOptions } from "posthog-react-native";

import { getAppEnvironment, isNonProductionEnvironment } from "./environment";
import { sentryRelease } from "./sentry";

export const approvedAnalyticsEventNames = [
  "onboarding_started",
  "onboarding_completed",
  "first_breath_started",
  "first_breath_completed",
  "first_session_started",
  "first_session_completed",
  "breath_session_started",
  "breath_session_completed",
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
    attempt_count: number;
    audio_asset_id:
      | "gentle-bell-transition"
      | "nature-ambient-loop"
      | "soft-whoosh-exhale"
      | "soft-whoosh-inhale";
    audio_failure_class:
      | "ambient_playback_failed"
      | "audio_mode_configuration"
      | "cue_playback_failed"
      | "interruption_handling_failed"
      | "lock_screen_metadata_failed"
      | "route_change_handling_failed";
    audio_mode: "gentle-bell" | "nature-ambient" | "none" | "soft-whoosh";
    breath_phase: "exhale" | "hold" | "inhale" | "second-inhale";
    proof: boolean;
    reason_class:
      | "offline"
      | "auth_denied"
      | "server_error"
      | "rate_limited"
      | "validation_error"
      | "unknown";
    record_type:
      | "local_install_link"
      | "first_session_record"
      | "post_session_reflection"
      | "local_event_queue";
    release: string;
    source: "observability_proof";
    sync_stage: "post_value_sync" | "analytics_event_flush";
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
  setDefaultPersonProperties: false,
};

export const posthogClient = posthogApiKey ? new PostHog(posthogApiKey, posthogOptions) : null;

export function isPostHogConfigured() {
  return posthogClient !== null;
}

export function createPrivacySafeAnalyticsProperties(
  properties: Readonly<Record<string, unknown>> = {},
): AnalyticsEventProperties {
  const safeProperties: Record<string, unknown> = {};
  const allowlistedKeys = [
    "app_environment",
    "attempt_count",
    "audio_asset_id",
    "audio_failure_class",
    "audio_mode",
    "breath_phase",
    "proof",
    "reason_class",
    "record_type",
    "release",
    "source",
    "sync_stage",
  ];

  for (const key of allowlistedKeys) {
    const value = properties[key];

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safeProperties[key] = value;
    }
  }

  return safeProperties as AnalyticsEventProperties;
}

function captureExplicitEvent(
  eventName: AnalyticsEventName | typeof posthogProofEventName,
  properties: Readonly<Record<string, unknown>> = {},
) {
  if (!posthogClient) {
    return {
      status: "not_configured" as const,
      eventName,
    };
  }

  posthogClient.capture(eventName, {
    ...createPrivacySafeAnalyticsProperties(properties),
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
  properties: Readonly<Record<string, unknown>> = {},
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

  if (result.status === "queued" && posthogClient) {
    await posthogClient.flush();
  }

  return result;
}
