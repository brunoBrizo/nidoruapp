import "expo-dev-client";

import { typography } from "@nidoru/ui-tokens";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { OnboardingSplashScreen } from "../onboarding/onboarding-splash-screen";
import { ObservabilityProvider } from "../observability/ObservabilityProvider";
import { initializeSentry, withSentryRoot } from "../observability/sentry";
import inter300 from "../../assets/fonts/Inter-300.ttf";
import inter400 from "../../assets/fonts/Inter-400.ttf";
import nunito400 from "../../assets/fonts/Nunito-400.ttf";
import nunito600 from "../../assets/fonts/Nunito-600.ttf";
import nunito700 from "../../assets/fonts/Nunito-700.ttf";
import nunito800 from "../../assets/fonts/Nunito-800.ttf";

initializeSentry();

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [typography.mobileFontFamily.primary.regular]: nunito400,
    [typography.mobileFontFamily.primary.semiBold]: nunito600,
    [typography.mobileFontFamily.primary.bold]: nunito700,
    [typography.mobileFontFamily.primary.extraBold]: nunito800,
    [typography.mobileFontFamily.data.light]: inter300,
    [typography.mobileFontFamily.data.regular]: inter400,
  });

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded) {
    return <OnboardingSplashScreen useWordmarkFont={false} />;
  }

  return (
    <ObservabilityProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="observability-proof" />
      </Stack>
      <StatusBar style="light" />
    </ObservabilityProvider>
  );
}

export default withSentryRoot(RootLayout);
