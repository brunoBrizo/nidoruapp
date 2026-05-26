import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import ProgressTabScreen, { PROGRESS_DASHBOARD_CARDS } from "../src/app/(tabs)/progress";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    Link: ({
      children,
      href,
    }: {
      readonly children: React.ReactElement<{ readonly href?: string }>;
      readonly href: string;
    }) => React.cloneElement(children, { href }),
  };
});

jest.mock("lucide-react-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);

  return {
    ChevronRight: Icon,
  };
});

const mobileRoot = join(__dirname, "..");
const readMobileSource = (sourcePath: string) => readFileSync(join(mobileRoot, sourcePath), "utf8");

describe("ProgressScreen Tailwind parity", () => {
  it("renders the Progress handoff with Tailwind primitives and reusable card previews", () => {
    render(<ProgressTabScreen />);

    expect(screen.getByTestId("progress-screen").props.className).toEqual(
      expect.stringContaining("bg-[#0D0F1A]"),
    );
    expect(screen.getByTestId("progress-screen").props.contentContainerClassName).toEqual(
      expect.stringContaining("px-nidoru-screen pt-12 pb-[104px]"),
    );
    expect(screen.getByTestId("progress-stat-row").props.className).toEqual(
      expect.stringContaining("flex-row gap-3"),
    );
    expect(screen.getByTestId("progress-stat-card-current-rhythm").props.className).toEqual(
      expect.stringContaining("min-h-[72px]"),
    );
    expect(screen.getByTestId("progress-stat-card-current-rhythm").props.className).toEqual(
      expect.stringContaining("bg-[#14172B]/50"),
    );
    expect(screen.getByTestId("progress-stat-value-current-rhythm").props.className).toEqual(
      expect.stringContaining("tabular-nums"),
    );

    for (const card of PROGRESS_DASHBOARD_CARDS) {
      expect(screen.getByRole("link", { name: card.title })).toHaveProp("href", card.href);
      expect(screen.getByTestId(`progress-card-${card.id}`).props.className).toEqual(
        expect.stringContaining("rounded-[20px]"),
      );
      expect(screen.getByTestId(`progress-card-${card.id}`).props.className).toEqual(
        expect.stringContaining("bg-[#14172B]/50"),
      );
      expect(screen.getByTestId(`progress-card-${card.id}`).props.className).toEqual(
        expect.stringContaining("active:scale-[0.96]"),
      );
    }

    expect(screen.getByTestId("progress-week-dot-complete-0").props.className).toEqual(
      expect.stringContaining("h-6 w-6 rounded-full bg-[#A89CE0]/90"),
    );
    expect(screen.getByTestId("progress-week-dot-paused-2").props.className).toEqual(
      expect.stringContaining("border-[1.5px] border-[#8A8FA8]/40"),
    );
    expect(screen.getByTestId("progress-week-dot-today-4").props.className).toEqual(
      expect.stringContaining("border-[1.5px] border-[#A89CE0]/60"),
    );
    expect(screen.getByTestId("progress-week-dot-future-5").props.className).toEqual(
      expect.stringContaining("border border-[#4A4E6A]/40"),
    );
    expect(screen.getByTestId("progress-weekly-count").props.className).toEqual(
      expect.stringContaining("tabular-nums"),
    );
    expect(screen.getByTestId("progress-mood-tag-active-2").props.className).toEqual(
      expect.stringContaining("bg-[#A89CE0]/15"),
    );
    expect(screen.getByTestId("progress-mood-tag-faded-3").props.className).toEqual(
      expect.stringContaining("opacity-50"),
    );
    expect(screen.getByTestId("progress-trend-bars").props.className).toEqual(
      expect.stringContaining("h-5"),
    );
    expect(screen.getByTestId("progress-trend-bar-active-3").props.className).toEqual(
      expect.stringContaining("bg-[#7C6FCD]"),
    );
  });

  it("keeps the migrated Progress sources free of stale static StyleSheet styling", () => {
    const progressSource = readMobileSource("src/progress/progress-screen.tsx");
    const progressRouteSource = readMobileSource("src/app/(tabs)/progress.tsx");
    const progressAnchorSource = readMobileSource("src/app/(tabs)/progress/[anchor].tsx");

    expect(progressSource).toContain('from "../tw"');
    expect(progressSource).toContain("className=");
    expect(progressSource).not.toMatch(/StyleSheet\.create|styles\./);
    expect(progressRouteSource).not.toMatch(/StyleSheet\.create|styles\./);
    expect(progressAnchorSource).toContain("TabPlaceholderScreen");
    expect(progressAnchorSource).not.toMatch(/StyleSheet\.create|styles\./);
  });
});
