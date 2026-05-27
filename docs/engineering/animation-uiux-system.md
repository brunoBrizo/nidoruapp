## Part 2: The Complete Animation System

Related docs:

- Use [Animation Engineering Index](animation-engineering-index.md) to navigate the animation docs.
- Use [Animation Tech Decisions And Easing](animation-tech-decisions-easing.md) for implementation constants.
- Use [Breathing Orb Code Pattern](breathing-orb-code-pattern.md) for the core orb implementation pattern.
- Use [Animation UIUX Timing Reference](animation-uiux-timing-reference.md) for the consolidated timing table.

Every animation in the app is categorized by type, purpose, technical implementation, and the exact timing values. These are not estimates — they are specific numbers derived from motion design research and competitor analysis.

### Category 1: The Breathing Orb (Core Product Animation)

This is the most important animation in the entire app. It must run at 60 FPS always, without any jank, on any device from iPhone 12 to the latest Android flagship. This is achieved exclusively using **React Native Reanimated 3** with `useSharedValue` and `withTiming` running on the native UI thread — never on the JavaScript thread.[^11][^12]

**Why Reanimated over the standard Animated API:**

Standard React Native Animated API runs on the JavaScript thread. When React re-renders (even for something unrelated — a notification, a state update), animations running on the JS thread can drop frames. Reanimated 3 runs animation worklets directly on the native thread, guaranteeing smooth 60fps regardless of JavaScript activity. For a breathing animation where one dropped frame causes visible jitter, this is not optional.[^13][^11]

**The 5-layer orb architecture:**

```
Layer 5: Outer pulse ring (opacity + scale, fires only on inhale transition)
Layer 4: Outer glow ring (scale: 1.0 → 1.35)
Layer 3: Middle diffusion ring (scale: 1.0 → 1.25, opacity: 0.3 → 0.15)
Layer 2: Inner glow (scale: 1.0 → 1.18, blur: 8 → 14px)
Layer 1: Core circle (scale: 1.0 → 1.12)
```

All five layers animate simultaneously. The key is that **each layer has a different scale target** — the outer rings move more than the inner core. This creates a sense of depth and organic expansion, like a cell expanding, not a circle getting bigger.

**The exact easing function:**

Inhale: `Easing.bezier(0.25, 0.46, 0.45, 0.94)` — an ease-out-quart that starts fast (lungs fill quickly) and slows at the end (natural deceleration as lungs reach capacity)[^14]

Exhale: `Easing.bezier(0.55, 0.055, 0.675, 0.19)` — an ease-in-quart that is slow to start (releasing breath gently) and accelerates near the end. This is the opposite curve from inhale and creates the sense of falling[^14]

Hold (between phases): orb at maximum scale, with a slow sine oscillation — scale 1.12 → 1.14 → 1.12 at 0.5 Hz, creating a "heartbeat shimmer" that communicates "stay here"

**Implementation pattern using Reanimated:**

```typescript
// useSharedValue runs on native thread
const orbScale = useSharedValue(1.0);

// Breathing sequence using withSequence
const startBreathingCycle = (technique: BreathTechnique) => {
  orbScale.value = withSequence(
    // Inhale phase
    withTiming(1.12, {
      duration: technique.inhale * 1000,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    }),
    // Hold phase (if applicable)
    ...(technique.holdIn > 0 ? [
      withTiming(1.12, { duration: technique.holdIn * 1000 })
    ] : []),
    // Exhale phase
    withTiming(1.0, {
      duration: technique.exhale * 1000,
      easing: Easing.bezier(0.55, 0.055, 0.675, 0.19),
    }),
    // Hold out phase (if applicable)
    ...(technique.holdOut > 0 ? [
      withTiming(1.0, { duration: technique.holdOut * 1000 })
    ] : []),
  );
};
```

**The outer pulse ring animation (fires only on inhale start):**

On the exact moment the inhale phase begins, a separate ring erupts outward and fades. This is a `withSequence` of: `scale 1.0 → 1.6` simultaneous with `opacity 0.5 → 0`. Duration: 800ms. This creates the "ripple" effect that looks stunning in TikTok screen recordings. It fires once per inhale, not continuously.

**Haptic synchronization:**

Haptics are fired from within the animation sequence using `runOnJS` (Reanimated's bridge back to JS for side effects):[^11][^13]

- On inhale start: `Haptics.impactAsync(ImpactFeedbackStyle.Light)` — a single soft tap
- On exhale start: `Haptics.impactAsync(ImpactFeedbackStyle.Soft)` — softer than Light, barely perceptible
- On hold phase: no haptic — silence communicates stillness
- On session complete: `Haptics.notificationAsync(NotificationFeedbackType.Success)` — the double-tap "success" pattern

Users who are breathing with eyes closed (the ideal state) experience the session entirely through haptics. The light tap on inhale and the even lighter sensation on exhale create a tactile rhythm that guides breathing without any visual reference.[^15][^16]

**Phase text animation:**

The words "Inhale," "Hold," "Exhale" must not appear/disappear abruptly. The transition:
- Outgoing text: `opacity 1 → 0` + `translateY 0 → -6px`, duration: 200ms, ease-in
- Incoming text: `opacity 0 → 1` + `translateY 6px → 0`, duration: 300ms, ease-out
- Total gap between texts: 100ms

The new text arrives 100ms after the old one leaves. This creates a "breathing" effect in the text itself.

***

### Category 2: Screen Transitions

**The rule:** Screen transitions in a sleep/wellness app must never be sharp or instantaneous. Every transition should feel like drawing a curtain, not opening a door.

**Inbound (navigating into a screen):**

All screens except the session screen use: `opacity 0 → 1` + `translateY 16px → 0`, duration: 380ms, `easing: ease-out`.

The session screen (breathing orb, sleep sounds) uses a **full-screen radial expand** from the tapped element: the card or button expands to fill the screen while its background color transitions to `#0D0F1A`. This is a Shared Element Transition — the source element becomes the destination screen. In React Native, this is implemented with `react-native-shared-element` + React Navigation.[^17][^18]

**Outbound (dismissing a session screen back to home):**

The screen contracts back into the card it came from, using the reverse shared element transition. Duration: 350ms. If the user swipes down (gesture dismiss), use a parallax parallax effect: the session screen slides down while a partially revealed home screen moves up at 60% speed — creating depth and reinforcing "I'm exiting this space."

**Tab bar switching:**

Never a hard cut. Active tab: the content fades out at 150ms ease-in, then the new tab's content fades in at 200ms ease-out. The tab icon uses: scale `1.0 → 0.9 → 1.05 → 1.0` over 300ms total — a micro "press in and spring back" that confirms selection. The active indicator (the `Iris` dot or underline) slides horizontally between tabs using `withSpring` with `{ damping: 20, stiffness: 200 }` — a slight spring that reinforces physical materiality.

**Modal and bottom sheet:**

Bottom sheets slide up from below: `translateY: screenHeight → 0`, duration: 420ms, easing: `Easing.bezier(0.16, 1, 0.3, 1)` — an ease-out-expo that starts fast and settles softly. This is the "iOS feel" spring curve. The backdrop behind it: `opacity 0 → 0.7`, same duration.

Dismissal: user drags down → spring resistance increases progressively → on release above 30% drag position, sheet springs back. Below 30%: sheet animates to full dismiss.

***

### Category 3: The Home Screen — Context-Aware Card Animation

The Primary Action Card on the home screen changes content based on time of day. When it changes (app open in a different time context), the card must communicate that it has updated:

- Old content: `opacity 1 → 0` + `scale 1 → 0.96`, duration: 200ms
- New content: `opacity 0 → 1` + `scale 0.96 → 1`, duration: 300ms
- The card's gradient background transitions smoothly: morning = warm gold tones, night = deep indigo. Use `backgroundColor` interpolation over 500ms on app open.

**The "Good evening/morning" header:**

On first open of the day, the greeting text fades in with a staggered character animation. Each word arrives 80ms after the last: "Good" → "evening" → "Bruno." This technique — borrowed from the best onboarding experiences of 2025 — makes the greeting feel spoken rather than displayed. Total cost: 3 `withDelay(withTiming(...))` calls.[^19]

***

### Category 4: Streak and Progress Animations

These are the animations that the brain uses to measure progress. Getting them wrong (or absent, as Headspace does) directly reduces motivation to maintain the habit.[^4]

**Daily streak calendar (horizontal week strip):**

When a session is completed and a new day is marked:
1. The today's circle fills from bottom to top: `scaleY 0 → 1`, duration: 400ms, ease-out
2. As the fill completes, the `Iris → Lavender` gradient sweeps across the filled circle: a `linearGradient` that travels left to right, duration: 300ms after fill starts
3. A small sparkle particle (4 tiny `View` elements, `opacity 0`, positioned around the circle) explodes outward and fades: `translateX/Y 0 → ±12px`, `opacity 0.8 → 0`, duration: 400ms
4. The streak number increments with a count-up: from previous number to new number over 600ms, using `withTiming` on a `useSharedValue`

The total duration of this sequence: approximately 1 second. It should feel like earning something.

**Streak milestone celebrations (7, 30, 100 sessions):**

At specific milestones, a Lottie animation plays over the session complete screen. LottieFiles provides free, ready-to-use JSON animations for badges and confetti. The recommended Lottie files:[^20][^21][^22]
- Session complete: `animated-checkmark-with-confetti` from LottieFiles — checkmark draws itself then confetti bursts
- Streak milestone: `reward-badge-confetti` — badge drops in and shines, confetti erupts

Lottie renders at 60fps, is vector-scalable, and adds ~40KB per animation JSON file. This is the right tool for complex celebrations because they are too intricate to hand-code and Lottie files can be designed in After Effects and exported directly.[^23][^24]

**The weekly summary card:**

When a weekly summary card appears (Monday morning), the statistics count up as the card enters view: sessions completed `0 → 5`, total breath minutes `0 → 32`, sleep average `0 → 3.8`. Each counter uses `withTiming` with `duration: 1200ms` and `easing: ease-out`. The stagger delay between counters: 200ms each. This technique — borrowed from sports stats overlays — makes numbers feel earned rather than arbitrary.

***

### Category 5: Sound Mixer Animations

The sound mixer is designed to be viral on TikTok. Every visual element should look alive.

**Sound card icons:**

Each active sound icon has a looping animation representing what the sound is:
- **Rain**: 4 tiny line segments (`│` symbols), each with independent `translateY 0 → 8px` + `opacity 1 → 0.2` animations offset by 200ms each — creating a continuous rain falling effect
- **Ocean**: a sine wave path using a `react-native-svg` `Path` whose `d` attribute animates between two wave states via Reanimated
- **Fire**: 3 flame shapes with `scaleY 1.0 → 1.15` + slight `rotate ±3°` oscillation at different frequencies (0.8 Hz, 1.1 Hz, 0.7 Hz) — creating organic, non-mechanical movement
- **White noise**: concentric rings that pulse outward at 0.5 Hz
- **Forest**: leaf silhouettes with a subtle `rotate ±5°` oscillation at 0.3 Hz

These animations loop indefinitely at low intensity. When the sound is deactivated, the animation fades out over 300ms. When activated, it fades in over 200ms and the circular volume ring fills clockwise.

**Volume ring interaction:**

The volume ring (circular stroke around each sound icon) responds to touch. When the user holds and drags:
- Ring arc fills/empties following the touch position (calculated as angle from circle center)
- Haptic: `Haptics.selectionAsync()` fires every 10% of volume change — simulates a physical dial click
- The sound volume changes in real time during the drag

**Sound layer mixing visual:**

At the bottom of the mixer, active sounds appear as small animated icons in a horizontal strip. They "float" in with a `translateY 12px → 0` + `opacity 0 → 1` entrance (200ms). When a sound is deactivated, it `translateY 0 → -8px` + `opacity 1 → 0` exits (150ms). The remaining icons slide to fill the gap using `withSpring` on their `translateX` values.

***

### Category 6: Glassmorphism — When and How to Use It

Glassmorphism (frosted glass effect on cards) is a dominant 2025–2026 UI trend and is perfectly suited for a sleep app with dark backgrounds. The frosted glass look creates depth and a premium feel that dark mode alone cannot achieve.[^25][^26]

**Where to use glassmorphism:**

- The Primary Action Card on the home screen — a semi-transparent card floating over the animated background
- The session complete overlay — appears over the session screen with the Lottie animation
- Quick action chips (Rescue Me, Sound Mixer, Free Breathe) — frosted pills floating over the background
- The sleep insight card — a glass panel that feels like looking at data through a window

**Technical implementation with NativeWind:**

```typescript
import { BlurView } from '@/tw';

<BlurView
  intensity={25}         // 0–100: lower = more transparent, higher = more opaque blur
  tint="dark"           // 'dark' | 'light' | 'default'
  className="overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.08)]"
>
  {/* Card content */}
</BlurView>
```

**The rules for using glassmorphism correctly:**

1. Never use glassmorphism on a flat dark background — the blur effect requires something behind it to blur. Glassmorphism only works if there is a visual background (gradient, nature video, particle field) that shows through the glass[^25]
2. Add a 1px border with `rgba(255, 255, 255, 0.08)` — this is the "glass edge" that makes the material readable
3. Use an inner shadow or subtle gradient on the glass surface: `background: linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.01))` — top of card is slightly lighter than bottom
4. On Android, `BlurView` performs poorly on older devices. Provide a fallback: a solid `rgba(28, 32, 64, 0.85)` background for devices below Android 12

***

### Category 7: Background Atmosphere Animation

The app background is not a static color. The background is a **living environment** that changes based on context.

**Evening/Night mode background:**
- A deep indigo gradient base (`#0D0F1A` to `#0F1230`)
- Over it: a `react-native-particles` or custom `Animated.View` particle system of ~80 tiny dots (1–2px) that move very slowly (0.3–0.8 px/second) in random trajectories — simulating stars drifting
- Stars occasionally "blink": `opacity 1.0 → 0.4 → 1.0` randomly across particles
- This particle system uses the Canvas API or `react-native-skia` for GPU-accelerated rendering — critical for smooth performance on mid-range Android devices

**Morning mode background:**
- Warm gradient transition: `#0D0F1A → #1A1535 → #2A1F4A → #3D2060` — a dawn light growing from the bottom
- The `Dusk Gold #E8C97A` appears as a soft glow at the bottom of the screen, growing slowly on app open
- No particles — clean light

**Background transition at time boundaries:**
When the app detects a time context shift (e.g., user opens at 7 AM after using the night mode), the background gradient transitions over 2 seconds: a slow `interpolateColor` from night palette to morning palette. This "time of day responsiveness" makes the app feel like the environment is aware of the moment — not just displaying a static color.

***

### Category 8: Onboarding Animation Flow

First impressions are formed in 50 milliseconds. The onboarding must feel like the app is welcoming you, not interrogating you.[^19]

**Splash to first screen:**
- Splash: logo at center, `opacity 0 → 1`, `scale 0.85 → 1.0`, duration: 600ms
- Logo breathes once (scale `1.0 → 1.05 → 1.0`, 1 second)
- Then dissolves: `opacity 1 → 0`, `scale 1.0 → 1.1`, 400ms
- First screen rises in: `opacity 0 → 1`, `translateY 24px → 0`, 500ms

The total splash to first content: under 2 seconds. Never more. Research is clear: app opening animations that slow down access to content are actively resented by users.[^27]

**Onboarding question cards (staggered entrance):**

Question text fades in first (300ms). Then options appear from top to bottom, each delayed by 80ms: option 1 at 400ms, option 2 at 480ms, option 3 at 560ms, option 4 at 640ms. This stagger makes the screen feel like it's "being presented to you" rather than dumped all at once. The total time to feel complete: ~800ms.

**Option selection animation:**

When a user taps an option:
- Selected option: background fills with `Iris` color, `scaleX 0 → 1` from left to right over 200ms (a "bar fill" that confirms selection), combined with a `Light` haptic
- Other options: `opacity 1 → 0.4` over 150ms
- Then: the selected option slides up with the question text (`translateY 0 → -fullHeight` over 300ms), revealing the next question sliding up from below

***

### Category 9: Session Complete — The Most Neglected Animation in Competitor Apps

Session completion is the single most important emotional moment in the daily habit loop. It is where the brain receives its reward signal. Every competitor gets this wrong — Calm exits silently, Breathwrk crashes, Headspace shows a static stats screen.[^4]

**The complete session-end sequence:**

1. **Orb fade:** The breathing orb's scale gently returns to resting size over 800ms (even if the session ends mid-exhale, override to graceful deceleration). Then `opacity 1 → 0`, `scale 1.0 → 0.8`, 600ms.

2. **Background wipe:** The session background (`#0D0F1A`) begins a radial wipe from center: a circle of `#14172B` expands from center outward, revealing the completion screen behind. Duration: 600ms. This is a "the dark clears" moment — intentionally theatrical and earned.

3. **Lottie checkmark + confetti:** The animated checkmark draws itself (300ms) then confetti bursts (LottieFiles `animated-checkmark-with-confetti`). Duration: 1.5 seconds total. Haptic: `NotificationFeedbackType.Success` at the moment the checkmark completes.[^22]

4. **Stats count up:** Session duration, total cycles, and streak increment all count up simultaneously over 800ms using Reanimated `withTiming`. The streak number gets a special treatment: it uses `withSpring({ damping: 8, stiffness: 100 })` creating a slight overshoot — the number "bounces" past its target value before settling. This is the reward-feedback moment.

5. **Social share card appears:** Slides up from bottom with a `translateY 80 → 0` + glassmorphism card, 400ms. Contains: a still frame of the orb at maximum expansion (beautiful screen capture), the session stats, and a share button. This is what users screenshot for TikTok.

***

### Category 10: Error, Empty, and Loading States

These are the states where most apps destroy trust. They must be designed as carefully as the happy path.

**Loading state (audio buffering):**

Never show a spinner in this app. Spinners communicate failure. Instead:
- Show the interface as if content has loaded, but with a shimmer overlay[^28][^29]
- The shimmer uses a translucent gradient that sweeps left to right over the content layout at 1.5-second intervals
- Below the shimmer: display the static layout (sound icon shapes, text placeholders) at 30% opacity
- This communicates "content is on its way, here is its shape" rather than "something is loading"
- The shimmer should use purples/indigo tones rather than the grey used in YouTube/Netflix — brand-consistent skeleton

For audio that should begin playing (wind-down flow, sounds), begin at 0% volume and ramp up over 3 seconds. A 3-second audio fade-in is imperceptible to the user but means that even if buffering causes a 1–2 second delay, the user never experiences a "silence then sudden audio" shock.

**Empty state (no check-ins yet, no insight data):**

Empty states must never be blank or show a generic "nothing here yet" message. Use a gentle animation to communicate "this fills as you use the app":
- An animated progress ring at 0% that pulses gently: `opacity 0.3 → 0.6 → 0.3` at 1 Hz
- Text below: "Complete a few evenings to unlock your sleep patterns"
- A subtle particle field (same as background) drifts across the empty area

**Error state:**

Only one use of the `Ember #FF6B6B` color in the entire app. When an error occurs (audio fails to load, network issue):
- A bottom toast slides up: `translateY 80 → 0`, 300ms
- The toast has a red-tinted glassmorphism surface
- Haptic: `NotificationFeedbackType.Error` — a distinctive double-buzz
- Auto-dismisses after 4 seconds: `translateY 0 → 80` with `opacity 1 → 0`, 250ms
- **Never show a modal or full-screen error for recoverable errors** — this interrupts the pre-bed flow and is one of the most-cited complaints about every competitor app

***
