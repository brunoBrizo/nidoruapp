## Part 5: Complete Animation Timing Reference

Related docs:

- Use [Animation Tech Decisions And Easing](animation-tech-decisions-easing.md) for exported easing constants.
- Use [Haptics, Reduce Motion, And Timing](haptics-reduce-motion-timing.md) for haptic and duration implementation rules.
- Use [Animation UIUX System](animation-uiux-system.md) for rationale by animation category.
- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation docs.

A single-table reference for every animation in the app:

| Animation | Duration | Easing | Haptic | Notes |
|---|---|---|---|---|
| Orb scale (inhale) | Technique × 1000ms | Bezier(0.25, 0.46, 0.45, 0.94) | Light on start | Native thread only |
| Orb scale (exhale) | Technique × 1000ms | Bezier(0.55, 0.055, 0.675, 0.19) | Soft on start | Native thread only |
| Orb pulse ring | 800ms | ease-out | None | Fires once per inhale |
| Phase text swap | 200ms out / 300ms in | ease-in / ease-out | None | 100ms gap between |
| Screen entrance | 380ms | ease-out | None | translateY 16px + opacity |
| Session screen entrance | 600ms | ease-out-expo | None | Shared element expand |
| Session screen exit | 350ms | ease-in-expo | None | Shared element contract |
| Tab switch | 300ms | ease-in-out | Selection | Content crossfade |
| Tab icon press | 300ms | Spring(20, 200) | Selection | Scale bounce |
| Bottom sheet open | 420ms | Bezier(0.16, 1, 0.3, 1) | None | Backdrop 0→0.7 |
| Bottom sheet drag | Real-time | Physics | Selection per 10% | Drag resistance |
| Streak day fill | 400ms | ease-out | None | scaleY from bottom |
| Streak sparkle | 400ms | ease-out | None | 4 particles |
| Streak number count | 600ms | ease-out | None | withTiming numeric |
| Milestone Lottie | 1500ms | Internal | Success | LottieFiles JSON |
| Session complete wipe | 600ms | ease-in-out | None | Radial from center |
| Completion stats count | 800ms | ease-out | Success at end | Stagger 200ms |
| Social card entrance | 400ms | ease-out | None | Glass card slides up |
| Sound icon (activate) | 200ms | ease-out | Selection | Opacity + ring fill |
| Sound ring drag | Real-time | Native | Selection per 10% | Arc fill |
| Sound volume fade out (timer) | 120,000ms | Linear | None | 2-minute fade at sleep |
| Morning greeting stagger | 80ms per word | ease-out | None | Words appear sequentially |
| Onboarding option stagger | 80ms per option | ease-out | Light on select | Bottom-to-top reveal |
| Onboarding selection fill | 200ms | ease-out | Light | Bar fills left-to-right |
| Shimmer skeleton | 1500ms loop | Linear | None | Left-to-right sweep |
| Error toast entrance | 300ms | ease-out | Error | Auto-dismiss 4s |
| Error toast exit | 250ms | ease-in | None | Slides down + fade |
| Background gradient (time) | 2000ms on open | ease-in-out | None | interpolateColor |
| Particle drift | ∞ | Constant | None | 0.3–0.8 px/s random |

***
