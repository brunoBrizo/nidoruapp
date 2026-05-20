import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";

import { RESTING_BREATHING_ORB_TEST_IDS } from "../src/breathing/breathing-orb";
import {
  ONBOARDING_SPLASH_BACKGROUND_COLOR,
  ONBOARDING_SPLASH_ORB_PULSE_MOTION,
  OnboardingSplashScreen,
  getOnboardingSplashOrbPulseConfig,
} from "../src/onboarding/onboarding-splash-screen";

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

describe("OnboardingSplashScreen", () => {
  it("renders the splash-only first screen without capture or loading chrome", () => {
    render(<OnboardingSplashScreen />);

    expect(
      StyleSheet.flatten(screen.getByTestId("onboarding-splash-screen").props.style),
    ).toMatchObject({
      backgroundColor: ONBOARDING_SPLASH_BACKGROUND_COLOR,
      flex: 1,
    });
    expect(StyleSheet.flatten(screen.getByTestId("onboarding-splash-wordmark").props.style)).toMatchObject({
      fontFamily: "Nunito-600",
    });
    expect(screen.getByRole("header", { name: "nidoru" })).toBeTruthy();
    expect(screen.queryByText("Nidoru")).toBeNull();
    expect(
      screen.queryByText(/start|continue|skip|sign in|account|paywall|permission|loading/i),
    ).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("uses the same resting orb language as Home instead of a splash-specific illustration", () => {
    render(<OnboardingSplashScreen />);

    const splashOrb = within(screen.getByTestId("onboarding-splash-resting-orb"));
    const coreStyle = StyleSheet.flatten(
      splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core).props.style,
    );
    const glowStyle = StyleSheet.flatten(
      splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.softGlow).props.style,
    );

    expect(coreStyle).toMatchObject({
      backgroundColor: "#7C6FCD",
      borderRadius: 28,
      height: 56,
      width: 56,
    });
    expect(glowStyle).toMatchObject({
      backgroundColor: "rgba(168, 156, 224, 0.35)",
      height: 68,
      width: 68,
    });
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.outerRing)).toBeTruthy();
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.middleRing)).toBeTruthy();
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.highlight)).toBeTruthy();
  });

  it("defines one calm non-looping inhale-length orb pulse", () => {
    expect(ONBOARDING_SPLASH_ORB_PULSE_MOTION).toEqual({
      durationMs: 4000,
      easing: "ease-in-out",
      isLooping: false,
      peakScale: 1.04,
      restScale: 1,
    });
    expect(getOnboardingSplashOrbPulseConfig(false)).toEqual(ONBOARDING_SPLASH_ORB_PULSE_MOTION);
    expect(getOnboardingSplashOrbPulseConfig(true)).toEqual({
      durationMs: 0,
      easing: "ease-in-out",
      isLooping: false,
      peakScale: 1,
      restScale: 1,
    });
  });
});
