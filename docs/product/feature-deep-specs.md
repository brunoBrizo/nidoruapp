## Part 2: Feature-by-Feature Deep Specification

Related docs:

- Use [Product Bible Index](../product-bible-index.md) to navigate the full product bible split.
- Use [MVP Scope and Roadmap](mvp-scope-and-roadmap.md) for launch priority and deferrals.
- Use [Design System](../design/design-system.md) for colors, typography, spacing, and visual rules.
- Use [Motion, Animation, And Haptics](../design/motion-animation-haptics.md) and [Animation Engineering Index](../engineering/animation-engineering-index.md) for animation implementation details.
- Use [Navigation Architecture](../ux/navigation-architecture.md), [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md), and [Notification Strategy](../ux/notification-strategy.md) for flow-specific product rules.
- Use [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md) before turning any technique, sound, insight, HRV, anxiety, panic, sleep-improvement, or nervous-system claim into product copy.

Every feature below is described at implementation level: what it does, what it looks like, what it must NOT do, how it earns its place in the app, and what makes it different from competitors.

***

### Feature 1: The Breathing Visual Pacer

**What it is:** An animated circle (orb) that expands and contracts in real time to guide the user's breath. The single most important feature in the entire product.

**Why it matters:** This is what goes viral on TikTok. The animated orb in a 15-second screen recording looks hypnotic and immediately communicates "this app helps you breathe." Users who see this in a TikTok video comment "What app is this?" before they've even started breathing. The orb IS the product, visually.

**The animation mechanics in detail:**

The orb is a multi-layered circle system:
- **Layer 1 (core):** Solid filled circle, `Iris #7C6FCD`, scale `1.0 → 1.12`
- **Layer 2 (inner glow):** Soft glow layer, scale `1.0 → 1.18`
- **Layer 3 (mid diffusion):** Middle diffusion layer, scale `1.0 → 1.25`, opacity `0.30 → 0.15`
- **Layer 4 (outer glow):** Outer glow layer, scale `1.0 → 1.35`, opacity `0.15 → 0.08`
- **Layer 5 (pulse ring):** Expands outward and fades on inhale phase only, scale `1.0 → 1.6`, opacity `0.5 → 0`

On inhale: all five layers scale up in sync from the breath phase timer. The scale factor varies per layer to create depth while preserving one timing source.

On hold (if applicable): orb stays at maximum size, pulsing gently at 50% of the breath rate (a subtle shimmer to communicate "stay here")

On exhale: all layers contract smoothly back to rest size. The exhale animation is always *slightly slower* than inhale — this mimics natural breathing and feels more relaxing

**Text overlay inside/below orb:**
- During inhale: "Inhale" in Nunito 16px Semibold, `Mist` color, fades in 200ms before the inhale phase starts
- During hold: "Hold" — same
- During exhale: "Exhale" — same
- The text fades OUT during transitions (crossfade) — never abrupt swap

**Technique catalog and evidence-safe positioning:**

| Name | Pattern | Status | Description | Context |
|------|---------|--------|-------------|---------|
| 4-7-8 Sleep | 4s in / 7s hold / 8s out | MVP | Popular long-exhale cadence for bedtime relaxation; do not frame as a tranquilizer, insomnia treatment, or guaranteed sleep aid | Before bed |
| Box Breathing | 4s in / 4s hold / 4s out / 4s hold | MVP | Simple square cadence for calm and focus; avoid military, panic-treatment, or anxiety-treatment claims | Calm/focus |
| Coherent Breathing / Daily Calm | 5.5s in / 5.5s out | MVP | Regular 10-minute slow-breathing practice; HRV-oriented language is internal until separately validated for public copy | Evening Wind-Down, Daily Practice |
| Diaphragmatic Breathing | 4s in / 6s out | MVP | Low-risk no-hold stress-reset option and useful fallback for users who dislike breath holds | Stress reset |
| Physiological Sigh | 2s in / 1s in / 8s out | Post-MVP candidate | Double inhale + long exhale; promising short reset candidate, but not a proven sleep or panic-treatment protocol | Acute stress reset |

Hold-based techniques must have a simple safety path before public launch: users can stop, skip holds, or choose a no-hold rhythm if they feel dizzy, breathless, or uncomfortable.

**What competitors get wrong:**
- Breathwrk labels exercises by vague emotion ("Calm," "Focus") not by technique — power users who know what 4-7-8 is can't find it[^12]
- Breathwrk requires screen-watching — no haptic-only mode. The Apple Watch animation shows the fix: haptics alone can replace the visual[^13]
- Most apps don't differentiate the speed feel between inhale and exhale animations — both use linear, making it feel robotic[^14]
- Breathwrk removed beloved visual animations in updates, destroying user trust — **never remove visual features once users depend on them**[^15]

**Audio options for the pacer:**
- None (pure visual + haptic) — default
- Gentle bell on phase transitions
- Soft whoosh sounds (inhale = airy sound, exhale = release sound)
- Nature ambient (rain/forest playing in background, phase audio on top)

**Screen behavior:** When a breathing session is active and the phone screen locks (or the user manually locks it), the session continues. On wake: the orb is in the correct phase position. Haptics keep firing regardless of screen state. This is technically achieved with background audio mode (a silent audio track keeps the app alive) + Expo's `Haptics` in a background task.

***

### Feature 2: Evening Wind-Down Flow

**What it is:** A guided pre-bed ritual that sequences breathwork → audio → (optional) body scan into a single uninterrupted experience. Activated with one tap from the home screen.

**Why it's the anchor feature:** Calm's own data confirmed that sleep-related features are their top retention driver. Users who complete a bedtime ritual consistently have dramatically higher 30-day retention. The goal is to make this so embedded in the user's night that opening the app at 10 PM becomes as automatic as brushing teeth.[^16]

**The complete flow:**

**Step 1: Quick Context Check (10 seconds, optional on first use, remembered after)**
"What's your goal tonight?"
- Fall asleep faster (→ 4-7-8 breath + sleep story + sounds)
- Calm racing thoughts (→ box breathing + body scan + sounds)
- Wake up fewer times (→ Coherent Breathing / Daily Calm + longer ambient audio)

After the first time, the app remembers the last choice and skips this step — one tap goes directly to the session.

**Step 2: Breathing Phase (user-chosen: 3, 5, or 8 minutes)**
The orb. Full screen. Top text: "Let's wind down." Dim ambient sound begins underneath (volume at 20%). No navigation bar. No back button visible (swipe down to exit). The world fades away.

**Step 3: Transition Card (5 seconds)**
Soft fade. The orb dissolves into a night sky visual. Text: "Good. Now let your body relax." Optional "Next: Sleep sounds" or "Next: Body scan" shown as a soft pill button at the bottom. If the user does nothing, it auto-advances after 5 seconds.

**Step 4a: Sleep Sounds Mode**
The mixer screen arrives. Their last used sound mix pre-loaded (remembered from prior sessions). Timer set to 30 minutes by default with a visible fade-out counter. The screen auto-dims to minimum brightness. After 30 seconds of no interaction, the interface fades to fully dark — only the sound plays. Tapping the screen brings it back softly.

**Step 4b: Sleep Story Mode (optional)**
A story from the library begins. The orb becomes a subtle background pattern. The narration is quiet, monotone-adjacent, and deliberately "boring" — descriptive nature walks, slow journeys, peaceful scenes. The story ends at a natural pause and flows into ambient sound automatically.

**Step 4c: Body Scan (optional)**
A 5-minute audio guide slowly drawing attention from toes to head, releasing tension. Gentle voice, no music, very low background ambient. This is aimed at users whose minds feel busy at bedtime; do not frame it as insomnia treatment.

**What competitors get wrong:**
- Every existing app requires multiple taps to get into a session. Calm requires: open app → navigate to Sleep → find Sleep Stories → choose story → tap play = at least 4 taps and 30+ seconds. On the Wind-Down app on the App Store, it's better but still requires choosing content first[^17][^18]
- Apps don't link breathwork and sleep sound playback — they're separate features in different sections. This misses the low-friction sequential bedtime experience.
- The screen stays bright throughout. This is a huge problem: you don't want full brightness UI at 11 PM. The auto-dim behavior is completely absent in current competitors

**Unique details that make this feature differentiated:**
- Phone brightness is automatically reduced to 30% when the session starts (with a permissions prompt on first use)
- "Smart bedtime detection": if the user opens the app for the first time after 9 PM, it defaults to the Wind-Down Flow instead of the home screen
- After the full flow completes, a subtle completion notification is scheduled for the next morning's check-in

***

### Feature 3: Sleep Sound Mixer

**What it is:** An interactive ambient audio experience where users layer multiple sounds and control their volumes individually, with a sleep timer that fades everything out.

**Why it matters more than it sounds:** Sound mixing is the single feature that generates the most "WHAT APP IS THIS?" comments on TikTok. When a creator screen records their mix setup — rain at 80%, brown noise at 60%, fireplace at 40%, adjusting sliders in real time — the result is visually captivating and immediately communicates value. This is the #1 viral feature in the product.[^19]

**The full sound library (16 curated sounds at launch):**

| Category | Sounds |
|----------|--------|
| Rain | Light Rain, Heavy Rain, Rain on Window, Thunderstorm |
| Nature | Ocean Waves, Forest, River Stream, Wind |
| Noise | White Noise, Brown Noise, Pink Noise |
| Environment | Fireplace Crackling, Cafe Ambience, Fan |
| Tones | 432Hz Tone, Delta Wave Binaural (experimental/preference audio, not a premium proof point) |

Each sound: **minimum 4 minutes of audio**, seamlessly looped (zero-cross fade at loop point — this prevents the jarring "click" when audio restarts that plagues cheaper apps). Production quality: recorded in actual environments, not synthesized. This is non-negotiable — users will immediately notice the difference.

**Mixer UI design in detail:**

Layout: A 2-column grid of sound cards. Each card:
- Animated icon (rain drops falling, fire flickering, waves moving) — subtle CSS-like animation that shows the sound is "alive"
- Sound name below the icon in `Label` style
- A circular volume ring around the icon: stroke fills clockwise to show volume level (0–100%)
- Tap once to activate (ring fills to 70% default volume). Tap and drag the ring to adjust volume. Tap active sound to deactivate.
- Active sounds highlighted with `Iris` color accent; inactive: `Haze`

At the bottom, a persistent mixer strip:
- Shows which sounds are active (small icons)
- Sleep timer: `20 / 30 / 45 / 60 / ∞` with a segmented pill selector
- A "Save Mix" button that lets users name their mix (max 3 saved mixes)

**Sleep timer mechanics:**
- Shows countdown in corner: "Fading in 28 min"
- At 2 minutes before fade: volume begins a slow linear fade from current to 0%
- Fade duration: 2 minutes (not sudden cut) — users who are light sleepers hate sudden audio stops
- When audio stops, the player releases any keep-awake or power-management lock so the device can dim and lock naturally.

**Offline behavior:** All 16 base sounds are bundled in the app install after licensing and loop QA clear. Zero network required. This is the most important technical decision for the sound mixer. Competitors require network playback — causing buffer pauses that wake users up. This is mentioned directly in user complaints about Calm.[^20]

**What competitors get wrong:**
- Calm's sound mixer UI is visually decent but doesn't allow fine-grained volume per sound in the same way
- Breathwrk has no ambient sound feature at all — completely missing the sleep use case
- Most apps do not loop cleanly — audible pop at loop point
- Apps require network — offline mode is either broken or nonexistent[^20]

***

### Feature 4: Morning Check-In

**What it is:** A 30-second daily ritual on app open in the morning. Rate last night's sleep (1–5 stars), add a mood tag, and get a morning breathwork suggestion.

**Why it's critical:** It sounds simple but it's the engine that powers the entire personalization layer and the biggest retention mechanic in the app (the Sleep Insight card, described in Feature 8). Without morning check-in data, the app is stateless — it can't learn, can't adapt, can't deliver insights. The design goal is to make this check-in take literally less time than unlocking the phone.

**The complete UX:**

**Morning detection:** The check-in screen appears automatically when the app is opened between 5 AM and 12 PM AND the user hasn't already completed it that day.

**Screen layout (one single screen, no scrolling):**

```
[Good morning, Bruno ☀️]        [15 Apr · Monday]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How did you sleep?

★ ★ ★ ★ ☆   [3 taps to select]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

How do you feel right now?

😴 Groggy    😤 Anxious    😊 Good
😣 Tired     😌 Calm       ⚡ Energized

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Start my morning breath →]   [Skip for now]
```

One tap on a star rating. One tap on a mood. Then the suggestion appears:
- Sleep ≤2 stars: "Try a 3-minute energizing breath to help wake up fully"
- Sleep 3–4 stars: "Start with Daily Calm breathing to balance your day"
- Sleep 5 stars: "Great night! Optional: 2 minutes of focused breathing before work"

The morning breathwork session is always 2–3 minutes maximum. This is a "starter" ritual — not a commitment.

**What makes this feel magical instead of annoying:**

The star rating is fully haptic — each star tap generates a `Light` haptic. Selecting a mood plays a subtle animation (the emoji "bounces" once on tap). The transition to the session is instant — no loading screen. Total time from opening app to first breath: under 10 seconds.

Skipping is always allowed with zero friction. Never guilt a user about skipping. The check-in is never mentioned in push notifications as something they "failed to do" — only framed as an optional positive.

***

### Feature 5: Home Screen Architecture

**What it is:** The primary screen users see every time they open the app. The entire app's value proposition is visible in a single glance.

**Design principle:** The home screen should feel like a trusted companion greeting you, not a content library overwhelming you. Headspace's redesigned home screen is their biggest UX improvement — moving from a grid of courses to a personalized "what should I do today" format.[^1]

**The home screen structure:**

```
────────────────────────────────────────────
   ☽ Good evening, Bruno        [avatar]
   Tonight's suggestion ready
────────────────────────────────────────────

  [PRIMARY ACTION CARD — Full width, 160px high]
  ┌──────────────────────────────────────────┐
  │  🌙  Evening Wind-Down                   │
  │      4-7-8 breathing · 8 min             │
  │                                          │
  │  [Begin Wind-Down]                       │
  └──────────────────────────────────────────┘

────────────────────────────────────────────
  Quick Actions

  [Rescue Me]    [Sound Mixer]   [Free Breathe]
    Settle now     Tonight's       Just the orb
                     sounds

────────────────────────────────────────────
  Your Sleep Streak

  ████████░░  8 days    ⟳ Compassionate

────────────────────────────────────────────
  Last Night: ★★★★☆  6 sessions this week

  [View your insight →]   ↗ This is new!

────────────────────────────────────────────
```

**The "Primary Action Card" logic:**

This card is context-aware and changes based on time of day:
- **5 AM – 12 PM (Morning):** Shows "Morning Breathwork" — 3-minute energizing session
- **12 PM – 5 PM (Afternoon):** Shows "Midday Reset" — box breathing for stress
- **5 PM – 8 PM (Evening):** Shows "Evening Prep" — transition from work mode
- **8 PM – 12 AM (Night):** Shows "Wind-Down Flow" — the full bedtime sequence
- **12 AM – 5 AM (Late Night):** Shows "Rescue Me" — can't sleep, need immediate help

This single behavioral feature makes the app feel alive. Users will notice that "it always shows me what I need right now" — this drives word-of-mouth more than any designed feature.

**What competitors get wrong:**

- Calm's home screen is a content library — dozens of items to scroll through, creating choice paralysis[^18]
- Headspace (pre-rebrand) was heavily course-oriented — forcing users into long programs when they just wanted a 5-minute session
- Neither app adapts to time of day in a meaningful way
- Breathwrk's home shows a grid of breathing techniques — useful for power users but overwhelming for first-timers who just need to be told what to do

***

### Feature 6: Streak System — "Compassionate Tracking"

**What it is:** A habit consistency tracker that celebrates continuity without punishing interruption.

**Why the standard streak model is toxic:**

Research from app retention communities in 2026 is unambiguous: "Streak resets create a black-and-white perception of success: either you're doing great, or you've failed. This can quickly become disheartening." The "days 3–5 dropout problem" — where a massive percentage of habit app users quit — is directly caused by a first streak reset making users feel they've failed and "might as well quit".[^21]

**The Compassionate Streak system:**

- **Active Streak:** Consecutive days of completing at least one session (breathwork or wind-down)
- **Pause (not reset):** Missing a day shows a ⏸ pause icon on that day in the calendar. The streak number freezes — it doesn't drop to zero
- **Resume:** The next session "resumes" the streak. A "Comeback" micro-animation plays — confetti + "Welcome back" message
- **Weekly summary (not daily streak pressure):** Every Monday morning, a summary card: "Last week you completed 5 out of 7 nights. That's your best week so far." Celebrates proportion, not perfection
- **"Ghost mode":** Users can toggle off the streak display entirely if it causes anxiety (the data still records, just not shown)
- **Milestone badges at:** 3, 7, 14, 30, 60, 100, 365 sessions. Badges are permanent and shown in the profile. They don't reset.

**Visual design of the streak calendar:**

A horizontal week strip showing Mon–Sun. Each day:
- Completed: filled circle with gradient (Iris to Lavender)
- Paused: ring with ⏸ inside, `Mist` color
- Future: empty ring, `Haze` color
- Today: ring with white outline accent

The streak number uses `Inter 48px Light` — large, clean, not aggressive.

***

### Feature 7: Rescue Me — Urgent Breathwork Support

**What it is:** A zero-friction "help me settle now" path. One tap → immediate 4-7-8 session. No music choices, no technique selection, no timer setting.

**Why it's the most important retention feature:**

This is the feature that gets shared when a user feels overwhelmed at 2 AM and wants the lowest-friction way to begin a guided breath. Keep the emotional value, but do not imply crisis support, panic treatment, or guaranteed symptom relief.

**Complete UX:**

Home screen bottom row: a red-accented card (the ONLY time the color `Ember #FF6B6B` is used in the entire app). Text: "Rescue Me" with a small support icon. Subtitle: "Overwhelmed right now."

Tap → **immediate full screen transition** (no loading, no animation delay). The orb is already visible before the transition completes. No text. No instructions. The orb begins inhale phase.

After 2 cycles of 4-7-8 breathing, a very subtle overlay fades in at the bottom: "You're doing great. Continue." or "You can stop here." No pressure.

At the end of the session (5 rounds, approximately 3.5 minutes): A soft success screen. "That took courage to start. You completed 5 breath cycles." One option: "Continue with a calming sound" — soft and optional.

**What makes this technically simple:**
- No network calls needed
- No user data required
- No personalization
- Just the orb, haptics, and a fixed 4-7-8 sequence

This is a 1-day engineering build that delivers disproportionate emotional value.

***

### Feature 8: Sleep Insight Card

**What it is:** After 7+ morning check-ins, the app detects patterns in the user's sleep ratings and generates a simple, personalized insight.

**Why this is the highest-retention feature in the entire product:**

This is the "moment of magic" — the first time the user feels the app notices their routine. After a week of 30-second morning check-ins, getting a card that says "Your highest-rated nights often followed wind-down before 10:30 PM" creates an "oh wow" reaction without claiming causation. Users screenshot this. Users share it on Instagram Stories. Users tell their friends.

**The insight types (all derivable from simple data, no ML required):**

| Insight Type | Data Required | Example Output |
|---|---|---|
| Bedtime correlation | Wind-down start time + sleep rating | "Your highest-rated nights often start with wind-down before 10:45 PM" |
| Streak effect | Session streak length + sleep rating | "After 3+ consecutive nights using the app, your check-ins have trended higher" |
| Sound preference | Most used sounds + sleep rating | "Rain sounds appear on more of your higher-rated nights than white noise" |
| Breathing technique impact | Technique used + sleep rating | "Your recent 4-7-8 nights have been rated higher than your recent box-breathing nights" |
| Weekend pattern | Day of week + sleep rating | "Your worst sleep is Sunday to Monday. Try starting wind-down 30 min earlier on Sundays" |
| Session duration effect | Breathing session duration + sleep rating | "Longer breathing sessions (5+ min) correlate with your best sleep nights" |

**UI design:**

The insight is shown as a full-width card on the home screen with a "NEW" badge. A subtle sparkle animation plays on first reveal. The card has:
- A one-line headline (the insight)
- A mini bar chart showing the correlation (two bars: "With X" vs "Without X")
- "See full pattern →" link to a detail screen

The detail screen shows a 14-day timeline graph: sleep ratings as a line, with markers showing session days, sound choices, and timing. Clean, readable, `Inter` font for all numbers.

**What competitors do wrong:**
- Calm tracks usage internally but shows users almost nothing about their own data[^16]
- Headspace shows a "mindful minutes" counter but no sleep-specific insights
- Sleep Cycle gives detailed data but it's overwhelming — graphs, graphs, graphs, with no natural language interpretation
- The right approach is to give users ONE clear insight at a time, in plain English, not a data dashboard

***

### Feature 9: Sleep Stories

**What it is:** Short (8–15 minute) audio narratives designed to bore you to sleep, told in a warm, quiet, neutral voice.

**Why "boring" is the point:**

Sleep stories work by giving a busy mind just enough low-stimulation input to follow, while not being interesting enough to keep you awake. The worst version of this: Calm's celebrity sleep stories. Matthew McConaughey reading a western, Harry Styles describing a trip, LeBron discussing mindfulness — these are engaging, which defeats the purpose. Users want a quiet stranger describing a gentle walk through a forest, not entertainment.[^18]

**Story categories and themes:**

| Category | Example Titles |
|---------|---------------|
| Nature Journey | "A Walk Through the Autumn Forest," "The Quiet Shoreline at Dusk" |
| Slow Travel | "An Afternoon in a Small Italian Town," "Riding the Night Train Through the Alps" |
| Domestic Calm | "The Old Bookshop on a Rainy Afternoon," "A Quiet Sunday Morning at the Cabin" |
| Descriptive Imagery | "The Observatory at 3 AM," "The Empty Library" |
| Repeated Familiar | Stories users can listen to night after night (familiarity aids sleep onset) |

**Production requirements (non-negotiable):**
- Human narrator only — no AI voice synthesis. Users immediately detect AI voices and it destroys trust[^22]
- Recording quality: studio-recorded, -60dB noise floor, natural room tone not dead-dry
- Pacing: noticeably slower than conversational speech — long pauses between sentences (2–3 seconds)
- Voice character: warm, neutral, slightly monotone by design — think "friendly librarian at closing time"
- End behavior: story fades naturally with no "goodbye" or musical sting — flows automatically into ambient sounds

**Technical implementation:** Stories are chunked into 3-minute audio segments and downloaded progressively (first chunk immediate, rest buffered). This prevents the "loading spinner at bedtime" problem.

***

### Feature 10: Free Breathe Mode

**What it is:** The purest form of the breathwork experience — users can set custom inhale/hold/exhale durations and just breathe, with no guidance or tracking.

**For whom:** Power users who already know breathwork. They don't want instructions — they want a beautiful visual pacer they can configure.

**UI:** A minimalist settings panel (bottom sheet) with three controls:
- Inhale: 2–10 seconds (stepper)
- Hold (in): 0–10 seconds (stepper, default 0)
- Exhale: 2–15 seconds (stepper)
- Hold (out): 0–10 seconds (stepper, default 0)
- Duration: 3 / 5 / 10 / 20 minutes / ∞

Then: full screen orb, no text, no timer visible by default (shown only if user taps screen). This is the "screensaver mode" of the app — pure, meditative, beautiful.

Safety rule: custom holds must be optional, bounded, and easy to skip. If a custom pattern feels uncomfortable, the app should make stopping or switching to a no-hold rhythm obvious.

***
