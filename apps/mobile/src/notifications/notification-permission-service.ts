import {
  eveningReminderNotificationContent,
  getNextEveningReminderDate,
  type SystemNotificationPermissionState,
} from "@nidoru/domain";

import {
  markNotificationPermissionAccepted,
  markNotificationPermissionDeclined,
  markNotificationPermissionPrompted,
  type LocalFirstOnboardingDatabase,
} from "../onboarding/local-first-onboarding";
import { captureAnalyticsEvent } from "../observability/posthog";

export const eveningReminderNotificationIdentifier = "evening-anchor";
export const eveningReminderNotificationChannelId = "evening-reminders";

type NotificationPermissionStatusLike = {
  readonly granted?: boolean;
  readonly status: string;
};

type NotificationPermissionRequest = {
  readonly android?: object;
  readonly ios?: {
    readonly allowAlert?: boolean;
    readonly allowBadge?: boolean;
    readonly allowSound?: boolean;
  };
};

type NotificationContentInput = {
  readonly body?: string;
  readonly data?: Record<string, string>;
  readonly interruptionLevel?: "passive" | "active" | "timeSensitive" | "critical";
  readonly sound?: boolean | string;
  readonly title?: string;
};

type NotificationTriggerInput = {
  readonly channelId?: string;
  readonly date: Date;
  readonly type: string;
};

type EveningReminderNotificationContent = {
  readonly body: string;
  readonly title: string;
};

export type NativeNotificationAdapter = {
  readonly androidImportanceLow: number;
  readonly dateTriggerType: string;
  readonly cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  readonly getPermissionsAsync: () => Promise<NotificationPermissionStatusLike>;
  readonly requestPermissionsAsync: (
    request?: NotificationPermissionRequest,
  ) => Promise<NotificationPermissionStatusLike>;
  readonly scheduleNotificationAsync: (request: {
    readonly content: NotificationContentInput;
    readonly identifier: string;
    readonly trigger: NotificationTriggerInput;
  }) => Promise<string>;
  readonly setNotificationChannelAsync: (
    channelId: string,
    channel: {
      readonly description: string;
      readonly enableVibrate: boolean;
      readonly importance: number;
      readonly name: string;
      readonly showBadge: boolean;
      readonly sound: null;
    },
  ) => Promise<unknown>;
};

export type NotificationPlatformOS = "android" | "ios" | "web" | "macos" | "windows";

export type NotificationGatePermissionResult =
  | {
      readonly permissionState: "accepted";
      readonly scheduleStatus: "failed" | "scheduled";
      readonly scheduledAt: Date | null;
    }
  | {
      readonly permissionState: "declined" | "error";
      readonly scheduleStatus: "not_scheduled";
      readonly scheduledAt: null;
    };

export function mapSystemNotificationPermissionState({
  granted,
  status,
}: NotificationPermissionStatusLike): SystemNotificationPermissionState {
  if (granted || status === "granted") {
    return "granted";
  }

  if (status === "denied") {
    return "denied";
  }

  return "undetermined";
}

export async function requestNotificationPermissionFromGate({
  adapter,
  database,
  localInstallId,
  now,
  platformOS,
  windDownMinutesAfterMidnight,
  content,
}: {
  readonly adapter: NativeNotificationAdapter;
  readonly content?: EveningReminderNotificationContent;
  readonly database: LocalFirstOnboardingDatabase;
  readonly localInstallId: string;
  readonly now: Date;
  readonly platformOS: NotificationPlatformOS;
  readonly windDownMinutesAfterMidnight: number | null;
}): Promise<NotificationGatePermissionResult> {
  await markNotificationPermissionPrompted({
    database,
    localInstallId,
    now,
  });
  captureAnalyticsEvent("notification_permission_prompted");

  let permissionStatus: SystemNotificationPermissionState;

  try {
    if (platformOS === "android") {
      await ensureAndroidEveningReminderChannel(adapter);
    }

    permissionStatus = mapSystemNotificationPermissionState(
      await adapter.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: false,
        },
      }),
    );
  } catch {
    return {
      permissionState: "error",
      scheduleStatus: "not_scheduled",
      scheduledAt: null,
    };
  }

  if (permissionStatus !== "granted") {
    await markNotificationPermissionDeclined({
      database,
      localInstallId,
      now,
    });

    return {
      permissionState: "declined",
      scheduleStatus: "not_scheduled",
      scheduledAt: null,
    };
  }

  await markNotificationPermissionAccepted({
    database,
    localInstallId,
    now,
  });
  captureAnalyticsEvent("notification_permission_accepted");

  const scheduleResult = await reconcileEveningReminderSchedule({
    adapter,
    lastOpenedAt: now,
    now,
    platformOS,
    windDownMinutesAfterMidnight,
    ...(content ? { content } : {}),
  });

  return {
    permissionState: "accepted",
    scheduleStatus: scheduleResult.status,
    scheduledAt: scheduleResult.scheduledAt,
  };
}

export async function declineNotificationPrePermission({
  database,
  localInstallId,
  now,
}: {
  readonly database: LocalFirstOnboardingDatabase;
  readonly localInstallId: string;
  readonly now: Date;
}): Promise<void> {
  await markNotificationPermissionDeclined({
    database,
    localInstallId,
    now,
  });
}

export async function reconcileEveningReminderSchedule({
  adapter,
  lastOpenedAt,
  now,
  platformOS,
  windDownMinutesAfterMidnight,
  content = eveningReminderNotificationContent,
}: {
  readonly adapter: NativeNotificationAdapter;
  readonly content?: EveningReminderNotificationContent;
  readonly lastOpenedAt: Date | null;
  readonly now: Date;
  readonly platformOS: NotificationPlatformOS;
  readonly windDownMinutesAfterMidnight: number | null;
}): Promise<{ readonly scheduledAt: Date | null; readonly status: "failed" | "scheduled" }> {
  const scheduledAt = getNextEveningReminderDate({
    lastOpenedAt,
    now,
    windDownMinutesAfterMidnight,
  });

  try {
    if (platformOS === "android") {
      await ensureAndroidEveningReminderChannel(adapter);
    }

    await adapter.cancelScheduledNotificationAsync(eveningReminderNotificationIdentifier);
    await adapter.scheduleNotificationAsync({
      identifier: eveningReminderNotificationIdentifier,
      content: {
        title: content.title,
        body: content.body,
        data: {
          kind: "evening_anchor",
        },
        interruptionLevel: "passive",
        sound: false,
      },
      trigger: {
        type: adapter.dateTriggerType,
        date: scheduledAt,
        channelId: eveningReminderNotificationChannelId,
      },
    });

    return {
      scheduledAt,
      status: "scheduled",
    };
  } catch {
    return {
      scheduledAt: null,
      status: "failed",
    };
  }
}

async function ensureAndroidEveningReminderChannel(adapter: NativeNotificationAdapter) {
  await adapter.setNotificationChannelAsync(eveningReminderNotificationChannelId, {
    name: "Evening reminders",
    description: "One quiet evening reminder if Nidoru has not been opened.",
    importance: adapter.androidImportanceLow,
    showBadge: false,
    enableVibrate: false,
    sound: null,
  });
}
