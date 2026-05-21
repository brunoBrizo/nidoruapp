import { useRouter } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";

import {
  getOrCreateLocalInstallIdentity,
  hasCompletedOnboardingPersonalization,
  type LocalFirstOnboardingDatabase,
} from "./local-first-onboarding";
import { OnboardingSplashScreen } from "./onboarding-splash-screen";
import { openMigratedLocalDatabase } from "../storage/local-database";

type FirstLaunchOnboardingGateBaseProps = {
  readonly allowIncompleteOnboarding?: boolean;
  readonly children: ReactNode;
  readonly loadShouldStartOnboarding?: () => Promise<boolean>;
  readonly replaceRoute: (route: "/onboarding") => void;
};

type GateState = "checking" | "home" | "redirecting";

export function FirstLaunchOnboardingGate({
  allowIncompleteOnboarding = false,
  children,
}: {
  readonly allowIncompleteOnboarding?: boolean;
  readonly children: ReactNode;
}) {
  const router = useRouter();

  return (
    <FirstLaunchOnboardingGateBase
      allowIncompleteOnboarding={allowIncompleteOnboarding}
      replaceRoute={(route) => {
        router.replace(route);
      }}
    >
      {children}
    </FirstLaunchOnboardingGateBase>
  );
}

export function FirstLaunchOnboardingGateBase({
  allowIncompleteOnboarding = false,
  children,
  loadShouldStartOnboarding = shouldStartFirstLaunchOnboarding,
  replaceRoute,
}: FirstLaunchOnboardingGateBaseProps) {
  const [gateState, setGateState] = useState<GateState>("checking");

  useEffect(() => {
    if (allowIncompleteOnboarding) {
      return;
    }

    let isMounted = true;

    async function resolveGate() {
      setGateState("checking");

      try {
        const shouldStartOnboarding = await loadShouldStartOnboarding();

        if (!isMounted) {
          return;
        }

        if (shouldStartOnboarding) {
          setGateState("redirecting");
          replaceRoute("/onboarding");
          return;
        }

        setGateState("home");
      } catch {
        if (!isMounted) {
          return;
        }

        setGateState("redirecting");
        replaceRoute("/onboarding");
      }
    }

    void resolveGate();

    return () => {
      isMounted = false;
    };
  }, [allowIncompleteOnboarding, loadShouldStartOnboarding, replaceRoute]);

  if (!allowIncompleteOnboarding && gateState !== "home") {
    return <OnboardingSplashScreen />;
  }

  return children;
}

async function shouldStartFirstLaunchOnboarding(): Promise<boolean> {
  const database = await openMigratedLocalDatabase();
  const localDatabase: LocalFirstOnboardingDatabase = {
    getFirstAsync: (source, params = []) => database.getFirstAsync(source, [...params]),
    runAsync: (source, params = []) => database.runAsync(source, [...params]),
  };
  const localInstallId = await getOrCreateLocalInstallIdentity({ database: localDatabase });
  const hasCompletedOnboarding = await hasCompletedOnboardingPersonalization(localDatabase, {
    localInstallId,
  });

  return !hasCompletedOnboarding;
}
