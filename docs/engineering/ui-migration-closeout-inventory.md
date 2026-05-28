# UI Migration Closeout Inventory

Date: 2026-05-26
ClickUp task: `06.UI.15 Final UI migration cleanup, dead-code removal, and pixel-proof closeout`

## Source Of Truth Checked

- `graphify-out/GRAPH_REPORT.md`
- `AGENTS.md`
- `docs/architecture/tech-stack-proposal.md`
- `docs/design/screens/`
- ClickUp task `86e1hzcxc`

## Accepted Handoff Coverage

| Handoff | Current app surface | Closeout classification |
| --- | --- | --- |
| `docs/design/screens/home/home.html`, `home-1.png`, `home-2.png` | `apps/mobile/src/home/home-screen.tsx`, `apps/mobile/src/app/(tabs)/index.tsx` | Migrated Tailwind surface. The ClickUp task names `home.png`, but the repo currently contains `home-1.png` and `home-2.png`, not `home.png`. |
| Home-derived global tab menu in `home.html` | `apps/mobile/src/navigation/app-tab-bar.tsx`, `apps/mobile/src/design-system/global-tab-bar.tsx`, `apps/mobile/src/app/(tabs)/_layout.tsx` | Migrated shared shell. Home, Sleep, Breathe, Progress, and Profile all route through the same `AppTabBar` / `GlobalTabBarSurface` implementation. |
| `docs/design/screens/sleep/sleep.html`, `sleep.png` | `apps/mobile/src/sleep/sleep-screen.tsx`, `apps/mobile/src/app/(tabs)/sleep.tsx` | Migrated Tailwind surface using the Home-derived shared tab shell. |
| `docs/design/screens/sleep/README.md`, `sound-mixer-main.html`, `sound-mixer-main.png`, `sound-mixer-save-mix.html`, `sound-mixer-save-mix.png`, `sound-mixer-dark.html`, `sound-mixer-dark.png` | `apps/mobile/src/app/(tabs)/sleep/sounds.tsx` | Sound Mixer route implementation and 06.UI.05 simulator proof are captured in `docs/engineering/sound-mixer-ui-closeout-proof.md`. |
| `docs/design/screens/breath/breathe.html`, `breathe.png` | `apps/mobile/src/app/(tabs)/breathe.tsx` | Migrated Tailwind surface using the Home-derived shared tab shell. |
| `docs/design/screens/progress/progress.html`, `progress.png` | `apps/mobile/src/progress/progress-screen.tsx`, `apps/mobile/src/app/(tabs)/progress.tsx` | Migrated Tailwind surface using the Home-derived shared tab shell. |
| `docs/design/screens/profile/profile.html`, `profile.png` | `apps/mobile/src/profile/profile-screen.tsx`, `apps/mobile/src/app/(tabs)/profile.tsx` | Migrated Tailwind surface using the Home-derived shared tab shell. |
| `docs/design/screens/onboarding/*.html`, `*.png` | `apps/mobile/src/onboarding/onboarding-flow-screen.tsx` | Migrated Tailwind question flow. |
| Splash / first-breath demo onboarding surfaces | `apps/mobile/src/onboarding/onboarding-splash-screen.tsx`, `apps/mobile/src/onboarding/first-breath-demo-screen.tsx`, `apps/mobile/src/breathing/breathing-orb.tsx` | Migrated from legacy `StyleSheet` to Tailwind wrappers in this closeout pass. |
| `docs/design/screens/personalized-plan/perosnalized-plan.html`, `personalized-plan.png` | `apps/mobile/src/onboarding/personalized-plan-screen.tsx` | Migrated from legacy `StyleSheet` to Tailwind wrappers in this closeout pass. The HTML filename keeps the current repo spelling. |
| `docs/design/screens/first-session/*` | `apps/mobile/src/session/first-session-screen.tsx` | Migrated Tailwind surface. |
| `docs/design/screens/notification-gate/*` | `apps/mobile/src/notifications/notification-permission-gate-screen.tsx` | Migrated Tailwind surface. |
| `docs/design/screens/paywall-screen/*` | `apps/mobile/src/paywall/post-value-account-paywall-screen.tsx`, `apps/mobile/src/paywall/post-value-account-paywall-route.tsx` | Migrated Tailwind/design-system surface. |
| `docs/design/screens/rescue-me/*` | `apps/mobile/src/rescue/rescue-me-screen.tsx`, `apps/mobile/src/rescue/rescue-me-session-route.tsx` | Migrated Tailwind surface, pending full simulator pixel proof. |
| `docs/design/screens/wind-down/*` | `apps/mobile/src/wind-down/wind-down-screen.tsx`, `apps/mobile/src/wind-down/wind-down-route.tsx` | Migrated Tailwind surface, pending full simulator pixel proof across the full state matrix. |

## Static Styling Audit

Current source command:

```sh
rg -n "StyleSheet\.create|styles\." apps/mobile/src --glob '*.{tsx,ts}'
```

Result: no matches after this closeout cleanup.

Remaining reviewed styling exceptions are inline dynamic values only:

- Animated opacity / transform values for RN Animated and Reanimated surfaces.
- Safe-area-derived padding values.
- Tab indicator position derived from measured tab width.
- `borderCurve: "continuous"` inline where React Native exposes the platform shape but Tailwind does not.
- SVG gradient coordinate data in `CardFade`, which is rendering data rather than React Native layout styling.

## Placeholder Audit

Current source command:

```sh
rg -n "TabPlaceholderScreen" apps/mobile/src
```

Intentional future-scope placeholders:

| Route | Reason retained |
| --- | --- |
| `apps/mobile/src/app/(tabs)/check-in.tsx` | Morning check-in anchor. No accepted `docs/design/screens/check-in` handoff exists. |
| `apps/mobile/src/app/(tabs)/sleep/sounds.tsx` | Sound mixer anchor. Accepted source contract exists at `docs/design/screens/sleep/README.md` with dedicated main mixer, Save Mix sheet, and idle dark playback handoffs; implementation remains pending. |
| `apps/mobile/src/app/(tabs)/sleep/stories.tsx` | Sleep stories anchor. No accepted sleep-stories handoff exists. |
| `apps/mobile/src/app/(tabs)/progress/[anchor].tsx` | Future progress detail anchors. Main Progress design is implemented in `progress.tsx`. |
| `apps/mobile/src/app/(tabs)/profile/[...anchor].tsx` | Future settings/support/privacy anchors. Main Profile design is implemented in `profile.tsx`. |

No accepted main tab handoff is routed through `TabPlaceholderScreen`.

## Closeout Gaps

This task should remain `Needs Review` until the following are resolved:

- ClickUp prerequisites were not all complete at audit time: `06.UI.00`, `06.UI.03`, `06.UI.04`, `06.UI.12`, `06.UI.13`, and `06.UI.14` were still `needs review`; `06.UI.05` now has local simulator closeout proof.
- Partial simulator screenshots were captured for the five tabbed screens and stored under `docs/engineering/ui-migration-closeout-screenshots/`. They prove the same Home-derived tab shell is used on Home, Sleep, Breathe, Progress, and Profile.
- The required full simulator screenshot set has not been captured in this pass for onboarding, personalized plan, first session, notification gate, paywall, Rescue Me, Wind-Down, and 06.UI.14-classified surfaces.
- The task references `docs/design/screens/home/home.png`, but the current repo does not contain that file; it contains `home-1.png`, `home-2.png`, and `home.html`.
