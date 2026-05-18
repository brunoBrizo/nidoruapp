# Animation & UI/UX Deep Specification: Sleep + Breathwork App

## Executive Summary

This document is the definitive animation and UI/UX specification for every interaction in the Sleep + Breathwork app. It covers: what every competitor does with animation and what they get catastrophically wrong, every animation category from macro screen transitions to micro haptic feedback, the exact technical implementation for React Native Reanimated, and the psychological principles behind every motion decision. Read this before writing a single line of animation code.

**The core principle:** Every animation in this app must do one of three things — **guide the user's breath, signal system state, or reward progress.** Any animation that does not serve at least one of these functions is decorative noise that increases cognitive load and must be cut.

***

## Part 1: Competitor Animation Audit — What They Do and What They Get Wrong

### Calm — Animation Analysis

**What Calm does well:**

Calm's background visual engine — subtle animated nature scenes (clouds slowly drifting, water rippling, leaves moving) — is the best execution of "ambient motion" in any wellness app. These backgrounds never demand attention because they move too slowly to be consciously tracked, yet they signal "this is a living environment" and reduce the sterility of looking at a static screen for 20 minutes. This is the right approach for background motion.[^1]

**What Calm gets wrong:**

The app's UI interactions (tapping, navigating, completing sessions) are largely static. Completing a sleep story gets no animation reward — the screen simply exits. Users who finish a 25-minute sleep story before falling asleep receive the same visual response as dismissing a notification. The brain expects reward when effort is completed, and getting nothing creates a psychological flatness that contributes to the "this feels robotic" experience users repeatedly describe.[^2][^3]

The loading behavior is a critical failure. When Calm is loading content (streaming audio), it shows a generic spinner. When users are anxious and trying to sleep, a spinning indicator is the worst possible visual — it communicates "something is broken" rather than "please relax". The fix: a slow, calming skeleton screen that mimics the audio player layout, or better still, buffer enough content that there is no loading state visible.[^2]

**The "no adaptation" complaint**, cited by hundreds of users in 2025 reviews: Calm's home screen looks identical whether it's your first session or your 500th. There is no animation that communicates "the app knows you." The welcome animation is the same for every user. This is a missed personalization cue that could be solved entirely with motion — a "Good evening, Bruno. Your streak glows brighter tonight" animation costs nothing to implement and earns enormous loyalty.[^3]

***

### Headspace — Animation Analysis

**What Headspace does well:**

The play button animation during active sessions is genuinely brilliant: the button "breathes" in and out, expanding and contracting like lungs. This single animation choice communicates the app's entire purpose without text. It anchors users visually during sessions and confirms "the session is running." This is the right application of purposeful motion — it has a specific communicative function.[^4]

The Headspace illustration animations for educational content (explaining concepts like "the monkey mind") use character animation to make abstract concepts approachable. These are not decorative — they reduce cognitive load by replacing complex explanation with visual metaphor.[^5]

**What Headspace gets catastrophically wrong:**

The app is described in a 2025 redesign analysis as "static". Despite a brand identity built entirely around meditation, breath, and flow, the UI interactions have almost no motion. Tapping through the content library, completing achievements, and progressing through courses all happen without meaningful animation feedback. The badge system — which should be the most rewarding part of building a habit — shows badges with "little to no motion," making users feel like they "haven't progressed as much as they thought". A streak milestone that earns no celebration teaches the brain that hitting milestones doesn't feel good, which reduces motivation to hit the next one.[^4]

The 2025 Reddit community is unambiguous about the navigation redesign: Headspace removed the favorites filter for sleep content, removed the ability to sort by voice type, removed Google Assistant integration, and replaced a clear hierarchy with horizontal scrolling cards. Users with ten years of subscription history describe finding the navigation "confusing". The new layout was so disorienting that when the app glitched back to an older version, users described it as "a relief". Navigation changes without clear spatial animation cues are the #1 cause of "I'm lost" reactions in app redesigns.[^6][^7]

The back button on Android causes the screen to freeze on a black screen with a loading wheel — a bug that has persisted through multiple updates. This destroys the illusion of a seamless, calming environment.[^7]

***

### Breathwrk — Animation Analysis

**What Breathwrk does well:**

The breathing visual itself — a circle that expands and contracts — is functional and serves its purpose. The exercise library is organized clearly enough for new users. The timing accuracy of the animation pacer (syncing visual to breath phase) is reportedly reliable.

**What Breathwrk gets catastrophically wrong:**

The visual design of the breathing animation is sterile. There is no glow, no multi-layer depth, no particle effect, no haptic synchronization beyond a basic vibration. The result is an animation that is technically correct but emotionally flat. Users do not share it on TikTok because it looks like a generic countdown circle — which is exactly what it is. The viral potential of the feature is untapped because of under-investment in visual quality.[^8]

Removing the visual animation style in updates — transitioning from a richer animation to a simpler one — without user consent or option to restore it broke trust for loyal users. This is an animation anti-pattern: users form emotional attachments to specific motion styles, and changing them feels like losing a friend.[^9]

The most technical failure: the app crashes at the end of sessions, wiping streaks. From an animation standpoint, this means the "session complete" animation — the reward moment — never plays. The most emotionally important frame in the entire session lifecycle (the completion state) is the most broken.[^10]

***

### Key Lesson From All Three Competitors

All three apps make the same category error: **they invest in ambient background animation and neglect state-change animation.** Beautiful backgrounds but no reward for completion. Animated illustrations but no feedback when you tap a button. Moving clouds behind the screen but a spinning loading icon when content buffers. The opportunity is the inverse: **make every transition, completion, and milestone feel alive.**

***

## Part 2: The Complete Animation System

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

**Technical implementation in React Native:**

```typescript
// Using BlurView from expo-blur
import { BlurView } from 'expo-blur';

<BlurView
  intensity={25}         // 0–100: lower = more transparent, higher = more opaque blur
  tint="dark"           // 'dark' | 'light' | 'default'
  style={{
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',  // thin white border = glass edge
  }}
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

4. **Stats count up:** Session duration, total cycles, and streak increment all count up simultaneously over 800ms using Reanimated `withTiming`. The streak number gets a special treatment: it uses `withSpring({ damping: 8, stiffness: 100 })` creating a slight overshoot — the number "bounces" past its target value before settling. This is the dopamine release moment.

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

## Part 3: The "Reduce Motion" Accessibility System

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

## Part 4: Animation Anti-Patterns to Avoid (Competitor Lessons)

Drawn directly from competitor analysis and user feedback:

| Anti-Pattern | Who Does It | Why It's Wrong | The Fix |
|---|---|---|---|
| Splash animation > 2 seconds | Eight Sleep app[^27] | Users resent being kept from content | Splash ≤ 1.5s, or instant load |
| Loading spinner at bedtime | Calm (audio buffering) | Communicates failure, increases anxiety | Shimmer skeleton + audio pre-buffer |
| Static session complete screen | Headspace, Calm | No reward signal = brain learns habit doesn't feel good | Lottie celebration + count-up stats |
| Removing animations in updates | Breathwrk[^9] | Destroys trust and habit routines | Never remove; offer toggle |
| Spring animations with high bounce | Many wellness apps | Fun in social apps, feels playful/wrong in sleep context | Use `damping > 15` for gentle spring |
| Ambient particles at high speed | Common mistake | Fast movement is activating, not calming | Particles max 0.8 px/second |
| Navigation without spatial cue | Headspace rebrand[^7] | Users lose their mental map of the app | Consistent directional transitions (forward = right, back = left) |
| Haptics for every touch | Common mistake | Becomes noise, loses meaning[^16] | Only 4 haptic events: inhale, exhale, success, error |
| Linear animation easing | Any app using `duration: 300` | Feels mechanical and robotic | Always use `ease-in-out` or bezier curves |
| Full-screen modal for errors | Calm, Headspace[^3] | Interrupts the pre-bed ritual | Toast only, auto-dismiss |
| Bright loading screen on night mode | Most apps | Burns eyes, breaks sleep readiness | Skeleton shimmer at 20% brightness |

***

## Part 5: Complete Animation Timing Reference

A single-table reference for every animation in the app:

| Animation | Duration | Easing | Haptic | Notes |
|---|---|---|---|---|
| Orb scale (inhale) | Technique × 1000ms | Bezier(0.25, 0.46, 0.45, 0.94) | Light on start | Native thread only |
| Orb scale (exhale) | Technique × 1000ms | Bezier(0.55, 0.055, 0.675, 0.19) | Soft on start | Native thread only |
| Orb pulse ring | 800ms | ease-out | None | Fires once per inhale |
| Phase text swap | 200ms out / 300ms in | ease-in / ease-out | None | 100ms gap between |
| Screen entrance | 380ms | ease-out | None | translateY 16px + opacity |
| Session screen entrance | 600ms | ease-out-expo | None | Shared element expand |
| Session screen exit | 350ms | ease-in-expo | None | Shared element contract |
| Tab switch | 300ms | ease-in-out | Selection | Content crossfade |
| Tab icon press | 300ms | Spring(20, 200) | Selection | Scale bounce |
| Bottom sheet open | 420ms | Bezier(0.16, 1, 0.3, 1) | None | Backdrop 0→0.7 |
| Bottom sheet drag | Real-time | Physics | Selection per 10% | Drag resistance |
| Streak day fill | 400ms | ease-out | None | scaleY from bottom |
| Streak sparkle | 400ms | ease-out | None | 4 particles |
| Streak number count | 600ms | ease-out | None | withTiming numeric |
| Milestone Lottie | 1500ms | Internal | Success | LottieFiles JSON |
| Session complete wipe | 600ms | ease-in-out | None | Radial from center |
| Completion stats count | 800ms | ease-out | Success at end | Stagger 200ms |
| Social card entrance | 400ms | ease-out | None | Glass card slides up |
| Sound icon (activate) | 200ms | ease-out | Selection | Opacity + ring fill |
| Sound ring drag | Real-time | Native | Selection per 10% | Arc fill |
| Sound volume fade out (timer) | 120,000ms | Linear | None | 2-minute fade at sleep |
| Morning greeting stagger | 80ms per word | ease-out | None | Words appear sequentially |
| Onboarding option stagger | 80ms per option | ease-out | Light on select | Bottom-to-top reveal |
| Onboarding selection fill | 200ms | ease-out | Light | Bar fills left-to-right |
| Shimmer skeleton | 1500ms loop | Linear | None | Left-to-right sweep |
| Error toast entrance | 300ms | ease-out | Error | Auto-dismiss 4s |
| Error toast exit | 250ms | ease-in | None | Slides down + fade |
| Background gradient (time) | 2000ms on open | ease-in-out | None | interpolateColor |
| Particle drift | ∞ | Constant | None | 0.3–0.8 px/s random |

***

## Conclusion: The Competitive Animation Moat

The competitive analysis reveals that this is not a space with technically superior animation — it is a space with **either beautiful passive motion (backgrounds) or absent reward motion (completions)**. Calm has gorgeous clouds but silent achievements. Headspace has an animated brand identity but a static product. Breathwrk has a functional circle but an emotionally flat one.

The differentiation is not complexity — it is intentionality. A Lottie confetti burst on session complete costs one line of code but earns the reward signal every habit loop depends on. A 5-layer breathing orb with Reanimated costs 3 days of development but generates millions of TikTok views. Haptic feedback synced to breath phases costs zero additional code and makes the app feel like it's breathing with you.

Build this animation system from Day 1. Do not ship an MVP with placeholder animations and plan to "add polish later." Animation quality is brand quality in a wellness app. Users who open this app at 11 PM with anxiety are deciding in the first 30 seconds whether this product will help them tonight. The animation system described here answers that question before they breathe a single breath.

---

## References

1. [Calm App UI Animation - Dmitry Lauretsky - Dribbble](https://dribbble.com/shots/14235062-Calm-App-UI-Animation) - This UI animation shows the flow of a guided meditation playlist selection on the For You screen and...

2. [Calm UX/UI Design Review: The Good, The Bad, and ... - YouTube](https://www.youtube.com/watch?v=dSvLEl6UJa8) - In this review, I analyze Calm, one of the leading meditation and sleep apps, examining every touchp...

3. [Why Users Are Moving Away from Calm & Headspace - RelaxFrens](https://www.relaxfrens.com/blog/why-users-moving-away-from-calm-headspace-missing-personalization) - Discover why users are leaving Calm and Headspace. Learn how lack of personalization, repetitive con...

4. [Headspace: Brand Analysis](https://www.duaa.design/headspace) - I look for micro-animations in every app now. From Facebook's bell icon to Uber's little cars, micro...

5. [Headspace animations - chrismarkland](https://chrismarkland.com/Headspace-animations) - A series of animations to support users on their meditation journey. We wanted to break down certain...

6. [Not happy with the new app & direction](https://www.reddit.com/r/Headspace/comments/1nt9b3l/not_happy_with_the_new_app_direction/) - Not happy with the new app & direction

7. [Headspace keeps getting worse and worse](https://www.reddit.com/r/Headspace/comments/1nq1qq7/headspace_keeps_getting_worse_and_worse/) - Headspace keeps getting worse and worse

8. [Breathwrk Review 2024: Pros & Cons, Cost, & Who It's Right For](https://www.choosingtherapy.com/breathwrk-app-review/) - Some negative reviews reported bugs with buttons not functioning, notifications stopping, and glitch...

9. [Recensies: Breathwrk: Breathing Exercises - AppWereld](https://www.appwereld.nl/app/breathwrk-breathing-exercises/1481804500/reviews/) - Lees de meningen van gebruikers over Breathwrk: Breathing Exercises uitgegeven door Peloton Interact...

10. [‎Breathwrk: Breathing Exercises - Ratings & Reviews - App Store](https://apps.apple.com/us/app/breathwrk-breathing-exercises/id1481804500?see-all=reviews&platform=iphone) - Scam. 12/10/2025. Spiderisms. DO NOT DOWNLOAD!! DO NOT BUY!! STAY FAR AWAY!! THIS APP IS A MONEY-HUN...

11. [Build a Mindful Breathing App with React Native and Reanimated](https://www.wellally.tech/blog/build-breathing-app-react-native-reanimated-tutorial) - Smooth breathing animations that run on the UI thread. React Native Reanimated for 60fps circles, se...

12. [Optimizing animations for 60 FPS with React Native Reanimated](https://dev.to/malik_chohra/optimizing-animations-for-60-fps-with-react-native-reanimatedoptimizing-animations-for-60-fps-with-1beh) - If you feel like you need to animate the layout, stop and rethink the design. The animation is proba...

13. [Your First Animation | React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/your-first-animation/) - Your First Animation. In this section, we'll guide you through the basic concepts of Reanimated. If ...

14. [React Native Breath In/Out Animation](https://gist.github.com/cagils/3f00c1cff5ff429bdb4d1acee91bcc5e) - React Native Breath In/Out Animation. GitHub Gist: instantly share code, notes, and snippets.

15. [2025 Guide to Haptics: Enhancing Mobile UX with Tactile ...](https://saropa-contacts.medium.com/2025-guide-to-haptics-enhancing-mobile-ux-with-tactile-feedback-676dd5937774) - Go beyond simple vibration. This guide provides best practices for leveraging sophisticated haptics ...

16. [How to Implement Effective Haptic Feedback in Mobile Apps - LinkedIn](https://www.linkedin.com/posts/amirhoseinkarimi_hapticfeedback-uxdesign-mobileapps-activity-7372636284684558336-QVpH) - Haptic Feedback in Mobile Apps: It's the technology that makes digital buttons and on-screen actions...

17. [How Designers and Developers can use Shared Element Transitions to Improve UX](https://sep.com/blog/shared-element-transitions/) - Learn to design and build shared element transitions on iOS, Android, and the web for a better navig...

18. [Delightful UI Animations With Shared Element Transitions API (Part 1)](https://www.smashingmagazine.com/2022/10/ui-animations-shared-element-transitions-api-part1/) - Shared Element Transitions API is a game-changing feature that will enable us to create impressive a...

19. [How Top AI Tools Onboard New Users in 2025](https://www.growthmates.news/p/how-top-ai-tools-onboard-new-users) - How Top AI Tools Onboard New Users in 2025. UX analysis and insights for 10 AI tools like Elevenlabs...

20. [Reward Badge Confetti Animations - Free Download in GIF, Lottie ...](https://iconscout.com/lottie-animations/reward-badge-confetti) - Free Download Reward Badge Confetti Animations in GIF, static SVG, JSON for Lottie, AEP or MP4 forma...

21. [Free Customizable Badge Animations - LottieFiles](https://lottiefiles.com/free-animations/badge) - Explore free Customizable Badge animations at LottieFiles. Download in GIF, MP4, and Lottie JSON to ...

22. [Free Animated Checkmark with Confetti Animation by Nattu Adnan](https://lottiefiles.com/free-animation/animated-checkmark-with-confetti-zOhZc4gVJk) - Animated Checkmark with Confetti animation designed in Figma and Exported to Lottie with LottieFiles...

23. [Airbnb's Lottie: After Effects Animations and React Native](https://www.fullstack.com/labs/resources/blog/airbnbs-lottie-after-effects-animations-and-react-native) - Animate React Native Apps with Lottie, Learn to set up, install & integrate Lottie animations for en...

24. [lottie-react-native](https://www.npmjs.com/package/lottie-react-native) - React Native bindings for Lottie. Latest version: 7.3.4, last published: 16 days ago. Start using lo...

25. [What is Glassmorphism? The Transparent Trend Defining 2025 UI ...](https://www.atvoid.com/blog/what-is-glassmorphism-the-transparent-trend-defining-2025-ui-design) - Discover Glassmorphism in 2025 UI design. Learn key elements, pros, cons, and implementation tips.

26. [10 Mind-Blowing Glassmorphism Examples For 2026](https://onyx8agency.com/blog/glassmorphism-inspiring-examples/) - Glassmorphism is a design technique that creates a glass-like appearance using see-through elements....

27. [App opening animation - slowing down the user experience.](https://www.reddit.com/r/EightSleep/comments/1pos3jv/app_opening_animation_slowing_down_the_user/) - Whose bright idea was it to add a 'cool' animation to the app? Now it takes even longer to get in to...

28. [React Native Skeleton Loaders: Elevate Your App's UX ...](https://medium.com/@andrew.chester/react-native-skeleton-loaders-elevate-your-apps-ux-with-shimmering-placeholders-5003b9507117) - Skeleton loaders are the shimmering placeholders you see in apps like YouTube, Twitter, or Notion, c...

29. [Skeleton Screens 101 - NN/G](https://www.nngroup.com/articles/skeleton-screens/) - A skeleton screen is a design pattern used to indicate that a page is loading while providing users ...

30. [Motion Matters: How Animation Elevates UX in 2025](https://medium.com/design-bootcamp/motion-matters-how-animation-elevates-ux-in-2025-b181adca68a9) - Motion is no longer just a decorative flourish it’s a vital ingredient in modern UX design. When use...

