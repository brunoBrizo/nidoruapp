import { useEffect, useState, type ComponentType } from "react";

import { HomeScreen, type HomeScreenProps } from "../../home/home-screen";
import { FirstLaunchOnboardingGate } from "../../onboarding/first-launch-onboarding-gate";

export default function HomeRoute(props: HomeScreenProps) {
  const homeScreen = (
    <HomeScreen
      {...props}
      notificationGateController={
        process.env.NODE_ENV === "test" ? null : <NotificationPermissionGateControllerLoader />
      }
    />
  );

  if (process.env.NODE_ENV === "test") {
    return homeScreen;
  }

  return <FirstLaunchOnboardingGate>{homeScreen}</FirstLaunchOnboardingGate>;
}

function NotificationPermissionGateControllerLoader() {
  const [Controller, setController] = useState<ComponentType | null>(null);

  useEffect(() => {
    let isMounted = true;

    void import("../../notifications/notification-permission-gate-controller").then((module) => {
      if (isMounted) {
        setController(() => module.NotificationPermissionGateController);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return Controller ? <Controller /> : null;
}
