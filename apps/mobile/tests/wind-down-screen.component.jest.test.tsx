import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { WindDownScreen } from "../src/wind-down/wind-down-screen";

describe("WindDownScreen", () => {
  it("renders the accepted quick context copy with one quiet tap per option and no form field", () => {
    render(<WindDownScreen onSelectGoal={jest.fn()} state="quick_context" />);

    expect(screen.getByText("TONIGHT")).toBeTruthy();
    expect(screen.getByRole("header", { name: "What’s your goal tonight?" })).toBeTruthy();
    expect(screen.getByText("We’ll start the right wind-down for you.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fall asleep faster" })).toHaveProp(
      "accessibilityHint",
      "Starts 4-7-8 breath with sleep sounds and remembers this Wind-Down goal.",
    );
    expect(screen.getByRole("button", { name: "Calm racing thoughts" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Wake up fewer times" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip" })).toHaveProp(
      "accessibilityHint",
      "Starts the default 4-7-8 Wind-Down and remembers it for next time.",
    );
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText(/account|paywall|notification|permission|loading/i)).toBeNull();
  });

  it("keeps the quick context choices as the only primary decision controls", () => {
    render(<WindDownScreen onSelectGoal={jest.fn()} state="quick_context" />);

    expect(screen.getAllByRole("button").map((button) => button.props.accessibilityLabel)).toEqual([
      "Fall asleep faster",
      "Calm racing thoughts",
      "Wake up fewer times",
      "Skip",
    ]);
  });

  it("calls the selected-goal callback with the routine contract goal", () => {
    const onSelectGoal = jest.fn();

    render(<WindDownScreen onSelectGoal={onSelectGoal} state="quick_context" />);

    fireEvent.press(screen.getByRole("button", { name: "Calm racing thoughts" }));

    expect(onSelectGoal).toHaveBeenCalledWith("calm_racing_thoughts");
  });

  it("calls skip as the default bedtime-safe routine choice", () => {
    const onSelectGoal = jest.fn();

    render(<WindDownScreen onSelectGoal={onSelectGoal} state="quick_context" />);

    fireEvent.press(screen.getByRole("button", { name: "Skip" }));

    expect(onSelectGoal).toHaveBeenCalledWith("fall_asleep_faster");
  });

  it("renders the active Wind-Down starter state without extra navigation chrome", () => {
    render(
      <WindDownScreen
        activeRoutine={{
          breathworkDurationSeconds: 300,
          phaseLabel: "Inhale",
          remainingSeconds: 298,
          soundLabel: "Rain",
          uiState: "active_winddown",
        }}
        state="active"
      />,
    );

    expect(screen.getByRole("header", { name: "Let’s wind down." })).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("04:58")).toBeTruthy();
    expect(screen.getByText("Rain softly playing")).toBeTruthy();
    expect(screen.getByText("Swipe down to exit")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("wind-down-active-orb").props.style)).toEqual(
      expect.objectContaining({
        height: 280,
        width: 280,
      }),
    );
  });

  it("renders a calm slow-bootstrap fallback without a spinner-heavy modal", () => {
    render(<WindDownScreen state="preparing" />);

    expect(screen.getByRole("header", { name: "Settling the room." })).toBeTruthy();
    expect(screen.getByText("Your Wind-Down will start here.")).toBeTruthy();
    expect(screen.queryByText(/loading/i)).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
