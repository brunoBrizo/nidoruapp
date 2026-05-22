import { createPersonalizedOnboardingPlan } from "@nidoru/domain";
import { colors } from "@nidoru/ui-tokens";
import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";

import { PersonalizedPlanScreen } from "../src/onboarding/personalized-plan-screen";

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
        ctaLabel="Continue"
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

    expect(StyleSheet.flatten(screen.getByTestId("personalized-plan-card").props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: colors.dark.surface.value,
        borderRadius: 28,
        minHeight: 224,
        padding: 24,
      }),
    );
    expect(screen.getByTestId("personalized-plan-card-fade")).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId("personalized-plan-answer-card").props.style),
    ).toEqual(
      expect.objectContaining({
        borderRadius: 24,
        marginTop: 16,
        padding: 16,
      }),
    );

    fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(continueWithPlan).toHaveBeenCalledWith(referencePlan);
    jest.useRealTimers();
  });
});
