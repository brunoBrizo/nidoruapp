# Navigation Architecture

Related docs:

- Use [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md) for the competitor rationale behind this structure.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for what each tab contains.
- Use [Onboarding and Retention](onboarding-retention.md) for first-session and return-flow constraints.
- Use [Product Bible Index](../product-bible-index.md) for the broader product source hierarchy.

The current navigation decision is based on the product bible and the newer competitor UI/UX intelligence report. The five-tab structure is fixed because competitor research shows that navigation churn destroys muscle memory and causes cancellations.

## Bottom Navigation

| Tab | Icon Direction | Contents | Rule |
| --- | --- | --- | --- |
| Home | House | Right-now primary action, quick actions, sleep summary/check-in, streak strip | Always the landing tab. Never a library. |
| Sleep | Moon | Wind-Down Flow, Sound Mixer, Sleep Stories when added | One tap from any screen to the sleep anchor. |
| Breathe | Orb or wave | Techniques grouped by state plus Free Breathe | Group by Sleep, Calm, Energy, Focus while still showing technique names. |
| Progress | Bar chart | Streak calendar, weekly summary, mood history, sleep trends | Data visible without shame; insights can be premium later. |
| Profile | Avatar | Settings, subscription, notifications, sound preferences, support | Cancel subscription is reachable in three taps or fewer. |

## Home Rules

- Home shows what to do right now, not everything the app contains.
- The Primary Action Card is always one tap to start.
- Quick actions are persistent: Rescue Me, Sounds, Breathe.
- The sleep quality card appears if a morning check-in exists; otherwise it becomes a one-tap check-in entry.
- Streak is visible but quiet.
- No library, social feed, upsell banner, trending content, red badge, or multiple primary CTAs.

## Future Navigation Rules

These are product laws:

1. Tabs do not move or rename after launch without a migration screen explaining the change.
2. Any feature accessible in a previous version remains accessible in later versions.
3. The primary path to any core feature remains three taps or fewer from Home.
4. Rescue Me remains available from Home regardless of scroll position.
5. Search, when added, must return useful results quickly and tolerate typos.
