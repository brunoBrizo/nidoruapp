import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { BreathSessionScreen, FirstSessionScreen } from "../src/session/first-session-screen";

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: {
    Light: "light",
    Soft: "soft",
  },
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(() => ({
    clearLockScreenControls: jest.fn(),
    loop: false,
    pause: jest.fn(),
    play: jest.fn(),
    remove: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    volume: 1,
  })),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  setIsAudioActiveAsync: jest.fn(() => Promise.resolve()),
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

const baseBreathSessionProps = {
  disableHaptics: true,
  durationSeconds: 600,
  localInstallId: "install_0123456789abcdef",
  sessionId: "session_regular0123456789",
  source: "breathe_tab",
  startedAtMs: Date.parse("2026-05-20T02:00:00.000Z"),
  techniqueId: "coherent-breathing",
  tickIntervalMs: 1000,
} as const;

describe("FirstSessionScreen", () => {
  it("renders the first full session without account, paywall, permission, or sync gates", () => {
    render(<FirstSessionScreen {...baseProps} />);

    expect(screen.getByText("Let’s wind down.")).toBeTruthy();
    expect(screen.getByText("4-7-8 Sleep · 4 min")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("04:00")).toBeTruthy();
    expect(screen.getByText("No audio")).toBeTruthy();
    expect(screen.getByText("Bell")).toBeTruthy();
    expect(screen.getByText("Whoosh")).toBeTruthy();
    expect(screen.getByText("Nature")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audio mode: Gentle bell" })).toBeTruthy();
    expect(screen.getByText("Haptics")).toBeTruthy();
    expect(screen.getByLabelText("Pause session")).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();
  });

  it("switches audio cue modes during an active session without pausing the controller", () => {
    render(<FirstSessionScreen {...baseProps} />);

    fireEvent.press(screen.getByRole("button", { name: "Audio mode: Soft whoosh" }));

    expect(screen.getByRole("button", { name: "Audio mode: Soft whoosh" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
    expect(screen.getByText("04:00")).toBeTruthy();
    expect(screen.queryByText("Paused")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Audio mode: Nature ambient" }));

    expect(screen.getByRole("button", { name: "Audio mode: Nature ambient" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
    expect(screen.getByText("Inhale")).toBeTruthy();
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

  it("does not wait for session-start event persistence before completing the local session", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseProps.startedAtMs);
    const persistStarted = jest.fn(
      () =>
        new Promise<void>(() => {
          // Keep analytics/local event persistence unresolved to prove it is off the session path.
        }),
    );
    const persistCompletion = jest.fn(() => Promise.resolve());

    render(
      <FirstSessionScreen
        {...baseProps}
        durationSeconds={1}
        persistCompletion={persistCompletion}
        persistStarted={persistStarted}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(persistCompletion).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText("How do you feel?")).toBeTruthy();

    jest.useRealTimers();
  });

  it("persists generic breath-session start before first-session analytics", async () => {
    const persistBreathSessionStarted = jest.fn(() => Promise.resolve());
    const persistStarted = jest.fn(() => Promise.resolve());

    render(
      <FirstSessionScreen
        {...baseProps}
        persistBreathSessionStarted={persistBreathSessionStarted}
        persistStarted={persistStarted}
      />,
    );

    await waitFor(() => {
      expect(persistBreathSessionStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          audioCueModeId: "gentle-bell",
          currentPhaseName: "inhale",
          durationSeconds: 240,
          localInstallId: "install_0123456789abcdef",
          sessionId: "session_0123456789abcdef",
          source: "first_session",
          status: "started",
          techniqueId: "4-7-8-sleep",
        }),
      );
    });
    expect(persistStarted).toHaveBeenCalledTimes(1);
    expect(persistBreathSessionStarted.mock.invocationCallOrder[0]).toBeLessThan(
      persistStarted.mock.invocationCallOrder[0] ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it("waits for generic breath-session completion persistence before showing reflection", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseProps.startedAtMs);
    let resolveBreathSessionCompletion: (() => void) | undefined;
    const persistBreathSessionCompletion = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveBreathSessionCompletion = resolve;
        }),
    );

    render(
      <FirstSessionScreen
        {...baseProps}
        durationSeconds={1}
        persistBreathSessionCompletion={persistBreathSessionCompletion}
        persistCompletion={() => Promise.resolve()}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(persistBreathSessionCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          audioCueModeId: "gentle-bell",
          completedAt: "2026-05-20T01:00:01.000Z",
          completionPersistedAt: "2026-05-20T01:00:01.000Z",
          currentPhaseName: "inhale",
          elapsedDurationMs: 1000,
          remainingDurationMs: 0,
          source: "first_session",
          status: "completed",
        }),
      );
    });
    expect(screen.queryByText("How do you feel?")).toBeNull();

    await act(async () => {
      resolveBreathSessionCompletion?.();
      await Promise.resolve();
    });

    expect(screen.getByText("How do you feel?")).toBeTruthy();

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

describe("BreathSessionScreen", () => {
  it("renders a regular Breathe-tab session without first-session or post-value gates", () => {
    render(<BreathSessionScreen {...baseBreathSessionProps} />);

    expect(screen.getByText("Let’s wind down.")).toBeTruthy();
    expect(screen.getByText("Coherent Breathing · 10 min")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("10:00")).toBeTruthy();
    expect(screen.getByText("No audio")).toBeTruthy();
    expect(screen.getByText("Bell")).toBeTruthy();
    expect(screen.getByText("Whoosh")).toBeTruthy();
    expect(screen.getByText("Nature")).toBeTruthy();
    expect(screen.getByText("Haptics")).toBeTruthy();
    expect(screen.getByLabelText("Pause session")).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();
  });

  it("uses generic breath-session persistence before showing the reward reflection", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseBreathSessionProps.startedAtMs);
    let resolveBreathSessionCompletion: (() => void) | undefined;
    const persistBreathSessionCompletion = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveBreathSessionCompletion = resolve;
        }),
    );

    render(
      <BreathSessionScreen
        {...baseBreathSessionProps}
        durationSeconds={1}
        persistBreathSessionCompletion={persistBreathSessionCompletion}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(persistBreathSessionCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          completedAt: "2026-05-20T02:00:01.000Z",
          completionPersistedAt: "2026-05-20T02:00:01.000Z",
          source: "breathe_tab",
          status: "completed",
          techniqueId: "coherent-breathing",
        }),
      );
    });
    expect(screen.queryByText("How do you feel?")).toBeNull();

    await act(async () => {
      resolveBreathSessionCompletion?.();
      await Promise.resolve();
    });

    expect(screen.getByText("Session complete")).toBeTruthy();
    expect(screen.getByText("How do you feel?")).toBeTruthy();
    expect(screen.queryByText(forbiddenActiveSessionGatePattern)).toBeNull();

    jest.useRealTimers();
  });

  it("does not write first-session start or completion persistence for regular planned sessions", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseBreathSessionProps.startedAtMs);
    const persistBreathSessionStarted = jest.fn(() => Promise.resolve());
    const persistBreathSessionCompletion = jest.fn(() => Promise.resolve());
    const persistCompletion = jest.fn(() => Promise.resolve());
    const persistStarted = jest.fn(() => Promise.resolve());

    render(
      <BreathSessionScreen
        {...baseBreathSessionProps}
        durationSeconds={1}
        persistBreathSessionCompletion={persistBreathSessionCompletion}
        persistBreathSessionStarted={persistBreathSessionStarted}
        persistCompletion={persistCompletion}
        persistStarted={persistStarted}
        planId="sleep_focused"
      />,
    );

    await waitFor(() => {
      expect(persistBreathSessionStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: "sleep_focused",
          source: "breathe_tab",
          status: "started",
        }),
      );
    });
    expect(persistStarted).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(persistBreathSessionCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: "sleep_focused",
          source: "breathe_tab",
          status: "completed",
        }),
      );
    });
    expect(screen.getByText("How do you feel?")).toBeTruthy();
    expect(persistCompletion).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("does not write first-session draft persistence for regular planned sessions", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseBreathSessionProps.startedAtMs);
    const persistBreathSessionDraft = jest.fn(() => Promise.resolve());
    const persistDraft = jest.fn(() => Promise.resolve());

    render(
      <BreathSessionScreen
        {...baseBreathSessionProps}
        persistBreathSessionDraft={persistBreathSessionDraft}
        persistDraft={persistDraft}
        planId="sleep_focused"
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(16000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(persistBreathSessionDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: "sleep_focused",
          source: "breathe_tab",
          status: "draft",
        }),
      );
    });
    expect(persistDraft).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("keeps pause and early-end behavior on the reusable controller for regular sessions", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(baseBreathSessionProps.startedAtMs);
    const persistAbandoned = jest.fn(() => Promise.resolve());
    const persistBreathSessionAbandoned = jest.fn(() => Promise.resolve());

    render(
      <BreathSessionScreen
        {...baseBreathSessionProps}
        persistAbandoned={persistAbandoned}
        persistBreathSessionAbandoned={persistBreathSessionAbandoned}
        planId="sleep_focused"
      />,
    );

    act(() => {
      jest.advanceTimersByTime(5500);
    });
    fireEvent.press(screen.getByLabelText("Pause session"));

    expect(screen.getByText("Paused")).toBeTruthy();
    expect(screen.getByText("Coherent Breathing · 9:55 left")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "End for now" }));

    await waitFor(() => {
      expect(persistBreathSessionAbandoned).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPhaseName: "exhale",
          elapsedDurationMs: 5500,
          source: "breathe_tab",
          status: "abandoned",
          stopReason: "user_ended",
        }),
      );
    });
    expect(screen.queryByText("How do you feel?")).toBeNull();
    expect(persistAbandoned).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
