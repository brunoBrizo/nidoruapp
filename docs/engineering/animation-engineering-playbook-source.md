# Animation Engineering Playbook — Sleep + Breathwork App

> **Purpose:** This is the standalone animation and motion design reference. It contains zero feature descriptions, zero market research, and zero business strategy — only animation specifications, code patterns, timing values, easing curves, haptic rules, competitor motion failures, and implementation decisions. Hand this directly to the developer or designer building the UI.

***

## 1. Technology Decisions

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

## 3. The Breathing Orb — Complete Implementation

### Architecture: 5 Layers

All five layers animate simultaneously via the same `useSharedValue`. Different `scale` targets per layer create depth — outer rings move more than the inner core, simulating organic expansion:

```
Layer 5 — Pulse ring:   Fires once per inhale. Scale 1.0 → 1.6, opacity 0.5 → 0. Disappears.
Layer 4 — Outer glow:   Scale 1.0 → 1.35, opacity 0.15 → 0.08
Layer 3 — Mid diffuse:  Scale 1.0 → 1.25, opacity 0.30 → 0.15
Layer 2 — Inner glow:   Scale 1.0 → 1.18
Layer 1 — Core circle:  Scale 1.0 → 1.12  ← the visible orb
```

### Complete Component

```typescript
// components/BreathingOrb.tsx
import React, { useEffect, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AnimatedView, View } from '@/tw';
import { EASE } from '../animations/easings';

interface BreathTechnique {
  inhale: number;   // seconds
  holdIn: number;   // seconds (0 = no hold)
  exhale: number;   // seconds
  holdOut: number;  // seconds (0 = no hold)
}

const TECHNIQUES: Record<string, BreathTechnique> = {
  '4-7-8':     { inhale: 4, holdIn: 7, exhale: 8,  holdOut: 0 },
  'box':       { inhale: 4, holdIn: 4, exhale: 4,  holdOut: 4 },
  'coherent':  { inhale: 5, holdIn: 0, exhale: 5,  holdOut: 0 },
  'sigh':      { inhale: 2, holdIn: 0, exhale: 8,  holdOut: 0 },
  'custom':    { inhale: 4, holdIn: 0, exhale: 6,  holdOut: 0 },
};

const triggerInhaleHaptic = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

const triggerExhaleHaptic = () =>
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

export function BreathingOrb({
  technique = '4-7-8',
  isRunning = false,
}: {
  technique?: string;
  isRunning?: boolean;
}) {
  const t = TECHNIQUES[technique];
  const coreScale    = useSharedValue(1.0);
  const innerGlow    = useSharedValue(1.0);
  const midDiffuse   = useSharedValue(1.0);
  const outerGlow    = useSharedValue(1.0);
  const pulseScale   = useSharedValue(1.0);
  const pulseOpacity = useSharedValue(0);

  // Hold shimmer — gentle oscillation while holding
  const holdShimmer  = useSharedValue(1.0);

  const firePulse = () => {
    pulseScale.value   = 1.0;
    pulseOpacity.value = 0.5;
    pulseScale.value   = withTiming(1.6, { duration: 800, easing: EASE.OUT });
    pulseOpacity.value = withTiming(0,   { duration: 800, easing: EASE.OUT });
  };

  const runCycle = () => {
    // Inhale — fire haptic + pulse ring at start
    runOnJS(triggerInhaleHaptic)();
    runOnJS(firePulse)();

    coreScale.value  = withTiming(1.12, { duration: t.inhale * 1000, easing: EASE.INHALE });
    innerGlow.value  = withTiming(1.18, { duration: t.inhale * 1000, easing: EASE.INHALE });
    midDiffuse.value = withTiming(1.25, { duration: t.inhale * 1000, easing: EASE.INHALE });
    outerGlow.value  = withTiming(1.35, { duration: t.inhale * 1000, easing: EASE.INHALE });

    // Hold In
    if (t.holdIn > 0) {
      holdShimmer.value = withRepeat(
        withSequence(
          withTiming(1.14, { duration: 600 }),
          withTiming(1.12, { duration: 600 }),
        ), -1, true
      );
      setTimeout(() => {
        holdShimmer.value = 1.12;
        startExhale();
      }, t.holdIn * 1000);
    } else {
      setTimeout(startExhale, t.inhale * 1000);
    }
  };

  const startExhale = () => {
    runOnJS(triggerExhaleHaptic)();

    coreScale.value  = withTiming(1.0, { duration: t.exhale * 1000, easing: EASE.EXHALE });
    innerGlow.value  = withTiming(1.0, { duration: t.exhale * 1000, easing: EASE.EXHALE });
    midDiffuse.value = withTiming(1.0, { duration: t.exhale * 1000, easing: EASE.EXHALE });
    outerGlow.value  = withTiming(1.0, { duration: t.exhale * 1000, easing: EASE.EXHALE });
  };

  // Animated styles
  const coreStyle    = useAnimatedStyle(() => ({ transform: [{ scale: coreScale.value }] }));
  const innerStyle   = useAnimatedStyle(() => ({ transform: [{ scale: innerGlow.value }] }));
  const midStyle     = useAnimatedStyle(() => ({ transform: [{ scale: midDiffuse.value }] }));
  const outerStyle   = useAnimatedStyle(() => ({ transform: [{ scale: outerGlow.value }] }));
  const pulseStyle   = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  useEffect(() => {
    if (isRunning) {
      runCycle();
    }
  }, [isRunning]);

  return (
    <View className="h-[220px] w-[220px] items-center justify-center">
      {/* Layer 5: Pulse ring */}
      <AnimatedView
        className="absolute h-[220px] w-[220px] rounded-full border-[1.5px] border-[rgba(168,156,224,0.5)] bg-transparent"
        style={pulseStyle}
      />
      {/* Layer 4: Outer glow */}
      <AnimatedView
        className="absolute h-[220px] w-[220px] rounded-full bg-[rgba(168,156,224,0.08)]"
        style={outerStyle}
      />
      {/* Layer 3: Mid diffuse */}
      <AnimatedView
        className="absolute h-[200px] w-[200px] rounded-full bg-[rgba(168,156,224,0.18)]"
        style={midStyle}
      />
      {/* Layer 2: Inner glow */}
      <AnimatedView
        className="absolute h-[180px] w-[180px] rounded-full bg-[rgba(124,111,205,0.35)]"
        style={innerStyle}
      />
      {/* Layer 1: Core */}
      <AnimatedView
        className="absolute h-[160px] w-[160px] rounded-full bg-[#7C6FCD]"
        style={coreStyle}
      />
    </View>
  );
}
```

### Phase Text — Crossfade Transition

The phase label ("Inhale" / "Hold" / "Exhale") must never hard-swap. It must crossfade:

```typescript
// components/PhaseLabel.tsx
const opacity = useSharedValue(1);
const translateY = useSharedValue(0);

const changePhase = (newLabel: string) => {
  // Fade out + float up
  opacity.value = withTiming(0, { duration: 200, easing: EASE.IN });
  translateY.value = withTiming(-6, { duration: 200, easing: EASE.IN });

  setTimeout(() => {
    setLabel(newLabel);
    translateY.value = 6; // reset to below
    // Fade in + rise up
    opacity.value = withTiming(1, { duration: 300, easing: EASE.OUT });
    translateY.value = withTiming(0, { duration: 300, easing: EASE.OUT });
  }, 220); // 20ms gap between out and in
};
```

***

## 4. Screen Transitions

### Standard Screen Entrance (All Screens Except Session)

```typescript
// Every screen wraps its content in this:
const opacity    = useSharedValue(0);
const translateY = useSharedValue(16);

useEffect(() => {
  opacity.value    = withTiming(1, { duration: 380, easing: EASE.OUT });
  translateY.value = withTiming(0, { duration: 380, easing: EASE.OUT });
}, []);

const screenStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ translateY: translateY.value }],
}));
```

### Shared Element Transition — Session Screen

When a user taps a session card (Wind-Down Flow, Rescue Me), that card expands to become the full session screen. This is implemented with `react-native-shared-element` + React Navigation's shared element middleware:

```bash
npx expo install react-native-shared-element
npm install react-navigation-shared-element
```

The card that opens the session gets a `sharedElements` tag:
```typescript
// On the card element:
<SharedElement id="session-card">
  <SessionCard ... />
</SharedElement>

// On the session screen root:
<SharedElement id="session-card">
  <View className="absolute inset-0" />
</SharedElement>
```

The transition config for the navigator:
```typescript
{
  gestureEnabled: true,
  transitionSpec: {
    open:  { animation: 'timing', config: { duration: 600, easing: EASE.OUT_EXPO } },
    close: { animation: 'timing', config: { duration: 350, easing: EASE.IN } },
  }
}
```

**Dismiss gesture:** Session screen supports swipe-down to dismiss. As user drags down, the screen follows with parallax — screen moves 1:1 with finger, background home content shifts up at 0.4x speed. On release above 40% dismiss threshold: spring back. Below 40%: complete dismiss animation.

***

## 5. Tab Bar Animations

### Active Tab Icon — Press + Spring

```typescript
const scale = useSharedValue(1.0);

const onPress = () => {
  scale.value = withSequence(
    withTiming(0.88, { duration: 100, easing: EASE.IN }),
    withSpring(1.05, { damping: 12, stiffness: 200 }),
    withTiming(1.0,  { duration: 100, easing: EASE.OUT }),
  );
  Haptics.selectionAsync(); // subtle selection click
};
```

### Active Indicator Slide

The active indicator (Iris-colored dot or underline beneath active tab icon) slides between positions:

```typescript
const indicatorX = useSharedValue(tabPositions);

const switchTab = (newIndex: number) => {
  indicatorX.value = withSpring(tabPositions[newIndex], {
    damping: 20,
    stiffness: 220,
  });
};

// Renders as a positioned View that follows indicatorX
```

### Tab Content Crossfade

When switching tabs, content crossfades — never hard-cuts:

```typescript
// Outgoing tab content
outOpacity.value = withTiming(0, { duration: 150, easing: EASE.IN });

// Incoming tab content (starts after 80ms gap)
setTimeout(() => {
  inOpacity.value  = withTiming(1, { duration: 200, easing: EASE.OUT });
}, 80);
```

***

## 6. Bottom Sheet & Modal Animations

All bottom sheets (sound mixer, technique selector, settings panels) use the same animation contract:

```typescript
// Open
translateY.value = withTiming(0, { duration: 420, easing: EASE.OUT_EXPO });
backdropOpacity.value = withTiming(0.65, { duration: 420 });

// Dismiss (programmatic)
translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300, easing: EASE.IN });
backdropOpacity.value = withTiming(0, { duration: 300 });
```

**Drag-to-dismiss (pan gesture):**

Using `react-native-gesture-handler` `PanGestureHandler`:

```typescript
const onGestureEvent = useAnimatedGestureHandler({
  onActive: (event) => {
    // Only allow downward drag
    if (event.translationY > 0) {
      translateY.value = event.translationY;
      // Resistance: backdrop dims as sheet moves down
      backdropOpacity.value = 0.65 * (1 - event.translationY / SHEET_HEIGHT);
    }
  },
  onEnd: (event) => {
    if (event.translationY > SHEET_HEIGHT * 0.30) {
      // Dismiss threshold reached
      translateY.value = withTiming(SHEET_HEIGHT, { duration: 250, easing: EASE.IN });
      backdropOpacity.value = withTiming(0, { duration: 250 });
      runOnJS(onClose)();
    } else {
      // Spring back
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(0.65, { duration: 250 });
    }
  },
});
```

***

## 7. Sound Mixer Animations

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
  className="font-rounded text-4xl text-cloud"
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
  className="h-[200px] w-[200px]"
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

## 11. Glassmorphism Implementation

Glassmorphism requires a visual background to blur. Always ensure the card sits over the animated background (gradient + particles), not over a flat surface.

```typescript
// components/GlassCard.tsx
import { BlurView, View } from '@/tw';
import { cn } from '@/tw/cn';

interface GlassCardProps {
  intensity?: number;  // 15–35 for dark theme. 25 is the default sweet spot.
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ intensity = 25, children, className }: GlassCardProps) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      className={cn(
        'overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.07)]',
        className,
      )}
    >
      {/* Inner gradient overlay for glass surface depth */}
      <View className="absolute inset-0 bg-[rgba(255,255,255,0.02)]" />
      {children}
    </BlurView>
  );
}
```

**Android fallback** (BlurView performs poorly on Android < 12):

```typescript
import { Platform } from 'react-native';

const cardBackground = Platform.OS === 'android' && Platform.Version < 31
  ? 'rgba(28, 32, 64, 0.90)'   // Solid dark card for older Android
  : undefined;                  // Let BlurView handle it on iOS and modern Android
```

***

## 12. Background Atmosphere System

The living background behind all screens:

### Night Mode (Default)

```typescript
// Two layers:
// 1. Static gradient: LinearGradient from expo
//    colors: ['#0D0F1A', '#0F1230']
//    direction: top → bottom
//
// 2. Particle field: 80 animated dots using react-native-skia (GPU-accelerated)
//    OR a simpler implementation: 80 tiny Animated.View elements

// Simple particle implementation:
interface Particle {
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
  size: number; // 1 or 2px, randomized
}

const createParticle = (): Particle => {
  const x = useSharedValue(Math.random() * SCREEN_WIDTH);
  const y = useSharedValue(Math.random() * SCREEN_HEIGHT);
  const opacity = useSharedValue(Math.random() * 0.6 + 0.2); // 0.2–0.8

  // Drift: slow random movement
  const driftX = (Math.random() - 0.5) * 80;  // ±40px total travel
  const driftY = (Math.random() - 0.5) * 80;
  const duration = Math.random() * 15000 + 20000; // 20–35 seconds per drift

  x.value = withRepeat(
    withSequence(
      withTiming(x.value + driftX, { duration, easing: EASE.IN_OUT }),
      withTiming(x.value,          { duration, easing: EASE.IN_OUT }),
    ), -1, true
  );

  // Twinkle: random opacity oscillation
  const twinkleDuration = Math.random() * 2000 + 2000; // 2–4 seconds
  opacity.value = withRepeat(
    withSequence(
      withTiming(Math.random() * 0.3 + 0.1, { duration: twinkleDuration }),
      withTiming(Math.random() * 0.5 + 0.3, { duration: twinkleDuration }),
    ), -1, true
  );

  return { x, y, opacity, size: Math.random() > 0.7 ? 2 : 1 };
};
```

**Performance note:** 80 animated `View` elements on the JS side will cause performance issues on Android. For production, use `react-native-skia` Canvas to render all 80 particles as a single GPU-drawn layer. The Canvas `drawCircle` call for 80 1-2px dots runs in microseconds on any device.

### Time-Based Gradient Transition

When the app detects a different time context on open (night → morning):

```typescript
// Background gradient interpolates over 2000ms
// Not achievable with standard backgroundColor animated value
// Use a Lottie or two overlapping LinearGradient views with opacity crossfade:

nightGradientOpacity.value  = withTiming(0, { duration: 2000, easing: EASE.IN_OUT });
morningGradientOpacity.value = withTiming(1, { duration: 2000, easing: EASE.IN_OUT });
```

***

## 13. Error, Loading, and Empty State Animations

### Shimmer Skeleton (Loading)

Never show a spinner. Show a shimmer over the expected layout shape:

```typescript
// Using react-native-skeleton-placeholder or custom implementation
// Custom shimmer: a translucent gradient that sweeps L → R

const shimmerX = useSharedValue(-SCREEN_WIDTH);

useEffect(() => {
  shimmerX.value = withRepeat(
    withTiming(SCREEN_WIDTH * 2, { duration: 1500, easing: Easing.linear }),
    -1
  );
}, []);

// Render as an absolute-positioned LinearGradient overlay:
// colors: ['transparent', 'rgba(124, 111, 205, 0.12)', 'transparent']
// Using shimmerX as the translateX
```

### Toast Notifications (Error / Info)

```typescript
// Entrance (slides up from off-screen bottom)
toastY.value = withTiming(0, { duration: 300, easing: EASE.OUT_EXPO });

// Auto-dismiss after 4 seconds
setTimeout(() => {
  toastY.value      = withTiming(80,  { duration: 250, easing: EASE.IN });
  toastOpacity.value = withTiming(0,   { duration: 250 });
}, 4000);

// Haptic on entrance:
// Error toast → Haptics.notificationAsync(NotificationFeedbackType.Error)
// Info toast  → Haptics.impactAsync(ImpactFeedbackStyle.Light)
```

### Empty State Animation (Data Not Yet Available)

```typescript
// Pulsing progress ring at 0%
pulsingOpacity.value = withRepeat(
  withSequence(
    withTiming(0.6, { duration: 1000, easing: EASE.IN_OUT }),
    withTiming(0.2, { duration: 1000, easing: EASE.IN_OUT }),
  ), -1, true
);
```

***

## 14. Haptic Design System

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

## 17. Competitor Motion Failures — What Not to Replicate

| Competitor | What They Do Wrong | Impact | The Fix |
|---|---|---|---|
| Calm | No animation on session complete — silent exit | No reward signal; habit doesn't feel good | Full session complete sequence (Section 9) |
| Calm | Generic spinner on audio loading | Communicates failure; increases anxiety before bed | Shimmer skeleton (Section 13) |
| Calm | Static achievement badges | No dopamine on milestones | Lottie badge + confetti (Section 9) |
| Headspace | Static product UI despite rich brand motion[^9] | Feels hollow; badge system earns no emotion | Animated milestones throughout |
| Headspace | Navigation redesign with no spatial transition cues[^10] | Users say "I'm confused, can't find anything" | Directional transitions + shared elements |
| Headspace | Back button freezes on black screen[^10] | Destroys calm environment; feels broken | Test every nav path on Android before release |
| Breathwrk | Removed animations in updates[^11] | Trust destroyed; users feel product "getting worse" | Never remove; add toggle in Settings |
| Breathwrk | Animation crashes at session end[^12] | Streak wiped; most important moment broken | Session complete is highest-priority test case |
| Breathwrk | Orb is a single flat circle — no depth or glow | Not shareable on TikTok; emotionally flat | 5-layer orb with glow + haptics |
| Eight Sleep | Splash > 3 seconds[^6] | Users resent delay; abandonment before first view | Splash ≤ 2.2 seconds absolute maximum |
| Generic apps | Linear easing on all animations | Feels mechanical and robotic | Always use bezier curves (Section 2) |
| Generic apps | Haptics on every button tap | Haptic noise; loses meaning for important events | Haptics only for 4 specific events (Section 14) |
| Generic apps | High-bounce spring on wellness UI | Feels playful; wrong for sleep/anxiety context | `damping > 15` for gentle springs |

***

*This playbook is the complete animation engineering reference. Every value is buildable. Every pattern is tested against competitor failures. Build once, test on the lowest-spec Android device you can find, and ship knowing the orb runs at 60fps and the session complete sequence earns the reward signal every habit loop depends on.*

---

## References

1. [Build a Mindful Breathing App with React Native and Reanimated](https://www.wellally.tech/blog/build-breathing-app-react-native-reanimated-tutorial) - Smooth breathing animations that run on the UI thread. React Native Reanimated for 60fps circles, se...

2. [Optimizing animations for 60 FPS with React Native Reanimated](https://dev.to/malik_chohra/optimizing-animations-for-60-fps-with-react-native-reanimatedoptimizing-animations-for-60-fps-with-1beh) - If you feel like you need to animate the layout, stop and rethink the design. The animation is proba...

3. [Airbnb's Lottie: After Effects Animations and React Native](https://www.fullstack.com/labs/resources/blog/airbnbs-lottie-after-effects-animations-and-react-native) - Animate React Native Apps with Lottie, Learn to set up, install & integrate Lottie animations for en...

4. [Free Animated Checkmark with Confetti Animation by Nattu Adnan](https://lottiefiles.com/free-animation/animated-checkmark-with-confetti-zOhZc4gVJk) - Animated Checkmark with Confetti animation designed in Figma and Exported to Lottie with LottieFiles...

5. [Reward Badge Confetti Animations - Free Download in GIF, Lottie ...](https://iconscout.com/lottie-animations/reward-badge-confetti) - Free Download Reward Badge Confetti Animations in GIF, static SVG, JSON for Lottie, AEP or MP4 forma...

6. [App opening animation - slowing down the user experience.](https://www.reddit.com/r/EightSleep/comments/1pos3jv/app_opening_animation_slowing_down_the_user/) - Whose bright idea was it to add a 'cool' animation to the app? Now it takes even longer to get in to...

7. [2025 Guide to Haptics: Enhancing Mobile UX with Tactile ...](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774) - Go beyond simple vibration. This guide provides best practices for leveraging sophisticated haptics ...

8. [How to Implement Effective Haptic Feedback in Mobile Apps - LinkedIn](https://www.linkedin.com/posts/amirhoseinkarimi_hapticfeedback-uxdesign-mobileapps-activity-7372636284684558336-QVpH) - Haptic Feedback in Mobile Apps: It's the technology that makes digital buttons and on-screen actions...

9. [Headspace: Brand Analysis](https://www.duaa.design/headspace) - I look for micro-animations in every app now. From Facebook's bell icon to Uber's little cars, micro...

10. [Headspace keeps getting worse and worse](https://www.reddit.com/r/Headspace/comments/1nq1qq7/headspace_keeps_getting_worse_and_worse/) - Headspace keeps getting worse and worse

11. [Recensies: Breathwrk: Breathing Exercises - AppWereld](https://www.appwereld.nl/app/breathwrk-breathing-exercises/1481804500/reviews/) - Lees de meningen van gebruikers over Breathwrk: Breathing Exercises uitgegeven door Peloton Interact...

12. [‎Breathwrk: Breathing Exercises - Ratings & Reviews - App Store](https://apps.apple.com/us/app/breathwrk-breathing-exercises/id1481804500?see-all=reviews&platform=iphone) - Scam. 12/10/2025. Spiderisms. DO NOT DOWNLOAD!! DO NOT BUY!! STAY FAR AWAY!! THIS APP IS A MONEY-HUN...
