import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";

import { RESTING_BREATHING_ORB_TEST_IDS } from "../src/breathing/breathing-orb";
import { AppTabBar } from "../src/navigation/app-tab-bar";
import HomeScreen from "../src/app/(tabs)/index";
import {
  HOME_CONTENT_ENTRANCE_MOTION,
  HOME_ORB_MOTION,
  getHomeContentEntranceMotionConfig,
} from "../src/home/home-screen";

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

describe("HomeScreen", () => {
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

  it("renders the verified Home layout sections", () => {
    render(<HomeScreen now={localDateAt(20)} />);

    expect(screen.getByRole("header", { name: "Good evening, Bruno" })).toBeTruthy();
    expect(screen.getByText("Tonight’s wind-down is ready")).toBeTruthy();
    expect(screen.getByText("8 days")).toBeTruthy();
    expect(screen.getByText("Evening Wind-Down")).toBeTruthy();
    expect(screen.getByText("4-7-8 breathing · 20 min sounds")).toBeTruthy();
    expect(screen.getByTestId("home-primary-card")).toBeTruthy();
    expect(screen.getByTestId("home-primary-card-fade")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("home-primary-card").props.style)).toEqual(
      expect.objectContaining({
        paddingBottom: 24,
      }),
    );
    expect(StyleSheet.flatten(screen.getByTestId("home-primary-button-frame").props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: "rgba(124, 111, 205, 0.88)",
        borderRadius: 16,
        minHeight: 48,
      }),
    );
    expect(
      within(
        screen.getByTestId("home-resting-breathing-orb", {
          includeHiddenElements: true,
        }),
      ).getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core, {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
    expect(screen.getByText("Last night")).toBeTruthy();
    expect(screen.getByText("Rain helped you settle")).toBeTruthy();
    expect(screen.getByText("Your sleep rhythm")).toBeTruthy();
    expect(screen.getByText("A steady week, with room to rest.")).toBeTruthy();
  });

  it("matches the PNG Home orb geometry and motion contract", () => {
    expect(HOME_ORB_MOTION).toEqual({
      corePulseDurationMs: 6000,
      isDecorativeOnly: true,
      ringPulseDurationMs: 6000,
      spinDurationMs: 12000,
    });

    render(<HomeScreen now={localDateAt(20)} />);

    const orbRoot = screen.getByTestId("home-resting-breathing-orb", {
      includeHiddenElements: true,
    });
    const orb = within(orbRoot);

    expect(StyleSheet.flatten(orbRoot.props.style)).toEqual(
      expect.objectContaining({
        alignSelf: "center",
        height: 112,
        width: 116,
      }),
    );
    expect(orb.getByTestId("home-orb-arc-layer", { includeHiddenElements: true })).toBeTruthy();
    expect(
      StyleSheet.flatten(
        orb.getByTestId("home-orb-pulse-ring", { includeHiddenElements: true }).props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        borderRadius: 42,
        height: 84,
        width: 84,
      }),
    );
    expect(
      StyleSheet.flatten(
        orb.getByTestId(RESTING_BREATHING_ORB_TEST_IDS.core, {
          includeHiddenElements: true,
        }).props.style,
      ),
    ).toEqual(
      expect.objectContaining({
        borderRadius: 21,
        height: 42,
        width: 42,
      }),
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
    expect(screen.getByRole("link", { name: "Sounds quick action" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sound Mixer anchor.",
    );
    expect(screen.getByRole("link", { name: "Breathe quick action" })).toHaveProp(
      "accessibilityHint",
      "Opens the Breathe anchor.",
    );
  });

  it.each([
    ["00:00", localDateAt(0), "Rescue Me", "Immediate 4-7-8 relief"],
    ["05:00", localDateAt(5), "Morning Breathwork", "3 min energizing breath"],
    ["12:00", localDateAt(12), "Midday Reset", "Box breathing for stress"],
    ["17:00", localDateAt(17), "Evening Wind-Down", "4-7-8 breathing · 20 min sounds"],
    ["20:00", localDateAt(20), "Evening Wind-Down", "4-7-8 breathing · 20 min sounds"],
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

  it("keeps the rhythm strip compassionate and pressure-free", () => {
    render(<HomeScreen now={localDateAt(20)} />);

    expect(screen.getByText("A steady week, with room to rest.")).toBeTruthy();
    expect(screen.queryByText(/red badge|reset|failed|lost|broken|missed/i)).toBeNull();
  });

  it("matches the compact home.png quick action card structure", () => {
    render(<HomeScreen now={localDateAt(20)} />);

    const quickActionCards = ["rescue-me", "sounds", "breathe"].map((actionId) =>
      screen.getByTestId(`home-quick-action-card-${actionId}`),
    );

    expect(quickActionCards.map((action) => StyleSheet.flatten(action.props.style))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: "rgba(20, 23, 43, 0.5)",
          borderRadius: 16,
          minHeight: 80,
        }),
      ]),
    );
    for (const actionId of ["rescue-me", "sounds", "breathe"]) {
      expect(
        StyleSheet.flatten(
          screen.getByTestId(`home-quick-action-icon-box-${actionId}`).props.style,
        ),
      ).toEqual(
        expect.objectContaining({
          alignItems: "center",
          height: 24,
          justifyContent: "center",
          width: 24,
        }),
      );
    }
  });

  it("omits prohibited Home surfaces", () => {
    render(<HomeScreen />);

    expect(screen.queryByText(/library/i)).toBeNull();
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
