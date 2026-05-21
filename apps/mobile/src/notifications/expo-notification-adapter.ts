import * as Notifications from "expo-notifications";

import type { NativeNotificationAdapter } from "./notification-permission-service";

export const expoNotificationAdapter: NativeNotificationAdapter = {
  androidImportanceLow: Notifications.AndroidImportance.LOW,
  dateTriggerType: Notifications.SchedulableTriggerInputTypes.DATE,
  cancelScheduledNotificationAsync: Notifications.cancelScheduledNotificationAsync,
  getPermissionsAsync: Notifications.getPermissionsAsync,
  requestPermissionsAsync: Notifications.requestPermissionsAsync,
  scheduleNotificationAsync: (request) =>
    Notifications.scheduleNotificationAsync(request as Notifications.NotificationRequestInput),
  setNotificationChannelAsync: Notifications.setNotificationChannelAsync,
};
