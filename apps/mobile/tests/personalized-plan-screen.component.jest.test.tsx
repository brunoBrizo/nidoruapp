import { createPersonalizedOnboardingPlan } from "@nidoru/domain";
import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { PersonalizedPlanScreen } from "../src/onboarding/personalized-plan-screen";

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

const referencePlan = createPersonalizedOnboardingPlan({
  breathworkFamiliarity: "new_to_me",
  goal: "curiosity",
  sleepBaseline: 4,
  windDownMinutesAfterMidnight: 22 * 60 + 30,
});

describe("PersonalizedPlanScreen", () => {
  it("keeps the PNG-faithful surfaces while using post-session copy", () => {
    jest.useFakeTimers();
    const continueWithPlan = jest.fn();

    render(
      <PersonalizedPlanScreen
        ctaLabel="Let’s start"
        onContinue={continueWithPlan}
        plan={referencePlan}
        screenExitMs={0}
        sessionEyebrow="Next session"
        statusLabel="Your follow-up plan is ready"
      />,
    );

    expect(screen.getByText("Your follow-up plan is ready")).toBeTruthy();
    expect(screen.getByText("Your plan")).toBeTruthy();
    expect(screen.getByText("General Wellness")).toBeTruthy();
    expect(screen.getByText("Next session")).toBeTruthy();
    expect(screen.getByText("4 min guided breathing")).toBeTruthy();
    expect(screen.getByText("Gentle cues for your 10:30 PM wind-down")).toBeTruthy();
    expect(screen.getByText("4 min")).toBeTruthy();
    expect(screen.getByText("Gentle guidance")).toBeTruthy();
    expect(screen.getByText("No account needed")).toBeTruthy();
    expect(screen.getByText("Based on your answers")).toBeTruthy();
    expect(screen.getByText("Wind-down around 10:30 PM")).toBeTruthy();
    expect(screen.getByText("New to breathwork")).toBeTruthy();
    expect(screen.getByText("Start simple")).toBeTruthy();
    expect(screen.queryByText("First session")).toBeNull();
    expect(screen.queryByText("Saved locally")).toBeNull();
    expect(screen.queryByText(/create account|sign in|paywall|subscribe|notification/i)).toBeNull();

    expect(screen.getByTestId("personalized-plan-card").props.className).toContain(
      "min-h-[224px]",
    );
    expect(screen.getByTestId("personalized-plan-card").props.className).toContain(
      "rounded-[28px]",
    );
    expect(screen.getByTestId("personalized-plan-card").props.className).toContain(
      "bg-nidoru-dark-surface",
    );
    expect(screen.getByTestId("personalized-plan-card").props.className).toContain("p-6");
    expect(screen.getByTestId("personalized-plan-card-fade")).toBeTruthy();
    expect(screen.getByTestId("personalized-plan-answer-card").props.className).toEqual(
      expect.stringContaining("mt-4"),
    );
    expect(screen.getByTestId("personalized-plan-answer-card").props.className).toEqual(
      expect.stringContaining("rounded-[24px]"),
    );
    expect(screen.getByTestId("personalized-plan-answer-card").props.className).toEqual(
      expect.stringContaining("p-4"),
    );

    fireEvent.press(screen.getByRole("button", { name: "Let’s start" }));
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(continueWithPlan).toHaveBeenCalledWith(referencePlan);
    jest.useRealTimers();
  });
});
