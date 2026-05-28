import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mockRouterBack = jest.fn();
const mockUseLocalSearchParams = jest.fn<() => Record<string, string | string[] | undefined>>(
  () => ({}),
);
const mockSoundMixerAudioPlayer = {
  clearLockScreenControls: jest.fn(),
  loop: false,
  pause: jest.fn(),
  play: jest.fn(),
  remove: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
  setActiveForLockScreen: jest.fn(),
  volume: 1,
};
const mockCreateAudioPlayer = jest.fn(() => mockSoundMixerAudioPlayer);
const mockSetAudioModeAsync = jest.fn(() => Promise.resolve());
const mockSetIsAudioActiveAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-audio", () => ({
  createAudioPlayer: mockCreateAudioPlayer,
  setAudioModeAsync: mockSetAudioModeAsync,
  setIsAudioActiveAsync: mockSetIsAudioActiveAsync,
}));

jest.mock("../src/audio/sound-mixer-playback-assets", () => ({
  soundMixerPlaybackAssetIds: [
    "light-rain",
    "heavy-rain",
    "rain-on-window",
    "thunderstorm",
    "ocean-waves",
    "forest",
    "river-stream",
    "wind",
    "brown-noise",
    "pink-noise",
    "fireplace-crackling",
    "cafe-ambience",
  ],
  soundMixerPlaybackAssetSources: {
    "light-rain": 101,
    "heavy-rain": 102,
    "rain-on-window": 103,
    thunderstorm: 104,
    "ocean-waves": 105,
    forest: 106,
    "river-stream": 107,
    wind: 108,
    "brown-noise": 109,
    "pink-noise": 110,
    "fireplace-crackling": 111,
    "cafe-ambience": 112,
  },
}));

jest.mock("../src/motion/use-reduce-motion-enabled", () => ({
  useReduceMotionPreference: () => ({
    isResolved: true,
    reduceMotionEnabled: false,
  }),
}));

jest.mock("../src/observability/deferred-capture", () => ({
  captureAnalyticsEventDeferred: jest.fn(),
}));

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const Link = Object.assign(
    ({ children }: { readonly children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    {
      Menu: ({ children }: { readonly children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      MenuAction: () => null,
      Preview: () => null,
      Trigger: ({ children }: { readonly children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
    },
  );

  return {
    Link,
    useLocalSearchParams: () => mockUseLocalSearchParams(),
    useRouter: () => ({ back: mockRouterBack }),
  };
});

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

import { captureAnalyticsEventDeferred } from "../src/observability/deferred-capture";
import SoundMixerAnchorScreen from "../src/app/(tabs)/sleep/sounds";
import { SoundMixerScreen } from "../src/sleep/sound-mixer-screen";

const hapticsSelectionAsync = Haptics.selectionAsync as jest.MockedFunction<
  typeof Haptics.selectionAsync
>;
const mockCaptureAnalyticsEventDeferred = captureAnalyticsEventDeferred as jest.MockedFunction<
  typeof captureAnalyticsEventDeferred
>;

describe("SoundMixerAnchorScreen", () => {
  beforeEach(() => {
    mockCreateAudioPlayer.mockClear();
    mockSetAudioModeAsync.mockClear();
    mockSetIsAudioActiveAsync.mockClear();
    mockSoundMixerAudioPlayer.clearLockScreenControls.mockClear();
    mockSoundMixerAudioPlayer.pause.mockClear();
    mockSoundMixerAudioPlayer.play.mockClear();
    mockSoundMixerAudioPlayer.remove.mockClear();
    mockSoundMixerAudioPlayer.seekTo.mockClear();
    mockSoundMixerAudioPlayer.setActiveForLockScreen.mockClear();
    mockSoundMixerAudioPlayer.volume = 1;
    hapticsSelectionAsync.mockClear();
    mockCaptureAnalyticsEventDeferred.mockReset();
    mockRouterBack.mockClear();
    mockUseLocalSearchParams.mockReset();
    mockUseLocalSearchParams.mockReturnValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the accepted Sound Mixer main handoff content", () => {
    render(<SoundMixerAnchorScreen />);

    expect(screen.getByRole("header", { name: "Sound Mixer" })).toBeTruthy();
    expect(screen.getByText("Offline pack")).toBeTruthy();
    expect(screen.getByText("Layer sounds for tonight.")).toBeTruthy();

    expect(screen.getByText("SAVED MIXES")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rain Hearth saved mix" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Forest Stream saved mix" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create new saved mix" })).toBeTruthy();

    expect(screen.getByText(/Timer/)).toBeTruthy();
    expect(screen.getAllByText("30 min")).toHaveLength(1);
    expect(screen.getByText(/Fade starts in/)).toBeTruthy();
    expect(screen.getByText("28 min")).toBeTruthy();

    for (const category of ["RAIN", "NATURE", "NOISE", "ENVIRONMENT", "TONES"]) {
      expect(screen.getByText(category)).toBeTruthy();
    }

    for (const sound of [
      "Light Rain",
      "Heavy Rain",
      "Rain on Window",
      "Thunderstorm",
      "Ocean Waves",
      "Forest",
      "River Stream",
      "Wind",
      "Brown Noise",
      "Pink Noise",
      "Fireplace Crackling",
      "Cafe Ambience",
      "432Hz Tone",
      "Delta Wave Binaural",
    ]) {
      expect(screen.getByText(sound)).toBeTruthy();
    }

    expect(screen.getByText("72%")).toBeTruthy();
    expect(screen.getByText("58%")).toBeTruthy();
    expect(screen.getByText("34%")).toBeTruthy();
    expect(screen.getByText("Tonight mix")).toBeTruthy();
    expect(screen.getByText("3 active layers")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Mix" })).toHaveProp(
      "accessibilityHint",
      "Opens the Save Mix sheet.",
    );
  });

  it("renders route-addressed proof variants through the validated uiVariant param", () => {
    mockUseLocalSearchParams.mockReturnValue({ uiVariant: ["full-save-mix-sheet"] });

    render(<SoundMixerAnchorScreen />);

    expect(screen.getByRole("header", { name: "Save mix" })).toBeTruthy();
    expect(screen.getByText("3 of 3 saved")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace existing mix" })).toBeTruthy();
  });

  it("starts the default bundled playback layers when native playback is provided", async () => {
    const playbackSnapshot = {
      activeLayerCount: 3,
      fadeProgress: 0,
      playingLayerCount: 3,
      remainingSeconds: 1_800,
      status: "playing" as const,
      timerDurationSeconds: 1_800,
      volumesBySoundId: {},
    };
    const playbackController = {
      getSnapshot: jest.fn(() => playbackSnapshot),
      handleAppStateChange: jest.fn(() => Promise.resolve(playbackSnapshot)),
      handleAudioInterruption: jest.fn(() => Promise.resolve(playbackSnapshot)),
      handleAudioOutputChange: jest.fn(() => Promise.resolve(playbackSnapshot)),
      handleTimerTick: jest.fn(() => Promise.resolve(playbackSnapshot)),
      release: jest.fn(),
      start: jest.fn(() => Promise.resolve(playbackSnapshot)),
      stop: jest.fn(() => Promise.resolve({ ...playbackSnapshot, status: "stopped" as const })),
      syncActiveLayers: jest.fn(() => Promise.resolve(playbackSnapshot)),
    };

    render(<SoundMixerScreen createPlaybackController={() => playbackController} />);

    await waitFor(() => {
      expect(playbackController.start).toHaveBeenCalledTimes(1);
    });

    expect(playbackController.start).toHaveBeenCalledWith(
      expect.objectContaining({
        activeLayers: [
          { soundId: "light-rain", volume: 72 },
          { soundId: "brown-noise", volume: 58 },
          { soundId: "fireplace-crackling", volume: 34 },
        ],
        timerDurationSeconds: 1_800,
      }),
    );
  });

  it("falls back to the default mixer when the proof variant param is unknown", () => {
    mockUseLocalSearchParams.mockReturnValue({ uiVariant: "unknown-proof-state" });

    render(<SoundMixerAnchorScreen />);

    expect(
      screen.getByRole("button", { name: "Light Rain active sound at 72% volume" }),
    ).toBeTruthy();
    expect(screen.getByText("72%")).toBeTruthy();
    expect(screen.queryByText("84%")).toBeNull();
    expect(screen.queryByTestId("sound-mixer-volume-ring-light-rain-knob")).toBeNull();
  });

  it("keeps active sounds and fixed controls accessible", () => {
    render(<SoundMixerAnchorScreen />);

    expect(
      screen.getByRole("button", { name: "Light Rain active sound at 72% volume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Brown Noise active sound at 58% volume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Fireplace Crackling active sound at 34% volume" }),
    ).toBeTruthy();

    expect(screen.getByLabelText("Light Rain active layer")).toHaveProp(
      "accessibilityRole",
      "image",
    );
    expect(screen.getByLabelText("Brown Noise active layer")).toHaveProp(
      "accessibilityRole",
      "image",
    );
    expect(screen.getByLabelText("Fireplace Crackling active layer")).toHaveProp(
      "accessibilityRole",
      "image",
    );

    expect(screen.getByRole("button", { name: "20 minute timer" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "30 minute timer, selected" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
    expect(screen.getByRole("button", { name: "∞ minute timer" })).toBeTruthy();
  });

  it("activates inactive sounds at the default volume and deactivates active cards", () => {
    render(<SoundMixerScreen uiVariant="empty-mixer" />);

    fireEvent.press(screen.getByRole("button", { name: "Heavy Rain sound" }));

    expect(
      screen.getByRole("button", { name: "Heavy Rain active sound at 70% volume" }),
    ).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getByText("1 active layer")).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-active-layer-heavy-rain")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Heavy Rain active sound at 70% volume" }));

    expect(screen.getByRole("button", { name: "Heavy Rain sound" })).toBeTruthy();
    expect(screen.queryByTestId("sound-mixer-active-layer-heavy-rain")).toBeNull();
    expect(screen.getByText("Choose up to 3 layers")).toBeTruthy();
  });

  it("restores saved-mix layer volumes instead of reactivating every sound at the default volume", () => {
    render(<SoundMixerAnchorScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Rain Hearth saved mix" }));

    expect(
      screen.getByRole("button", { name: "Light Rain active sound at 72% volume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Fireplace Crackling active sound at 34% volume" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Brown Noise sound" })).toBeTruthy();
    expect(screen.getByText("2 active layers")).toBeTruthy();
    expect(screen.queryByTestId("sound-mixer-active-layer-brown-noise")).toBeNull();
  });

  it("shows a quiet max-3 state without dropping an existing active layer", () => {
    render(<SoundMixerAnchorScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Ocean Waves sound" }));

    expect(screen.getByTestId("sound-mixer-max-layer-notice")).toBeTruthy();
    expect(screen.getByText("3 layers max. Remove one to add another.")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Light Rain active sound at 72% volume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Brown Noise active sound at 58% volume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Fireplace Crackling active sound at 34% volume" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ocean Waves sound" })).toBeTruthy();
  });

  it("renders the circular volume editing variant with visible detents and live volume", () => {
    render(<SoundMixerScreen uiVariant="volume-editing" />);

    expect(
      screen.getByRole("button", {
        name: "Light Rain active sound being edited at 84% volume",
      }),
    ).toBeTruthy();
    expect(screen.getByText("84%")).toBeTruthy();
    expect(screen.getByText("58%")).toBeTruthy();
    expect(screen.getByText("34%")).toBeTruthy();
    expect(screen.getByText("3 active layers")).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-volume-ring-light-rain-knob")).toBeTruthy();

    for (const index of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      expect(screen.getByTestId(`sound-mixer-volume-ring-light-rain-detent-${index}`)).toBeTruthy();
    }

    expect(screen.getByTestId("sound-mixer-sound-light-rain").props.className).toEqual(
      expect.stringContaining("border-[#A89CE0]/70"),
    );
    expect(screen.getByLabelText("Adjust Light Rain volume")).toHaveProp(
      "accessibilityRole",
      "adjustable",
    );
    expect(screen.getByLabelText("Adjust Light Rain volume")).toHaveProp("accessibilityActions", [
      { label: "Increase volume", name: "increment" },
      { label: "Decrease volume", name: "decrement" },
    ]);
  });

  it("drags the generous circular ring hit area with live clamped volume feedback", () => {
    render(<SoundMixerScreen uiVariant="volume-editing" />);

    const ringHitArea = screen.getByTestId("sound-mixer-volume-ring-light-rain-hit-area");

    fireEvent(ringHitArea, "responderGrant", {
      nativeEvent: { locationX: 48, locationY: 0, pageX: 48, pageY: 0 },
    });
    fireEvent(ringHitArea, "responderMove", {
      nativeEvent: { locationX: 96, locationY: 48, pageX: 96, pageY: 48 },
    });
    fireEvent(ringHitArea, "responderRelease", {
      nativeEvent: { locationX: 96, locationY: 48, pageX: 96, pageY: 48 },
    });

    expect(
      screen.getByRole("button", { name: "Light Rain active sound being edited at 25% volume" }),
    ).toBeTruthy();
    expect(screen.getByText("25%")).toBeTruthy();
    expect(hapticsSelectionAsync).toHaveBeenCalled();
  });

  it("offers an adjustable accessibility path that clamps volume and gates haptic detents", () => {
    render(<SoundMixerScreen uiVariant="empty-mixer" />);

    fireEvent.press(screen.getByRole("button", { name: "Heavy Rain sound" }));

    const volumeControl = screen.getByLabelText("Adjust Heavy Rain volume");

    for (let index = 0; index < 5; index += 1) {
      fireEvent(volumeControl, "accessibilityAction", {
        nativeEvent: { actionName: "increment" },
      });
    }

    expect(
      screen.getByRole("button", { name: "Heavy Rain active sound being edited at 100% volume" }),
    ).toBeTruthy();
    expect(hapticsSelectionAsync).toHaveBeenCalled();

    hapticsSelectionAsync.mockClear();

    for (let index = 0; index < 12; index += 1) {
      fireEvent(volumeControl, "accessibilityAction", {
        nativeEvent: { actionName: "decrement" },
      });
    }

    expect(
      screen.getByRole("button", { name: "Heavy Rain active sound being edited at 0% volume" }),
    ).toBeTruthy();
    expect(hapticsSelectionAsync).toHaveBeenCalled();
  });

  it("does not claim haptic detents when haptics are disabled", () => {
    render(<SoundMixerScreen disableHaptics uiVariant="volume-editing" />);

    fireEvent(screen.getByLabelText("Adjust Light Rain volume"), "accessibilityAction", {
      nativeEvent: { actionName: "increment" },
    });

    expect(
      screen.getByRole("button", { name: "Light Rain active sound being edited at 94% volume" }),
    ).toBeTruthy();
    expect(hapticsSelectionAsync).not.toHaveBeenCalled();
  });

  it("uses active-strip motion props only when reduced motion is off", () => {
    const { rerender } = render(<SoundMixerScreen reduceMotionOverride />);

    expect(
      screen.getByTestId("sound-mixer-active-layer-light-rain").props.entering,
    ).toBeUndefined();
    expect(screen.getByTestId("sound-mixer-active-layer-light-rain").props.exiting).toBeUndefined();
    expect(screen.getByTestId("sound-mixer-active-layer-light-rain").props.layout).toBeUndefined();

    rerender(<SoundMixerScreen reduceMotionOverride={false} />);

    expect(screen.getByTestId("sound-mixer-active-layer-light-rain").props.entering).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-active-layer-light-rain").props.exiting).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-active-layer-light-rain").props.layout).toBeTruthy();
  });

  it("renders the empty mixer state without active layers or save affordance", () => {
    render(<SoundMixerScreen uiVariant="empty-mixer" />);

    expect(screen.getByText("Starts when a sound plays.")).toBeTruthy();
    expect(screen.getByText("Choose up to 3 layers")).toBeTruthy();
    expect(screen.queryByText("72%")).toBeNull();
    expect(screen.queryByTestId("sound-mixer-active-layer-light-rain")).toBeNull();
    expect(screen.queryByTestId("sound-mixer-active-layer-brown-noise")).toBeNull();
    expect(screen.queryByTestId("sound-mixer-active-layer-fireplace-crackling")).toBeNull();

    expect(screen.getByRole("button", { name: "Show dark playback mode" })).toHaveProp(
      "accessibilityState",
      { disabled: true },
    );
    expect(screen.getByRole("button", { name: "Save Mix" })).toHaveProp("accessibilityState", {
      disabled: true,
    });
    expect(screen.getByRole("button", { name: "30 minute timer, selected" })).toHaveProp(
      "accessibilityState",
      { disabled: true, selected: true },
    );
  });

  it("renders the empty saved mixes variant while preserving a valid active mix", () => {
    render(<SoundMixerScreen uiVariant="empty-saved-mixes" />);

    expect(screen.getByTestId("sound-mixer-saved-mixes-empty-section")).toBeTruthy();
    expect(screen.getByText("No saved mixes yet.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Rain Hearth saved mix" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Forest Stream saved mix" })).toBeNull();
    expect(screen.getByRole("button", { name: "Create new saved mix" })).toBeTruthy();
    expect(screen.getByText("2 active layers")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Light Rain active sound at 72% volume" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Brown Noise active sound at 58% volume" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", {
        name: "Fireplace Crackling active sound at 34% volume",
      }),
    ).toBeNull();
  });

  it("renders the full saved mixes management variant at capacity", () => {
    render(<SoundMixerScreen uiVariant="full-saved-mixes" />);

    expect(screen.getByTestId("sound-mixer-saved-mixes-full-panel")).toBeTruthy();
    expect(screen.getByText("3 of 3 saved")).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-saved-mix-full-rain-hearth")).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-saved-mix-full-forest-stream")).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-saved-mix-full-ocean-noise")).toBeTruthy();
    expect(screen.getByText("Ocean Noise")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Saved mixes full" })).toHaveProp(
      "accessibilityState",
      { disabled: true },
    );
    expect(screen.getByText("Full")).toBeTruthy();
  });

  it("renders the full-capacity Save Mix sheet with replacement action", () => {
    render(<SoundMixerScreen uiVariant="full-save-mix-sheet" />);

    expect(screen.getByRole("header", { name: "Save mix" })).toBeTruthy();
    expect(screen.getByText("You can save up to 3 mixes.")).toBeTruthy();
    expect(screen.getByText("3 of 3 saved")).toBeTruthy();
    expect(screen.getByText("Replace saved mix")).toBeTruthy();
    expect(screen.getByText("Capacity reached")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace existing mix" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace Rain Hearth saved mix" })).toHaveProp(
      "accessibilityState",
      { selected: true },
    );
    expect(screen.getByRole("button", { name: "Replace Forest Stream saved mix" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace Ocean Noise saved mix" })).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-replace-mix-selector")).toBeTruthy();
  });

  it("opens the full-capacity Save Mix sheet when the proof variant changes after mount", () => {
    const { rerender } = render(<SoundMixerScreen />);

    expect(screen.queryByRole("header", { name: "Save mix" })).toBeNull();

    rerender(<SoundMixerScreen uiVariant="full-save-mix-sheet" />);

    expect(screen.getByRole("header", { name: "Save mix" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace existing mix" })).toBeTruthy();
  });

  it("closes the full-capacity Save Mix sheet when leaving the proof variant", () => {
    const { rerender } = render(<SoundMixerScreen uiVariant="full-save-mix-sheet" />);

    expect(screen.getByRole("header", { name: "Save mix" })).toBeTruthy();

    rerender(<SoundMixerScreen uiVariant="default" />);

    expect(screen.queryByRole("header", { name: "Save mix" })).toBeNull();
    expect(screen.getByTestId("sound-mixer-main-content")).toHaveProp("pointerEvents", "auto");
  });

  it("matches the handoff layout classes for the main screen and active strip", () => {
    render(<SoundMixerAnchorScreen />);

    expect(screen.getByTestId("sound-mixer-screen").props.className).toEqual(
      expect.stringContaining("flex-1 bg-[#0D0F1A]"),
    );
    expect(screen.getByTestId("sound-mixer-scroll").props.contentContainerClassName).toEqual(
      expect.stringContaining("pb-[252px]"),
    );
    expect(screen.getByTestId("sound-mixer-scroll")).toHaveProp(
      "contentInsetAdjustmentBehavior",
      "automatic",
    );
    expect(screen.getByTestId("sound-mixer-scroll")).toHaveProp("scrollEnabled", true);
    expect(screen.getByTestId("sound-mixer-header").props.className).toEqual(
      expect.stringContaining("px-nidoru-screen pt-12"),
    );
    expect(screen.getByTestId("sound-mixer-saved-mixes-row")).toHaveProp("horizontal", true);
    expect(screen.getByTestId("sound-mixer-timer-card").props.className).toEqual(
      expect.stringContaining("h-[52px]"),
    );
    expect(screen.getByTestId("sound-mixer-timer-card").props.className).toEqual(
      expect.stringContaining("rounded-[16px] border border-[#1E2236]/50 bg-[#14172B]/70"),
    );
    expect(screen.getByTestId("sound-mixer-sound-light-rain").props.className).toEqual(
      expect.stringContaining("border-[#7C6FCD]/40 bg-[#1C2040]"),
    );
    expect(screen.getByTestId("sound-mixer-sound-heavy-rain").props.className).toEqual(
      expect.stringContaining("border-[#1E2236]/60 bg-[#14172B]"),
    );
    expect(screen.getByTestId("sound-mixer-active-strip").props.className).toEqual(
      expect.stringContaining("absolute bottom-[96px] left-nidoru-screen right-nidoru-screen"),
    );
    expect(screen.getByTestId("sound-mixer-active-strip").props.className).toEqual(
      expect.stringContaining("rounded-[24px] border border-[#1E2236]/80 bg-[#14172B]/95"),
    );
    expect(screen.getByTestId("sound-mixer-timer-option-30").props.className).toEqual(
      expect.stringContaining("border border-[#2D3359]/50 bg-[#1C2040]"),
    );
  });

  it("opens the accepted Save Mix sheet over a dimmed mixer", () => {
    render(<SoundMixerAnchorScreen />);

    expect(screen.queryByText("Save mix")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));

    expect(screen.getByRole("header", { name: "Save mix" })).toBeTruthy();
    expect(screen.getByText("Keep this sound combination for another night.")).toBeTruthy();
    expect(screen.getByText("Mix name")).toBeTruthy();
    expect(screen.getByDisplayValue("Rain Hearth")).toBeTruthy();
    expect(screen.getByText("You can save up to 3 mixes.")).toBeTruthy();
    expect(screen.getByText("2 of 3 saved")).toBeTruthy();

    expect(screen.getByLabelText("Light Rain active layer at 72% volume")).toBeTruthy();
    expect(screen.getByLabelText("Brown Noise active layer at 58% volume")).toBeTruthy();
    expect(screen.getByLabelText("Fireplace Crackling active layer at 34% volume")).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-save-mix-name-input")).toHaveProp(
      "accessibilityLabel",
      "Mix name",
    );

    expect(
      screen.getByTestId("sound-mixer-main-content", { includeHiddenElements: true }),
    ).toHaveProp("pointerEvents", "none");
    expect(
      screen.getByTestId("sound-mixer-main-content", { includeHiddenElements: true }),
    ).toHaveProp("importantForAccessibility", "no-hide-descendants");
    expect(screen.getByTestId("sound-mixer-scroll", { includeHiddenElements: true })).toHaveProp(
      "scrollEnabled",
      false,
    );
    expect(screen.getByRole("button", { name: "Close Save Mix sheet" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancel Save Mix" })).toBeTruthy();
  });

  it("saves a named mix through the local persistence handler and updates the row", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-05-28T12:00:00.000Z"));

    const callOrder: string[] = [];
    const onSaveMix = jest.fn<() => Promise<void>>(async () => {
      callOrder.push("local-save");
    });
    mockCaptureAnalyticsEventDeferred.mockImplementation(() => {
      callOrder.push("analytics");
    });

    render(
      <SoundMixerScreen
        initialSavedMixRecords={[]}
        localInstallId="install_0123456789abcdef"
        onSaveMix={onSaveMix}
        uiVariant="empty-mixer"
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Heavy Rain sound" }));
    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));
    fireEvent.changeText(screen.getByTestId("sound-mixer-save-mix-name-input"), "  Storm Hearth  ");
    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));

    await waitFor(() => {
      expect(onSaveMix).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: "2026-05-28T12:00:00.000Z",
          layers: [{ soundId: "heavy-rain", volume: 70 }],
          localInstallId: "install_0123456789abcdef",
          mixId: expect.stringMatching(/^soundmix_[A-Za-z0-9_-]{8,64}$/),
          name: "Storm Hearth",
          timerPreference: 30,
          updatedAt: "2026-05-28T12:00:00.000Z",
        }),
      );
    });
    expect(screen.queryByText("Save mix")).toBeNull();
    expect(screen.getByRole("button", { name: "Storm Hearth saved mix" })).toBeTruthy();
    expect(mockCaptureAnalyticsEventDeferred).toHaveBeenCalledWith("sound_mix_saved", {
      active_layer_count: 1,
      source_surface: "sound_mixer",
      sound_category_ids: ["rain"],
      sound_ids: ["heavy-rain"],
      timer_option: 30,
    });
    expect(callOrder).toEqual(["local-save", "analytics"]);
    expect(JSON.stringify(mockCaptureAnalyticsEventDeferred.mock.calls)).not.toMatch(
      /Storm Hearth|install_|soundmix_|Bruno/i,
    );
  });

  it("keeps the saved mix update non-blocking when telemetry capture fails", async () => {
    const onSaveMix = jest.fn<() => Promise<void>>(() => Promise.resolve());
    mockCaptureAnalyticsEventDeferred.mockImplementationOnce(() => {
      throw new Error("posthog unavailable");
    });

    render(
      <SoundMixerScreen
        initialSavedMixRecords={[]}
        localInstallId="install_0123456789abcdef"
        onSaveMix={onSaveMix}
        uiVariant="empty-mixer"
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Heavy Rain sound" }));
    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));
    fireEvent.changeText(screen.getByTestId("sound-mixer-save-mix-name-input"), "Storm Hearth");
    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));

    await waitFor(() => {
      expect(onSaveMix).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText("Save mix")).toBeNull();
    expect(screen.getByRole("button", { name: "Storm Hearth saved mix" })).toBeTruthy();
  });

  it("replaces an existing saved mix instead of creating a fourth persisted record", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-05-28T12:10:00.000Z"));

    const onSaveMix = jest.fn<() => Promise<void>>(() => Promise.resolve());

    render(
      <SoundMixerScreen
        initialSavedMixRecords={[
          {
            createdAt: "2026-05-28T12:00:00.000Z",
            layers: [{ soundId: "light-rain", volume: 72 }],
            localInstallId: "install_0123456789abcdef",
            mixId: "soundmix_rainhearth0001",
            name: "Rain Hearth",
            timerPreference: 30,
            updatedAt: "2026-05-28T12:00:00.000Z",
          },
          {
            createdAt: "2026-05-28T12:01:00.000Z",
            layers: [{ soundId: "forest", volume: 70 }],
            localInstallId: "install_0123456789abcdef",
            mixId: "soundmix_foreststream0001",
            name: "Forest Stream",
            timerPreference: 45,
            updatedAt: "2026-05-28T12:01:00.000Z",
          },
          {
            createdAt: "2026-05-28T12:02:00.000Z",
            layers: [{ soundId: "ocean-waves", volume: 70 }],
            localInstallId: "install_0123456789abcdef",
            mixId: "soundmix_oceannoise0001",
            name: "Ocean Noise",
            timerPreference: 60,
            updatedAt: "2026-05-28T12:02:00.000Z",
          },
        ]}
        localInstallId="install_0123456789abcdef"
        onSaveMix={onSaveMix}
        uiVariant="full-save-mix-sheet"
      />,
    );

    fireEvent.changeText(screen.getByTestId("sound-mixer-save-mix-name-input"), "Storm Hearth");
    fireEvent.press(screen.getByRole("button", { name: "Replace existing mix" }));

    await waitFor(() => {
      expect(onSaveMix).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: "2026-05-28T12:00:00.000Z",
          localInstallId: "install_0123456789abcdef",
          mixId: "soundmix_rainhearth0001",
          name: "Storm Hearth",
          updatedAt: "2026-05-28T12:10:00.000Z",
        }),
      );
    });
    expect(screen.queryByText("Save mix")).toBeNull();
    expect(screen.getByTestId("sound-mixer-saved-mix-soundmix_rainhearth0001")).toBeTruthy();
    expect(screen.getByText("Storm Hearth")).toBeTruthy();
  });

  it("opens the dark playback base and wakes the temporary controls", () => {
    render(<SoundMixerAnchorScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Show dark playback mode" }));

    expect(screen.getByRole("button", { name: "Tap to show controls" })).toBeTruthy();
    expect(screen.getByText("Rain Hearth")).toBeTruthy();
    expect(screen.getByText("Playing softly")).toBeTruthy();
    expect(screen.getByText(/Fade starts in/)).toBeTruthy();
    expect(screen.getByText("TAP TO SHOW CONTROLS")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save Mix" })).toBeNull();
    expect(screen.queryByText("RAIN")).toBeNull();
    expect(screen.getByTestId("sound-mixer-dark-playback-idle").props.className).toEqual(
      expect.stringContaining("flex-1 bg-[#03040A]"),
    );
    expect(screen.getByTestId("sound-mixer-dark-playback-idle").props.entering).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-dark-playback-idle").props.exiting).toBeTruthy();
    expect(screen.getByTestId("sound-mixer-app-dimming-surface").props.className).toEqual(
      expect.stringContaining("bg-black"),
    );
    expect(screen.getByTestId("sound-mixer-dark-playback-ring").props.className).toEqual(
      expect.stringContaining("h-28 w-28"),
    );

    fireEvent.press(screen.getByRole("button", { name: "Tap to show controls" }));

    expect(screen.getByTestId("sound-mixer-dark-playback-controls")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause sound" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dim playback controls" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Adjust mix" })).toBeTruthy();
    expect(screen.getByLabelText("Light Rain active layer at 72% volume")).toBeTruthy();
    expect(screen.getByLabelText("Brown Noise active layer at 58% volume")).toBeTruthy();
    expect(screen.getByLabelText("Fireplace Crackling active layer at 34% volume")).toBeTruthy();
  });

  it("automatically dims to dark playback after 30 seconds while preserving the active mix", () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-05-28T23:00:00.000Z"));

    render(<SoundMixerAnchorScreen />);

    expect(screen.getByTestId("sound-mixer-main-content")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(29_999);
    });

    expect(screen.queryByTestId("sound-mixer-dark-playback-idle")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("sound-mixer-dark-playback-idle")).toBeTruthy();
    expect(screen.getByText("Rain Hearth")).toBeTruthy();
    expect(screen.getByText("Light Rain")).toBeTruthy();
    expect(screen.getByText("Brown Noise")).toBeTruthy();
    expect(screen.getByText("Fireplace")).toBeTruthy();
    expect(screen.getByText(/Fade starts in/)).toBeTruthy();
    expect(screen.getByText("28 min")).toBeTruthy();
    expect(screen.queryByTestId("sound-mixer-main-content")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save Mix" })).toBeNull();
  });

  it("resets the idle dimming timer after mixer interaction", () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse("2026-05-28T23:00:00.000Z"));

    render(<SoundMixerAnchorScreen />);

    act(() => {
      jest.advanceTimersByTime(25_000);
    });

    act(() => {
      fireEvent(screen.getByTestId("sound-mixer-main-content"), "touchStart");
    });

    act(() => {
      jest.advanceTimersByTime(29_999);
    });

    expect(screen.queryByTestId("sound-mixer-dark-playback-idle")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("sound-mixer-dark-playback-idle")).toBeTruthy();
  });

  it("uses an immediate dimming transition for reduced-motion users", () => {
    render(<SoundMixerScreen reduceMotionOverride />);

    fireEvent.press(screen.getByRole("button", { name: "Show dark playback mode" }));

    expect(screen.getByTestId("sound-mixer-dark-playback-idle").props.entering).toBeUndefined();
    expect(screen.getByTestId("sound-mixer-dark-playback-idle").props.exiting).toBeUndefined();

    fireEvent.press(screen.getByRole("button", { name: "Tap to show controls" }));

    expect(screen.getByTestId("sound-mixer-dark-playback-controls").props.entering).toBeUndefined();
  });

  it("renders the calm audio interruption recovery state", () => {
    render(<SoundMixerScreen initialPlaybackMode="interrupted" />);

    expect(screen.getByTestId("sound-mixer-dark-playback-interrupted")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Playback paused" })).toBeTruthy();
    expect(screen.getByText("Audio was interrupted.")).toBeTruthy();
    expect(screen.getByText("Timer is paused until you resume.")).toBeTruthy();
    expect(screen.getByText("Check your audio output if this keeps happening.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Resume sound" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Keep stopped" })).toBeTruthy();
    expect(screen.getByText("Light Rain")).toBeTruthy();
    expect(screen.getByText("Brown Noise")).toBeTruthy();
    expect(screen.getByText("Fireplace")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Resume sound" }));

    expect(screen.getByRole("button", { name: "Pause sound" })).toBeTruthy();
  });

  it("returns from the audio interruption state to the mixer when the user keeps audio stopped", () => {
    render(<SoundMixerScreen initialPlaybackMode="interrupted" />);

    fireEvent.press(screen.getByRole("button", { name: "Keep stopped" }));

    expect(screen.queryByTestId("sound-mixer-dark-playback-interrupted")).toBeNull();
    expect(screen.getByTestId("sound-mixer-screen")).toBeTruthy();
    expect(screen.getByText("Layer sounds for tonight.")).toBeTruthy();
  });

  it("matches the Save Mix sheet layout classes and touch-target requirements", () => {
    render(<SoundMixerAnchorScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));

    expectClassNameContains(
      screen.getByTestId("sound-mixer-main-content", { includeHiddenElements: true }).props
        .className,
      ["opacity-[0.45]", "blur-[2px]"],
    );
    expectClassNameContains(screen.getByTestId("sound-mixer-save-mix-overlay").props.className, [
      "absolute inset-0",
      "z-[100]",
      "justify-end",
      "bg-black/45",
      "backdrop-blur-[2px]",
    ]);
    expectClassNameContains(screen.getByTestId("sound-mixer-save-mix-sheet").props.className, [
      "rounded-t-[24px]",
      "border-t border-[#1E2236]",
      "bg-[#14172B]",
      "px-5 pt-3 pb-11",
      "shadow-[0_-10px_40px_rgba(0,0,0,0.5)]",
    ]);
    expectClassNameContains(
      screen.getByTestId("sound-mixer-save-mix-handle", { includeHiddenElements: true }).props
        .className,
      ["h-1 w-10", "bg-[#2D3359]"],
    );
    expectClassNameContains(screen.getByTestId("sound-mixer-save-mix-close").props.className, [
      "h-11 w-11",
      "active:scale-[0.96]",
    ]);
    expectClassNameContains(
      screen.getByTestId("sound-mixer-save-mix-close-icon-frame").props.className,
      ["h-8 w-8", "rounded-full", "border border-[#2D3359]", "bg-[#1C2040]"],
    );
    expectClassNameContains(screen.getByTestId("sound-mixer-save-mix-preview").props.className, [
      "rounded-[16px]",
      "min-h-[152px]",
      "border border-[#1E2236]/60",
      "bg-[#0D0F1A]",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    ]);
    expectClassNameContains(screen.getByTestId("sound-mixer-save-mix-submit").props.className, [
      "h-12",
      "rounded-[14px]",
      "bg-[#7C6FCD]",
    ]);
    expectClassNameContains(screen.getByTestId("sound-mixer-save-mix-cancel").props.className, [
      "h-12",
      "rounded-[14px]",
    ]);
  });

  it("dismisses the Save Mix sheet through Cancel and close", () => {
    render(<SoundMixerAnchorScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));
    fireEvent.press(screen.getByRole("button", { name: "Cancel Save Mix" }));

    expect(screen.queryByText("Save mix")).toBeNull();
    expect(screen.getByTestId("sound-mixer-main-content")).toHaveProp("pointerEvents", "auto");
    expect(screen.getByTestId("sound-mixer-scroll")).toHaveProp("scrollEnabled", true);

    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));
    fireEvent.press(screen.getByRole("button", { name: "Close Save Mix sheet" }));

    expect(screen.queryByText("Save mix")).toBeNull();
    expect(screen.getByTestId("sound-mixer-main-content")).toHaveProp("pointerEvents", "auto");
  });

  it("routes the back affordance without adding account or network behavior", () => {
    render(<SoundMixerAnchorScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Back to Sleep" }));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  it("does not render the old placeholder or introduce clinical claims", () => {
    const routeSource = readFileSync(
      resolve(__dirname, "../src/app/(tabs)/sleep/sounds.tsx"),
      "utf8",
    );
    const screenSource = readFileSync(
      resolve(__dirname, "../src/sleep/sound-mixer-screen.tsx"),
      "utf8",
    );
    const combinedSource = `${routeSource}\n${screenSource}`;

    expect(routeSource).not.toContain("TabPlaceholderScreen");
    expect(combinedSource).not.toMatch(
      /improves sleep|treats anxiety|heals insomnia|proven frequency/i,
    );
    expect(combinedSource).not.toMatch(/expo-audio|supabase|sqlite|fetch\(/i);
    expect(combinedSource).not.toMatch(
      /setInterval|requestAnimationFrame|Animated\.loop|withRepeat|useSharedValue/i,
    );

    render(<SoundMixerAnchorScreen />);
    fireEvent.press(screen.getByRole("button", { name: "Save Mix" }));

    expect(screen.queryByText(/account|sync|paywall|premium|cloud/i)).toBeNull();
  });
});

function expectClassNameContains(className: string | undefined, expectedParts: readonly string[]) {
  expect(className).toBeTruthy();

  for (const expectedPart of expectedParts) {
    expect(className).toContain(expectedPart);
  }
}
