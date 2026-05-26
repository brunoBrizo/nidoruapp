import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { RESTING_BREATHING_ORB_TEST_IDS } from "../src/breathing/breathing-orb";
import {
  ONBOARDING_SPLASH_BACKGROUND_COLOR,
  ONBOARDING_SPLASH_ORB_PULSE_MOTION,
  OnboardingSplashScreen,
  getOnboardingSplashOrbPulseConfig,
} from "../src/onboarding/onboarding-splash-screen";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

describe("OnboardingSplashScreen", () => {
  it("renders the splash-only first screen without capture or loading chrome", () => {
    render(<OnboardingSplashScreen />);

    expect(ONBOARDING_SPLASH_BACKGROUND_COLOR).toBe("#0D0F1A");
    expect(screen.getByTestId("onboarding-splash-screen").props.className).toEqual(
      "flex-1 bg-nidoru-dark-background",
    );
    expect(screen.getByTestId("onboarding-splash-wordmark").props.className).toContain(
      "font-nidoru-primary-semibold",
    );
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
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core).props.className).toContain(
      "h-14 w-14",
    );
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core).props.className).toContain(
      "bg-[#7C6FCD]",
    );
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.softGlow).props.className).toEqual(
      expect.stringContaining("h-[68px] w-[68px]"),
    );
    expect(splashOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.softGlow).props.className).toEqual(
      expect.stringContaining("bg-[#A89CE0]/[0.35]"),
    );
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
