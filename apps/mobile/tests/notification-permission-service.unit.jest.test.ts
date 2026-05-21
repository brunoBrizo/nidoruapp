import { describe, expect, it, jest } from "@jest/globals";

import {
  declineNotificationPrePermission,
  eveningReminderNotificationChannelId,
  eveningReminderNotificationIdentifier,
  mapSystemNotificationPermissionState,
  reconcileEveningReminderSchedule,
  requestNotificationPermissionFromGate,
  type NativeNotificationAdapter,
} from "../src/notifications/notification-permission-service";
import type { LocalFirstOnboardingDatabase } from "../src/onboarding/local-first-onboarding";

jest.mock("../src/observability/posthog", () => ({
  captureAnalyticsEvent: jest.fn(),
}));

function createMockDatabase(order: string[] = []) {
  const database: LocalFirstOnboardingDatabase & {
    readonly runAsync: jest.MockedFunction<LocalFirstOnboardingDatabase["runAsync"]>;
    readonly getFirstAsync: jest.MockedFunction<LocalFirstOnboardingDatabase["getFirstAsync"]>;
  } = {
    getFirstAsync: jest.fn<LocalFirstOnboardingDatabase["getFirstAsync"]>().mockResolvedValue(null),
    runAsync: jest
      .fn<LocalFirstOnboardingDatabase["runAsync"]>()
      .mockImplementation(async (sql) => {
        order.push(sql.includes("local_event_queue") ? "event" : "state");
        return undefined;
      }),
  };

  return database;
}

function createNativeAdapter(overrides: Partial<NativeNotificationAdapter> = {}) {
  const adapter: NativeNotificationAdapter = {
    androidImportanceLow: 4,
    dateTriggerType: "date",
    cancelScheduledNotificationAsync: jest
      .fn<NativeNotificationAdapter["cancelScheduledNotificationAsync"]>()
      .mockResolvedValue(undefined),
    getPermissionsAsync: jest
      .fn<NativeNotificationAdapter["getPermissionsAsync"]>()
      .mockResolvedValue({
        granted: false,
        status: "undetermined",
      }),
    requestPermissionsAsync: jest
      .fn<NativeNotificationAdapter["requestPermissionsAsync"]>()
      .mockResolvedValue({
        granted: true,
        status: "granted",
      }),
    scheduleNotificationAsync: jest
      .fn<NativeNotificationAdapter["scheduleNotificationAsync"]>()
      .mockResolvedValue(eveningReminderNotificationIdentifier),
    setNotificationChannelAsync: jest
      .fn<NativeNotificationAdapter["setNotificationChannelAsync"]>()
      .mockResolvedValue(undefined),
    ...overrides,
  };

  return adapter;
}

describe("notification permission service", () => {
  it("maps native notification permission responses into the gate contract", () => {
    expect(mapSystemNotificationPermissionState({ granted: false, status: "undetermined" })).toBe(
      "undetermined",
    );
    expect(mapSystemNotificationPermissionState({ granted: true, status: "granted" })).toBe(
      "granted",
    );
    expect(mapSystemNotificationPermissionState({ granted: false, status: "denied" })).toBe(
      "denied",
    );
  });

  it("records prompted before requesting OS permission and records accepted only after grant", async () => {
    const order: string[] = [];
    const database = createMockDatabase(order);
    const adapter = createNativeAdapter({
      requestPermissionsAsync: jest
        .fn<NativeNotificationAdapter["requestPermissionsAsync"]>()
        .mockImplementation(async () => {
          order.push("request");

          return {
            granted: true,
            status: "granted",
          };
        }),
    });

    await expect(
      requestNotificationPermissionFromGate({
        adapter,
        database,
        localInstallId: "install_0123456789abcdef",
        now: new Date("2026-05-20T12:00:00.000Z"),
        platformOS: "ios",
        windDownMinutesAfterMidnight: 20 * 60 + 30,
      }),
    ).resolves.toMatchObject({
      permissionState: "accepted",
      scheduleStatus: "scheduled",
    });

    expect(order.slice(0, 3)).toEqual(["state", "event", "request"]);
    expect(database.runAsync).toHaveBeenCalledWith(
      expect.stringContaining("local_event_queue"),
      expect.arrayContaining(["notification_permission_accepted"]),
    );
    expect(adapter.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: eveningReminderNotificationIdentifier,
        content: expect.objectContaining({
          body: expect.not.stringMatching(/sleep score|session|sale|discount|badge/i),
          data: {
            kind: "evening_anchor",
          },
          sound: false,
        }),
      }),
    );
  });

  it("records decline without showing the OS prompt", async () => {
    const database = createMockDatabase();
    const adapter = createNativeAdapter();

    await declineNotificationPrePermission({
      database,
      localInstallId: "install_0123456789abcdef",
      now: new Date("2026-05-20T12:00:00.000Z"),
    });

    expect(database.runAsync).toHaveBeenCalledTimes(1);
    expect(adapter.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it("schedules only the next one-off evening reminder and suppresses today after app open", async () => {
    const adapter = createNativeAdapter();

    await expect(
      reconcileEveningReminderSchedule({
        adapter,
        lastOpenedAt: new Date(2026, 0, 3, 8, 5),
        now: new Date(2026, 0, 3, 8, 10),
        platformOS: "android",
        windDownMinutesAfterMidnight: 20 * 60 + 30,
      }),
    ).resolves.toMatchObject({
      status: "scheduled",
    });

    expect(adapter.setNotificationChannelAsync).toHaveBeenCalledWith(
      eveningReminderNotificationChannelId,
      expect.objectContaining({
        enableVibrate: false,
        showBadge: false,
        sound: null,
      }),
    );
    expect(adapter.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      eveningReminderNotificationIdentifier,
    );
    expect(adapter.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: expect.objectContaining({
          channelId: eveningReminderNotificationChannelId,
          date: new Date(2026, 0, 4, 20, 30),
          type: "date",
        }),
      }),
    );
  });
});
