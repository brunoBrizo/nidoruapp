# Product Strategy

Related docs:

- Use [MVP Scope and Roadmap](mvp-scope-and-roadmap.md) for what ships first.
- Use [Feature Deep Specs](feature-deep-specs.md) for implementation-level product behavior.
- Use [User and Market Insights](../research/user-and-market-insights.md) for the customer pain behind the strategy.
- Use [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md) for competitor-informed decisions.
- Use [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md) for Nidoru metadata, pricing, and acquisition strategy.

## Positioning

This app should own the category of sleep ritual: what someone does before bed to calm down and what they do in the morning to understand what helped.

It should not position itself as:

- A meditation platform. Calm and Headspace already own that frame.
- A sleep tracker. Users already complain that trackers explain the problem without helping solve it.
- A clinical CBT-I product. That creates complexity, regulatory risk, and expectations the MVP cannot safely meet.

The core promise is practical and immediate:

> Start breathing in under 60 seconds, wind down without scrolling, and learn which nightly habits actually help.

## Competitive UX Moat

The competitor UI/UX intelligence report sharpens the positioning:

> Be the only app that is both extremely simple and context-aware from Day 1.

The design moat is trust. The app earns it by showing one right-now action instead of a content library, letting the user breathe before any capture, staying quiet unless a reminder is genuinely useful, making billing and cancellation unusually clear, and preserving session/streak state even if the app crashes at the worst moment.

## Core Product Thesis

The market gap is not "more sleep content." The gap is a simple, trustworthy nightly flow that combines:

- Breathwork that works without watching the screen.
- Ambient audio that keeps playing offline and fades out cleanly.
- A bedtime routine that reduces choice instead of adding it.
- Morning reflection that becomes useful insight after repeated use.
- Honest pricing that avoids billing backlash and subscription anxiety.

The two core breathing jobs stay distinct:

- Rescue Me is the emergency off switch: one tap into 4-7-8 breathing, with no choices or setup.
- Coherent Breathing is regular practice: a 10-minute Daily Calm / HRV Training session for evening wind-down or daily resilience building.

## Current Product Bible Principle

The complete product bible adds a stricter product filter:

> Every feature must be demonstrable in 15 seconds on TikTok and feel like relief within 60 seconds of first use.

Use this as the default tie-breaker for product decisions. Features that fail both tests should be deferred or removed unless there is a clear infrastructure, safety, compliance, or retention reason to keep them.

## Product Principles

1. Time to first breath beats feature count.
   The app has failed if a new user cannot feel value in the first minute.

2. Bedtime UX should reduce screen interaction.
   Audio, haptics, dimming, and one-tap starts matter more than rich navigation at night.

3. Name breathing techniques by technique.
   Use names like 4-7-8, box breathing, coherent breathing, and diaphragmatic breathing. Outcome labels such as Daily Calm or HRV Training can help users choose, but the technique name remains visible.

4. Make streaks compassionate.
   Missed days should pause momentum, not punish the user. Celebrate returning.

5. Offline playback is a core trust feature.
   Downloads that fail are a known competitor complaint. Ambient sound and core breath cues should not depend on a perfect network connection.

6. No account, paywall, or permissions before value.
   The first launch path starts with breathing and can complete a first full session before personalization. Ask for personalization, account creation, and paid conversion after the first completed session. Ask for notification permission on Day 3 after at least two completed sessions.

7. No clinical overclaiming.
   The app can be science-informed without promising to treat insomnia, anxiety, or medical conditions.

## Launch Success Metrics

Use these as the first product gates:

| Metric | Target |
| --- | --- |
| Time to first breath | 60 seconds or less |
| Taps from home to evening wind-down | 1 tap preferred, 2 taps maximum |
| First session completion | 70% or higher for users who start onboarding |
| Day 1 return | Strong enough to compare onboarding variants; exact target should be set after baseline |
| 7-day loop completion | Track users who complete evening wind-down plus morning check-in |
| Crash-free session completion | Near 100% for breathwork session end, because streak loss is a competitor pain point |
| Offline playback success | Ambient sound continues when the device is locked and network is unavailable |

## Primary Loops

### Evening Loop

1. Notification or home action starts wind-down.
2. User completes 3-5 minutes of breathwork.
3. App transitions into 2 minutes of body relaxation cue.
4. Ambient sound continues with dimmed or locked screen.
5. Session is recorded without needing the user to do more.

### Morning Loop

1. User opens the app.
2. App asks for sleep rating from 1 to 5.
3. App asks for one mood or energy tag.
4. App offers one short morning breath session.
5. History and streak update without punishment.

## Non-Goals For V1

- No microphone-based sleep tracking.
- No AI therapist, chatbot, or coaching claims.
- No community feed.
- No full CBT-I program.
- No wearable companion app.
- No large course library.
- No forced account creation before first use.

## Decision Bias

When two product choices are close, choose the one that:

- Gets the user breathing faster.
- Keeps the phone out of their hands at night.
- Reduces the number of choices.
- Can be verified with local product analytics.
- Does not create medical, privacy, or trust risk.
