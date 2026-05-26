import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { coreFeatureReachability, homeQuickActions } from "../src/home/home-actions";
import { allowsIncompleteOnboardingForRoute } from "../src/navigation/onboarding-route-contract";

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
      {
        id: "daily-calm-steady-practice",
        label: "Daily Calm / steady practice",
        routeTarget: "/breathe/coherent-breathing?durationSeconds=600",
        tapsFromHome: 2,
      },
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

  it("lets Rescue Me bypass first-launch onboarding while preserving the first-session rule", () => {
    expect(allowsIncompleteOnboardingForRoute("/rescue-me", undefined)).toBe(true);
    expect(allowsIncompleteOnboardingForRoute("/rescue-me?state=active-launch", undefined)).toBe(
      true,
    );
    expect(allowsIncompleteOnboardingForRoute("/breathe/4-7-8-sleep", "true")).toBe(true);
    expect(allowsIncompleteOnboardingForRoute("/breathe/4-7-8-sleep", undefined)).toBe(false);
    expect(allowsIncompleteOnboardingForRoute("/", undefined)).toBe(false);
  });

  it("keeps the Rescue Me pre-orb route free of prohibited launch dependencies", () => {
    const routeSource = readFileSync(
      resolve(__dirname, "../src/app/(tabs)/rescue-me.tsx"),
      "utf8",
    );
    const sessionRouteSource = readFileSync(
      resolve(__dirname, "../src/rescue/rescue-me-session-route.tsx"),
      "utf8",
    );
    const screenSource = readFileSync(
      resolve(__dirname, "../src/rescue/rescue-me-screen.tsx"),
      "utf8",
    );
    const preOrbSource = `${routeSource}\n${sessionRouteSource}\n${screenSource}`;

    const prohibitedLaunchDependencies = [
      {
        label: "auth/account/paywall/network/sync/permission modules or copy",
        pattern:
          /account|auth|fetch\(|network|notification|paywall|permission|posthog|purchase|remote|sentry|supabase|\.\.\/sync\/|syncPostValue/i,
      },
      {
        label: "shared onboarding persistence module with notification-gate code",
        pattern: /local-first-onboarding/i,
      },
    ];

    expect(
      prohibitedLaunchDependencies
        .filter(({ pattern }) => pattern.test(preOrbSource))
        .map(({ label }) => label),
    ).toEqual([]);
  });
});
