import { describe, expect, it } from "@jest/globals";

import {
  appShellTabs,
  createLocalHomeState,
  homePrimaryActionWindows,
  homeQuickActions,
  selectHomePrimaryAction,
} from "../src/home/home-actions";

const localDateAt = (hour: number, minute = 0) => new Date(2026, 0, 1, hour, minute);

describe("home actions contract", () => {
  it("keeps the fixed app shell tabs in product order", () => {
    expect(appShellTabs.map((tab) => tab.label)).toEqual([
      "Home",
      "Sleep",
      "Breathe",
      "Progress",
      "Profile",
    ]);
    expect(appShellTabs.map((tab) => tab.routeTarget)).toEqual([
      "/",
      "/sleep",
      "/breathe",
      "/progress",
      "/profile",
    ]);
  });

  it("keeps the fixed Home quick actions in design order", () => {
    expect(homeQuickActions).toHaveLength(3);
    expect(homeQuickActions.map((action) => action.label)).toEqual([
      "Rescue Me",
      "Sounds",
      "Breathe",
    ]);
    expect(homeQuickActions.map((action) => action.routeTarget)).toEqual([
      "/rescue-me",
      "/sleep/sounds",
      "/breathe",
    ]);
  });

  it("defines all five primary action windows", () => {
    expect(homePrimaryActionWindows).toEqual([
      { id: "late-night", startsAtMinute: 0, endsAtMinute: 300, actionId: "rescue-me" },
      { id: "morning", startsAtMinute: 300, endsAtMinute: 720, actionId: "morning-breathwork" },
      { id: "midday", startsAtMinute: 720, endsAtMinute: 1020, actionId: "midday-reset" },
      { id: "evening", startsAtMinute: 1020, endsAtMinute: 1200, actionId: "evening-prep" },
      { id: "night", startsAtMinute: 1200, endsAtMinute: 1440, actionId: "wind-down-flow" },
    ]);
  });

  it.each([
    ["00:00", localDateAt(0, 0), "Rescue Me", true],
    ["04:59", localDateAt(4, 59), "Rescue Me", true],
    ["05:00", localDateAt(5, 0), "Morning Breathwork", false],
    ["11:59", localDateAt(11, 59), "Morning Breathwork", false],
    ["12:00", localDateAt(12, 0), "Midday Reset", false],
    ["16:59", localDateAt(16, 59), "Midday Reset", false],
    ["17:00", localDateAt(17, 0), "Evening Wind-Down", false],
    ["19:59", localDateAt(19, 59), "Evening Wind-Down", false],
    ["20:00", localDateAt(20, 0), "Evening Wind-Down", false],
    ["23:59", localDateAt(23, 59), "Evening Wind-Down", false],
  ])(
    "selects the %s local-time primary action",
    (_timeLabel, now, expectedLabel, expectedUrgency) => {
      const action = selectHomePrimaryAction({ now });

      expect(action.label).toBe(expectedLabel);
      expect(action.ctaText).toBe("Start now");
      expect(action.isDistressUrgent).toBe(expectedUrgency);
    },
  );

  it("builds a local-only Home state model from current time", () => {
    const homeState = createLocalHomeState({ now: localDateAt(20) });

    expect(homeState.primaryAction.label).toBe("Evening Wind-Down");
    expect(homeState.tabs).toBe(appShellTabs);
    expect(homeState.quickActions).toBe(homeQuickActions);
  });
});
