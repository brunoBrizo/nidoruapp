import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

jest.mock("../src/rescue/rescue-me-launch-performance", () => ({
  markRescueMeHomeTap: jest.fn(),
}));

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
    usePathname: () => "/",
  };
});

import { AppTabBar } from "../src/navigation/app-tab-bar";
import HomeScreen from "../src/app/(tabs)/index";
import {
  HOME_CONTENT_ENTRANCE_MOTION,
  getHomeContentEntranceMotionConfig,
} from "../src/home/home-screen";
import { markRescueMeHomeTap } from "../src/rescue/rescue-me-launch-performance";

const routes = [
  { key: "home-key", name: "index" },
  { key: "sleep-key", name: "sleep" },
  { key: "breathe-key", name: "breathe" },
  { key: "progress-key", name: "progress" },
  { key: "profile-key", name: "profile" },
] as const;

const tabLabels = ["Home", "Sleep", "Breathe", "Progress", "Profile"] as const;

const descriptors = Object.fromEntries(
  routes.map((route, index) => [
    route.key,
    {
      options: {
        tabBarAccessibilityLabel: `${tabLabels[index]} tab`,
      },
    },
  ]),
);

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

const localDateAt = (hour: number, minute = 0) => new Date(2026, 0, 1, hour, minute);
const designDate = new Date(2026, 0, 6, 22, 42);

const quickActionIds = ["rescue-me", "sounds", "breathe"] as const;
const mockMarkRescueMeHomeTap = markRescueMeHomeTap as jest.MockedFunction<
  typeof markRescueMeHomeTap
>;
const routePressEvent = {
  defaultPrevented: true,
  preventDefault: jest.fn(),
};

describe("HomeScreen", () => {
  beforeEach(() => {
    mockMarkRescueMeHomeTap.mockClear();
  });

  it("defines decorative Home entrance timing without delaying action routes", () => {
    expect(HOME_CONTENT_ENTRANCE_MOTION).toEqual({
      durationMs: 400,
      easing: "ease-out",
      isDecorativeOnly: true,
    });
    expect(getHomeContentEntranceMotionConfig(false)).toEqual({
      durationMs: 400,
      easing: "ease-out",
      translateY: 12,
    });
    expect(getHomeContentEntranceMotionConfig(true)).toEqual({
      durationMs: 0,
      easing: "ease-out",
      translateY: 0,
    });

    render(<HomeScreen now={localDateAt(0)} />);

    expect(screen.getByRole("link", { name: "Start now" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Rescue Me quick action" })).toBeTruthy();
    expect(screen.getByTestId("home-entrance-polish")).toBeTruthy();
  });

  it("renders the updated Home handoff sections from home.html", () => {
    render(<HomeScreen now={designDate} />);

    expect(screen.getByText("Tuesday · 10:42 PM")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Good evening, Bruno" })).toBeTruthy();
    expect(screen.getByText("Tonight's wind-down is ready")).toBeTruthy();
    expect(screen.getByText("8 nights")).toBeTruthy();
    expect(screen.getByText("Tonight's Ritual")).toBeTruthy();
    expect(screen.getByText("~22 min")).toBeTruthy();
    expect(screen.getByText("Evening Wind-Down")).toBeTruthy();
    expect(screen.getByText("4-7-8 breathing · rain & low strings")).toBeTruthy();
    expect(screen.getByTestId("home-ritual-scene")).toBeTruthy();
    expect(screen.getByTestId("home-scene-crescent-moon")).toBeTruthy();
    expect(screen.getByText("In")).toBeTruthy();
    expect(screen.getByText("Hold")).toBeTruthy();
    expect(screen.getByText("Out")).toBeTruthy();
    expect(screen.getByText("Last night")).toBeTruthy();
    expect(screen.getByText("Rain helped you settle")).toBeTruthy();
    expect(screen.getByText("You fell asleep 14 min faster. Try box breathing tonight."))
      .toBeTruthy();
    expect(screen.getByText("7h 12m")).toBeTruthy();
    expect(screen.getByText("Wind-down library")).toBeTruthy();
    expect(screen.getByText("The Lantern Keeper")).toBeTruthy();
    expect(screen.getByText("Coastal Rainfall")).toBeTruthy();
    expect(screen.getByText("Body Scan")).toBeTruthy();
  });

  it("uses Tailwind primitives for the migrated Home shell and primary ritual card", () => {
    render(<HomeScreen now={designDate} />);

    expect(screen.getByTestId("home-root").props.className).toEqual(
      expect.stringContaining("bg-[#0D0F1A]"),
    );
    expect(screen.getByTestId("home-screen").props.className).not.toEqual(
      expect.stringContaining("bg-nidoru-dark-background"),
    );
    expect(screen.getByTestId("home-screen").props.contentContainerClassName).toEqual(
      expect.stringContaining("px-5 pt-12 pb-[104px]"),
    );
    expect(screen.getByTestId("home-ambient-backdrop").props.className).toEqual(
      expect.stringContaining("absolute inset-0"),
    );
    expect(screen.getByTestId("home-backdrop-svg")).toBeTruthy();
    expect(screen.getByTestId("home-backdrop-base-color")).toBeTruthy();
    expect(screen.getByTestId("home-backdrop-dot-grid")).toBeTruthy();
    expect(screen.getByTestId("home-backdrop-vignette")).toBeTruthy();
    expect(screen.getByTestId("home-primary-card").props.className).toEqual(
      expect.stringContaining("rounded-[28px]"),
    );
    expect(screen.getByTestId("home-primary-card").props.className).toEqual(
      expect.stringContaining("border-white/[0.06]"),
    );
    expect(screen.getByTestId("home-primary-card").props.className).toEqual(
      expect.stringContaining("shadow-[inset_0_1px_0_rgba(238,240,255,0.08)"),
    );
    expect(screen.getByTestId("home-primary-card").props.className).not.toEqual(
      expect.stringContaining("bg-[#14172B]"),
    );
    expect(screen.getByTestId("home-primary-card-backdrop")).toBeTruthy();
    expect(screen.getByTestId("home-primary-card-gradient")).toBeTruthy();
    expect(screen.getByTestId("home-primary-card-lavender-glow")).toBeTruthy();
    expect(screen.getByTestId("home-primary-card-moonstone-glow")).toBeTruthy();
    expect(screen.getByTestId("home-ritual-scene").props.className).not.toEqual(
      expect.stringContaining("bg-[#111426]"),
    );
    expect(screen.getByTestId("home-ritual-scene-svg")).toBeTruthy();
    expect(screen.getByTestId("home-mountain-far").props.d).toBe(
      "M0 124 L60 94 L110 114 L160 86 L220 119 L280 92 L340 112 L390 96 L390 144 L0 144 Z",
    );
    expect(screen.getByTestId("home-mountain-near").props.d).toBe(
      "M0 134 L40 114 L90 129 L150 106 L210 132 L260 114 L320 130 L390 116 L390 144 L0 144 Z",
    );
    expect(screen.getByTestId("home-crescent-moon-disc")).toBeTruthy();
    expect(screen.getByTestId("home-crescent-moon-cutout").props.r).toBe("19.2");
    expect(screen.getByTestId("home-primary-button-frame").props.className).toEqual(
      expect.stringContaining("overflow-hidden"),
    );
    expect(screen.getByTestId("home-primary-button-gradient")).toBeTruthy();
    expect(screen.getByTestId("home-primary-button-frame").props.className).toEqual(
      expect.stringContaining("active:scale-[0.97]"),
    );
  });

  it("keeps one primary CTA and exactly three secondary quick actions", () => {
    render(<HomeScreen />);

    expect(screen.getAllByRole("link", { name: "Start now" })).toHaveLength(1);
    expect(
      screen.getAllByLabelText(/quick action$/i).map((action) => action.props.accessibilityLabel),
    ).toEqual(["Rescue Me quick action", "Sounds quick action", "Breathe quick action"]);
  });

  it("exposes route-aware accessible hints for the persistent quick actions", () => {
    render(<HomeScreen />);

    expect(screen.getByRole("link", { name: "Rescue Me quick action" })).toHaveProp(
      "accessibilityHint",
      "Starts the Rescue Me anchor immediately.",
    );
    expect(screen.getByRole("link", { name: "Rescue Me quick action" })).toHaveProp(
      "href",
      "/rescue-me",
    );
    expect(screen.getByRole("link", { name: "Sounds quick action" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sound Mixer anchor.",
    );
    expect(screen.getByRole("link", { name: "Breathe quick action" })).toHaveProp(
      "accessibilityHint",
      "Opens the Breathe anchor.",
    );
  });

  it("marks Rescue Me taps before route navigation for repeatable latency proof", () => {
    const { unmount } = render(<HomeScreen now={localDateAt(0)} />);

    fireEvent.press(screen.getByRole("link", { name: "Start now" }), routePressEvent);

    expect(mockMarkRescueMeHomeTap).toHaveBeenCalledTimes(1);

    unmount();
    mockMarkRescueMeHomeTap.mockClear();

    render(<HomeScreen now={localDateAt(20)} />);

    fireEvent.press(screen.getByRole("link", { name: "Rescue Me quick action" }), routePressEvent);

    expect(mockMarkRescueMeHomeTap).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["00:00", localDateAt(0), "Rescue Me", "Immediate 4-7-8 relief"],
    ["05:00", localDateAt(5), "Morning Breathwork", "3 min energizing breath"],
    ["12:00", localDateAt(12), "Midday Reset", "Box breathing for stress"],
    ["17:00", localDateAt(17), "Evening Wind-Down", "4-7-8 breathing · rain & low strings"],
    ["20:00", localDateAt(20), "Evening Wind-Down", "4-7-8 breathing · rain & low strings"],
  ])(
    "renders only the %s local-time primary action",
    (_timeLabel, now, expectedLabel, expectedSubtitle) => {
      render(<HomeScreen now={now} />);

      expect(screen.getByRole("header", { name: expectedLabel })).toBeTruthy();
      expect(screen.getByText(expectedSubtitle)).toBeTruthy();
      expect(screen.getAllByRole("link", { name: "Start now" })).toHaveLength(1);
    },
  );

  it("renders a one-tap check-in entry when last-night data is missing", () => {
    render(<HomeScreen hasMorningCheckIn={false} now={localDateAt(8)} />);

    expect(screen.queryByText("Last night")).toBeNull();
    expect(screen.getByRole("header", { name: "How did you sleep?" })).toBeTruthy();
    expect(screen.getByText("Take a quiet check-in for last night.")).toBeTruthy();
    expect(screen.getByText("One tap to log it. Skip anytime.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tap to log" })).toHaveProp(
      "accessibilityHint",
      "Opens the morning check-in anchor.",
    );
    expect(screen.getAllByRole("link", { name: "Start now" })).toHaveLength(1);
  });

  it("matches the compact home.html quick action card structure", () => {
    render(<HomeScreen now={designDate} />);

    expect(screen.getByTestId("home-quick-action-grid").props.className).toEqual(
      expect.stringContaining("flex-row gap-2.5"),
    );
    for (const actionId of quickActionIds) {
      expect(screen.getByTestId(`home-quick-action-card-${actionId}`).props.className).toEqual(
        expect.stringContaining("min-h-[92px]"),
      );
      expect(screen.getByTestId(`home-quick-action-card-${actionId}`).props.className).toEqual(
        expect.stringContaining("rounded-[18px]"),
      );
      expect(screen.getByTestId(`home-quick-action-icon-box-${actionId}`).props.className).toEqual(
        expect.stringContaining("h-9 w-9 rounded-full"),
      );
    }
    expect(screen.getByTestId("home-quick-action-card-rescue-me").props.className).toEqual(
      expect.stringContaining("border-[#FF6B6B]/15"),
    );
    expect(
      within(screen.getByTestId("home-quick-action-card-rescue-me")).getByText("Rescue Me"),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("home-quick-action-card-rescue-me")).getByText("Immediate"),
    ).toBeTruthy();
    expect(screen.getByText("3 mixes")).toBeTruthy();
    expect(screen.getByText("Just orb")).toBeTruthy();
    for (const actionId of ["sounds", "breathe"]) {
      expect(screen.getByTestId(`home-quick-action-card-${actionId}`).props.className).not.toEqual(
        expect.stringContaining("FF6B6B"),
      );
      expect(
        screen.getByTestId(`home-quick-action-icon-box-${actionId}`).props.className,
      ).not.toEqual(expect.stringContaining("FF6B6B"));
    }
  });

  it("omits prohibited Home surfaces", () => {
    render(<HomeScreen />);

    expect(screen.queryByText(/feed/i)).toBeNull();
    expect(screen.queryByText(/trending/i)).toBeNull();
    expect(screen.queryByText(/upsell/i)).toBeNull();
    expect(screen.queryByText(/badge/i)).toBeNull();
    expect(screen.queryByText("Technical proof screen")).toBeNull();
    expect(screen.queryByText("Mobile design foundation")).toBeNull();
  });

  it("renders the fixed five tab labels in shell order", () => {
    render(
      <AppTabBar
        state={{ index: 0, routes }}
        descriptors={descriptors}
        navigation={{
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        }}
      />,
    );

    expect(
      screen.getAllByRole("tab").map((tab) => within(tab).getByText(/.+/).props.children),
    ).toEqual([...tabLabels]);
  });
});
