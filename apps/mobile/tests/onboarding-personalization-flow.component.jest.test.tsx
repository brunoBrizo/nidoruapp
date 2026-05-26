import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import {
  ONBOARDING_PERSONALIZATION_QUESTION_COUNT,
  OnboardingPersonalizationFlowScreen,
} from "../src/onboarding/onboarding-flow-screen";

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

const forbiddenPrePlanGatePattern =
  /account|paywall|permission|notification|microphone|health|subscribe|sign in/i;
const forbiddenPlanGatePattern =
  /create account|sign in|paywall|subscribe|notification|microphone|health|permission/i;

function continueToNextQuestion() {
  fireEvent.press(screen.getByRole("button", { name: "Continue" }));
  act(() => {
    jest.runOnlyPendingTimers();
  });
}

function answerThroughBreathworkQuestion() {
  fireEvent.press(screen.getByText("Calm my mind"));
  continueToNextQuestion();

  expect(screen.getByText("2 of 5")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Sleep baseline 2, Restless"));
  continueToNextQuestion();

  expect(screen.getByText("3 of 5")).toBeTruthy();
  fireEvent.press(screen.getByText("9:30 PM"));
  continueToNextQuestion();

  expect(screen.getByText("4 of 5")).toBeTruthy();
  fireEvent.press(screen.getByText("Yes"));
  continueToNextQuestion();
}

function expectClassNameContains(testID: string, expectedClassName: string) {
  expect(screen.getByTestId(testID, { includeHiddenElements: true }).props.className).toEqual(
    expect.stringContaining(expectedClassName),
  );
}

describe("OnboardingPersonalizationFlowScreen", () => {
  it("renders the question shell and disabled CTA with Tailwind primitives", () => {
    jest.useFakeTimers();

    render(
      <OnboardingPersonalizationFlowScreen
        continueAfterPlan={jest.fn()}
        persistAnswers={jest.fn(() => Promise.resolve())}
        screenExitMs={0}
        startedAt="2026-05-20T01:00:00.000Z"
      />,
    );

    expectClassNameContains("onboarding-question-shell", "bg-nidoru-dark-background");
    expectClassNameContains("onboarding-question-content", "px-nidoru-screen");
    expectClassNameContains("onboarding-progress-track", "w-24");
    expectClassNameContains("onboarding-progress-segment-goal", "bg-[#A89CE0]");
    expectClassNameContains("onboarding-continue-cta", "bg-[#1C2040]");
    expectClassNameContains("onboarding-continue-cta", "opacity-0");

    jest.useRealTimers();
  });

  it("captures typed answers across the five-question flow without pre-plan gates", async () => {
    jest.useFakeTimers();
    const persistAnswers = jest.fn(() => Promise.resolve());
    const continueAfterPlan = jest.fn();

    render(
      <OnboardingPersonalizationFlowScreen
        continueAfterPlan={continueAfterPlan}
        persistAnswers={persistAnswers}
        screenExitMs={0}
        startedAt="2026-05-20T01:00:00.000Z"
      />,
    );

    expect(ONBOARDING_PERSONALIZATION_QUESTION_COUNT).toBe(5);
    expect(screen.getByText("1 of 5")).toBeTruthy();
    expect(screen.getByText("We’ll shape your follow-up plan around this.")).toBeTruthy();
    expect(screen.queryByText("We’ll shape your first session around this.")).toBeNull();
    expect(screen.getByText("What brings you here?").props.className).toEqual(
      expect.stringContaining("text-[28px]"),
    );
    expect(screen.getByTestId("onboarding-question-content").props.className).toEqual(
      expect.stringContaining("px-nidoru-screen"),
    );
    expect(screen.queryByText(forbiddenPrePlanGatePattern)).toBeNull();

    answerThroughBreathworkQuestion();

    expect(screen.getByText("5 of 5")).toBeTruthy();
    expect(screen.getByPlaceholderText("Name")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("Name"), "Riley");
    continueToNextQuestion();

    await waitFor(() => {
      expect(persistAnswers).toHaveBeenCalledWith({
        breathworkFamiliarity: "yes",
        completedAt: expect.any(String),
        displayName: "Riley",
        goal: "anxiety",
        sleepBaseline: 2,
        startedAt: "2026-05-20T01:00:00.000Z",
        windDownMinutesAfterMidnight: 21 * 60 + 30,
      });
    });
    expect(screen.getByText("Riley, your follow-up plan is ready")).toBeTruthy();
    expect(screen.getByText("Calm Mind")).toBeTruthy();
    expect(screen.getByText("Light guidance")).toBeTruthy();
    expect(screen.getByText("Wind-down around 9:30 PM")).toBeTruthy();
    expect(screen.getByText("Breathwork familiar")).toBeTruthy();
    expect(screen.getByText("Start gently")).toBeTruthy();
    expect(screen.getByText("No account needed")).toBeTruthy();
    expect(screen.queryByText("Saved locally")).toBeNull();
    expect(screen.getByText("Next session")).toBeTruthy();
    expect(screen.queryByText("First session")).toBeNull();
    expect(screen.queryByText(forbiddenPlanGatePattern)).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Let’s start" }));
    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(continueAfterPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "anxiety_relief",
        firstSession: expect.objectContaining({
          techniqueId: "box-breathing",
        }),
      }),
    );

    jest.useRealTimers();
  });

  it("allows name skip and keeps the handoff copy non-personal", async () => {
    jest.useFakeTimers();
    const persistAnswers = jest.fn(() => Promise.resolve());
    const continueAfterPlan = jest.fn();

    render(
      <OnboardingPersonalizationFlowScreen
        continueAfterPlan={continueAfterPlan}
        persistAnswers={persistAnswers}
        screenExitMs={0}
        startedAt="2026-05-20T01:00:00.000Z"
      />,
    );

    answerThroughBreathworkQuestion();
    fireEvent.press(screen.getByRole("button", { name: "Skip for now" }));
    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(persistAnswers).toHaveBeenCalledWith({
        breathworkFamiliarity: "yes",
        completedAt: expect.any(String),
        displayName: undefined,
        goal: "anxiety",
        sleepBaseline: 2,
        startedAt: "2026-05-20T01:00:00.000Z",
        windDownMinutesAfterMidnight: 21 * 60 + 30,
      });
    });

    expect(screen.getByText("Your follow-up plan is ready")).toBeTruthy();
    expect(screen.getByText("Your plan")).toBeTruthy();
    expect(screen.queryByText(/Riley|Bruno|welcome back/i)).toBeNull();

    jest.useRealTimers();
  });

  it("shows validation feedback instead of persisting overlong display names", async () => {
    jest.useFakeTimers();
    const persistAnswers = jest.fn(() => Promise.resolve());

    render(
      <OnboardingPersonalizationFlowScreen
        continueAfterPlan={jest.fn()}
        persistAnswers={persistAnswers}
        screenExitMs={0}
        startedAt="2026-05-20T01:00:00.000Z"
      />,
    );

    answerThroughBreathworkQuestion();
    fireEvent.changeText(screen.getByPlaceholderText("Name"), "A".repeat(41));
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText("Use 40 characters or fewer.")).toBeTruthy();
    expect(persistAnswers).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
