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
      | "breath_session"
      | "local_install_link"
      | "first_session_record"
      | "post_session_reflection"
      | "local_event_queue"
      | "wind_down_run";
    release: string;
    source: "observability_proof";
    sync_stage: "post_value_sync" | "analytics_event_flush";
  }>
>;

export const posthogProofEventName = "observability_test_event";

const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "";
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const allowedEventNames = new Set<string>([...approvedAnalyticsEventNames, posthogProofEventName]);
const allowedStringAnalyticsProperties = {
  app_environment: new Set(["development", "staging", "production"]),
  audio_asset_id: new Set([
    "gentle-bell-transition",
    "nature-ambient-loop",
    "soft-whoosh-exhale",
    "soft-whoosh-inhale",
  ]),
  audio_failure_class: new Set([
    "ambient_playback_failed",
    "audio_mode_configuration",
    "cue_playback_failed",
    "interruption_handling_failed",
    "lock_screen_metadata_failed",
    "route_change_handling_failed",
  ]),
  audio_mode: new Set(["gentle-bell", "nature-ambient", "none", "soft-whoosh"]),
  breath_phase: new Set(["exhale", "hold", "inhale", "second-inhale"]),
  reason_class: new Set([
    "offline",
    "auth_denied",
    "server_error",
    "rate_limited",
    "validation_error",
    "unknown",
  ]),
  record_type: new Set([
    "breath_session",
    "local_install_link",
    "first_session_record",
    "post_session_reflection",
    "local_event_queue",
    "wind_down_run",
  ]),
  source: new Set(["observability_proof"]),
  sync_stage: new Set(["post_value_sync", "analytics_event_flush"]),
} as const;

const safeReleasePattern = /^[A-Za-z0-9._/@:+-]{1,120}$/;

const posthogOptions: PostHogOptions = {
  before_send: (event) => {
    if (!event || typeof event.event !== "string" || !isApprovedAnalyticsEventName(event.event)) {
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

export function isApprovedAnalyticsEventName(
  eventName: string,
): eventName is AnalyticsEventName | typeof posthogProofEventName {
  return allowedEventNames.has(eventName);
}

export function createPrivacySafeAnalyticsProperties(
  properties: Readonly<Record<string, unknown>> = {},
): AnalyticsEventProperties {
  const safeProperties: Record<string, unknown> = {};

  for (const [key, allowedValues] of Object.entries(allowedStringAnalyticsProperties)) {
    const value = properties[key];

    if (typeof value === "string" && allowedValues.has(value)) {
      safeProperties[key] = value;
    }
  }

  const attemptCount = properties.attempt_count;
  if (typeof attemptCount === "number" && Number.isInteger(attemptCount) && attemptCount >= 1) {
    safeProperties.attempt_count = attemptCount;
  }

  if (typeof properties.proof === "boolean") {
    safeProperties.proof = properties.proof;
  }

  const release = properties.release;
  if (typeof release === "string" && isPrivacySafeRelease(release)) {
    safeProperties.release = release;
  }

  return safeProperties as AnalyticsEventProperties;
}

function isPrivacySafeRelease(value: string): boolean {
  return safeReleasePattern.test(value) && !containsSensitiveToken(value);
}

function containsSensitiveToken(value: string): boolean {
  return /(?:install_|session_|reflection_|ExponentPushToken|token|secret)/i.test(value);
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

  const eventProperties = {
    ...createPrivacySafeAnalyticsProperties(properties),
    app_environment: getAppEnvironment(),
  };

  if (isPrivacySafeRelease(sentryRelease)) {
    eventProperties.release = sentryRelease;
  }

  posthogClient.capture(eventName, eventProperties);

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
