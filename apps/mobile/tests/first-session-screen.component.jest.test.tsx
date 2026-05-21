import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { FirstSessionScreen } from "../src/session/first-session-screen";

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

const forbiddenActiveSessionGatePattern =
  /account|paywall|permission|notification|microphone|health|subscribe|sign in|sync/i;

const baseProps = {
  disableHaptics: true,
  durationSeconds: 240,
  localInstallId: "install_0123456789abcdef",
  planId: "sleep_focused",
  sessionId: "session_0123456789abcdef",
  startedAtMs: Date.parse("2026-05-20T01:00:00.000Z"),
  techniqueId: "4-7-8-sleep",
  tickIntervalMs: 1000,
} as const;

describe("FirstSessionScreen", () => {
  it("renders the first full session without account, paywall, permission, or sync gates", () => {
    render(<FirstSessionScreen {...baseProps} />);

    expect(screen.getByText("Let’s wind down.")).toBeTruthy();
    expect(screen.getByText("4-7-8 Sleep · 4 min")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("04:00")).toBeTruthy();
    expect(screen.getByText("Bell")).toBeTruthy();
    expect(screen.getByText("Haptics")).toBeTruthy();
    expect(screen.getByLabelText("Pause session")).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();
  });

  it("pauses and resumes without showing post-value gates", () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseProps.startedAtMs);

    render(<FirstSessionScreen {...baseProps} />);

    fireEvent.press(screen.getByLabelText("Pause session"));

    expect(screen.getByText("Paused")).toBeTruthy();
    expect(screen.getByText("4-7-8 Sleep · 4:00 left")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "End for now" })).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(screen.queryByText("Paused")).toBeNull();

    jest.useRealTimers();
  });

  it("persists completion locally before showing the reflection overlay", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseProps.startedAtMs);
    let resolveCompletion: (() => void) | undefined;
    const persistCompletion = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCompletion = resolve;
        }),
    );

    render(
      <FirstSessionScreen
        {...baseProps}
        durationSeconds={1}
        persistCompletion={persistCompletion}
      />,
    );

    expect(screen.queryByText("How do you feel?")).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(persistCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          completionPersistedAt: "2026-05-20T01:00:01.000Z",
          status: "completed",
        }),
      );
    });
    expect(screen.queryByText("How do you feel?")).toBeNull();

    await act(async () => {
      resolveCompletion?.();
      await Promise.resolve();
    });

    expect(screen.getByText("How do you feel?")).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();

    jest.useRealTimers();
  });

  it("persists the selected reflection locally and reveals the reward transition", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseProps.startedAtMs);
    const persistReflection = jest.fn(() => Promise.resolve());

    render(
      <FirstSessionScreen
        {...baseProps}
        durationSeconds={1}
        persistCompletion={() => Promise.resolve()}
        persistReflection={persistReflection}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await screen.findByText("How do you feel?");
    expect(screen.getByText("Same")).toBeTruthy();
    expect(screen.getByText("Better")).toBeTruthy();
    expect(screen.getByText("Much better")).toBeTruthy();
    expect(
      screen.queryByText("Deep breathing shifts your nervous system into rest mode."),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Better" }));

    await waitFor(() => {
      expect(persistReflection).toHaveBeenCalledWith({
        feeling: "better",
        localInstallId: "install_0123456789abcdef",
        reflectedAt: "2026-05-20T01:00:01.000Z",
        sessionId: "session_0123456789abcdef",
      });
    });
    expect(
      screen.getByText("Deep breathing shifts your nervous system into rest mode."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();

    jest.useRealTimers();
  });

  it("can resume directly into the reflection state after completion was saved before a crash", () => {
    const persistCompletion = jest.fn(() => Promise.resolve());

    render(
      <FirstSessionScreen
        {...baseProps}
        initialCompletionMode="completed"
        persistCompletion={persistCompletion}
      />,
    );

    expect(screen.getByText("First session complete")).toBeTruthy();
    expect(screen.getByText("How do you feel?")).toBeTruthy();
    expect(persistCompletion).not.toHaveBeenCalled();
  });

  it("records an abandoned partial session when ending from the pause overlay", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseProps.startedAtMs);
    const persistAbandoned = jest.fn(() => Promise.resolve());

    render(<FirstSessionScreen {...baseProps} persistAbandoned={persistAbandoned} />);

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    fireEvent.press(screen.getByLabelText("Pause session"));
    fireEvent.press(screen.getByRole("button", { name: "End for now" }));

    await waitFor(() => {
      expect(persistAbandoned).toHaveBeenCalledWith(
        expect.objectContaining({
          completedBreathCycles: 0,
          currentPhaseName: "hold",
          elapsedDurationMs: 5000,
          status: "abandoned",
        }),
      );
    });
    expect(screen.queryByText("How do you feel?")).toBeNull();
    expect(screen.queryByText("Even a short pause can help your body settle.")).toBeNull();

    jest.useRealTimers();
  });
});
