# Nidoru Design Tool Brief

Use this file as the source prompt for an AI design tool. It is synthesized from the product, UX, research, design-system, and animation docs in this repo. Do not use the existing files under `docs/design/screens/` as references.

## Source Priority

Use these sources in this order when decisions conflict:

1. `docs/product-bible-index.md`
2. `docs/research/competitor-uiux-response-plan.md`
3. `docs/design/design-system.md`
4. `docs/design/motion-animation-haptics.md`
5. `docs/design/breathing-orb-implementation-spec.md`
6. `docs/ux/onboarding-flow-screen-by-screen.md`
7. `docs/ux/navigation-architecture.md`
8. `docs/ux/onboarding-retention.md`
9. `docs/ux/notification-strategy.md`
10. `docs/product/product-strategy.md`
11. `docs/product/mvp-scope-and-roadmap.md`
12. `docs/product/feature-deep-specs.md`
13. `docs/engineering/animation-source-alignment.md`
14. `docs/engineering/animation-engineering-index.md`

## Product Frame

Design a mobile sleep and breathwork app called Nidoru. The product is not a meditation library, sleep tracker, clinical CBT-I tool, social network, or course platform. It is a practical nightly ritual app:

> Start breathing in under 60 seconds, wind down without scrolling, and learn which nightly habits actually help.

The competitive white space is the simplest sleep and breathwork app that still feels context-aware from Day 1. The design moat is trust: one useful action, no content overload, no account before value, no paywall before value, quiet notifications, clear billing, local-first session reliability, and compassionate progress.

Every screen should pass two tests:

- Can this be understood in a 15-second screen recording?
- Does this feel like relief within 60 seconds of first use?

## Design Direction

The app should feel like a quiet nocturnal atmosphere, not a startup dashboard and not a marketing landing page. The strongest visual metaphor is a living night sky: dark indigo depth, soft violet light, glass surfaces, slow motion, and a breathing orb that feels alive.

Mood:

- Calm
- Safe
- Intimate
- Spacious
- Premium but not cold
- Context-aware but not overly clever
- Supportive without guilt

Avoid:

- Bright surfaces at night
- Pure black backgrounds
- Pure white text
- Red badges
- Multiple competing CTAs
- Large content grids on Home
- Marketing copy
- Medical claims
- Heavy illustration systems
- Playful bounce or cartoon motion
- Streak shame
- Upsell banners before value

## Platform And Canvas

Design for a native mobile app first.

- Primary frame: iPhone-sized mobile viewport around 390 x 844.
- Respect safe areas and bottom home indicator.
- Use one-handed reach as a layout constraint.
- Primary controls must have at least a 40 x 40 px hit area.
- Keep the main content width compact and intimate.
- Use a fixed bottom tab bar after onboarding.
- Do not design a web landing page.

## Visual System

### Color

Default theme is dark night mode.

| Role                 | Name          | Hex       | Usage                                      |
| -------------------- | ------------- | --------- | ------------------------------------------ |
| Background           | Void          | `#0D0F1A` | Main night background                      |
| Secondary background | Midnight Blue | `#0F1230` | Depth behind glass surfaces                |
| Surface              | Deep Ink      | `#14172B` | Cards, sheets, modals                      |
| Surface raised       | Midnight      | `#1C2040` | Elevated cards and selected states         |
| Primary              | Iris          | `#7C6FCD` | Primary buttons, active icons, orb core    |
| Primary glow         | Lavender      | `#A89CE0` | Orb glow, progress rings, subtle gradients |
| Accent               | Moonstone     | `#5EC4D4` | Success, highlights, streak rings          |
| Morning accent       | Dusk Gold     | `#E8C97A` | Morning mode and achievement warmth        |
| Text primary         | Cloud         | `#EEF0FF` | Headings and main text                     |
| Text secondary       | Mist          | `#8A8FA8` | Supporting text, labels, hints             |
| Text tertiary        | Haze          | `#4A4E6A` | Inactive icons and placeholders            |
| Danger               | Ember         | `#FF6B6B` | Errors and Rescue Me only                  |
| Divider              | Divider       | `#1E2236` | Subtle separators                          |

Rules:

- Use the 60-30-10 ratio: 60% dark background, 30% muted surfaces/text, 10% Iris/Lavender accent.
- Do not flood screens with purple.
- Do not use pure white text or pure black backgrounds.
- Reserve Ember for true errors and Rescue Me. Do not use red for badges or streak pressure.
- Morning mode may use Dusk Gold, but it should still feel soft and low stimulation.

### Typography

Use:

- Primary font: Nunito.
- Data font: Inter.

Type scale:

| Role           | Font   | Size | Weight |
| -------------- | ------ | ---- | ------ |
| Display        | Nunito | 32   | 800    |
| H1             | Nunito | 24   | 700    |
| H2             | Nunito | 20   | 600    |
| H3             | Nunito | 17   | 600    |
| Body large     | Nunito | 16   | 400    |
| Body           | Nunito | 15   | 400    |
| Label          | Nunito | 13   | 600    |
| Caption        | Inter  | 12   | 400    |
| Timer or score | Inter  | 48+  | 300    |

Rules:

- Keep letter spacing at 0.
- Never use more than two font families.
- Never let body text drop below 14 px.
- Use Inter for timers, duration, countdowns, streak numbers, and other numeric data.
- Use clear, short, human copy. Avoid phrases like "start your journey" or "unlock transformation."

### Layout

- Base spacing unit: 8 px.
- Screen horizontal padding: 20 px.
- Card radius: 20 px.
- Standard button radius: 14 px.
- Pill controls: 9999 px.
- Bottom navigation height: about 80 px.
- Primary screens should be vertically stacked, not dense grids.
- Home should show one right-now action, not a library.
- Do not nest cards inside cards.

### Surfaces

Use glass selectively:

- Primary Action Card
- Quick action chips
- Session-complete overlay
- Sleep insight card
- Important bottom sheets

Glass style:

- Dark translucent surface over the background gradient.
- 20 px radius for cards.
- 1 px low-opacity white edge.
- Soft internal highlight.
- Blur only when it sits over a meaningful background. If blur cannot be represented, use solid Deep Ink or Midnight.

Do not make every section a glass card. The atmosphere should come from restraint.

## Component Direction

### Breathing Orb

The breathing orb is the visual center of the product. It must communicate the app's value in a short screen recording.

Design as layered light:

- Core Iris circle.
- Inner glow.
- Outer diffusion ring.
- Pulse ring that expands and fades on inhale.
- Optional outer atmosphere ring.

States:

- Inhale: layers expand with ease-in-out motion.
- Hold: orb stays expanded with subtle shimmer.
- Exhale: layers contract smoothly and feel slower than inhale.
- Phase text: "Inhale", "Hold", "Exhale" fades, never abruptly swaps.

Static design tools should show at least rest, inhale, hold, and exhale frames.

### Home Primary Action Card

Home exists to answer: what should I do right now?

The card changes by time of day:

- Morning: short morning breath or check-in.
- Afternoon: midday reset.
- Evening: evening prep.
- Night: wind-down flow.
- Late night: Rescue Me.

Card requirements:

- One primary CTA only.
- One tap starts the recommended action.
- Show duration and technique or flow summary.
- Do not show a content library.
- Do not show upsell banners.

### Quick Actions

Three persistent Home shortcuts:

- Rescue Me
- Sounds
- Breathe

Rules:

- Use icon plus label.
- Keep them visible and easy to tap.
- Rescue Me must feel immediate, not dramatic.
- Do not add more than three quick actions to Home.

### Bottom Navigation

Use five fixed tabs:

1. Home
2. Sleep
3. Breathe
4. Progress
5. Profile

Rules:

- Use Lucide-style line icons.
- Always pair icon and label.
- Active color: Iris.
- Inactive color: Haze.
- Never rename or reorder tabs casually.

### Sound Mixer

The mixer should feel like building a personal sleep environment.

Design:

- 2-column sound card grid.
- Sound cards have subtle animated icon direction.
- Active sounds show a circular volume ring.
- Inactive sounds are muted and low contrast.
- Persistent mixer strip at bottom shows active layers and timer.
- Timer presets: 20, 30, 45, 60, infinity.
- "Save Mix" is present but not more prominent than playback.

Do not make the mixer feel like a pro audio tool. It should be tactile and simple.

### Morning Check-In

One screen. No scrolling.

Content:

- Greeting.
- Sleep rating from 1 to 5.
- One mood or energy tag.
- Suggested 2-3 minute morning breath.
- "Skip for now" is visible and guilt-free.

The check-in should take less than 30 seconds.

### Compassionate Progress

Progress must not shame users.

Use:

- Total sessions.
- Total breath minutes.
- Weekly summary.
- Paused streak state.
- Comeback moment.
- Small horizontal week strip.

Avoid:

- Red missed days.
- "You broke your streak."
- Large failure states.
- Notifications that mention missed days.

### Profile, Billing, And Support

Profile is where users expect account, subscription, notifications, sound preferences, privacy, and support.

Trust rules:

- Cancel subscription must be reachable in three taps or fewer.
- Annual total price must be visible when annual plan is shown.
- Refund and renewal language must be clear.
- Support should feel human and reachable.

## Required Screen Set

Generate a coherent high-fidelity mobile flow with these screens. Do not use the old screenshots.

### 1. Splash

- Dark night background.
- Resting orb.
- App name.
- No spinner.
- Should feel instant and calm.

### 2. First Breath Demo

- First interaction is a 30-second guided breath.
- Show orb with "Breathe in with us" and "And out" states.
- No account, no paywall, no permissions, no questions.

### 3. First Full Session

- Start immediately after the breath demo.
- Use a short default session.
- Full-screen breathing orb.
- Minimal text.
- Technique and duration visible but quiet.
- Audio/haptic state visible without clutter.
- No navigation bar while active.
- No account, paywall, permissions, or questions.

### 4. Post-Session Reflection

- Ask "How do you feel?"
- Use three options: Same, Better, Much better.
- Keep the reward moment quiet and non-salesy.

### 5. Personalization Questions

Design one representative question screen and define the system for the rest.

Questions:

- What brings you here?
- How do you sleep most nights?
- When do you usually wind down?
- Have you tried breathwork before?
- What should we call you?

Rules:

- Five questions maximum.
- No more than three options unless it is a time picker.
- Use step count.
- No unnecessary typing.

### 6. Personalized Plan

- Show one plan mapped from answers.
- One sentence explaining the plan.
- One primary CTA: "Let's start."
- No paywall.

### 7. Home

Design the Night or Evening version first.

Content order:

1. Greeting and subtle streak cue.
2. Primary Action Card.
3. Quick actions: Rescue Me, Sounds, Breathe.
4. Sleep check-in or last-night summary.
5. Quiet progress strip.
6. Bottom navigation.

Home must have exactly one primary CTA.

### 8. Rescue Me

- One tap from Home.
- Immediate 4-7-8 breathing.
- Lowest-brightness presentation.
- No menus.
- No account.
- No network.
- No paywall.
- Reassurance appears only after two breath cycles.

### 9. Evening Wind-Down

- Starts from Home in one tap, two taps maximum.
- Sequence: breathwork, short body relaxation cue, ambient sound.
- The screen should dim after active breathwork.
- The user should understand whether audio will stop, fade, or continue.

### 10. Sound Mixer

- 2-column sound cards.
- Active layers and volumes visible.
- Timer selector visible.
- Save Mix secondary.
- Offline base sounds should feel available, not loading.

### 11. Morning Check-In

- Single screen.
- Sleep rating.
- Mood or energy tags.
- Suggested short breath.
- Skip for now.

### 12. Progress

- Compassionate streak.
- Weekly summary.
- Total sessions and minutes.
- Missed days are paused, not failed.
- Use Inter for numeric metrics.

### 13. Profile

- Settings.
- Subscription.
- Notifications.
- Sound preferences.
- Privacy.
- Support.
- Make cancellation and support easy to find.

## Motion Notes For Static Design

Even if the design tool outputs static screens, define motion in component notes:

- Default content entrance: 400 ms fade plus gentle upward motion.
- Exit: 300 ms fade.
- Screen transitions should feel like a curtain, not a hard cut.
- Orb inhale and exhale follow breath technique timing.
- Phase text crossfades.
- Tab active indicator slides softly.
- Bottom sheets rise over 420 ms.
- Sound volume fades out over the final 2 minutes of the timer.
- Avoid bouncy springs.
- Avoid fast particles.
- Avoid generic spinners.

Reduce Motion state:

- Keep the core breathing scale cue.
- Remove decorative particles and pulse rings.
- Use opacity-only screen transitions.
- Replace celebration motion with a static badge fade.

## Copy Voice

Voice should sound like a trusted friend, not a wellness brand.

Use:

- "Take 4 minutes tonight."
- "Your wind-down is ready."
- "Welcome back. Let's start fresh."
- "Sleep sounds are here whenever you need them. No pressure."
- "That took 30 seconds. Imagine 4 minutes."

Avoid:

- "Start your journey."
- "Unlock your potential."
- "Transform your sleep forever."
- "Do not break your streak."
- "Limited time offer."
- "You missed yesterday."

## AI Design Tool Prompt

Paste this prompt into the design tool if it only accepts one instruction block:

```text
Design a high-fidelity native mobile app for Nidoru, a sleep and breathwork ritual app. Ignore any old screenshots or files under docs/design/screens. The app must feel like a calm nocturnal atmosphere: deep indigo background, soft violet light, glass surfaces used sparingly, rounded Nunito typography, Inter for numeric data, and a layered breathing orb as the visual centerpiece.

Design for an iPhone-sized mobile viewport around 390 x 844 with safe areas and one-handed use. Default to dark night mode. Use these colors: background #0D0F1A, secondary background #0F1230, surface #14172B, raised surface #1C2040, primary Iris #7C6FCD, glow Lavender #A89CE0, accent Moonstone #5EC4D4, morning Dusk Gold #E8C97A, text Cloud #EEF0FF, secondary text Mist #8A8FA8, tertiary Haze #4A4E6A, danger Ember #FF6B6B only for errors and Rescue Me. Do not use pure black, pure white, red badges, content overload, marketing copy, or multiple primary CTAs.

Create a coherent screen set: Splash, 30-second first breath demo, first full breathing session, post-session reflection, one personalization question, personalized plan, Home evening/night state, Rescue Me, Evening Wind-Down, Sound Mixer, Morning Check-In, Progress, and Profile. Home must show exactly one primary action card, then three quick actions: Rescue Me, Sounds, Breathe. Use five fixed bottom tabs: Home, Sleep, Breathe, Progress, Profile. The first launch flow must show breathing and allow the first full session before account creation, paywall, notification permission, health permission, questions, or any backend dependency.

The core components are a layered breathing orb, glass primary action card, quick action chips, bottom tab bar, sound mixer cards with circular volume rings, timer selector, compassionate streak strip, and simple profile/settings rows. The breathing orb should have rest, inhale, hold, and exhale states. The sound mixer should feel tactile and personal, not technical. Progress should celebrate sessions and minutes without shame. Profile should make subscription, cancellation, privacy, notifications, and support easy to find.

The visual mood is quiet, safe, intimate, premium, and low-stimulation. Use spacious layouts, 20 px horizontal padding, 8 px spacing rhythm, 20 px card radii, 14 px button radii, pill controls where appropriate, and at least 40 x 40 px touch targets. Keep body text at 14 px or larger. Keep letter spacing at 0. Use short human copy such as "Take 4 minutes tonight", "Your wind-down is ready", "Welcome back. Let's start fresh", and "That took 30 seconds. Imagine 4 minutes."
```

## Review Checklist

Before accepting a generated design, check:

- Old screenshots were not copied.
- Home has one primary CTA.
- First breath happens before account, paywall, notification, health, or microphone permission.
- Rescue Me is visible from Home and feels immediate.
- Home is not a content library.
- Five tabs are Home, Sleep, Breathe, Progress, Profile.
- Text is readable in a dark room without pure white.
- Purple is restrained.
- Ember is not used as a badge or decoration.
- Streaks are compassionate.
- Billing/support entry points are easy to find.
- Sound mixer has per-layer volume and clear timer behavior.
- Orb is the visual centerpiece.
- Motion notes avoid snappy, bouncy, or decorative motion.
- Reduce Motion behavior is specified.
- All tap targets appear at least 40 x 40 px.
- The result feels like relief, not productivity software.
