import { Tabs, useLocalSearchParams, usePathname } from "expo-router";

import { AppTabBar } from "../../navigation/app-tab-bar";
import { FirstLaunchOnboardingGate } from "../../onboarding/first-launch-onboarding-gate";

export default function TabLayout() {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ firstLaunch?: string | string[] }>();
  const allowIncompleteOnboarding = isFirstLaunchSessionRoute(pathname, params.firstLaunch);

  return (
    <FirstLaunchOnboardingGate allowIncompleteOnboarding={allowIncompleteOnboarding}>
      <Tabs
        initialRouteName="index"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <AppTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="sleep" options={{ title: "Sleep" }} />
        <Tabs.Screen name="breathe" options={{ title: "Breathe" }} />
        <Tabs.Screen name="progress" options={{ title: "Progress" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </FirstLaunchOnboardingGate>
  );
}

function isFirstLaunchSessionRoute(
  pathname: string,
  firstLaunchParam: string | string[] | undefined,
): boolean {
  return pathname.startsWith("/breathe/") && parseFirstLaunch(firstLaunchParam);
}

function parseFirstLaunch(value: string | string[] | undefined): boolean {
  const firstLaunch = Array.isArray(value) ? value[0] : value;

  return firstLaunch === "1" || firstLaunch === "true";
}
