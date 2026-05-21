import { canPromptForNotificationPermission } from "@nidoru/domain";
import { getLocaleMessages, type LocaleMessages } from "@nidoru/i18n";
import { getLocales } from "expo-localization";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  getOrCreateLocalInstallIdentity,
  loadNotificationGateReadiness,
  markLocalInstallSeen,
  type LocalFirstOnboardingDatabase,
  type NotificationGateReadiness,
} from "../onboarding/local-first-onboarding";
import { openMigratedLocalDatabase } from "../storage/local-database";
import { expoNotificationAdapter } from "./expo-notification-adapter";
import { NotificationPermissionGateScreen } from "./notification-permission-gate-screen";
import {
  declineNotificationPrePermission,
  mapSystemNotificationPermissionState,
  reconcileEveningReminderSchedule,
  requestNotificationPermissionFromGate,
  type NativeNotificationAdapter,
} from "./notification-permission-service";

type ActiveNotificationGate = {
  readonly copy: LocaleMessages["notificationGate"];
  readonly database: LocalFirstOnboardingDatabase;
  readonly localInstallId: string;
  readonly windDownMinutesAfterMidnight: number | null;
};

export type NotificationPermissionGateControllerProps = {
  readonly adapter?: NativeNotificationAdapter;
  readonly enabled?: boolean;
  readonly getNow?: () => Date;
  readonly isInOnboarding?: boolean;
  readonly openDatabase?: () => Promise<LocalFirstOnboardingDatabase>;
};

const getDefaultNow = () => new Date();
const openDefaultLocalDatabase = async (): Promise<LocalFirstOnboardingDatabase> => {
  const database = await openMigratedLocalDatabase();

  return {
    getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
    runAsync: (source, params = []) => database.runAsync(source, [...params]),
  };
};

export function NotificationPermissionGateController({
  adapter = expoNotificationAdapter,
  enabled = true,
  getNow = getDefaultNow,
  isInOnboarding = false,
  openDatabase = openDefaultLocalDatabase,
}: NotificationPermissionGateControllerProps) {
  const [activeGate, setActiveGate] = useState<ActiveNotificationGate | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActiveGate(null);
      return;
    }

    let cancelled = false;

    async function evaluateGate() {
      const now = getNow();
      const copy = getCurrentNotificationGateCopy();
      const database = await openDatabase();
      const localInstallId = await getOrCreateLocalInstallIdentity({
        database,
        now,
      });
      const systemPermissionState = mapSystemNotificationPermissionState(
        await adapter.getPermissionsAsync(),
      );
      const readiness = await loadNotificationGateReadiness({
        database,
        isInOnboarding,
        localInstallId,
        now,
        systemPermissionState,
      });

      await markLocalInstallSeen({
        database,
        localInstallId,
        now,
      });

      if (cancelled) {
        return;
      }

      if (shouldReconcileAcceptedReminder(readiness, systemPermissionState)) {
        await reconcileEveningReminderSchedule({
          adapter,
          content: {
            title: copy.eveningReminderTitle,
            body: copy.eveningReminderBody,
          },
          lastOpenedAt: now,
          now,
          platformOS: Platform.OS,
          windDownMinutesAfterMidnight: readiness.windDownMinutesAfterMidnight,
        });

        return;
      }

      if (canPromptForNotificationPermission(readiness.eligibility)) {
        setActiveGate({
          copy,
          database,
          localInstallId,
          windDownMinutesAfterMidnight: readiness.windDownMinutesAfterMidnight,
        });
      }
    }

    void evaluateGate().catch(() => {
      if (!cancelled) {
        setActiveGate(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [adapter, enabled, getNow, isInOnboarding, openDatabase]);

  if (!activeGate) {
    return null;
  }

  return (
    <NotificationPermissionGateScreen
      copy={activeGate.copy}
      onAccept={async () => {
        await requestNotificationPermissionFromGate({
          adapter,
          content: {
            title: activeGate.copy.eveningReminderTitle,
            body: activeGate.copy.eveningReminderBody,
          },
          database: activeGate.database,
          localInstallId: activeGate.localInstallId,
          now: getNow(),
          platformOS: Platform.OS,
          windDownMinutesAfterMidnight: activeGate.windDownMinutesAfterMidnight,
        });
      }}
      onDecline={async () => {
        await declineNotificationPrePermission({
          database: activeGate.database,
          localInstallId: activeGate.localInstallId,
          now: getNow(),
        });
      }}
      onDismiss={() => {
        setActiveGate(null);
      }}
    />
  );
}

function shouldReconcileAcceptedReminder(
  readiness: NotificationGateReadiness,
  systemPermissionState: "denied" | "granted" | "undetermined",
) {
  return (
    readiness.eligibility.permissionState === "accepted" && systemPermissionState === "granted"
  );
}

function getCurrentNotificationGateCopy() {
  const locale = getLocales()[0]?.languageTag;

  return getLocaleMessages(locale).notificationGate;
}
