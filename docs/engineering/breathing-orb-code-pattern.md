## 3. The Breathing Orb — Complete Implementation

Related docs:

- Use [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md) for product acceptance criteria.
- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation implementation docs.
- Use [Animation Implementation Review Notes](animation-implementation-review-notes.md) before copying this pattern into production.
- Use [Animation Tech Decisions And Easing](animation-tech-decisions-easing.md) for constants and dependency decisions.

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
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
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
    <View style={styles.container}>
      {/* Layer 5: Pulse ring */}
      <Animated.View style={[styles.pulseRing, pulseStyle]} />
      {/* Layer 4: Outer glow */}
      <Animated.View style={[styles.outerGlow, outerStyle]} />
      {/* Layer 3: Mid diffuse */}
      <Animated.View style={[styles.midDiffuse, midStyle]} />
      {/* Layer 2: Inner glow */}
      <Animated.View style={[styles.innerGlow, innerStyle]} />
      {/* Layer 1: Core */}
      <Animated.View style={[styles.core, coreStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  core:       { position: 'absolute', width: 160, height: 160, borderRadius: 80,
                backgroundColor: '#7C6FCD' },
  innerGlow:  { position: 'absolute', width: 180, height: 180, borderRadius: 90,
                backgroundColor: 'rgba(124, 111, 205, 0.35)' },
  midDiffuse: { position: 'absolute', width: 200, height: 200, borderRadius: 100,
                backgroundColor: 'rgba(168, 156, 224, 0.18)' },
  outerGlow:  { position: 'absolute', width: 220, height: 220, borderRadius: 110,
                backgroundColor: 'rgba(168, 156, 224, 0.08)' },
  pulseRing:  { position: 'absolute', width: 220, height: 220, borderRadius: 110,
                borderWidth: 1.5, borderColor: 'rgba(168, 156, 224, 0.5)',
                backgroundColor: 'transparent' },
});
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
