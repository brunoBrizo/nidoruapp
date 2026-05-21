# Feature: App Shell, Navigation, and Home

Phase: MVP

## Summary

The app shell gives Nidoru its fixed five-tab structure and makes Home a "right now" action surface, not a content library. Home must show one primary action, three quick actions, a check-in or last-night summary, and quiet progress. The Home tab is always the landing tab, and primary navigation must not move or rename casually after launch.

## User Stories

- As a tired user opening the app at night, I want one obvious action so I do not browse before bed.
- As an anxious user, I want Rescue Me visible from Home so I can start immediate relief.
- As a returning user, I want Home to adapt to the time of day so the app feels context-aware.
- As a subscriber or free user, I want Profile to clearly contain subscription, notification, support, and privacy settings.

## MVP Scope

- Five fixed tabs: Home, Sleep, Breathe, Progress, Profile.
- Home contains one primary action card, three persistent quick actions, sleep check-in or last-night summary, and quiet streak/progress.
- Primary action changes by time of day:
  - 5 AM-12 PM: Morning Breathwork.
  - 12 PM-5 PM: Midday Reset.
  - 5 PM-8 PM: Evening Prep.
  - 8 PM-12 AM: Wind-Down Flow.
  - 12 AM-5 AM: Rescue Me.
- Quick actions are Rescue Me, Sounds, and Breathe.
- Sleep tab contains Wind-Down Flow, Sound Mixer, and Sleep Stories when added.
- Breathe tab groups techniques by Sleep, Calm, Energy, and Focus while still showing technique names, including Coherent Breathing / Daily Calm as the regular 10-minute HRV Training practice.
- Progress tab contains streak calendar, weekly summary, mood history, and sleep trends.
- Profile tab contains settings, subscription, notifications, sound preferences, support, and privacy controls.

## Out Of Scope

- Social feed.
- Trending content.
- Large content library on Home.
- Red app-icon badges or red streak pressure.
- Search in MVP.
- Moving or renaming tabs without an explicit migration screen.

## Acceptance Criteria

- Home has exactly one primary CTA.
- Home never shows a library, social feed, upsell banner, trending content, red badge, or multiple primary CTAs.
- Rescue Me remains available from Home regardless of scroll position.
- The primary path to every core feature is three taps or fewer from Home.
- The five tab names and order match [Navigation Architecture](../ux/navigation-architecture.md).
- Context-aware card swaps do not delay Rescue Me or first breath start.
- Android back navigation never freezes or returns to a black loading screen.

## UX References

- [Navigation Architecture](../ux/navigation-architecture.md)
- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)
- [Competitor UI/UX Home Screen IA](../research/competitor-uiux-home-screen-ia.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Transitions, Tabs, And Sheets](../engineering/transitions-tabs-sheets.md)

## Data And Backend Needs

- Reads local current time and user wind-down target.
- Reads local streak cache and morning check-in state.
- Reads entitlement state only for surfaces that need gating; entitlement checks never block Home startup.
- Does not require Supabase, RevenueCat, PostHog, Sentry, R2, or push services to render the initial Home action.

## Analytics Events

Use downstream explicit events already defined in the architecture docs:

- `rescue_me_started`
- `wind_down_started`
- `morning_check_in_completed`
- `streak_paused`
- `comeback_completed`
- `paywall_viewed`

Do not add broad Home autocapture.

## Edge Cases And Failure States

- If app opens after midnight, Home prioritizes Rescue Me and low-brightness presentation.
- If check-in is missing in the morning, the summary area becomes a one-tap check-in entry.
- If streak data is unavailable because sync failed, show local streak cache.
- If feature flags fail to load, use safe local defaults.
- If subscription state is unavailable, keep free surfaces usable and avoid blocking breathwork.

## Task Checklist

- [ ] Define the five-tab route structure: Home, Sleep, Breathe, Progress, Profile.
- [ ] Build Home layout with one primary action card.
- [ ] Add time-of-day primary action selection.
- [ ] Add persistent quick actions: Rescue Me, Sounds, Breathe.
- [ ] Add sleep check-in or last-night summary slot.
- [ ] Add quiet streak/progress strip.
- [ ] Surface Coherent Breathing / Daily Calm in the Breathe tab as a regular practice, not as Rescue Me.
- [ ] Add Profile entry points for settings, subscription, notifications, support, and privacy.
- [ ] Implement tab active indicator motion using product timing.
- [ ] Verify Home has no library, feed, upsell banner, red badge, or multiple primary CTAs.
- [ ] Verify core features are reachable in three taps or fewer.
- [ ] Verify Android back paths through all five tabs.
- [ ] Verify Home renders from local state without network.
