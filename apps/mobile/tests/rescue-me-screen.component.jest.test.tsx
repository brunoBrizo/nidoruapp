import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  type AppStateStatus,
  StyleSheet,
} from "react-native";

const mockSoundHandoffAudioPlayer = {
  clearLockScreenControls: jest.fn(),
  loop: false,
  pause: jest.fn(),
  play: jest.fn(),
  remove: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  setActiveForLockScreen: jest.fn(),
  updateLockScreenMetadata: jest.fn(),
  volume: 1,
};
const mockCreateAudioPlayer = jest.fn(() => mockSoundHandoffAudioPlayer);
const mockSetAudioModeAsync = jest.fn(() => Promise.resolve());
const mockSetIsAudioActiveAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-audio", () => ({
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
}));

jest.mock("../src/observability/deferred-capture", () => ({
  captureAnalyticsEventDeferred: jest.fn(),
}));

jest.mock("../src/rescue/rescue-me-launch-performance", () => ({
  recordRescueMeOrbVisible: jest.fn(),
}));

import { captureAnalyticsEventDeferred } from "../src/observability/deferred-capture";
import { recordRescueMeOrbVisible } from "../src/rescue/rescue-me-launch-performance";
import {
  parseRescueMeScreenState,
  RescueMeActiveSessionScreen,
  RESCUE_ME_SCREEN_STATES,
  RescueMeScreen,
  type RescueMeScreenState,
} from "../src/rescue/rescue-me-screen";

const forbiddenSurfacePattern =
  /account|paywall|permission|choose|pick|setup|loading|spinner|network|medical|crisis|badge|streak|reward|ember/i;
const rescueStartedAtMs = Date.parse("2026-05-23T05:00:00.000Z");
const rescueSessionProps = {
  disableHaptics: true,
  localInstallId: "install_0123456789abcdef",
  sessionId: "session_rescueme0123456789",
  startedAtMs: rescueStartedAtMs,
  tickIntervalMs: 1000,
} as const;
const mockCaptureAnalyticsEventDeferred = captureAnalyticsEventDeferred as jest.MockedFunction<
  typeof captureAnalyticsEventDeferred
>;
const mockRecordRescueMeOrbVisible = recordRescueMeOrbVisible as jest.MockedFunction<
  typeof recordRescueMeOrbVisible
>;

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));
const appStateAddEventListener = jest
  .spyOn(AppState, "addEventListener")
  .mockImplementation(() => ({ remove: jest.fn() }));

function mockAppStateChangeListeners() {
  const handlers: ((state: AppStateStatus) => void)[] = [];
  appStateAddEventListener.mockImplementation((eventType, listener) => {
    if (eventType === "change") {
      handlers.push(listener as (state: AppStateStatus) => void);
    }

    return { remove: jest.fn() };
  });

  return {
    handlers,
    restore: () => {
      appStateAddEventListener.mockImplementation(() => ({ remove: jest.fn() }));
    },
  };
}

function mockFetchOffline() {
  const globalWithFetch = globalThis as typeof globalThis & { fetch?: typeof fetch };
  const originalFetch = globalWithFetch.fetch;
  const fetchMock = jest.fn<typeof fetch>(() =>
    Promise.reject(new Error("Network access disabled for Rescue Me sound handoff.")),
  );

  globalWithFetch.fetch = fetchMock;

  return {
    fetchMock,
    restoreFetch: () => {
      if (originalFetch) {
        globalWithFetch.fetch = originalFetch;
      } else {
        delete globalWithFetch.fetch;
      }
    },
  };
}

describe("RescueMeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptureAnalyticsEventDeferred.mockReset();
    mockCaptureAnalyticsEventDeferred.mockImplementation(() => undefined);
    mockCreateAudioPlayer.mockReset();
    mockCreateAudioPlayer.mockReturnValue(mockSoundHandoffAudioPlayer);
    mockSetAudioModeAsync.mockReset();
    mockSetAudioModeAsync.mockImplementation(() => Promise.resolve());
    mockSetIsAudioActiveAsync.mockReset();
    mockSetIsAudioActiveAsync.mockImplementation(() => Promise.resolve());
    mockSoundHandoffAudioPlayer.clearLockScreenControls.mockReset();
    mockSoundHandoffAudioPlayer.loop = false;
    mockSoundHandoffAudioPlayer.pause.mockReset();
    mockSoundHandoffAudioPlayer.play.mockReset();
    mockSoundHandoffAudioPlayer.remove.mockReset();
    mockSoundHandoffAudioPlayer.seekTo.mockReset();
    mockSoundHandoffAudioPlayer.seekTo.mockImplementation(() => Promise.resolve());
    mockSoundHandoffAudioPlayer.setActiveForLockScreen.mockReset();
    mockSoundHandoffAudioPlayer.updateLockScreenMetadata.mockReset();
    mockSoundHandoffAudioPlayer.volume = 1;
    mockRecordRescueMeOrbVisible.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders every accepted visual state without setup or gate surfaces", () => {
    for (const state of RESCUE_ME_SCREEN_STATES) {
      const { unmount } = render(<RescueMeScreen state={state} />);

      expect(screen.queryByText(forbiddenSurfacePattern)).toBeNull();
      expect(screen.queryByRole("button", { name: /choose|pick|setup/i })).toBeNull();

      unmount();
    }
  });

  it("matches the active launch contract with an immediate full-screen orb", () => {
    render(<RescueMeScreen state="active-launch" />);

    expect(screen.getByTestId("rescue-me-screen-active-launch")).toBeTruthy();
    expect(screen.getByLabelText("Inhale breathing phase")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("03:29")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audio cue: Bell" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause Rescue Me session" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Haptics on" })).toBeTruthy();
    expect(screen.queryByText("You’re doing enough. Stay with the next breath.")).toBeNull();

    fireEvent(screen.getByTestId("rescue-me-orb"), "layout", {
      nativeEvent: { layout: { height: 300, width: 300, x: 34, y: 170 } },
    });

    expect(mockRecordRescueMeOrbVisible).toHaveBeenCalledTimes(1);
  });

  it("defaults the route state parser to the active launch contract", () => {
    expect(parseRescueMeScreenState(undefined)).toBe("active-launch");
    expect(parseRescueMeScreenState("setup")).toBe("active-launch");
    expect(parseRescueMeScreenState(["active-phase", "complete"])).toBe("active-phase");
  });

  it("keeps reassurance as subtle bottom copy only after two cycles", () => {
    render(<RescueMeScreen state="active-reassurance" />);

    const reassurance = screen.getByText("You’re doing enough. Stay with the next breath.");

    expect(screen.getByLabelText("Exhale breathing phase")).toBeTruthy();
    expect(reassurance).toBeTruthy();
    expect(StyleSheet.flatten(reassurance.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: undefined,
        color: "rgba(138, 143, 168, 0.78)",
        fontSize: 12,
        textAlign: "center",
      }),
    );
  });

  it("renders completion copy and quiet actions exactly", () => {
    render(<RescueMeScreen state="complete" />);

    expect(screen.getByText("That took courage to start.")).toBeTruthy();
    expect(screen.getByText("You completed 5 breath cycles.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with a calming sound" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Return home" })).toBeTruthy();
  });

  it("renders the offline sound handoff variants without a sound picker", () => {
    for (const state of ["sound-handoff", "sound-handoff-alt"] satisfies RescueMeScreenState[]) {
      const { unmount } = render(<RescueMeScreen state={state} />);

      expect(screen.getByText("Rain is playing")).toBeTruthy();
      expect(screen.getByText("Works offline. You can stop anytime.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Pause Rain sound" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Return home" })).toBeTruthy();
      expect(screen.getByTestId("rescue-me-sound-bars-aura")).toBeTruthy();
      expect(screen.queryByText(/sound picker|choose sound|select sound/i)).toBeNull();

      unmount();
    }
  });

  it("renders the handoff sound icon with a fading aura and animated playback bars", () => {
    render(<RescueMeScreen state="sound-handoff" />);

    const auraStyle = StyleSheet.flatten(
      screen.getByTestId("rescue-me-sound-bars-aura").props.style,
    );
    const firstBarStyle = StyleSheet.flatten(
      screen.getByTestId("rescue-me-sound-bar-0").props.style,
    );

    expect(auraStyle).toEqual(
      expect.objectContaining({
        height: 174,
        position: "absolute",
        width: 220,
      }),
    );
    expect(auraStyle.backgroundColor).toBeUndefined();
    expect(firstBarStyle.height).toBe(24);
    expect(firstBarStyle.opacity).toBe(0.92);
    expect(firstBarStyle.transform).toEqual([
      expect.objectContaining({
        scaleY: 1,
      }),
    ]);
  });

  it("starts bundled Rain audio offline and supports pause, resume, and return home", async () => {
    const { fetchMock, restoreFetch } = mockFetchOffline();
    const onReturnHome = jest.fn();

    try {
      render(<RescueMeScreen onReturnHome={onReturnHome} state="sound-handoff" />);

      await waitFor(() => {
        expect(mockSoundHandoffAudioPlayer.play).toHaveBeenCalledTimes(1);
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByRole("button", { name: "Pause Rain sound" }));

      await waitFor(() => {
        expect(mockSoundHandoffAudioPlayer.pause).toHaveBeenCalledTimes(1);
      });
      expect(screen.getByRole("button", { name: "Resume Rain sound" })).toBeTruthy();

      fireEvent.press(screen.getByRole("button", { name: "Resume Rain sound" }));

      await waitFor(() => {
        expect(mockSoundHandoffAudioPlayer.play).toHaveBeenCalledTimes(2);
      });

      fireEvent.press(screen.getByRole("button", { name: "Return home" }));

      expect(onReturnHome).toHaveBeenCalledTimes(1);
    } finally {
      restoreFetch();
    }
  });

  it("keeps the handoff calm when bundled audio startup fails", async () => {
    mockCreateAudioPlayer.mockImplementationOnce(() => {
      throw new Error("audio unavailable");
    });

    render(<RescueMeScreen state="sound-handoff" />);

    expect(screen.getByText("Rain is playing")).toBeTruthy();
    expect(screen.getByText("Works offline. You can stop anytime.")).toBeTruthy();

    await waitFor(() => {
      expect(mockCreateAudioPlayer).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "Pause Rain sound" })).toBeTruthy();
  });

  it("starts the handoff playback bar loop when reduced motion is off", async () => {
    const reduceMotionMock = AccessibilityInfo.isReduceMotionEnabled as jest.MockedFunction<
      typeof AccessibilityInfo.isReduceMotionEnabled
    >;
    const loopStart = jest.fn();
    const loopStop = jest.fn();
    const loopSpy = jest.spyOn(Animated, "loop").mockReturnValue({
      reset: jest.fn(),
      start: loopStart,
      stop: loopStop,
    } as unknown as ReturnType<typeof Animated.loop>);

    reduceMotionMock.mockResolvedValueOnce(false);
    try {
      render(<RescueMeScreen state="sound-handoff" />);

      await waitFor(() => {
        expect(loopStart).toHaveBeenCalledTimes(1);
      });

      expect(loopSpy).toHaveBeenCalledTimes(1);
    } finally {
      loopSpy.mockRestore();
    }
  });

  it("does not use Ember on active, completion, or handoff screen surfaces", () => {
    for (const state of RESCUE_ME_SCREEN_STATES) {
      const { unmount } = render(<RescueMeScreen state={state} />);
      const screenRoot = screen.getByTestId(`rescue-me-screen-${state}`);

      expect(JSON.stringify(screenRoot.props.style)).not.toContain("#FF6B6B");
      expect(JSON.stringify(screenRoot.props.style)).not.toContain("255, 107, 107");

      unmount();
    }
  });

  it("keeps controls at accessible touch sizes", () => {
    render(<RescueMeScreen state="active-phase" />);

    for (const label of ["Audio cue: Bell", "Pause Rescue Me session", "Haptics on"]) {
      const button = screen.getByRole("button", { name: label });

      expect(StyleSheet.flatten(button.props.style)).toEqual(
        expect.objectContaining({
          minHeight: 44,
          minWidth: 44,
        }),
      );
    }

    const pauseButton = within(screen.getByTestId("rescue-me-controls")).getByRole("button", {
      name: "Pause Rescue Me session",
    });

    expect(StyleSheet.flatten(pauseButton.props.style)).toEqual(
      expect.objectContaining({
        height: 68,
        width: 68,
      }),
    );
  });

  it("starts the fixed Rescue Me runtime without launch setup copy", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs);
    mockCaptureAnalyticsEventDeferred.mockImplementationOnce(() => {
      throw new Error("PostHog unavailable");
    });
    const persistBreathSessionStarted = jest.fn(() => Promise.resolve());

    render(
      <RescueMeActiveSessionScreen
        {...rescueSessionProps}
        persistBreathSessionStarted={persistBreathSessionStarted}
      />,
    );

    expect(screen.getByTestId("rescue-me-active-session-screen")).toBeTruthy();
    expect(screen.getByLabelText("Inhale breathing phase")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("03:29")).toBeTruthy();
    expect(screen.queryByText(forbiddenSurfacePattern)).toBeNull();
    expect(screen.queryByRole("button", { name: /choose|pick|setup/i })).toBeNull();

    await waitFor(() => {
      expect(persistBreathSessionStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          audioCueModeId: "gentle-bell",
          currentPhaseName: "inhale",
          durationSeconds: 209,
          localInstallId: rescueSessionProps.localInstallId,
          sessionId: rescueSessionProps.sessionId,
          source: "rescue_me",
          status: "started",
          techniqueId: "4-7-8-sleep",
        }),
      );
    });
    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("rescue_me_started");
  });

  it("does not rewrite a recovered Rescue Me draft as a fresh local start", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs + 60_000);
    const persistBreathSessionStarted = jest.fn(() => Promise.resolve());
    const persistBreathSessionDraft = jest.fn(() => Promise.resolve());

    render(
      <RescueMeActiveSessionScreen
        {...rescueSessionProps}
        hasExistingLocalRecord
        persistBreathSessionDraft={persistBreathSessionDraft}
        persistBreathSessionStarted={persistBreathSessionStarted}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(15_000);
      await Promise.resolve();
    });

    expect(persistBreathSessionStarted).not.toHaveBeenCalled();
    expect(mockCaptureAnalyticsEventDeferred).not.toHaveBeenCalledWith("rescue_me_started");
    expect(persistBreathSessionDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        elapsedDurationMs: 75_000,
        localInstallId: rescueSessionProps.localInstallId,
        sessionId: rescueSessionProps.sessionId,
        source: "rescue_me",
        status: "draft",
      }),
    );
  });

  it("persists Rescue Me progress when the app backgrounds", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs);
    const { handlers, restore } = mockAppStateChangeListeners();
    const persistBreathSessionDraft = jest.fn(() => Promise.resolve());

    render(
      <RescueMeActiveSessionScreen
        {...rescueSessionProps}
        persistBreathSessionDraft={persistBreathSessionDraft}
      />,
    );

    await act(async () => {
      jest.setSystemTime(rescueStartedAtMs + 42_000);
      for (const handler of handlers) {
        handler("background");
      }
      await Promise.resolve();
    });

    expect(persistBreathSessionDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        completedBreathCycles: 1,
        elapsedDurationMs: 42_000,
        localInstallId: rescueSessionProps.localInstallId,
        remainingDurationMs: 167_000,
        sessionId: rescueSessionProps.sessionId,
        source: "rescue_me",
        status: "draft",
      }),
    );

    restore();
  });

  it("shows reassurance only after two fixed Rescue Me cycles without moving the orb stage", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs);

    render(<RescueMeActiveSessionScreen {...rescueSessionProps} />);

    expect(screen.queryByText("You’re doing enough. Stay with the next breath.")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("rescue-me-orb").props.style)).toEqual(
      expect.objectContaining({
        height: 300,
        width: 300,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(84000);
      await Promise.resolve();
    });

    const reassurance = screen.getByText("You’re doing enough. Stay with the next breath.");

    expect(reassurance).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("rescue-me-orb").props.style)).toEqual(
      expect.objectContaining({
        height: 300,
        width: 300,
      }),
    );
  });

  it("renders completion only after five Rescue Me cycles and persists the local completion", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs);
    mockCaptureAnalyticsEventDeferred
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error("PostHog unavailable");
      });
    const persistBreathSessionCompletion = jest.fn(() => Promise.resolve());

    render(
      <RescueMeActiveSessionScreen
        {...rescueSessionProps}
        persistBreathSessionCompletion={persistBreathSessionCompletion}
      />,
    );

    expect(screen.queryByText("That took courage to start.")).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(209000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByText("That took courage to start.")).toBeTruthy();
    });

    expect(screen.getByText("You completed 5 breath cycles.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with a calming sound" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Return home" })).toBeTruthy();
    expect(persistBreathSessionCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        completedBreathCycles: 5,
        durationSeconds: 209,
        localInstallId: rescueSessionProps.localInstallId,
        remainingDurationMs: 0,
        sessionId: rescueSessionProps.sessionId,
        source: "rescue_me",
        status: "completed",
        techniqueId: "4-7-8-sleep",
      }),
    );
    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("rescue_me_completed");
  });

  it("pauses and resumes with neutral Rescue Me copy", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs);

    render(<RescueMeActiveSessionScreen {...rescueSessionProps} />);

    fireEvent.press(screen.getByRole("button", { name: "Pause Rescue Me session" }));

    expect(screen.getByTestId("rescue-me-pause-overlay")).toBeTruthy();
    expect(screen.getByText("Paused")).toBeTruthy();
    expect(screen.getByText("You can continue when you’re ready.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resume Rescue Me session" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "End Rescue Me for now" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Resume Rescue Me session" }));

    await waitFor(() => {
      expect(screen.queryByTestId("rescue-me-pause-overlay")).toBeNull();
    });
  });

  it("persists a neutral Rescue Me partial stop before returning home", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(rescueStartedAtMs);
    const onReturnHome = jest.fn();
    const persistBreathSessionAbandoned = jest.fn(() => Promise.resolve());

    render(
      <RescueMeActiveSessionScreen
        {...rescueSessionProps}
        onReturnHome={onReturnHome}
        persistBreathSessionAbandoned={persistBreathSessionAbandoned}
      />,
    );

    await act(async () => {
      jest.setSystemTime(rescueStartedAtMs + 42_000);
      fireEvent.press(screen.getByRole("button", { name: "Pause Rescue Me session" }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "End Rescue Me for now" })).toBeTruthy();
    });
    fireEvent.press(screen.getByRole("button", { name: "End Rescue Me for now" }));

    expect(persistBreathSessionAbandoned).toHaveBeenCalledWith(
      expect.objectContaining({
        completedBreathCycles: 1,
        elapsedDurationMs: 42_000,
        localInstallId: rescueSessionProps.localInstallId,
        remainingDurationMs: 167_000,
        sessionId: rescueSessionProps.sessionId,
        source: "rescue_me",
        status: "abandoned",
        stopReason: "user_ended",
        techniqueId: "4-7-8-sleep",
      }),
    );
    await waitFor(() => {
      expect(onReturnHome).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps the core breathing cue and removes decorative pulse layers under reduced motion", async () => {
    const reduceMotionMock = AccessibilityInfo.isReduceMotionEnabled as jest.MockedFunction<
      typeof AccessibilityInfo.isReduceMotionEnabled
    >;

    reduceMotionMock.mockResolvedValueOnce(true);
    render(<RescueMeActiveSessionScreen {...rescueSessionProps} />);

    await waitFor(() => {
      expect(screen.queryByTestId("rescue-me-orb-pulse-ring")).toBeNull();
    });

    expect(screen.queryByTestId("rescue-me-orb-outer-glow")).toBeNull();
    expect(screen.getByTestId("rescue-me-orb-core")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
  });
});
