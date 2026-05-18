## Part 3: The "Reduce Motion" Accessibility System

Related docs:

- Use [Haptics, Reduce Motion, And Timing](haptics-reduce-motion-timing.md) for code-first implementation guidance.
- Use [Animation UIUX System](animation-uiux-system.md) for the broader animation catalog.
- Use [Motion, Animation, And Haptics](../design/motion-animation-haptics.md) for product-level accessibility rules.
- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation docs.

Not all users tolerate animation. Research consistently shows that vestibular disorders affect a significant portion of users, and iOS's "Reduce Motion" system setting exists specifically for this. A wellness app that ignores this setting is deeply ironic — causing nausea in users trying to relax.[^30]

**Implementation:**

```typescript
import { AccessibilityInfo } from 'react-native';
import { useReduceMotion } from 'react-native-reanimated';

// Reanimated 3 has native reduce motion support
const reduceMotion = useReduceMotion();

// Use in all animations:
const animationConfig = {
  duration: reduceMotion ? 0 : 400,
  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
};
```

**The rules for reduced motion:**

- Breathing orb: stays functional — scale animation is preserved because it is the product. Only the outer pulse ring and particle effects are disabled
- Screen transitions: `opacity` only — no `translateY` movement
- Lottie celebrations: replaced with a static badge image that fades in
- Background particle field: disabled, replaced with static gradient
- All `withSpring` springs: replaced with `withTiming` with no overshoot

The app should function completely correctly with all motion disabled. Never gate value behind animation.

***
