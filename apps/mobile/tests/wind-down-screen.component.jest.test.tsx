import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { WindDownScreen } from "../src/wind-down/wind-down-screen";

const holdSafetyCopy = "Skip holds or stop if you feel dizzy, breathless, or uncomfortable.";
const defaultBodyCue = {
  eyebrow: "BODY RELAXATION",
  title: "Soften your shoulders.",
  subtitle: "Let the weight of the day drop a little.",
} as const;

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

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
    expect(screen.getByText("Box breathing · body relax")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Calm racing thoughts" })).toHaveProp(
      "accessibilityHint",
      "Starts Box breathing with body relaxation and remembers this Wind-Down goal.",
    );
    expect(screen.getByRole("button", { name: "Wake up fewer times" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skip" })).toHaveProp(
      "accessibilityHint",
      "Starts the default 4-7-8 Wind-Down and remembers it for next time.",
    );
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByText(/account|paywall|notification|permission|loading/i)).toBeNull();
    expect(screen.queryByText("Box breathing · body scan")).toBeNull();
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
          bodyCue: defaultBodyCue,
          phaseLabel: "Inhale",
          remainingSeconds: 298,
          isNoHoldFallback: false,
          noHoldFallbackTechniqueId: "diaphragmatic-breathing",
          soundLabel: "Rain",
          techniqueId: "4-7-8-sleep",
          uiState: "active_winddown",
        }}
        state="active"
      />,
    );

    expect(screen.getByRole("header", { name: "Let's wind down." })).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("04:58")).toBeTruthy();
    expect(screen.getByText(holdSafetyCopy)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Switch to no-hold breathing" })).toBeTruthy();
    expect(screen.getByText("Rain softly playing")).toBeTruthy();
    expect(screen.getByText("Swipe down to exit")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("wind-down-active-orb").props.className).toContain("h-[340px]");
    expect(screen.getByTestId("wind-down-active-orb").props.className).toContain("w-[340px]");
    expect(screen.getByText("04:58").props.className).toContain("tabular-nums");
  });

  it("uses one quiet action to enter no-hold Wind-Down breathing from safety copy", () => {
    const onUseNoHoldFallback = jest.fn();

    render(
      <WindDownScreen
        activeRoutine={{
          breathworkDurationSeconds: 300,
          bodyCue: defaultBodyCue,
          phaseLabel: "Inhale",
          remainingSeconds: 298,
          isNoHoldFallback: false,
          noHoldFallbackTechniqueId: "diaphragmatic-breathing",
          soundLabel: "Rain",
          techniqueId: "4-7-8-sleep",
          uiState: "active_winddown",
        }}
        onUseNoHoldFallback={onUseNoHoldFallback}
        state="active"
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Switch to no-hold breathing" }));

    expect(onUseNoHoldFallback).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/choose a technique|pick a technique|treatment/i)).toBeNull();
  });

  it("renders no-hold Wind-Down breathing without hold guidance or a technique picker", () => {
    render(
      <WindDownScreen
        activeRoutine={{
          breathworkDurationSeconds: 300,
          bodyCue: defaultBodyCue,
          phaseLabel: "Inhale",
          remainingSeconds: 298,
          isNoHoldFallback: true,
          noHoldFallbackTechniqueId: null,
          soundLabel: "Rain",
          techniqueId: "diaphragmatic-breathing",
          uiState: "no_hold_fallback",
        }}
        state="active"
      />,
    );

    expect(screen.getByTestId("wind-down-state-no_hold_fallback")).toBeTruthy();
    expect(screen.getByRole("header", { name: "No-hold breathing" })).toBeTruthy();
    expect(screen.getByText("Diaphragmatic breathing for wind-down")).toBeTruthy();
    expect(screen.queryByText(holdSafetyCopy)).toBeNull();
    expect(screen.queryByRole("button", { name: "Switch to no-hold breathing" })).toBeNull();
    expect(screen.queryByText(/panic|anxiety|insomnia|medical/i)).toBeNull();
  });

  it("keeps the sleep-sound timer halo at the accepted PNG scale", () => {
    render(<WindDownScreen state="ambient_handoff" />);

    const timer = screen.getByText("29:58");

    expect(timer.props.className).toContain("text-[55px]");
    expect(screen.getByTestId("wind-down-timer-halo").props.className).toContain("h-[210px]");
    expect(screen.getByTestId("wind-down-timer-halo").props.className).toContain("w-[210px]");
  });

  it("renders a calm slow-bootstrap fallback without a spinner-heavy modal", () => {
    render(<WindDownScreen state="preparing" />);

    expect(screen.getByRole("header", { name: "Settling the room." })).toBeTruthy();
    expect(screen.getByText("Your Wind-Down will start here.")).toBeTruthy();
    expect(screen.queryByText(/loading/i)).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("renders every accepted Wind-Down PNG state with the expected low-light copy", () => {
    const visualStates = [
      {
        state: "quick_context",
        header: "What’s your goal tonight?",
        expectedCopy: "Fall asleep faster",
      },
      {
        state: "active_winddown",
        header: "Let's wind down.",
        expectedCopy: "Rain softly playing",
      },
      {
        state: "no_hold_fallback",
        header: "No-hold breathing",
        expectedCopy: "Diaphragmatic breathing for wind-down",
      },
      {
        state: "daily_calm",
        header: "Daily Calm",
        expectedCopy: "Coherent breathing for wind-down",
      },
      {
        state: "transition_card",
        header: "Good. Now let your body relax.",
        expectedCopy: "Body relaxation starts in",
      },
      {
        state: "body_cue",
        header: "Soften your shoulders.",
        expectedCopy: "Let the weight of the day drop a little.",
      },
      {
        state: "ambient_handoff",
        header: "Rain is playing",
        expectedCopy: "Screen will dim. Audio keeps going.",
      },
      {
        state: "dimmed_idle",
        header: "29:28",
        expectedCopy: "Rain continues",
      },
      {
        state: "tap_to_wake",
        header: "Rain is playing",
        expectedCopy: "Keep playing",
      },
      {
        state: "audio_interruption",
        header: "Rain resumed",
        expectedCopy: "Audio paused briefly, then continued.",
      },
      {
        state: "completion",
        header: "Rest now.",
        expectedCopy: "Screen can sleep.",
      },
      {
        state: "partial_stop",
        header: "You can stop here.",
        expectedCopy: "We saved what you completed tonight.",
      },
      {
        state: "background_recovery",
        header: "You’re back.",
        expectedCopy: "Breathwork was saved while you were away.",
      },
    ] as const;

    for (const visualState of visualStates) {
      const { unmount } = render(
        <WindDownScreen
          {...({
            onSelectGoal: jest.fn(),
            state: visualState.state,
          } as React.ComponentProps<typeof WindDownScreen>)}
        />,
      );

      expect(screen.getByTestId(`wind-down-state-${visualState.state}`)).toBeTruthy();
      expect(screen.getByRole("header", { name: visualState.header })).toBeTruthy();
      expect(screen.getByText(visualState.expectedCopy)).toBeTruthy();
      expect(screen.queryByText(/account|paywall|notification|permission|loading/i)).toBeNull();

      unmount();
    }
  });

  it("uses Tailwind primitives instead of static StyleSheet base styling", () => {
    const source = readFileSync(join(__dirname, "../src/wind-down/wind-down-screen.tsx"), "utf8");

    expect(source).toContain("className=");
    expect(source).toContain("../tw");
    expect(source).not.toMatch(/StyleSheet\.create|styles\./);
  });
});
