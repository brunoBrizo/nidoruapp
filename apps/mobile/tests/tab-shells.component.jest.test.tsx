import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import BreatheTabScreen from "../src/app/(tabs)/breathe";
import ProfileTabScreen from "../src/app/(tabs)/profile";
import ProgressTabScreen from "../src/app/(tabs)/progress";
import SleepTabScreen from "../src/app/(tabs)/sleep";
import {
  AppTabBar,
  TAB_ACTIVE_INDICATOR_MOTION,
  getTabIndicatorMotionConfig,
} from "../src/navigation/app-tab-bar";

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

const renderTabBar = (index = 0) =>
  render(
    <AppTabBar
      state={{ index, routes }}
      descriptors={descriptors}
      navigation={{
        emit: jest.fn(() => ({ defaultPrevented: false })),
        navigate: jest.fn(),
      }}
    />,
  );

describe("tab entry shells", () => {
  it("defines the product active-tab timing and reduced-motion cutoff", () => {
    expect(TAB_ACTIVE_INDICATOR_MOTION).toEqual({
      durationMs: 250,
      easing: "ease-in-out",
    });
    expect(getTabIndicatorMotionConfig(false)).toEqual({
      durationMs: 250,
      easing: "ease-in-out",
    });
    expect(getTabIndicatorMotionConfig(true)).toEqual({
      durationMs: 0,
      easing: "ease-in-out",
    });
  });

  it("renders one active indicator for the fixed five-tab bar without badges", () => {
    renderTabBar(2);

    expect(screen.getByTestId("tab-active-indicator")).toBeTruthy();
    expect(
      screen.getAllByRole("tab").map((tab) => within(tab).getByText(/.+/).props.children),
    ).toEqual([...tabLabels]);
    expect(screen.getByRole("tab", { name: "Breathe tab" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.queryByText(/badge/i)).toBeNull();
  });

  it("renders the Sleep MVP anchors", () => {
    render(<SleepTabScreen />);

    expect(screen.getByRole("header", { name: "Sleep" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Wind-Down Flow" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sound Mixer" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sleep Stories when added" })).toBeTruthy();
  });

  it("renders Breathe groups and available domain technique names", () => {
    render(<BreatheTabScreen />);

    expect(screen.getByRole("header", { name: "Breathe" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Sleep" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Calm" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Energy" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Focus" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "4-7-8 Sleep" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coherent Breathing" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Box Breathing" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Physiological Sigh" })).toBeTruthy();
  });

  it("renders the Progress MVP anchors", () => {
    render(<ProgressTabScreen />);

    expect(screen.getByRole("header", { name: "Progress" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Streak Calendar" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Weekly Summary" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Mood History" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sleep Trends" })).toBeTruthy();
  });

  it("renders the Profile MVP anchors without invoking real settings flows", () => {
    render(<ProfileTabScreen />);

    expect(screen.getByRole("header", { name: "Profile" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Settings" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Subscription" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cancel Subscription" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sound Preferences" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Support" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacy Controls" })).toBeTruthy();
    expect(
      screen.queryByText(
        /connect account|enable notifications|manage billing|contact support now/i,
      ),
    ).toBeNull();
  });
});
