import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import BreatheTabScreen, {
  BREATHE_FREE_BREATHE_STATUS,
  BREATHE_TECHNIQUE_LIBRARY,
} from "../src/app/(tabs)/breathe";
import ProfileTabScreen from "../src/app/(tabs)/profile";
import ProgressTabScreen from "../src/app/(tabs)/progress";
import RescueMeAnchorScreen from "../src/app/(tabs)/rescue-me";
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

  it("defines Breathe library route targets with explicit MVP technique ids and durations", () => {
    expect(
      BREATHE_TECHNIQUE_LIBRARY.map((technique) => ({
        href: technique.href,
        label: technique.label,
        rhythmLabel: technique.rhythmLabel,
      })),
    ).toEqual([
      {
        href: "/breathe/4-7-8-sleep?durationSeconds=300",
        label: "4-7-8 Sleep",
        rhythmLabel: "4 in · 7 hold · 8 out",
      },
      {
        href: "/breathe/coherent-breathing?durationSeconds=600",
        label: "Coherent Breathing / Daily Calm",
        rhythmLabel: "5 in · 5 out",
      },
      {
        href: "/breathe/box-breathing?durationSeconds=300",
        label: "Box Breathing",
        rhythmLabel: "4 in · 4 hold · 4 out · 4 hold",
      },
      {
        href: "/breathe/diaphragmatic-breathing?durationSeconds=300",
        label: "Diaphragmatic Breathing",
        rhythmLabel: "4 in · 6 out",
      },
    ]);
    expect(
      BREATHE_TECHNIQUE_LIBRARY.some((technique) => technique.href.includes("physiological-sigh")),
    ).toBe(false);
    expect(BREATHE_FREE_BREATHE_STATUS).toBe("post_mvp_disabled");
  });

  it("renders the Breathe reference library defaulting to the Sleep state", () => {
    render(<BreatheTabScreen />);

    expect(screen.getByRole("header", { name: "Breathe" })).toBeTruthy();
    expect(screen.getByText("Find a rhythm for right now.")).toBeTruthy();
    expect(screen.getByText("Choose by how you want to feel.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sleep" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByRole("button", { name: "Calm" })).toHaveProp("accessibilityState", {
      selected: false,
    });
    expect(screen.getByRole("link", { name: "4-7-8 Sleep" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coherent Breathing" })).toBeTruthy();
    expect(screen.getByText("Settle into the night.")).toBeTruthy();
    expect(screen.getByText("Smooth, steady rhythm.")).toBeTruthy();
    expect(screen.getByText("4 in · 7 hold · 8 out")).toBeTruthy();
    expect(screen.getByText("5 in · 5 out")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Box Breathing" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Diaphragmatic Breathing" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Physiological Sigh" })).toBeNull();
  });

  it("switches categories with local state and reveals the Calm technique set", () => {
    render(<BreatheTabScreen />);

    fireEvent.press(screen.getByRole("button", { name: "Calm" }));

    expect(screen.getByRole("button", { name: "Calm" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.queryByRole("link", { name: "4-7-8 Sleep" })).toBeNull();
    expect(screen.getByRole("link", { name: "Box Breathing" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coherent Breathing / Daily Calm" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Diaphragmatic Breathing" })).toBeTruthy();
  });

  it("gives visible techniques meaningful route and screen-reader labels", () => {
    render(<BreatheTabScreen />);

    const sleepTechnique = screen.getByRole("link", { name: "4-7-8 Sleep" });
    const coherentTechnique = screen.getByRole("link", { name: "Coherent Breathing" });

    expect(sleepTechnique).toHaveProp("accessibilityHint", "Starts 4-7-8 Sleep for 5 minutes.");
    expect(coherentTechnique).toHaveProp(
      "accessibilityHint",
      "Starts Coherent Breathing / Daily Calm for 10 minutes.",
    );
  });

  it("keeps Free Breathe visible but disabled while the custom mode remains post-MVP", () => {
    render(<BreatheTabScreen />);

    const freeBreathe = screen.getByRole("button", { name: "Free Breathe" });

    expect(freeBreathe).toHaveProp("accessibilityState", { disabled: true });
    expect(freeBreathe).toHaveProp(
      "accessibilityHint",
      "Custom Free Breathe settings are planned after MVP.",
    );
    expect(screen.getByText("Set your own inhale, hold, and exhale.")).toBeTruthy();
    expect(screen.getByText("Custom rhythm")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Free Breathe" })).toBeNull();
  });

  it("keeps Rescue Me separate from Daily Calm HRV copy", () => {
    render(<RescueMeAnchorScreen />);

    expect(screen.getByRole("header", { name: "Rescue Me" })).toBeTruthy();
    expect(screen.getByText(/immediate 4-7-8 relief/i)).toBeTruthy();
    expect(screen.queryByText(/daily calm|hrv training/i)).toBeNull();
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
