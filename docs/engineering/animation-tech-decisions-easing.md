## 1. Technology Decisions

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) to navigate the split animation playbook.
- Use [Animation Source Alignment](animation-source-alignment.md) for source hierarchy and conflict decisions.
- Use [Animation Implementation Review Notes](animation-implementation-review-notes.md) before copying code patterns.
- Use [Tech Stack Decision Record](../architecture/tech-stack-proposal.md) for app-level package decisions.

### Why React Native Reanimated 3 (Not Animated API)

The standard React Native `Animated` API runs on the **JavaScript thread**. Any re-render — a push notification, a state update, a background fetch — can interrupt animations and cause dropped frames. For a breathing orb that must pulse at exactly the right rhythm, one dropped frame destroys the illusion.

Reanimated 3 runs animation worklets directly on the **native UI thread** via JSI (JavaScript Interface), bypassing the JS bridge entirely. The result: guaranteed 60fps on any device, regardless of JS activity. This is non-negotiable for the core breathing animation.[^1][^2]

**Install:**
```bash
npx expo install react-native-reanimated
# Add to babel.config.js:
# plugins: ['react-native-reanimated/plugin']
```

**Key APIs used throughout this app:**

| API | Use Case |
|-----|----------|
| `useSharedValue` | All animated values (scale, opacity, translateY) — lives on native thread |
| `useAnimatedStyle` | Derive animated styles from shared values |
| `withTiming` | Duration-based animation with easing |
| `withSequence` | Chain multiple animations (breathing phases) |
| `withRepeat` | Loop animations (background particles, hold shimmer) |
| `withSpring` | Physics-based animations (tab icons, streak number) |
| `withDelay` | Stagger delays (onboarding options, greeting words) |
| `runOnJS` | Bridge back to JS for side effects (haptics from animations) |
| `useReduceMotion` | Detect iOS/Android "Reduce Motion" accessibility setting |

**For Lottie (celebration animations):**
```bash
npx expo install lottie-react-native
```

**For glassmorphism blur:**
```bash
npx expo install expo-blur
```

**For haptics:**
```bash
npx expo install expo-haptics
```

***

## 2. The Global Easing Curve Library

Never use `Easing.linear`. Never use generic `ease`. Define these four curves once and import them everywhere:

```typescript
// animations/easings.ts
import { Easing } from 'react-native-reanimated';

export const EASE = {
  // Standard entrance — fast start, gentle deceleration
  OUT: Easing.bezier(0.25, 0.46, 0.45, 0.94),

  // Standard exit — gentle start, faster end
  IN: Easing.bezier(0.55, 0.055, 0.675, 0.19),

  // Smooth in-out — used for transitions and crossfades
  IN_OUT: Easing.bezier(0.455, 0.03, 0.515, 0.955),

  // Dramatic entrance — expo feel, settles softly (iOS sheet opens)
  OUT_EXPO: Easing.bezier(0.16, 1, 0.3, 1),

  // Inhale breath — fills fast, slows at top of breath
  INHALE: Easing.bezier(0.25, 0.46, 0.45, 0.94),

  // Exhale breath — slow release, slightly faster at end
  EXHALE: Easing.bezier(0.55, 0.055, 0.675, 0.19),
};
```

***
