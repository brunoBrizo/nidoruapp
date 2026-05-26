import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import SleepTabScreen from "../src/app/(tabs)/sleep";

const mockRouterPush = jest.fn();

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
    useRouter: () => ({ push: mockRouterPush }),
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

describe("SleepTabScreen", () => {
  beforeEach(() => {
    mockRouterPush.mockClear();
  });

  it("renders the designed Sleep tab sections from the reference screen", () => {
    render(<SleepTabScreen />);

    expect(screen.getByRole("header", { name: "Sleep" })).toBeTruthy();
    expect(screen.getByText("Settle into tonight.")).toBeTruthy();

    expect(screen.getByText("Evening Wind-Down")).toBeTruthy();
    expect(screen.getByTestId("sleep-primary-card-fade")).toBeTruthy();
    expect(screen.getByText("4-7-8 breath · body relax · sleep sounds")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start wind-down" })).toHaveProp(
      "accessibilityHint",
      "Opens the Evening Wind-Down flow.",
    );

    expect(screen.getByRole("link", { name: "Sound Mixer" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sound Mixer anchor.",
    );
    expect(screen.getByText("Layer sounds for sleep.")).toBeTruthy();
    expect(screen.getByText("30 min")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getByText("55%")).toBeTruthy();
    expect(screen.getByText("35%")).toBeTruthy();
    expect(screen.getByText("Brown noise")).toBeTruthy();
    expect(screen.getByText("Fireplace")).toBeTruthy();

    expect(screen.getByRole("link", { name: "Rain quick sound" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sound Mixer anchor.",
    );
    expect(screen.getByRole("link", { name: "Ocean quick sound" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Fan quick sound" })).toBeTruthy();

    expect(screen.getByRole("link", { name: "Sleep Stories" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sleep Stories anchor.",
    );
    expect(screen.getByText("Quiet narration for restless thoughts.")).toBeTruthy();
    expect(screen.getByText("The Quiet Shoreline")).toBeTruthy();
    expect(screen.getByText("45 min")).toBeTruthy();
  });

  it("uses Tailwind classes for the Sleep handoff card hierarchy", () => {
    render(<SleepTabScreen />);

    expect(screen.getByTestId("sleep-screen").props.className).toEqual(
      expect.stringContaining("bg-[#0D0F1A]"),
    );
    expect(screen.getByTestId("sleep-screen").props.contentContainerClassName).toEqual(
      expect.stringContaining("gap-5 px-5 pt-12 pb-[104px]"),
    );

    expect(screen.getByTestId("sleep-primary-card").props.className).toEqual(
      expect.stringContaining("rounded-[24px] bg-[#1C2040] px-5 pt-[18px] pb-4"),
    );
    expect(screen.getByTestId("sleep-primary-cta").props.className).toEqual(
      expect.stringContaining("h-[44px] rounded-[16px] bg-[#7C6FCD]"),
    );

    expect(screen.getByTestId("sleep-mixer-card").props.className).toEqual(
      expect.stringContaining("rounded-[24px] border border-[#1E2236]/60 bg-[#14172B] p-5"),
    );
    expect(screen.getByTestId("sleep-timer-pill").props.className).toEqual(
      expect.stringContaining("rounded-[10px] border border-[#1E2236] bg-[#0D0F1A]/80"),
    );
    expect(screen.getByTestId("sleep-mixer-layer-Rain-fill").props.className).toEqual(
      expect.stringContaining("w-[70%]"),
    );
    expect(screen.getByTestId("sleep-mixer-layer-Brown noise-fill").props.className).toEqual(
      expect.stringContaining("w-[55%]"),
    );
    expect(screen.getByTestId("sleep-mixer-layer-Fireplace-fill").props.className).toEqual(
      expect.stringContaining("w-[35%]"),
    );

    expect(screen.getByTestId("sleep-quick-sound-Rain").props.className).toEqual(
      expect.stringContaining("rounded-[16px] border border-[#1E2236]/60 bg-[#14172B] px-4 py-3"),
    );
    expect(screen.getByTestId("sleep-story-card").props.className).toEqual(
      expect.stringContaining("rounded-[20px] border border-[#1E2236]/60 bg-[#14172B] p-4"),
    );
    expect(screen.getByTestId("sleep-story-preview").props.className).toEqual(
      expect.stringContaining("rounded-[16px] border border-[#1E2236]/50 bg-[#0D0F1A]/60 p-2.5"),
    );
  });

  it("routes the primary Wind-Down entry without adding account or permission gates", () => {
    render(<SleepTabScreen />);

    fireEvent.press(screen.getByRole("link", { name: "Start wind-down" }));

    expect(mockRouterPush).toHaveBeenCalledWith("/sleep/wind-down");
  });

  it("does not keep static StyleSheet styling in the Sleep tab implementation", () => {
    const sleepScreenSource = readFileSync(
      resolve(__dirname, "../src/sleep/sleep-screen.tsx"),
      "utf8",
    );

    expect(sleepScreenSource).not.toMatch(/StyleSheet\.create|styles\./);
  });
});
