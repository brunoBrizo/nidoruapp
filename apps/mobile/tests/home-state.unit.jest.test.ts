import { describe, expect, it } from "@jest/globals";

import { createHomeOverview } from "../src/home/home-state";

const localDateAt = (hour: number, minute = 0) => new Date(2026, 0, 1, hour, minute);

describe("home overview state", () => {
  it("uses local last-night fixture data when a morning check-in exists", () => {
    const homeState = createHomeOverview({ now: localDateAt(20), hasMorningCheckIn: true });

    expect(homeState.summarySlot).toEqual({
      kind: "last-night",
      title: "Last night",
      ratingText: "4/5",
      ratingAccessibilityLabel: "Sleep rating 4 out of 5",
      summary: "Rain helped you settle",
      suggestion:
        "Your highest-rated nights often include a short breathing session. Try box breathing tonight.",
      actionLabel: "View insight",
      routeTarget: "/progress",
      durationText: "7h 12m",
    });
  });

  it("uses a one-tap check-in entry when the morning check-in is missing", () => {
    const homeState = createHomeOverview({ now: localDateAt(8), hasMorningCheckIn: false });

    expect(homeState.summarySlot).toEqual({
      kind: "check-in",
      title: "How did you sleep?",
      summary: "Take a quiet check-in for last night.",
      suggestion: "One tap to log it. Skip anytime.",
      actionLabel: "Tap to log",
      routeTarget: "/check-in",
      accessibilityHint: "Opens the morning check-in anchor.",
    });
  });

  it("falls back to compassionate local rhythm data without reset pressure", () => {
    const homeState = createHomeOverview({ now: localDateAt(20), hasMorningCheckIn: true });

    expect(homeState.rhythm.title).toBe("Your sleep rhythm");
    expect(homeState.rhythm.compassionateCopy).toBe("A steady week, with room to rest.");
    expect(homeState.rhythm.segments).toHaveLength(7);
    expect(homeState.rhythm.compassionateCopy).not.toMatch(/reset|failed|lost|broken|missed/i);
  });
});
