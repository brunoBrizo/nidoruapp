import { describe, expect, it, jest } from "@jest/globals";

jest.mock("posthog-react-native", () => {
  function PostHog() {
    return {
      capture: jest.fn(),
      flush: jest.fn(() => Promise.resolve()),
    };
  }

  return {
    __esModule: true,
    default: PostHog,
  };
});

jest.mock("../src/observability/sentry", () => ({
  sentryRelease: "test-release",
}));

import {
  capturePostHogProofEvent,
  createPrivacySafeAnalyticsProperties,
  posthogClient,
  posthogProofEventName,
} from "../src/observability/posthog";
import { createPrivacySafeSyncFailureContext } from "../src/observability/sync-observability";

describe("privacy-safe observability", () => {
  it("keeps PostHog uninitialized when the public API key is not configured", async () => {
    expect(posthogClient).toBeNull();
    await expect(capturePostHogProofEvent()).resolves.toEqual({
      eventName: posthogProofEventName,
      status: "not_configured",
    });
  });

  it("allowlists analytics properties and strips prohibited identifiers and user-entered values", () => {
    const properties = createPrivacySafeAnalyticsProperties({
      account_id: "user_123",
      audio_asset_id: "gentle-bell-transition",
      audio_failure_class: "cue_playback_failed",
      audio_file_path: "/private/var/mobile/Containers/Data/session_0123456789abcdef/cue.m4a",
      audio_mode: "gentle-bell",
      breath_phase: "inhale",
      attempt_count: 2,
      device_id: "device-secret",
      display_name: "Bruno",
      local_install_id: "install_0123456789abcdef",
      notification_token: "ExponentPushToken[secret]",
      raw_reflection: "I feel anxious about work",
      reason_class: "server_error",
      record_type: "first_session_record",
      revenuecat_customer_id: "rc_123",
      sync_stage: "post_value_sync",
    });

    expect(properties).toEqual({
      audio_asset_id: "gentle-bell-transition",
      audio_failure_class: "cue_playback_failed",
      audio_mode: "gentle-bell",
      breath_phase: "inhale",
      attempt_count: 2,
      reason_class: "server_error",
      record_type: "first_session_record",
      sync_stage: "post_value_sync",
    });
    expect(JSON.stringify(properties)).not.toMatch(
      /Bruno|install_|device-secret|ExponentPushToken|anxious|user_123|rc_123/,
    );
  });

  it("redacts sync failure observability to reason classes and non-sensitive counters", () => {
    const context = createPrivacySafeSyncFailureContext({
      attemptCount: 3,
      error: new Error(
        "HTTP 500 while syncing install_0123456789abcdef for user 123e4567-e89b-12d3-a456-426614174000 with token secret",
      ),
      reasonClass: "server_error",
      recordType: "post_session_reflection",
      syncStage: "post_value_sync",
    });

    expect(context.analyticsProperties).toEqual({
      attempt_count: 3,
      reason_class: "server_error",
      record_type: "post_session_reflection",
      sync_stage: "post_value_sync",
    });
    expect(context.sentryBreadcrumb).toEqual({
      category: "sync",
      data: {
        attempt_count: 3,
        reason_class: "server_error",
        record_type: "post_session_reflection",
        sync_stage: "post_value_sync",
      },
      level: "warning",
      message: "sync_failed",
    });
    expect(JSON.stringify(context)).not.toMatch(/install_|123e4567|token secret|HTTP 500/);
  });
});
