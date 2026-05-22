import type { AnalyticsEventName } from "./posthog";

export type SyncFailureReasonClass =
  | "offline"
  | "auth_denied"
  | "server_error"
  | "rate_limited"
  | "validation_error"
  | "unknown";

export type SyncFailureRecordType =
  | "breath_session"
  | "local_install_link"
  | "first_session_record"
  | "post_session_reflection"
  | "local_event_queue";

export type SyncFailureStage = "post_value_sync" | "analytics_event_flush";

export type PrivacySafeSyncFailureInput = {
  readonly attemptCount: number;
  readonly error?: unknown;
  readonly reasonClass: SyncFailureReasonClass;
  readonly recordType: SyncFailureRecordType;
  readonly syncStage: SyncFailureStage;
};

export type PrivacySafeSyncFailureContext = {
  readonly analyticsEventName: Extract<AnalyticsEventName, "sync_failed">;
  readonly analyticsProperties: {
    readonly attempt_count: number;
    readonly reason_class: SyncFailureReasonClass;
    readonly record_type: SyncFailureRecordType;
    readonly sync_stage: SyncFailureStage;
  };
  readonly sentryBreadcrumb: {
    readonly category: "sync";
    readonly data: {
      readonly attempt_count: number;
      readonly reason_class: SyncFailureReasonClass;
      readonly record_type: SyncFailureRecordType;
      readonly sync_stage: SyncFailureStage;
    };
    readonly level: "warning";
    readonly message: "sync_failed";
  };
};

export function createPrivacySafeSyncFailureContext({
  attemptCount,
  reasonClass,
  recordType,
  syncStage,
}: PrivacySafeSyncFailureInput): PrivacySafeSyncFailureContext {
  const data = {
    attempt_count: Math.max(1, Math.trunc(attemptCount)),
    reason_class: reasonClass,
    record_type: recordType,
    sync_stage: syncStage,
  } as const;

  return {
    analyticsEventName: "sync_failed",
    analyticsProperties: data,
    sentryBreadcrumb: {
      category: "sync",
      data,
      level: "warning",
      message: "sync_failed",
    },
  };
}
