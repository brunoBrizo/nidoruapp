# Animation Implementation Review Notes

These notes are the engineering judgment layer on top of the source playbook. The source file is preserved exactly in [Animation Engineering Playbook Source](animation-engineering-playbook-source.md); the newer UI/UX research source is preserved exactly in [Animation UI/UX Deep Spec Source](animation-ui-ux-deep-spec-source.md). Use [Animation Source Alignment](animation-source-alignment.md) for conflict decisions before production implementation.

## Decisions To Keep

- Use Reanimated for orb, screen, tab, sheet, mixer, streak, and onboarding animations.
- Keep easing and duration constants centralized.
- Build the breathing orb as a multi-layer component.
- Use audio and haptics as meaningful breath guidance, not decorative feedback.
- Use expo-blur for glass surfaces with an Android fallback.
- Use shimmer skeletons instead of generic spinners.
- Treat session completion as a critical retention sequence with its own test coverage.
- Implement Reduce Motion from the first build.

## Corrections Before Coding

### UI/UX Deep Spec Conflicts

The UI/UX deep spec adds useful rationale and home-screen behavior, but it conflicts with the code-first playbook in a few places:

- Phase text gap: implement the code-first `20ms` gap, not the UI/UX spec's `100ms` gap, unless motion QA proves the shorter gap feels abrupt.
- Splash duration: cap splash-to-first-content under 2000ms, overriding the code-first 2200ms splash.
- Session-complete counters: keep the code-first T+0ms to T+2400ms sequence and 1200ms staggered counters as baseline.
- Haptics: keep the restricted five-category haptic set because the source tables require selection haptics even though one sentence says "only 4 haptic events."
- Home primary card: add the UI/UX spec's context-aware 200ms old-content exit, 300ms new-content entrance, and 500ms gradient transition.

### Reanimated Version

The playbook says Reanimated 3. The implementation should use the Reanimated version supported by the active Expo SDK at build time. Do not hard-pin to Reanimated 3 if Expo ships a newer supported version.

### Gesture API

The playbook uses `PanGestureHandler` and `useAnimatedGestureHandler` for bottom sheets. Current Reanimated documentation marks `useAnimatedGestureHandler` as deprecated. Use the modern Gesture Handler `GestureDetector` / `Gesture.Pan()` API unless project dependencies prove otherwise.

### BreathingOrb Timer Lifecycle

The playbook's `BreathingOrb.tsx` snippet uses `setTimeout` without cleanup. Production code must:

- Clear timers when the session stops or the component unmounts.
- Avoid stale closures when technique or running state changes.
- Persist session progress outside the visual component.
- Keep the breath phase controller separate from rendering.

### `runOnJS` Usage

The source snippet calls `runOnJS` from code that appears to run on the JS thread. In production, `runOnJS` should be used only when crossing from a worklet/UI-thread context back to JS. Haptic triggers need a small wrapper that is called from the correct context for the final Reanimated version.

### Haptic Count Mismatch

The playbook says "Only 4 haptic events" but the table lists five categories:

- Inhale start.
- Exhale start.
- Success / complete.
- Selection.
- Error.

Implementation decision: allow these five categories as the current source-defined haptic set, but keep them restricted. Do not add routine button haptics, list-scroll haptics, or background-event haptics.

### Shared Element Transition

The playbook proposes `react-native-shared-element` plus React Navigation shared-element middleware. Before adopting it, verify compatibility with Expo Router, the current React Navigation version, and the active Expo SDK. If compatibility is weak, keep the visual behavior but implement with Reanimated layout/shared transitions instead.

### GlassCard Code

The GlassCard snippet shows a simulated gradient with a plain `View`. Production should use `expo-linear-gradient` for the actual inner overlay and use Expo BlurView's current Android blur method behavior. Older Android devices should receive the solid fallback.

### Background Particles

The playbook suggests 80 `Animated.View` particles as a simple option, but also warns this can hurt Android. Production decision: use `react-native-skia` for the particle field if we ship the animated particle background. If Skia adds too much early complexity, ship the static gradient first and defer particles.

### Shimmer Easing

The shimmer snippet uses linear movement. That is acceptable for a shimmer skeleton because the playbook's "never linear" rule is aimed at emotional UI motion and breath guidance, not utility loading sweeps.

## Required Engineering Proofs

- Breathing orb runs at target smoothness on a low-spec Android device.
- Bottom sheet drag-to-dismiss works with the modern gesture API.
- Glass cards fall back correctly on Android versions below 12.
- Session complete sequence timing matches the T+0ms to T+2400ms plan.
- Reduce Motion removes decorative motion while preserving core breath guidance.
- Haptic categories stay within the source-defined restricted set.

## Current Docs Checked

- Expo BlurView Android behavior: https://docs.expo.dev/versions/latest/sdk/blur-view/
- Expo Haptics API: https://docs.expo.dev/versions/latest/sdk/haptics/
- Reanimated deprecated `useAnimatedGestureHandler`: https://docs.swmansion.com/react-native-reanimated/docs/3.x/utilities/useAnimatedGestureHandler/
- React Native Gesture Handler Reanimated integration: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/reanimated-interactions
