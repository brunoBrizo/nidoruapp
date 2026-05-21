import type { AnalyticsEventName } from "./posthog";
import type { PrivacySafeSyncFailureContext } from "./sync-observability";

export function captureAnalyticsEventDeferred(
  eventName: AnalyticsEventName,
  properties?: Readonly<Record<string, unknown>>,
): void {
  void import("./posthog")
    .then(({ captureAnalyticsEvent }) => {
      captureAnalyticsEvent(eventName, properties);
    })
    .catch(() => undefined);
}

export function captureSyncFailureDeferred(context: PrivacySafeSyncFailureContext): void {
  captureAnalyticsEventDeferred(context.analyticsEventName, context.analyticsProperties);

  void import("./sentry")
    .then(({ addSentryBreadcrumb }) => {
      addSentryBreadcrumb(context.sentryBreadcrumb);
    })
    .catch(() => undefined);
}
