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
  approvedAnalyticsEventNames,
  capturePostHogProofEvent,
  createPrivacySafeAnalyticsProperties,
  isApprovedAnalyticsEventName,
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
      app_environment: "staging",
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
      release: "nidoru@0.0.0",
      record_type: "first_session_record",
      revenuecat_customer_id: "rc_123",
      source: "observability_proof",
      sync_stage: "post_value_sync",
    });

    expect(properties).toEqual({
      app_environment: "staging",
      audio_asset_id: "gentle-bell-transition",
      audio_failure_class: "cue_playback_failed",
      audio_mode: "gentle-bell",
      breath_phase: "inhale",
      attempt_count: 2,
      reason_class: "server_error",
      release: "nidoru@0.0.0",
      record_type: "first_session_record",
      source: "observability_proof",
      sync_stage: "post_value_sync",
    });
    expect(JSON.stringify(properties)).not.toMatch(
      /Bruno|install_|device-secret|ExponentPushToken|anxious|user_123|rc_123/,
    );
  });

  it("rejects allowlisted analytics keys when values contain health-adjacent taxonomy or raw details", () => {
    const properties = createPrivacySafeAnalyticsProperties({
      app_environment: "anxiety_relief",
      audio_asset_id: "/private/session_0123456789abcdef/cue.m4a",
      audio_failure_class: "panic_audio_trace",
      audio_mode: "anxiety-relief",
      breath_phase: "panic",
      attempt_count: 1.5,
      proof: true,
      reason_class: "anxiety",
      record_type: "goal_anxiety",
      release: "install_0123456789abcdef",
      sound_category_id: "bedtime-story",
      sound_category_ids: ["rain", "private-session"],
      sound_id: "/private/session_0123456789abcdef/cue.m4a",
      sound_ids: ["light-rain", "/private/session_0123456789abcdef/cue.m4a"],
      source: "rescue_me_anxiety_relief",
      source_surface: "bedtime_journal",
      sync_stage: "raw_payload_flush",
      timer_option: "sleep_diary",
    });

    expect(properties).toEqual({
      proof: true,
    });
    expect(JSON.stringify(properties)).not.toMatch(
      /anxiety|panic|install_|session_|private|raw_payload/i,
    );
  });

  it("allowlists Rescue Me lifecycle events and rejects unknown event names", () => {
    expect(approvedAnalyticsEventNames).toEqual(
      expect.arrayContaining([
        "wind_down_started",
        "wind_down_completed",
        "breath_session_started",
        "breath_session_completed",
        "audio_started",
        "audio_failed",
        "rescue_me_started",
        "rescue_me_completed",
        "sync_failed",
      ]),
    );
    expect(isApprovedAnalyticsEventName("wind_down_started")).toBe(true);
    expect(isApprovedAnalyticsEventName("wind_down_completed")).toBe(true);
    expect(isApprovedAnalyticsEventName("rescue_me_started")).toBe(true);
    expect(isApprovedAnalyticsEventName("rescue_me_completed")).toBe(true);
    expect(isApprovedAnalyticsEventName("rescue_me_started_install_0123456789abcdef")).toBe(false);
    expect(isApprovedAnalyticsEventName("session_details_submitted")).toBe(false);
  });

  it("keeps Wind-Down analytics to event names and coarse sync failure metadata", () => {
    const properties = createPrivacySafeAnalyticsProperties({
      ambient_sound_id: "light-rain",
      attempt_count: 2,
      context_goal: "calm_racing_thoughts",
      exact_bedtime_text: "I need to sleep before my 6am medical appointment",
      local_install_id: "install_0123456789abcdef",
      reason_class: "validation_error",
      record_type: "wind_down_run",
      routine_id: "wind_down_racing_thoughts",
      sync_stage: "post_value_sync",
      user_id: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(properties).toEqual({
      attempt_count: 2,
      reason_class: "validation_error",
      record_type: "wind_down_run",
      sync_stage: "post_value_sync",
    });
    expect(JSON.stringify(properties)).not.toMatch(
      /light-rain|calm_racing_thoughts|wind_down_racing_thoughts|medical|install_|123e4567/i,
    );
  });

  it("allows only allowlisted Sound Mixer playback telemetry", () => {
    const properties = createPrivacySafeAnalyticsProperties({
      active_layer_count: 3,
      audio_asset_id: "apps/mobile/assets/audio/sleep/light-rain.m4a",
      audio_failure_class: "missing_bundled_asset",
      audio_mode: "sound-mixer",
      exact_mix_name: "Rain beside Bruno's window",
      source_surface: "sound_mixer",
      sound_category_id: "rain",
      sound_category_ids: ["rain", "noise"],
      sound_id: "light-rain",
      sound_ids: ["light-rain", "brown-noise"],
      timer_option: 30,
      timer_duration_seconds: 1_800,
      volume_by_sound_id: { "light-rain": 72 },
    });

    expect(properties).toEqual({
      active_layer_count: 3,
      audio_failure_class: "missing_bundled_asset",
      audio_mode: "sound-mixer",
      source_surface: "sound_mixer",
      sound_category_id: "rain",
      sound_category_ids: ["rain", "noise"],
      sound_id: "light-rain",
      sound_ids: ["light-rain", "brown-noise"],
      timer_option: 30,
      timer_duration_seconds: 1_800,
    });
    expect(JSON.stringify(properties)).not.toMatch(
      /Rain beside|Bruno|apps\/mobile|\.m4a/i,
    );
  });

  it("redacts sync failure observability to reason classes and non-sensitive counters", () => {
    const context = createPrivacySafeSyncFailureContext({
      attemptCount: 3,
      error: new Error(
        "HTTP 500 while syncing install_0123456789abcdef for user 123e4567-e89b-12d3-a456-426614174000 with token secret",
      ),
      reasonClass: "server_error",
      recordType: "sound_mix",
      syncStage: "post_value_sync",
    });

    expect(context.analyticsProperties).toEqual({
      attempt_count: 3,
      reason_class: "server_error",
      record_type: "sound_mix",
      sync_stage: "post_value_sync",
    });
    expect(context.sentryBreadcrumb).toEqual({
      category: "sync",
      data: {
        attempt_count: 3,
        reason_class: "server_error",
        record_type: "sound_mix",
        sync_stage: "post_value_sync",
      },
      level: "warning",
      message: "sync_failed",
    });
    expect(JSON.stringify(context)).not.toMatch(/install_|123e4567|token secret|HTTP 500/);
  });
});
