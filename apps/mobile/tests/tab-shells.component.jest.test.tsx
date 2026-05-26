import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import BreatheTabScreen, {
  BREATHE_FREE_BREATHE_STATUS,
  BREATHE_TECHNIQUE_LIBRARY,
} from "../src/app/(tabs)/breathe";
import ProfileTabScreen from "../src/app/(tabs)/profile";
import ProgressTabScreen, { PROGRESS_DASHBOARD_CARDS } from "../src/app/(tabs)/progress";
import RescueMeAnchorScreen from "../src/app/(tabs)/rescue-me";
import SleepTabScreen from "../src/app/(tabs)/sleep";
import {
  AppTabBar,
  TAB_ACTIVE_INDICATOR_MOTION,
  getTabIndicatorMotionConfig,
} from "../src/navigation/app-tab-bar";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

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

  it("renders the fixed five-tab bar with a Breathe active indicator and no badges", () => {
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
    expect(screen.getByRole("link", { name: "Start wind-down" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sound Mixer" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sleep Stories" })).toBeTruthy();
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
    expect(screen.getByTestId("breathe-screen").props.className).toEqual(
      expect.stringContaining("bg-[#0D0F1A]"),
    );
    expect(screen.getByTestId("breathe-tabs").props.className).toEqual(
      expect.stringContaining("rounded-2xl bg-[#14172B]/50 p-1.5"),
    );
    expect(screen.getByRole("button", { name: "Sleep" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByRole("button", { name: "Calm" })).toHaveProp("accessibilityState", {
      selected: false,
    });
    expect(screen.getByRole("link", { name: "4-7-8 Sleep" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coherent Breathing" })).toBeTruthy();
    expect(screen.getByTestId("breathe-4-7-8-sleep-card-fade")).toBeTruthy();
    expect(screen.getByTestId("breathe-coherent-breathing-card-fade")).toBeTruthy();
    expect(screen.getByText("Settle into the night.")).toBeTruthy();
    expect(screen.getByText("Smooth, steady rhythm.")).toBeTruthy();
    expect(screen.getByText("4 in · 7 hold · 8 out")).toBeTruthy();
    expect(screen.getByText("5 in · 5 out")).toBeTruthy();
    expect(screen.getByTestId("breathe-4-7-8-sleep-card").props.className).toEqual(
      expect.stringContaining("min-h-[100px]"),
    );
    expect(screen.getByTestId("breathe-4-7-8-sleep-card").props.className).toEqual(
      expect.stringContaining("rounded-[20px]"),
    );
    expect(screen.getByTestId("breathe-4-7-8-sleep-card").props.className).toEqual(
      expect.stringContaining("bg-[#14172B]/50"),
    );
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
    expect(screen.getByTestId("breathe-box-breathing-card-fade")).toBeTruthy();
    expect(screen.getByTestId("breathe-coherent-breathing-card-fade")).toBeTruthy();
    expect(screen.getByTestId("breathe-diaphragmatic-breathing-card-fade")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Energy" }));

    expect(screen.getByRole("button", { name: "Energy" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByRole("link", { name: "Coherent Breathing / Daily Calm" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Box Breathing" })).toBeTruthy();
    expect(screen.getByTestId("breathe-coherent-breathing-card-fade")).toBeTruthy();
    expect(screen.getByTestId("breathe-box-breathing-card-fade")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Focus" }));

    expect(screen.getByRole("button", { name: "Focus" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByRole("link", { name: "Box Breathing" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Coherent Breathing / Daily Calm" })).toBeTruthy();
    expect(screen.getByTestId("breathe-box-breathing-card-fade")).toBeTruthy();
    expect(screen.getByTestId("breathe-coherent-breathing-card-fade")).toBeTruthy();
    expect(screen.queryByTestId("breathe-free-breathe-card-fade")).toBeNull();
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
    expect(freeBreathe.props.className).toEqual(expect.stringContaining("min-h-[88px]"));
    expect(freeBreathe.props.className).toEqual(expect.stringContaining("rounded-[20px]"));
    expect(freeBreathe.props.className).toEqual(expect.stringContaining("bg-[#14172B]/20"));
    expect(freeBreathe).toHaveProp(
      "accessibilityHint",
      "Custom Free Breathe settings are planned after MVP.",
    );
    expect(screen.getByText("Set your own inhale, hold, and exhale.")).toBeTruthy();
    expect(screen.getByText("Custom rhythm")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Free Breathe" })).toBeNull();
  });

  it("keeps Rescue Me separate from Daily Calm HRV copy", () => {
    const { unmount } = render(<RescueMeAnchorScreen />);

    expect(screen.getByTestId("rescue-me-screen-active-launch")).toBeTruthy();
    expect(screen.getByLabelText("Inhale breathing phase")).toBeTruthy();
    expect(screen.queryByText(/daily calm|hrv training/i)).toBeNull();
    expect(screen.queryByText(/setup|technique|choose|account|paywall|permission/i)).toBeNull();

    unmount();
  });

  it("renders the Progress reference dashboard and keeps anchors reachable", () => {
    render(<ProgressTabScreen />);

    expect(screen.getByRole("header", { name: "Progress" })).toBeTruthy();
    expect(screen.getByText("Small patterns, no pressure.")).toBeTruthy();
    expect(screen.getByText("current rhythm")).toBeTruthy();
    expect(screen.getByText("sessions")).toBeTruthy();
    expect(screen.getByText("breath time")).toBeTruthy();
    expect(screen.getByText("Missed days pause. They do not reset.")).toBeTruthy();
    expect(screen.getByText("A gentle look at your last 7 nights.")).toBeTruthy();
    expect(screen.getByText("5 of 7 nights")).toBeTruthy();
    expect(screen.getByText("Morning check-ins over time.")).toBeTruthy();
    expect(screen.getByText("clear")).toBeTruthy();
    expect(screen.getByText("Patterns appear after a few check-ins.")).toBeTruthy();

    for (const card of PROGRESS_DASHBOARD_CARDS) {
      expect(screen.getByRole("link", { name: card.title })).toHaveProp("href", card.href);
    }

    expect(
      screen.queryByText("Compassionate progress anchors without streak pressure."),
    ).toBeNull();
    expect(screen.queryByText("Future check-in trend anchor.")).toBeNull();
  });

  it("renders the Profile reference screen without invoking real settings flows", () => {
    render(<ProfileTabScreen />);

    expect(screen.getByRole("link", { name: "Profile details" })).toHaveProp(
      "href",
      "/profile/settings",
    );
    expect(screen.getByText("Bruno")).toBeTruthy();
    expect(screen.getByText("Nidoru member")).toBeTruthy();
    expect(screen.getByText("8-day rhythm")).toBeTruthy();
    expect(screen.getByText("48 min breath time")).toBeTruthy();
    expect(screen.getByTestId("profile-card-fade")).toBeTruthy();
    expect(screen.getByText("Manage")).toBeTruthy();
    expect(screen.getByText("Quiet")).toBeTruthy();

    expect(screen.getByRole("link", { name: "Subscription" })).toHaveProp(
      "href",
      "/profile/subscription",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveProp("href", "/profile/settings");
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveProp(
      "href",
      "/profile/notifications",
    );
    expect(screen.getByRole("link", { name: "Sound preferences" })).toHaveProp(
      "href",
      "/profile/sound-preferences",
    );
    expect(screen.getByRole("link", { name: "Support" })).toHaveProp("href", "/profile/support");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveProp("href", "/profile/privacy");
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveProp(
      "accessibilityHint",
      "Opens notification preferences. Current state: Quiet.",
    );
    expect(
      screen.queryByText(
        /cancel subscription|connect account|enable notifications|manage billing|contact support now/i,
      ),
    ).toBeNull();
  });

  it("uses Profile Tailwind primitives that match the accepted content handoff", () => {
    render(<ProfileTabScreen />);

    expect(screen.getByTestId("profile-screen").props.className).toEqual(
      expect.stringContaining("bg-nidoru-dark-background"),
    );
    expect(screen.getByTestId("profile-screen").props.contentContainerClassName).toEqual(
      expect.stringContaining("gap-6 px-5 pt-8 pb-[112px]"),
    );
    expect(screen.getByTestId("profile-card").props.className).toEqual(
      expect.stringContaining("rounded-[20px] border border-[#1E2236]/80 bg-[#14172B] p-4"),
    );
    expect(screen.getByTestId("profile-card").props.className).toEqual(
      expect.stringContaining("active:scale-[0.96]"),
    );
    expect(screen.getByTestId("profile-avatar").props.className).toEqual(
      expect.stringContaining("h-[52px] w-[52px] rounded-full"),
    );
    expect(screen.getByTestId("profile-rhythm-chip").props.className).toEqual(
      expect.stringContaining("rounded-[12px] border border-[#1E2236]/50 bg-[#0D0F1A]/50"),
    );
    expect(screen.getByTestId("profile-subscription-row").props.className).toEqual(
      expect.stringContaining("min-h-[64px] rounded-[20px] border border-[#1E2236]/60"),
    );

    for (const rowId of ["settings", "notifications", "sound-preferences", "support", "privacy"]) {
      expect(screen.getByTestId(`profile-list-row-${rowId}`).props.className).toEqual(
        expect.stringContaining("min-h-[74px] rounded-[20px] border border-[#1E2236]/60"),
      );
      expect(screen.getByTestId(`profile-list-row-icon-${rowId}`).props.className).toEqual(
        expect.stringContaining("h-10 w-10 rounded-[12px] border border-[#1E2236]/50"),
      );
    }
  });
});
