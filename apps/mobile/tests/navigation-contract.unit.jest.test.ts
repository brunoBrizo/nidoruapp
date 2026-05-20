import { describe, expect, it } from "@jest/globals";

import { coreFeatureReachability, homeQuickActions } from "../src/home/home-actions";

describe("navigation reachability contract", () => {
  it("keeps Home quick actions routed to their persistent feature anchors", () => {
    expect(
      homeQuickActions.map((action) => ({
        label: action.label,
        routeTarget: action.routeTarget,
        tapsFromHome: action.tapsFromHome,
      })),
    ).toEqual([
      { label: "Rescue Me", routeTarget: "/rescue-me", tapsFromHome: 1 },
      { label: "Sounds", routeTarget: "/sleep/sounds", tapsFromHome: 1 },
      { label: "Breathe", routeTarget: "/breathe", tapsFromHome: 1 },
    ]);
  });

  it("documents every core feature anchor as reachable from Home in three taps or fewer", () => {
    expect(coreFeatureReachability).toEqual([
      { id: "rescue-me", label: "Rescue Me", routeTarget: "/rescue-me", tapsFromHome: 1 },
      {
        id: "wind-down-flow",
        label: "Wind-Down Flow",
        routeTarget: "/sleep/wind-down",
        tapsFromHome: 2,
      },
      { id: "sound-mixer", label: "Sound Mixer", routeTarget: "/sleep/sounds", tapsFromHome: 1 },
      { id: "breathe", label: "Breathe", routeTarget: "/breathe", tapsFromHome: 1 },
      { id: "progress", label: "Progress", routeTarget: "/progress", tapsFromHome: 1 },
      {
        id: "profile-settings",
        label: "Profile settings",
        routeTarget: "/profile",
        tapsFromHome: 1,
      },
      {
        id: "profile-subscription",
        label: "Subscription",
        routeTarget: "/profile/subscription",
        tapsFromHome: 2,
      },
      {
        id: "cancel-subscription",
        label: "Cancel Subscription",
        routeTarget: "/profile/subscription/cancel",
        tapsFromHome: 3,
      },
    ]);
    expect(coreFeatureReachability.every((anchor) => anchor.tapsFromHome <= 3)).toBe(true);
  });
});
