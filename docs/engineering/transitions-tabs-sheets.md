## 4. Screen Transitions

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) to navigate sibling animation implementation docs.
- Use [Navigation Architecture](../ux/navigation-architecture.md) for tab and route behavior.
- Use [Animation Tech Decisions And Easing](animation-tech-decisions-easing.md) for timing and easing constants.
- Use [Haptics, Reduce Motion, And Timing](haptics-reduce-motion-timing.md) for accessibility constraints.

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
  <View style={StyleSheet.absoluteFill} />
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
