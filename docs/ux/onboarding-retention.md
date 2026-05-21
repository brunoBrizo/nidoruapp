# Onboarding and Retention

Related docs:

- Use [Onboarding Flow Screen-by-Screen](onboarding-flow-screen-by-screen.md) for exact screens and sequence.
- Use [Notification Strategy](notification-strategy.md) for permission timing and push rules.
- Use [Habit Loop Architecture](../product/habit-loop-architecture.md) for retention mechanics.
- Use [Technical Foundation](../architecture/technical-foundation.md) for local-first first-session requirements.

## First 60 Seconds

The first session should demonstrate value before collecting data. Everything else waits.

The current screen-by-screen source is [Onboarding Flow Screen-by-Screen](onboarding-flow-screen-by-screen.md). It incorporates the newer competitor UI/UX report.

### Screen 1: Splash

Dark background, resting orb, app name. No spinner.

### Screen 2: Breath Demo

The first interaction is a 30-second guided breath with the orb. No questions, no account, no permission, no paywall.

### Screen 3: First Full Session

Start a short default first full session immediately after the breath demo. The user can complete this session without answering questions, creating an account, accepting permissions, or seeing a paywall.

### Screen 4: Reflection

Ask "How do you feel?" with three options:

- Same.
- Better.
- Much better.

### Screens 5-9: Personalization

Ask no more than five questions:

- Goal.
- Sleep baseline.
- Wind-down time.
- Breathwork familiarity.
- Optional name.

### Screen 10: Plan

Show one prebuilt plan mapped to answers with one start button.

### Screen 11: Account And Paywall

After the first full session:

- Offer account linking with social login.
- Show paywall only after the reward moment if the current experiment includes paywall.

## What Must Not Happen In First Session

- No account creation.
- No notification permission prompt.
- No health permission prompt.
- No microphone permission prompt.
- No paywall.
- No personalization survey before the first full session.
- No tutorial carousel.
- No content library browsing requirement.

## Night Mode Behavior

If system time is after 8 PM, default to night-friendly presentation:

- Dark background.
- Low contrast glow or soft motion.
- No bright modal surfaces.
- Large start target.
- Minimal text.

This should be a presentation default, not a separate user decision during onboarding.

## Evening Habit Loop

1. Optional Evening Anchor notification in the user's wind-down window.
2. One tap starts wind-down.
3. Breath session runs with visual, audio, and haptic cues.
4. Body cue plays.
5. Ambient sound continues.
6. App records completion and updates streak state.

## Morning Habit Loop

1. User opens app.
2. User gives a 1-5 sleep rating.
3. User chooses one mood or energy tag.
4. App offers one morning breath option.
5. History updates.
6. After enough nights, an insight card appears.

## Smart Notifications

Use [Notification Strategy](notification-strategy.md) for the current default push rules.

Default push types are limited to Evening Anchor, Streak Milestone, and one-time Re-engagement. Morning check-ins and insight-ready prompts are in-app by default.

## Compassionate Streak

State model:

- Active: user completed the expected daily loop.
- Paused: user missed a day, but streak does not reset.
- Comeback: user returns after one or more missed days.

Display rules:

- Celebrate total sessions and total minutes.
- Do not turn missed days into red failure states.
- Show comeback as progress, not repair.
- Weekly summary should emphasize completed sessions, not only consecutive days.

## 3 AM Recovery Mode

The blueprint repeatedly points to users who wake during the night. This mode should be designed differently from normal browsing.

Behavior:

- One obvious action.
- Lowest brightness presentation.
- No typing.
- No account or paywall prompts.
- No analytics-heavy reflection.
- Immediate audio or haptic-guided breathing.

The MVP version reuses Rescue Me.

## UX Quality Bar

- All core controls must be reachable with one hand.
- All session cues must work without watching the screen.
- End-of-session save must happen before share prompts, animations, or upsell.
- The ambient sound timer must be understandable without reading help text.
- The user should always know whether audio will stop, fade, or continue.
