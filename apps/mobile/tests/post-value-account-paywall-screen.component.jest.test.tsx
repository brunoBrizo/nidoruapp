import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

import { PostValueAccountPaywallScreen } from "../src/paywall/post-value-account-paywall-screen";
import type { PostRewardPaywallEligibility } from "../src/paywall/post-value-account-linking";

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

const eligibleAccessState = {
  canContinueFree: true,
  canLinkAccount: true,
  canShowPaywall: true,
  proof: {
    breathCount: 18,
    durationLabel: "4 min",
    sessionId: "session_0123456789abcdef",
    streakCount: 1,
  },
  reason: "eligible",
  reward: {
    feeling: "better",
    reflectedAt: "2026-05-20T01:05:00.000Z",
  },
  status: "eligible",
} satisfies PostRewardPaywallEligibility;

describe("PostValueAccountPaywallScreen", () => {
  it("does not render the account or paywall prompt when post-reward access is blocked", () => {
    render(
      <PostValueAccountPaywallScreen
        accessState={{
          canContinueFree: true,
          canLinkAccount: false,
          canShowPaywall: false,
          reason: "reward_required",
          status: "blocked",
        }}
      />,
    );

    expect(screen.queryByText("Keep tonight’s calm going")).toBeNull();
    expect(screen.queryByText("Save tonight’s progress")).toBeNull();
    expect(screen.getByText("Finish the first session reward first.")).toBeTruthy();
  });

  it("matches the post-value account screen with session proof before plans are requested", () => {
    render(<PostValueAccountPaywallScreen accessState={eligibleAccessState} />);

    expectClassNameContains(
      screen.getByTestId("post-value-account-paywall-screen").props.className,
      ["flex-1", "bg-[#0D0F1A]"],
    );
    expectClassNameContains(screen.getByTestId("post-value-account-section").props.className, [
      "gap-3",
      "mb-24",
    ]);
    expectClassNameContains(screen.getByTestId("post-value-sticky-footer").props.className, [
      "absolute",
      "bottom-0",
      "px-5",
    ]);
    expect(screen.getByTestId("post-value-paywall-top-fade")).toBeTruthy();
    expect(screen.getByText("First session complete")).toBeTruthy();
    expect(screen.getByText("Keep tonight’s calm going")).toBeTruthy();
    expect(screen.getByText("4 min")).toBeTruthy();
    expect(screen.getByText("18")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Save tonight’s progress")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Apple" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "See plans" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with free" })).toBeTruthy();
    expect(screen.queryByText("Try 14 days of Nidoru Premium")).toBeNull();
    expect(screen.queryByRole("button", { name: "Annual" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Monthly" })).toBeNull();
    expect(screen.queryByText("14 days free. Then $39.99/year unless canceled.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Restore purchase" })).toBeNull();
  });

  it("reveals the premium plan selector after See plans is pressed", () => {
    render(<PostValueAccountPaywallScreen accessState={eligibleAccessState} />);

    fireEvent.press(screen.getByRole("button", { name: "See plans" }));

    expectClassNameContains(screen.getByTestId("post-value-plan-list").props.className, [
      "gap-3",
      "mb-[22px]",
    ]);
    expect(screen.getByText("Try 14 days of Nidoru Premium")).toBeTruthy();
    expect(screen.getByText("Build on the routine that helped tonight.")).toBeTruthy();
    expect(screen.getByText("Unlimited sleep sessions and breath techniques")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Annual" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Monthly" })).toBeTruthy();
    expect(screen.getByText("14 days free. Then $39.99/year unless canceled.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start 14-day free trial" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restore purchase" })).toBeTruthy();
  });

  it("supports account linking, plan selection, restore, trial, and continue-free paths", async () => {
    const onContinueFree = jest.fn();
    const onLinkAccount = jest.fn(() => Promise.resolve());
    const onRestorePurchase = jest.fn(() => Promise.resolve());
    const onStartTrial = jest.fn(() => Promise.resolve());

    render(
      <PostValueAccountPaywallScreen
        accessState={eligibleAccessState}
        onContinueFree={onContinueFree}
        onLinkAccount={onLinkAccount}
        onRestorePurchase={onRestorePurchase}
        onStartTrial={onStartTrial}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Continue with Apple" }));
    await waitFor(() => {
      expect(onLinkAccount).toHaveBeenCalledWith("apple");
    });

    fireEvent.press(screen.getByRole("button", { name: "See plans" }));
    expect(screen.getByRole("button", { name: "Start 14-day free trial" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restore purchase" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$7.99")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Start 14-day free trial" }));
    fireEvent.press(screen.getByRole("button", { name: "Restore purchase" }));
    fireEvent.press(screen.getByRole("button", { name: "Continue with free" }));

    await waitFor(() => {
      expect(onStartTrial).toHaveBeenCalledWith("monthly");
      expect(onRestorePurchase).toHaveBeenCalled();
      expect(onContinueFree).toHaveBeenCalled();
    });
  });

  it("keeps the free path available when the experiment suppresses the paywall", () => {
    render(
      <PostValueAccountPaywallScreen
        accessState={{
          ...eligibleAccessState,
          canShowPaywall: false,
          reason: "free_only_experiment",
        }}
      />,
    );

    expect(screen.getByText("Save tonight’s progress")).toBeTruthy();
    expect(screen.queryByText("Try 14 days of Nidoru Premium")).toBeNull();
    expect(screen.getByRole("button", { name: "Continue with free" })).toBeTruthy();
  });
});

function expectClassNameContains(className: string | undefined, expectedParts: readonly string[]) {
  expect(className).toBeTruthy();

  for (const expectedPart of expectedParts) {
    expect(className).toContain(expectedPart);
  }
}
