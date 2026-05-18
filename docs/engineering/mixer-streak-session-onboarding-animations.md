## 7. Sound Mixer Animations

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation implementation docs.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for mixer, streak, session, and onboarding behavior.
- Use [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md) for first-session timing.
- Use [Animation UIUX Timing Reference](animation-uiux-timing-reference.md) for consolidated durations.

### Sound Icon States — Three Visual States

Each sound card can be: Inactive → Active → Volume Editing. Each transition is animated:

**Inactive → Active (tap):**
```typescript
// Ring stroke-dashoffset fills from 0 to 70% of circumference
// Duration: 300ms, EASE.OUT
// Color: Haze #4A4E6A → Iris #7C6FCD, duration: 200ms
// Icon animation loop starts: opacity 0.4 → 1.0, duration: 200ms
ringFill.value    = withTiming(0.70, { duration: 300, easing: EASE.OUT });
iconOpacity.value = withTiming(1.0,  { duration: 200 });
Haptics.selectionAsync();
```

**Volume drag — haptic detents:**
As the user drags the circular volume ring, haptics fire at every 10% increment:

```typescript
// In PanGestureHandler onActive:
const currentVolume = calculateVolumeFromAngle(event.x, event.y);
const previousBracket = Math.floor(previousVolume / 0.10);
const currentBracket  = Math.floor(currentVolume  / 0.10);
if (currentBracket !== previousBracket) {
  runOnJS(() => Haptics.selectionAsync())();
}
```

### Active Sound Icons in Mix Strip (Bottom of Mixer)

When a sound activates, its mini icon joins the "active mix" strip at the bottom:

```typescript
// Entrance
translateY.value = withTiming(0, { duration: 200, easing: EASE.OUT });  // from 12px
opacity.value    = withTiming(1, { duration: 200 });

// Exit
translateY.value = withTiming(-8, { duration: 150, easing: EASE.IN });
opacity.value    = withTiming(0,  { duration: 150 });

// Remaining icons slide to fill gap using withSpring on translateX
```

### Live Sound Icon Animations (Looping)

Implemented using `withRepeat(withSequence(...), -1, true)`:

```typescript
// Rain icon: 4 drops falling independently
// Drop 1: delay 0ms
dropY1.value = withRepeat(
  withSequence(
    withTiming(8,   { duration: 500, easing: EASE.IN }),
    withTiming(0,   { duration: 0 }),  // instant reset to top
  ), -1
);
dropOpacity1.value = withRepeat(
  withSequence(
    withTiming(0.2, { duration: 500 }),
    withTiming(1.0, { duration: 0 }),
  ), -1
);
// Drops 2–4 have withDelay(200), withDelay(350), withDelay(480)

// Fire icon: 3 flames oscillating at different frequencies
flame1Rotation.value = withRepeat(
  withSequence(
    withTiming(3,  { duration: 700 }),
    withTiming(-3, { duration: 700 }),
  ), -1, true
);
// flame2 at 900ms cycle, flame3 at 1100ms cycle
// scaleY additionally: withRepeat(withSequence(1.0→1.15→1.0), 800ms cycle)
```

***

## 8. Streak & Progress Animations

### Daily Streak Calendar — Session Complete

When a session completes and today's ring fills:

```typescript
// Step 1: Ring fills from bottom (scaleY)
const dayRingScale = useSharedValue(0);
dayRingScale.value = withTiming(1, { duration: 400, easing: EASE.OUT });

// Step 2: Gradient sweep (200ms after ring starts filling)
setTimeout(() => {
  gradientPosition.value = withTiming(1, { duration: 300, easing: EASE.OUT });
}, 200);

// Step 3: 4 sparkle particles burst outward
sparkles.forEach((sparkle, i) => {
  const angle = (i / 4) * Math.PI * 2;
  sparkle.x.value = withTiming(Math.cos(angle) * 14, { duration: 400, easing: EASE.OUT });
  sparkle.y.value = withTiming(Math.sin(angle) * 14, { duration: 400, easing: EASE.OUT });
  sparkle.opacity.value = withSequence(
    withTiming(0.9, { duration: 150 }),
    withTiming(0,   { duration: 250 }),
  );
});

// Step 4: Streak number counts up with spring overshoot
streakNumber.value = withSpring(newStreakCount, { damping: 8, stiffness: 100 });
// damping: 8 = moderate bounce. stiffness: 100 = not too fast
// Result: number briefly goes to newStreakCount+0.3 before settling
```

### Weekly Summary Stats Count-Up

Three counters animate simultaneously with 200ms stagger:

```typescript
const animateCounter = (shared: SharedValue<number>, target: number, delay: number) => {
  setTimeout(() => {
    shared.value = withTiming(target, { duration: 1200, easing: EASE.OUT });
  }, delay);
};

animateCounter(sessions,    weekSessions,    0);
animateCounter(minutes,     weekMinutes,     200);
animateCounter(sleepAverage, weekSleepAvg,  400);
```

In the JSX, render the animated value as text using `useAnimatedProps` on a `TextInput` (the most performant way to animate text values in Reanimated):

```typescript
const animatedProps = useAnimatedProps(() => ({
  text: String(Math.round(sessions.value)),
}));

<AnimatedTextInput
  animatedProps={animatedProps}
  editable={false}
  style={styles.counterText}
/>
```

***

## 9. Session Complete Sequence — Frame-by-Frame

This is the most important animation sequence in the entire app. It must be flawless. Every competitor skips this — it is the single biggest retention differentiator.

**Total sequence duration: approximately 3 seconds.**

```
T+0ms    Orb decelerates to rest size (800ms, EASE.OUT regardless of current phase)
T+600ms  Background radial wipe begins: #14172B circle expands from center outward
          Duration: 600ms, fills to full screen
T+800ms  Haptic: NotificationFeedbackType.Success (double-tap pattern)
T+900ms  Lottie animation plays: animated-checkmark-with-confetti
          Source: lottiefiles.com (free)
          Duration: 1500ms internally
T+1200ms Stats panel slides up from bottom:
          translateY: SCREEN_HEIGHT → 0, duration: 400ms, EASE.OUT_EXPO
          Glassmorphism card (expo-blur intensity:25, tint:'dark')
T+1400ms Counters begin count-up (staggered 200ms apart):
          Session duration, breath cycles, updated streak
T+2400ms Share card appears:
          opacity: 0→1, translateY: 20→0, duration: 300ms
          Contains: orb screenshot, stats, share button
```

**The Lottie component:**

```typescript
import LottieView from 'lottie-react-native';
import confettiAnimation from '../assets/lottie/checkmark-confetti.json';

<LottieView
  source={confettiAnimation}
  autoPlay
  loop={false}
  style={{ width: 200, height: 200 }}
  onAnimationFinish={() => setLottieComplete(true)}
/>
```

Download the JSON from LottieFiles (free tier, no account required for basic animations). Store in `/assets/lottie/`. File size is ~40–80KB.[^3][^4]

**Milestone Lottie (7, 30, 100 sessions):**

Replace the standard checkmark with a `reward-badge-confetti` Lottie. Same implementation. Badge shines with a rotating glint animation before confetti bursts. These play instead of the standard completion Lottie on milestone sessions only.[^5]

***

## 10. Onboarding Animations — Screen-by-Screen

### Splash Screen

```typescript
// Logo entrance
logoOpacity.value    = withTiming(1,    { duration: 600, easing: EASE.OUT });
logoScale.value      = withTiming(1.0,  { duration: 600, easing: EASE.OUT }); // from 0.85

// Single breath (after 800ms)
setTimeout(() => {
  logoScale.value = withSequence(
    withTiming(1.05, { duration: 500, easing: EASE.IN_OUT }),
    withTiming(1.0,  { duration: 500, easing: EASE.IN_OUT }),
  );
}, 800);

// Exit (after 1800ms total)
setTimeout(() => {
  logoOpacity.value = withTiming(0, { duration: 400 });
  logoScale.value   = withTiming(1.1, { duration: 400 });
}, 1800);
```

Total splash duration: **2200ms**. Never exceed this.[^6]

### Question Cards — Staggered Option Entrance

```typescript
// Question text: arrives first
questionOpacity.value = withTiming(1, { duration: 300, easing: EASE.OUT }); // delay: 0

// Options appear bottom-to-top, 80ms stagger
options.forEach((_, index) => {
  const delay = 350 + (index * 80); // first option at 350ms, then 430, 510, 590
  setTimeout(() => {
    optionOpacity[index].value    = withTiming(1,  { duration: 250 });
    optionTranslate[index].value  = withTiming(0,  { duration: 250, easing: EASE.OUT }); // from 12px
  }, delay);
});
```

### Option Selection — Bar Fill + Haptic

```typescript
const selectOption = (index: number) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // Selected option: background bar fills left-to-right
  fillWidth[index].value = withTiming(1.0, { duration: 200, easing: EASE.OUT }); // 0→1 = scaleX
  // Text color shifts: Mist → Cloud
  textColor[index].value = withTiming(1, { duration: 150 });

  // Other options: fade
  options.forEach((_, i) => {
    if (i !== index) {
      optionOpacity[i].value = withTiming(0.35, { duration: 150 });
    }
  });

  // After 400ms: whole question exits upward, next question enters from below
  setTimeout(() => {
    questionContainerY.value = withTiming(-SCREEN_HEIGHT * 0.4, {
      duration: 320,
      easing: EASE.IN,
    });
    // Trigger next question after 200ms (mid-exit)
    setTimeout(showNextQuestion, 200);
  }, 400);
};
```

***
