import { colors, spacing, typography } from "@nidoru/ui-tokens";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import { RestingBreathingOrb } from "../breathing/breathing-orb";
import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";

export const ONBOARDING_SPLASH_BACKGROUND_COLOR = colors.dark.background.value;

export const ONBOARDING_SPLASH_ORB_PULSE_MOTION = {
  durationMs: 4000,
  easing: "ease-in-out",
  isLooping: false,
  peakScale: 1.04,
  restScale: 1,
} as const;

export const getOnboardingSplashOrbPulseConfig = (reduceMotionEnabled: boolean) => ({
  durationMs: reduceMotionEnabled ? 0 : ONBOARDING_SPLASH_ORB_PULSE_MOTION.durationMs,
  easing: ONBOARDING_SPLASH_ORB_PULSE_MOTION.easing,
  isLooping: ONBOARDING_SPLASH_ORB_PULSE_MOTION.isLooping,
  peakScale: reduceMotionEnabled
    ? ONBOARDING_SPLASH_ORB_PULSE_MOTION.restScale
    : ONBOARDING_SPLASH_ORB_PULSE_MOTION.peakScale,
  restScale: ONBOARDING_SPLASH_ORB_PULSE_MOTION.restScale,
});

type OnboardingSplashScreenProps = {
  readonly useWordmarkFont?: boolean;
};

export function OnboardingSplashScreen({ useWordmarkFont = true }: OnboardingSplashScreenProps) {
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    !reduceMotionPreference.isResolved || reduceMotionPreference.reduceMotionEnabled;
  const pulseConfig = getOnboardingSplashOrbPulseConfig(reduceMotionEnabled);
  const pulseProgress = useRef(new Animated.Value(0)).current;
  const orbScale = pulseProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 0.5, 1],
    outputRange: [pulseConfig.restScale, pulseConfig.peakScale, pulseConfig.restScale],
  });

  useEffect(() => {
    if (!reduceMotionPreference.isResolved) {
      return;
    }

    if (pulseConfig.durationMs === 0) {
      pulseProgress.setValue(1);
      return;
    }

    pulseProgress.setValue(0);
    Animated.timing(pulseProgress, {
      duration: pulseConfig.durationMs,
      easing: Easing.inOut(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [pulseConfig.durationMs, pulseProgress, reduceMotionPreference.isResolved]);

  return (
    <View style={styles.screen} testID="onboarding-splash-screen">
      <StatusBar style="light" />
      <View style={styles.content}>
        <Animated.View
          style={[styles.orbPulse, { transform: [{ scale: orbScale }] }]}
          testID="onboarding-splash-orb-pulse"
        >
          <RestingBreathingOrb
            accessibilityLabel="Resting breathing orb preview"
            isDecorative={false}
            testID="onboarding-splash-resting-orb"
          />
        </Animated.View>
        <Text
          accessibilityRole="header"
          selectable
          style={[styles.wordmark, useWordmarkFont && styles.wordmarkFont]}
          testID="onboarding-splash-wordmark"
        >
          nidoru
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: ONBOARDING_SPLASH_BACKGROUND_COLOR,
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 72,
    paddingHorizontal: spacing.screenPadding,
  },
  orbPulse: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    color: "rgba(238, 240, 255, 0.86)",
    fontSize: 30,
    letterSpacing: 0,
    lineHeight: 38,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  wordmarkFont: {
    fontFamily: typography.mobileFontFamily.primary.semiBold,
  },
});
