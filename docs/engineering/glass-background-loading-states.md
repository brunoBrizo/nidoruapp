## 11. Glassmorphism Implementation

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation implementation docs.
- Use [Design System](../design/design-system.md) for glass, color, and elevation tokens.
- Use [Animation Implementation Review Notes](animation-implementation-review-notes.md) for production corrections.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for the screens that use glass cards and loading states.

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
