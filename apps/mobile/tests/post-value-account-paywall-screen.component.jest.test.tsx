import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

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

  it("matches the post-value account and paywall copy with session proof", () => {
    render(<PostValueAccountPaywallScreen accessState={eligibleAccessState} />);

    expect(screen.getByText("First session complete")).toBeTruthy();
    expect(screen.getByText("Keep tonight’s calm going")).toBeTruthy();
    expect(screen.getByText("4 min")).toBeTruthy();
    expect(screen.getByText("18")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Save tonight’s progress")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Apple" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeTruthy();
    expect(screen.getByText("Try 14 days of Nidoru Premium")).toBeTruthy();
    expect(screen.getByRole("button", { name: "See plans" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with free" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Restore purchase" })).toBeNull();
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

    fireEvent.press(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$7.99")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "See plans" }));
    expect(screen.getByRole("button", { name: "Start 14-day free trial" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Restore purchase" })).toBeTruthy();

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
