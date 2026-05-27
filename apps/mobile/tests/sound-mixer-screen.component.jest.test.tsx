import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import SoundMixerAnchorScreen from "../src/app/(tabs)/sleep/sounds";

const mockRouterBack = jest.fn();

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

describe("SoundMixerAnchorScreen", () => {
  beforeEach(() => {
    mockRouterBack.mockClear();
  });

  it("renders the accepted Sound Mixer main handoff content", () => {
    render(<SoundMixerAnchorScreen />);

    expect(screen.getByRole("header", { name: "Sound Mixer" })).toBeTruthy();
    expect(screen.getByText("Offline pack")).toBeTruthy();
    expect(screen.getByText("Layer sounds for tonight.")).toBeTruthy();

    expect(screen.getByText("SAVED MIXES")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Rain Hearth saved mix" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Forest Fan saved mix" })).toBeTruthy();
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
      "White Noise",
      "Brown Noise",
      "Pink Noise",
      "Fireplace Crackling",
      "Cafe Ambience",
      "Fan",
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

  it("routes the back affordance without adding playback, account, or network behavior", () => {
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
