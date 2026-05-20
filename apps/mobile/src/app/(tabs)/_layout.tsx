import { Tabs } from "expo-router";

import { AppTabBar } from "../../navigation/app-tab-bar";

export default function TabLayout() {
  return (
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
  );
}
