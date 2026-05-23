import { Tabs, useLocalSearchParams, usePathname } from "expo-router";

import { AppTabBar } from "../../navigation/app-tab-bar";
import { allowsIncompleteOnboardingForRoute } from "../../navigation/onboarding-route-contract";
import { FirstLaunchOnboardingGate } from "../../onboarding/first-launch-onboarding-gate";

export default function TabLayout() {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ firstLaunch?: string | string[] }>();
  const allowIncompleteOnboarding = allowsIncompleteOnboardingForRoute(
    pathname,
    params.firstLaunch,
  );

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
