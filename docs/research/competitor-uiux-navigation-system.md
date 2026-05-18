## Part 6: The Navigation System

Related docs:

- Use [Navigation Architecture](../ux/navigation-architecture.md) for the current navigation decision.
- Use [Competitor UI/UX Failure Modes](competitor-uiux-failure-modes.md) for the evidence behind fixed navigation.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for tab contents and feature behavior.
- Use [Competitor UI/UX Response Plan](competitor-uiux-response-plan.md) for the actionable competitor response.

Five tabs. Fixed positions. They never move in any future update.

| Tab | Icon | Contents | Key rule |
|---|---|---|---|
| Home (🏠) | House outline | Primary Action Card, Quick Access, Sleep Summary, Streak | Always shows "right now" content |
| Sleep (🌙) | Moon | Sound Mixer, Sleep Stories (if added), Sleep Tracker | Accessible in one tap from any screen |
| Breathe (🌬️) | Orb/wave | Technique Library organized by goal state, Free Breathe | Techniques listed by state: Calm, Sleep, Energy, Focus |
| Progress (📊) | Bar chart | Streak calendar, weekly summary, mood history, sleep trends | Data visible without subscription — insights gated behind premium |
| Profile (👤) | Avatar | Settings, Subscription, Notifications, Sound preferences | Cancel subscription is always exactly 3 taps from here |

### Navigation Rules for Future Updates

These are design laws, not guidelines:
1. Tabs never move or rename after launch without a migration screen that shows users exactly where their previous tab went
2. Any feature accessible in previous versions remains accessible in new versions — it may be moved, never removed
3. The "Rescue Me" button is always visible on the Home tab regardless of scroll position (sticky element)
4. Search function must return results within 200ms with typo tolerance — the Headspace search failure directly caused cancellations[^26]

***
