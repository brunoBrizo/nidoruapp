# Animation Source Alignment

This is the decision layer for the three animation sources now in the repo:

- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md) from the product bible.
- [Animation Engineering Playbook Source](animation-engineering-playbook-source.md), the code-first implementation source.
- [Animation UI/UX Deep Spec Source](animation-ui-ux-deep-spec-source.md), the UX rationale, competitor audit, and interaction-quality source.

Use this file before opening the full sources when a timing, haptic, or implementation detail conflicts.

## Source Roles

| Source | Use it for |
| --- | --- |
| Product bible motion docs | Product intent, broad motion philosophy, and feature behavior. |
| Animation engineering playbook | Code patterns, constants, frame-by-frame session-complete sequence, component-level implementation details. |
| Animation UI/UX deep spec | Animation rationale, competitor lessons, home-card behavior, glass usage rules, anti-patterns, and Reduce Motion expectations. |
| Review notes | Production corrections before copying source code into the app. |

## Final Decisions

| Topic | Decision |
| --- | --- |
| Core principle | Keep only motion that guides breath, signals state, or rewards progress. Decorative motion must be cut. |
| Reanimated version | Use the Reanimated version supported by the active Expo SDK, not a hard-pinned source-doc version. |
| Breathing orb | Build the five-layer orb, but make the breath phase timer the source of truth and keep visual layers derived from phase state. |
| Phase text gap | Use the code-first `20ms` gap for implementation. The UI/UX spec's `100ms` gap is preserved as source input, but a shorter gap keeps the active breath cue continuously legible. |
| Screen/session open | Keep the 600ms shared-element/radial expansion behavior. Verify library compatibility before choosing `react-native-shared-element`; if weak, implement the same behavior with Reanimated transitions. |
| Bottom sheets | Use the 420ms open timing and 30% drag-dismiss threshold, implemented with the modern Gesture Handler API. |
| Home primary card | Add the UI/UX spec's context-aware card swap pattern: 200ms old-content exit, 300ms new-content entrance, and 500ms gradient transition. |
| Splash/onboarding intro | Cap splash-to-first-content under 2000ms. The code-first 2200ms splash is too slow for the product's first-value promise. |
| Session complete sequence | Keep the engineering playbook's frame-by-frame T+0ms to T+2400ms sequence and 1200ms staggered counters as the baseline. Shorten only after device QA proves it feels sluggish. |
| Haptics | Use the restricted five-category set: inhale, exhale, success, selection, error. The "only 4" wording conflicts with the source tables because selection haptics are required for tabs/options/volume detents. |
| Glassmorphism | Use glass only on the primary action card, session-complete overlay, quick action chips, and sleep insight card. Keep Android fallback behavior mandatory. |
| Background particles | Start with static gradients if needed; ship animated particles only with Skia or equivalent performance proof on low-spec Android. |
| Loading | Never use generic spinners for app-owned loading states. Use shimmer skeletons and graceful audio fade-in. |
| Reduce Motion | Preserve the core breathing scale cue, remove decorative motion, replace Lottie with a static fade, and use opacity-only transitions. |

## Implementation Gate

Before animation implementation is considered ready:

- Run the breath pacer for a full 5-minute 4-7-8 session on real iOS and Android devices.
- Verify Reduce Motion on both platforms.
- Verify haptic behavior with haptics enabled, disabled, and unavailable.
- Verify background particles do not create visible frame drops on a low-spec Android device.
- Verify the session-complete sequence stays coherent with audio, haptics, Lottie, counters, and the share card.
