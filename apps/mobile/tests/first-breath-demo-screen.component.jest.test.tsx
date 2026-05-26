import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { act, render, screen, waitFor, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { RESTING_BREATHING_ORB_TEST_IDS } from "../src/breathing/breathing-orb";
import {
  FIRST_BREATH_DEMO_BREATH_TIMING,
  FIRST_BREATH_DEMO_COMPLETION_COPY,
  FIRST_BREATH_DEMO_COPY,
  FIRST_BREATH_DEMO_SCREEN_EXIT_MS,
  FirstBreathDemoScreen,
  getFirstBreathDemoPhaseForElapsedMs,
} from "../src/onboarding/first-breath-demo-screen";
import {
  ONBOARDING_FIRST_BREATH_SPLASH_DELAY_MS,
  OnboardingFlowScreen,
} from "../src/onboarding/onboarding-flow-screen";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: {
    Light: "light",
    Soft: "soft",
  },
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

afterEach(() => {
  jest.useRealTimers();
});

const advanceDemoByPhases = (phaseCount: number) => {
  for (let phaseIndex = 0; phaseIndex < phaseCount; phaseIndex += 1) {
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  }
};

describe("FirstBreathDemoScreen", () => {
  it("defines the 30-second coherent breathing demo contract", () => {
    expect(FIRST_BREATH_DEMO_BREATH_TIMING).toEqual({
      cycles: 3,
      exhaleDurationMs: 5000,
      inhaleDurationMs: 5000,
      totalDurationMs: 30000,
    });
    expect(getFirstBreathDemoPhaseForElapsedMs(0)).toMatchObject({
      copy: FIRST_BREATH_DEMO_COPY.inhale,
      cycle: 1,
      phase: "inhale",
    });
    expect(getFirstBreathDemoPhaseForElapsedMs(4999)).toMatchObject({
      copy: FIRST_BREATH_DEMO_COPY.inhale,
      cycle: 1,
      phase: "inhale",
    });
    expect(getFirstBreathDemoPhaseForElapsedMs(5000)).toMatchObject({
      copy: FIRST_BREATH_DEMO_COPY.exhale,
      cycle: 1,
      phase: "exhale",
    });
    expect(getFirstBreathDemoPhaseForElapsedMs(10000)).toMatchObject({
      copy: FIRST_BREATH_DEMO_COPY.inhale,
      cycle: 2,
      phase: "inhale",
    });
    expect(getFirstBreathDemoPhaseForElapsedMs(29999)).toMatchObject({
      copy: FIRST_BREATH_DEMO_COPY.exhale,
      cycle: 3,
      phase: "exhale",
    });
    expect(getFirstBreathDemoPhaseForElapsedMs(30000)).toEqual({
      copy: FIRST_BREATH_DEMO_COMPLETION_COPY,
      phase: "complete",
    });
  });

  it("renders the first breath demo without capture, chrome, gates, or extra surfaces", () => {
    render(<FirstBreathDemoScreen disableHaptics />);

    expect(screen.getByTestId("first-breath-demo-screen").props.className).toEqual(
      "flex-1 bg-nidoru-dark-background",
    );
    expect(screen.getByText(FIRST_BREATH_DEMO_COPY.inhale)).toBeTruthy();
    expect(screen.queryByText(FIRST_BREATH_DEMO_COPY.exhale)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(
      screen.queryByText(
        /account|paywall|permission|notification|microphone|health|loading|spinner|skip/i,
      ),
    ).toBeNull();

    const demoOrb = within(screen.getByTestId("first-breath-demo-orb"));
    expect(demoOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core).props.className).toContain(
      "h-14 w-14",
    );
    expect(demoOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core).props.className).toContain(
      "bg-[#7C6FCD]",
    );
    expect(demoOrb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.softGlow).props.className).toContain(
      "bg-[#A89CE0]/[0.35]",
    );
  });

  it("cycles synced phase copy for 30 seconds before handing off", () => {
    jest.useFakeTimers();
    const onComplete = jest.fn();

    render(
      <FirstBreathDemoScreen autoAdvanceDelayMs={50} disableHaptics onComplete={onComplete} />,
    );

    expect(screen.getByText(FIRST_BREATH_DEMO_COPY.inhale)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText(FIRST_BREATH_DEMO_COPY.exhale)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    advanceDemoByPhases(5);
    expect(screen.getByText(FIRST_BREATH_DEMO_COMPLETION_COPY)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(50 + FIRST_BREATH_DEMO_SCREEN_EXIT_MS);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it("does not wait for breath-complete event persistence before handing off", () => {
    jest.useFakeTimers();
    const onBreathComplete = jest.fn(
      () =>
        new Promise<void>(() => {
          // Keep event persistence unresolved to prove it is not on the animation handoff path.
        }),
    );
    const onComplete = jest.fn();

    render(
      <FirstBreathDemoScreen
        autoAdvanceDelayMs={50}
        disableHaptics
        onBreathComplete={onBreathComplete}
        onComplete={onComplete}
      />,
    );

    advanceDemoByPhases(6);
    expect(onBreathComplete).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(50 + FIRST_BREATH_DEMO_SCREEN_EXIT_MS);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});

describe("OnboardingFlowScreen", () => {
  it("resumes directly into personalization after the first session reflection is already saved", async () => {
    const persistOnboardingStarted = jest.fn(() => Promise.resolve());
    const startDefaultFirstSession = jest.fn();

    render(
      <OnboardingFlowScreen
        initialStep="personalization"
        persistOnboardingStarted={persistOnboardingStarted}
        startDefaultFirstSession={startDefaultFirstSession}
      />,
    );

    expect(screen.getByTestId("onboarding-personalization-flow-entry")).toBeTruthy();
    expect(screen.getByRole("header", { name: "What brings you here?" })).toBeTruthy();
    expect(persistOnboardingStarted).not.toHaveBeenCalled();
    expect(startDefaultFirstSession).not.toHaveBeenCalled();
  });

  it("resumes recoverable first-session or reflection states before replaying onboarding", async () => {
    const persistOnboardingStarted = jest.fn(() => Promise.resolve());
    const startDefaultFirstSession = jest.fn();

    render(
      <OnboardingFlowScreen
        initialStep="first-session"
        persistOnboardingStarted={persistOnboardingStarted}
        startDefaultFirstSession={startDefaultFirstSession}
      />,
    );

    await waitFor(() => {
      expect(startDefaultFirstSession).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId("onboarding-personalization-flow-entry")).toBeNull();
    expect(persistOnboardingStarted).not.toHaveBeenCalled();
  });

  it("places the 30-second demo immediately after splash and before personalization", async () => {
    const persistFirstBreathDemoEvent = jest.fn(() => Promise.resolve());
    const startDefaultFirstSession = jest.fn();

    render(
      <OnboardingFlowScreen
        firstBreathAutoAdvanceDelayMs={50}
        initialStep="first-breath-demo"
        persistFirstBreathDemoEvent={persistFirstBreathDemoEvent}
        startDefaultFirstSession={startDefaultFirstSession}
      />,
    );

    expect(ONBOARDING_FIRST_BREATH_SPLASH_DELAY_MS).toBeLessThan(2000);
    expect(screen.getByText(FIRST_BREATH_DEMO_COPY.inhale)).toBeTruthy();
    await waitFor(() => {
      expect(persistFirstBreathDemoEvent).toHaveBeenCalledWith("started");
    });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText(/account|paywall|permission|question|loading|skip/i)).toBeNull();
    expect(startDefaultFirstSession).not.toHaveBeenCalled();
    expect(screen.queryByTestId("onboarding-personalization-flow-entry")).toBeNull();
    expect(screen.queryByRole("header", { name: "What brings you here?" })).toBeNull();
  });
});
