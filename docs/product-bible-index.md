# Product Bible Index

The complete product bible is now the current product source of truth for feature behavior, UI/UX, visual design, notifications, competitor analysis, and screen-level instructions.

The full source is preserved here:

- [Complete Product Bible Source](research/complete-product-bible-source.md)
- [Complete Product Bible With Animations Source](research/complete-product-bible-with-animations-source.md)
- [Competitor UI/UX Intelligence Source](research/competitor-uiux-intelligence-source.md)

Use the split docs below for focused work:

| Need | Open |
| --- | --- |
| Product philosophy and executive summary | [Product Bible Executive Summary](product/product-bible-executive-summary.md) |
| Color palette, typography, spacing, iconography, elevation, motion | [Design System](design/design-system.md) |
| Motion timings, easing, haptics, and animation rules | [Motion, Animation, And Haptics](design/motion-animation-haptics.md) |
| Breathing orb visual and implementation spec | [Breathing Orb Implementation Spec](design/breathing-orb-implementation-spec.md) |
| Breathing pacer, wind-down, sound mixer, morning check-in, home, streaks, Rescue Me, insights, stories, Free Breathe | [Feature Deep Specs](product/feature-deep-specs.md) |
| Bottom navigation and app-level navigation rules | [Navigation Architecture](ux/navigation-architecture.md) |
| Calm, Headspace, Breathwrk, and Wind Down competitor analysis | [Competitor Design Analysis](research/competitor-design-analysis.md) |
| Competitor UI/UX response decisions | [Competitor UI/UX Response Plan](research/competitor-uiux-response-plan.md) |
| Competitor failures translated into implementation anti-patterns | [Competitor Anti-Patterns](research/competitor-anti-patterns.md) |
| Sleep/breathwork technique evidence, safety, and claim boundaries | [Sleep and Breathwork Technique Audit](research/sleep-breathwork-technique-audit.md) |
| Code-first animation engineering source and implementation notes | [Animation Engineering Index](engineering/animation-engineering-index.md) |
| Hook model, investment loop, Day 3-5 churn strategy | [Habit Loop Architecture](product/habit-loop-architecture.md) |
| Notification types, timing, copy, and permission strategy | [Notification Strategy](ux/notification-strategy.md) |
| Splash, personalization, no-account, first session, post-session, notification permission | [Onboarding Flow Screen-by-Screen](ux/onboarding-flow-screen-by-screen.md) |
| Conclusion and citation list | [Product Bible Conclusion and References](research/product-bible-conclusion-references.md) |
| Execution-ready feature specs and checklists | [Feature Specs Index](features/README.md) |

## Source Hierarchy

1. Product Bible: current detailed product, UX, and design source.
2. Sleep and Breathwork Technique Audit: current evidence and claim-boundary layer for sleep, breathwork, sound, insight, and growth copy.
3. Competitor UI/UX Response Plan: current competitive UX, onboarding, navigation, notification, and trust-differentiation decision layer.
4. Tech Stack Proposal: current technical architecture proposal.
5. Earlier Blueprint: strategic market and roadmap input, retained for context.

If a detail conflicts between the earlier blueprint and the product bible, treat the product bible as newer unless we explicitly decide otherwise. If the conflict is specifically about competitor response, onboarding, navigation, notification limits, or billing trust, use the Competitor UI/UX Response Plan.
If a product-bible or competitor source makes a clinical, physiological, sleep-improvement, anxiety, panic, HRV, sound-frequency, binaural, or treatment-style claim, use the Sleep and Breathwork Technique Audit first.

## Product Bible Principle

Every feature must pass both tests:

- It can be demonstrated in 15 seconds on TikTok.
- It feels useful and calming within 60 seconds of first use.
