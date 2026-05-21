# Competitor UI/UX Response Plan

Related docs:

- Use [Competitor UI/UX Intelligence Source](competitor-uiux-intelligence-source.md) for the preserved full source.
- Use [Competitor UI/UX Executive Summary](competitor-uiux-executive-summary.md) for the research overview.
- Use [Competitor Anti-Patterns](competitor-anti-patterns.md) for implementation rules.
- Use [Product Strategy](../product/product-strategy.md), [Navigation Architecture](../ux/navigation-architecture.md), [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md), and [Notification Strategy](../ux/notification-strategy.md) for the docs this plan feeds.

This is the actionable layer for [Competitor UI/UX Intelligence Source](competitor-uiux-intelligence-source.md). Use it to decide what to copy, what to avoid, and what we must do better than Calm, Headspace, Breathwrk, BetterSleep, and Insight Timer.

## Positioning Decision

The target white space is:

> The simplest sleep and breathwork app that still feels context-aware from Day 1.

Competitors split the market badly:

- Calm feels polished but generic and content-heavy.
- Headspace had emotional design strength but damaged trust with navigation churn and billing complaints.
- Breathwrk is fast and focused but visually sterile and unreliable at the session-complete moment.
- BetterSleep creates ownership through the mixer but adds complexity and tracker-trust problems.
- Insight Timer earns trust through generosity but overwhelms users with library scale.

The app should win by combining a low-choice home screen, first-value breathing before capture, personal sound ownership, compassionate progress, and unusually clear billing/support.

## Replicate What Works

| Competitor strength | What to replicate | Product expression |
| --- | --- | --- |
| Calm's Daily Calm anticipation | A reason to open that is not only a notification | A daily "right now" card with fresh copy, one recommended action, and later a daily reflection prompt. |
| Calm's ambient backgrounds | Slow, non-demanding background life | Night gradients, subtle particles only after performance proof, and no attention-grabbing loops. |
| Calm's 60-second Breathe Bubble | Zero-friction relief | Rescue Me and Free Breathe must be visible from Home and start without account, network, or paywall. |
| Headspace emotional design | Rounded, spacious, safe UI language | Warm copy, readable whitespace, friendly typography, no sharp or urgent interaction style. |
| Headspace breathe-before-register pattern | Demonstrate value before capture | First launch starts with a 30-second guided orb breath and a short first full session before questions, sign-in, permissions, or paywall. |
| Headspace progressive path | Make beginners feel guided | Use bounded next steps and later short foundations/challenges, not a huge course library. |
| Breathwrk goal categories | Organize by user state | Breathe tab groups techniques by Sleep, Calm, Energy, and Focus while still showing technique names. |
| Breathwrk customization | Create ownership | Let users control voice/audio/haptics/duration where it matters, without slowing the first session. |
| Breathwrk lung-score lesson | Give progress-oriented users a metric | Use breath minutes, completed cycles, consistency, and later cautious insights; avoid medical scoring. |
| BetterSleep sound mixer | User-created sleep environment | Mixer is a core product surface, not a settings panel. Saved mixes should feel personal. |
| BetterSleep Smart Mix | Avoid noticeable repetition | Launch sounds need clean loops; longer-term Smart Mix should vary layers so the brain does not catch repeat points. |
| BetterSleep support responsiveness | Treat support as UX | Billing/support lookup and macros are part of launch readiness, not post-launch operations. |
| Insight Timer generosity | Trust through real free value | Free tier must remain useful after trial: core breathing, Rescue Me, limited sounds, and basic history. |

## Do The Opposite Of These Failures

| Competitor failure | Product rule | Build/QA gate |
| --- | --- | --- |
| Netflix Syndrome content overload | Home is a moment, never a library. | Home shows one primary action, three shortcuts, today's check-in/sleep summary, and progress only. |
| Paywall before value | Monetization comes after first completed full session. | First launch path has no account, paywall, notification prompt, or backend dependency before breathing. |
| Navigation destroying muscle memory | Five fixed tabs never move or rename casually. | Tab order and names require migration messaging if ever changed after launch. |
| Generic notification spam | Only three push notification types are allowed by default. | No marketing pushes, feature announcements, red badges, or guilt copy. |
| One-size-fits-all content | Use simple context signals before AI complexity. | Home changes by time of day, morning check-in, and session history. |
| Billing distrust | Be clearer than competitors before money moves. | Renewal reminder, visible cancel path, refund policy, and total annual price are required. |
| Broken feature-level behavior | Treat first session and session-complete as launch gates. | Android back paths, locked-screen resume, local session persistence, and crash-after-session recovery must pass on devices. |

## Decision Updates From This Report

### Onboarding

Use the newer competitor report as the current onboarding decision:

1. Splash stays short.
2. First interaction is a 30-second breathing demonstration.
3. Start a short first full session.
4. Ask the post-session reflection.
5. Ask no more than five personalization questions.
6. Show a personalized plan screen.
7. Show paywall only after the first full session reward moment.
8. Offer social login after value; no password creation on Day 1.
9. Ask for notification permission on Day 3 after at least two completed sessions.

### Home Screen

The Home tab must stay focused on "what should I do right now?"

- One primary action card.
- Three quick actions: Rescue Me, Sounds, Breathe.
- Sleep check-in or last-night summary.
- Streak/progress as a quiet strip, not a demand.
- No content library, social feed, upsell banner, trending content, red badge, or multiple CTAs.

### Navigation

Use five fixed tabs:

1. Home.
2. Sleep.
3. Breathe.
4. Progress.
5. Profile.

Reasoning: this naming is clearer than `Track` and `Settings`, gives the sleep anchor priority, and keeps account/subscription/support where users expect it.

### Notifications

Default push notification types are limited to:

- Evening Anchor.
- Streak Milestone.
- Re-engagement after exactly 3 inactive days.

Morning check-ins, insight-ready prompts, and paywall prompts should be in-app surfaces by default unless a user explicitly enables extra reminders later.

### MVP Scope

Pull Rescue Me into MVP. The report makes it a direct competitive response to Calm's 60-second Breathe Bubble and a requirement for zero-friction emergency relief. It is technically small and strategically central.

## Implementation Acceptance Gates

- New user can reach a breathing cue in under 60 seconds from first open.
- First 30 seconds demonstrate breath before capture.
- New user can complete the first full session before personalization.
- Home has exactly one primary CTA.
- Rescue Me starts from Home without network, account, or paywall.
- Sound mixer can play bundled sounds with no audible loop click.
- Android back navigation never freezes or returns to a black loading screen.
- Screen lock never silently discards in-progress or nearly complete sessions.
- Streak/session data survives a crash at the session-complete moment.
- Cancel subscription is reachable from Profile in three taps or fewer.
- Annual renewal reminder is scheduled 7 days before renewal where platform rules allow.
- Support can resolve billing lookup from user ID, install ID, RevenueCat ID, or email.
