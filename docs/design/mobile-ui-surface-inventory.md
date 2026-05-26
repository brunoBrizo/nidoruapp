# Mobile UI Surface Inventory

Updated for ClickUp `06.UI.14` on 2026-05-26.

Inventory command reviewed:

```sh
rg --files apps/mobile/src | rg '\.tsx$'
```

The updated Home handoff owns the global tab menu for all tabbed surfaces:
`docs/design/screens/home/home.html`, `docs/design/screens/home/home-1.png`, and
`docs/design/screens/home/home-2.png`.

## Status Legend

- Pixel-migrated: implemented from an accepted `docs/design/screens` HTML/PNG handoff.
- Global Home menu source: tab shell/menu only; content still uses its own screen handoff.
- Dev-only Tailwind primitive: retained non-product tooling UI using shared Tailwind primitives.
- Reusable Tailwind primitive: shared component used by product or tooling surfaces.
- Future-scope placeholder: intentionally reachable stub for a future subroute.
- Blocked for missing handoff: product-facing UI remains built, but must not be treated as pixel complete until the named handoff exists.
- Deleted as dead code: removed because it was neither product-facing nor required developer tooling.
- Non-surface wrapper: TSX route/provider/wrapper that delegates to another recorded surface.

## Product And Route Surfaces

| Surface | Status | Source of truth or blocker |
| --- | --- | --- |
| `apps/mobile/src/app/_layout.tsx` | Non-surface wrapper | Hosts root stack and delegates font-loading UI to `OnboardingSplashScreen`; splash is blocked below. |
| `apps/mobile/src/app/(tabs)/_layout.tsx` | Global Home menu source | Uses `AppTabBar`; menu source is `docs/design/screens/home/home.html`, `home-1.png`, `home-2.png`. |
| `apps/mobile/src/app/(tabs)/index.tsx` | Non-surface wrapper | Delegates to `HomeScreen`; content source is Home. |
| `apps/mobile/src/home/home-screen.tsx` | Pixel-migrated | `docs/design/screens/home/home.html`, `home-1.png`, `home-2.png`. |
| `apps/mobile/src/home/home-breathing-orb.tsx` | Pixel-migrated | Home orb component used by the accepted Home handoff. |
| `apps/mobile/src/navigation/app-tab-bar.tsx` | Global Home menu source | Shared tab menu from the updated Home handoff. |
| `apps/mobile/src/navigation/solar-tab-icons.tsx` | Global Home menu source | Icon components for the Home-owned tab menu. |
| `apps/mobile/src/app/(tabs)/sleep.tsx` | Non-surface wrapper | Delegates to `SleepScreen`; content source is Sleep, menu source is Home. |
| `apps/mobile/src/sleep/sleep-screen.tsx` | Pixel-migrated | `docs/design/screens/sleep/sleep.html`, `sleep.png`; tab menu from Home. |
| `apps/mobile/src/sleep/sleep-icons.tsx` | Pixel-migrated | Sleep tab icon details used by the accepted Sleep handoff. |
| `apps/mobile/src/app/(tabs)/breathe.tsx` | Pixel-migrated | `docs/design/screens/breath/breathe.html`, `breathe.png`; tab menu from Home. |
| `apps/mobile/src/app/(tabs)/breathe/[technique].tsx` | Non-surface wrapper | Delegates to first/full breath session screens. |
| `apps/mobile/src/session/first-session-screen.tsx` | Pixel-migrated | `docs/design/screens/first-session/first-session.html`, `first-session.png`, `first-session-paused.png`, `post-session-reflection.html`, `post-session-reflection.png`. |
| `apps/mobile/src/breathing/breathing-orb.tsx` | Pixel-migrated | Shared orb used by accepted first-session, rescue, and onboarding handoffs. |
| `apps/mobile/src/app/(tabs)/progress.tsx` | Non-surface wrapper | Delegates to `ProgressScreen`; content source is Progress, menu source is Home. |
| `apps/mobile/src/progress/progress-screen.tsx` | Pixel-migrated | `docs/design/screens/progress/progress.html`, `progress.png`; tab menu from Home. |
| `apps/mobile/src/app/(tabs)/profile.tsx` | Non-surface wrapper | Delegates to `ProfileScreen`; content source is Profile, menu source is Home. |
| `apps/mobile/src/profile/profile-screen.tsx` | Pixel-migrated | `docs/design/screens/profile/profile.html`, `profile.png`; tab menu from Home. |
| `apps/mobile/src/app/(tabs)/rescue-me.tsx` | Non-surface wrapper | Delegates to Rescue Me flow. |
| `apps/mobile/src/rescue/rescue-me-screen.tsx` | Pixel-migrated | `docs/design/screens/rescue-me/README.md` plus the Rescue Me PNG set in that folder. |
| `apps/mobile/src/rescue/rescue-me-session-route.tsx` | Pixel-migrated route wrapper | Uses the Rescue Me screen/session contract above. |
| `apps/mobile/src/app/(tabs)/sleep/wind-down.tsx` | Non-surface wrapper | Delegates to Wind-Down route. |
| `apps/mobile/src/wind-down/wind-down-route.tsx` | Pixel-migrated route wrapper | Uses the Wind-Down screen contract below. |
| `apps/mobile/src/wind-down/wind-down-screen.tsx` | Pixel-migrated | `docs/design/screens/wind-down/README.md` plus the Wind-Down PNG set in that folder. |
| `apps/mobile/src/app/onboarding.tsx` | Non-surface wrapper | Delegates to onboarding flow; individual onboarding surfaces are recorded below. |
| `apps/mobile/src/onboarding/onboarding-flow-screen.tsx` | Pixel-migrated | Question flow uses `docs/design/screens/onboarding/*.html` and `*.png`; it also composes splash and first-breath demo surfaces that remain blocked below. |
| `apps/mobile/src/onboarding/personalized-plan-screen.tsx` | Pixel-migrated | `docs/design/screens/personalized-plan/perosnalized-plan.html`, `personalized-plan.png`. |
| `apps/mobile/src/onboarding/onboarding-splash-screen.tsx` | Blocked for missing handoff | Missing accepted `docs/design/screens/splash/splash.html` and `docs/design/screens/splash/splash.png`. Do not claim pixel parity until those exist. |
| `apps/mobile/src/onboarding/first-breath-demo-screen.tsx` | Blocked for missing handoff | Missing accepted `docs/design/screens/first-breath-demo/first-breath-demo.html` and `docs/design/screens/first-breath-demo/first-breath-demo.png`. Product docs describe the flow, but there is no accepted screen handoff. |
| `apps/mobile/src/onboarding/first-launch-onboarding-gate.tsx` | Non-surface wrapper | Delegates checking/redirect loading UI to `OnboardingSplashScreen`; splash blocker applies. |
| `apps/mobile/src/app/post-value.tsx` | Non-surface wrapper | Delegates to post-value paywall route. |
| `apps/mobile/src/paywall/post-value-account-paywall-route.tsx` | Pixel-migrated | Paywall content uses `docs/design/screens/paywall-screen/paywall-screen.html`, `paywall-screen-1.png`, `paywall-screen-2.png`; loading state uses `NidoruLoadingScreen`. |
| `apps/mobile/src/paywall/post-value-account-paywall-screen.tsx` | Pixel-migrated | `docs/design/screens/paywall-screen/paywall-screen.html`, `paywall-screen-1.png`, `paywall-screen-2.png`. |
| `apps/mobile/src/notifications/notification-permission-gate-controller.tsx` | Non-surface wrapper | Delegates to notification gate screen. |
| `apps/mobile/src/notifications/notification-permission-gate-screen.tsx` | Pixel-migrated | `docs/design/screens/notification-gate/notification-gate.html`, `notification-gate.png`. |

## Future-Scope Placeholders

These are the only routes currently allowed to render `TabPlaceholderScreen`.

| Surface | Status | Reason |
| --- | --- | --- |
| `apps/mobile/src/navigation/tab-placeholder-screen.tsx` | Future-scope placeholder | Single shared Tailwind placeholder primitive. |
| `apps/mobile/src/app/(tabs)/check-in.tsx` | Future-scope placeholder | Morning Check-In tab anchor; no accepted product handoff yet. |
| `apps/mobile/src/app/(tabs)/progress/[anchor].tsx` | Future-scope placeholder | Progress subroute anchor; accepted Progress dashboard remains visible at `/progress`. |
| `apps/mobile/src/app/(tabs)/profile/[...anchor].tsx` | Future-scope placeholder | Profile settings/support/subscription anchors; accepted Profile dashboard remains visible at `/profile`. |
| `apps/mobile/src/app/(tabs)/sleep/sounds.tsx` | Future-scope placeholder | Sound Mixer anchor; no accepted product handoff yet. |
| `apps/mobile/src/app/(tabs)/sleep/stories.tsx` | Future-scope placeholder | Sleep Stories anchor; no accepted product handoff yet. |

## Developer And Foundation Surfaces

| Surface | Status | Source of truth or blocker |
| --- | --- | --- |
| `apps/mobile/src/app/observability-proof.tsx` | Dev-only Tailwind primitive | Non-product proof tooling. Uses `MidnightScrollScreen`, `NidoruButton`, and `GlassCard`; does not show DSNs, PostHog keys, install IDs, account IDs, or sleep/session details. |
| `apps/mobile/src/observability/ObservabilityProvider.tsx` | Non-surface wrapper | Provider only; no product UI. |
| `apps/mobile/src/tw/index.tsx` | Reusable Tailwind primitive | CSS-enabled wrappers for Tailwind/NativeWind. |
| `apps/mobile/src/tw/tailwind-runtime-proof.tsx` | Dev-only Tailwind primitive | Runtime proof content retained only inside observability proof tooling. |
| `apps/mobile/src/design-system/screen.tsx` | Reusable Tailwind primitive | Shared screen, spacer, backdrop, and loading primitives. |
| `apps/mobile/src/design-system/global-tab-bar.tsx` | Global Home menu source | Shared implementation for the Home-owned tab menu. |
| `apps/mobile/src/design-system/interaction.tsx` | Reusable Tailwind primitive | Shared buttons, chips, segmented controls, and pressables. |
| `apps/mobile/src/design-system/typography.tsx` | Reusable Tailwind primitive | Shared text primitive. |
| `apps/mobile/src/design-system/surface.tsx` | Reusable Tailwind primitive | Shared card/list/progress primitives. |
| `apps/mobile/src/design-system/orb.tsx` | Reusable Tailwind primitive | Shared CSS orb wrapper. |
| `apps/mobile/src/surfaces/card-fade.tsx` | Pixel-migrated | Shared animated card treatment used by accepted Home/Profile/Breathe surfaces. |

## Deleted Surfaces

| Surface | Status | Reason |
| --- | --- | --- |
| `apps/mobile/src/shell/tab-entry-screen.tsx` | Deleted as dead code | Unused StyleSheet renderer; not product-facing and not required for developer proof. |
