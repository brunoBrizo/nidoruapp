## 14. Haptic Design System

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation implementation docs.
- Use [Motion, Animation, And Haptics](../design/motion-animation-haptics.md) for product-level haptic policy.
- Use [Animation UIUX Reduce Motion](animation-uiux-reduce-motion.md) for the companion accessibility source.
- Use [Animation UIUX Timing Reference](animation-uiux-timing-reference.md) for consolidated timing values.

**Cardinal rule: Only 4 haptic events in the entire app.** More than 4 and haptics become noise — users stop perceiving them as meaningful.[^7][^8]

| Event | Haptic Type | When |
|-------|-------------|------|
| Inhale start | `ImpactFeedbackStyle.Light` | Every breathing cycle inhale phase |
| Exhale start | `ImpactFeedbackStyle.Soft` | Every breathing cycle exhale phase |
| Success / complete | `NotificationFeedbackType.Success` | Session complete, milestone badge |
| Selection | `selectionAsync()` | Tab switch, option select, volume detents |
| Error | `NotificationFeedbackType.Error` | Network errors, billing errors only |

**The inhale/exhale haptic distinction matters:** `Light` is a distinct, clear single tap. `Soft` is subtler and slightly cushioned. The difference between inhale (Light) and exhale (Soft) creates a physical rhythm users can feel with the screen dark and eyes closed. This is not a UI detail — it is the core accessibility feature of the breathing session.[^7]

**Never use haptics for:** passive list scrolling, image loading, background events, or routine button taps (outside selection). Haptic fatigue is real and destroys the meaningfulness of session haptics.

***

## 15. Reduce Motion — Accessibility

```typescript
import { useReduceMotion, ReduceMotion } from 'react-native-reanimated';

// Global hook — use this in every component that has animation
const shouldReduceMotion = useReduceMotion();

// In practice:
const duration = shouldReduceMotion ? 0 : 380;
const translateYStart = shouldReduceMotion ? 0 : 16;
```

**What survives Reduce Motion (must keep — these ARE the product):**

- Breathing orb core scale animation — reduced to 3 layers (remove outer glow + pulse ring)
- Phase text label changes — crossfade becomes instant swap
- Session complete Lottie — replaced with static badge image + `opacity 0→1` fade

**What is removed under Reduce Motion:**

- Background particle field (static gradient only)
- Outer pulse ring on orb
- Screen entrance translateY movements (opacity only)
- Streak sparkle particles
- Sound icon looping animations (static icons)
- Tab icon spring bounce (instant state change)

***

## 16. Complete Timing Reference Table

Every animation in the app. Build this as a constants file and import everywhere:

```typescript
// animations/durations.ts
export const DURATION = {
  // Breathing orb
  ORB_PULSE_RING:      800,
  ORB_HOLD_SHIMMER:    1200,  // period of hold oscillation

  // Screen transitions
  SCREEN_ENTER:        380,
  SCREEN_EXIT:         300,
  SHARED_ELEMENT_OPEN: 600,
  SHARED_ELEMENT_CLOSE: 350,

  // Tab bar
  TAB_ICON_PRESS:      300,
  TAB_CONTENT_OUT:     150,
  TAB_CONTENT_IN:      200,
  TAB_CONTENT_GAP:     80,

  // Bottom sheet
  SHEET_OPEN:          420,
  SHEET_CLOSE:         300,

  // Phase text
  PHASE_TEXT_OUT:      200,
  PHASE_TEXT_IN:       300,
  PHASE_TEXT_GAP:      20,

  // Session complete sequence
  ORB_DECELERATE:      800,
  BG_WIPE:             600,
  STATS_SLIDE_UP:      400,
  COUNTER_COUNT_UP:    1200,
  SHARE_CARD_ENTER:    300,

  // Streak
  DAY_RING_FILL:       400,
  GRADIENT_SWEEP:      300,
  SPARKLE:             400,

  // Onboarding
  SPLASH_ENTER:        600,
  SPLASH_BREATH:       1000,  // single in-out breath
  SPLASH_EXIT:         400,
  OPTION_STAGGER:      80,
  OPTION_FILL:         200,
  QUESTION_EXIT:       320,

  // Loading / errors
  SHIMMER_SWEEP:       1500,
  TOAST_ENTER:         300,
  TOAST_EXIT:          250,
  TOAST_AUTO_DISMISS:  4000,

  // Background
  TIME_GRADIENT_SHIFT: 2000,
};
```

***
