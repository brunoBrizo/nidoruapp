# Feature: Sleep Insight Cards

Phase: Phase 2

## Summary

Sleep Insight Cards are the first "the app notices my routine" moment. After enough morning check-ins, Nidoru shows one simple, cautious, personalized pattern in plain English. The card should help users understand what was associated with better self-reported nights without making medical, diagnostic, treatment, or causal claims.

## User Stories

- As a user with a week of check-ins, I want a simple pattern that helps me improve tonight.
- As a user who dislikes dashboards, I want one useful insight, not overwhelming graphs.
- As a privacy-sensitive user, I want insights based on my entered data and clear language.
- As a user considering subscription, I want the insight loop to show why continuing matters.

## MVP Scope

Phase 2 first version:

- Trigger after 7-14 nights of check-ins.
- Show one simple pattern at a time.
- Phrase insights as observed patterns, not causation.
- Use copy like "your highest-rated nights often..." or "appears more often on..." instead of "this made you sleep better."
- Home card has a "NEW" badge and subtle sparkle only on first reveal.
- Detail view can show a 14-day timeline with sleep ratings and markers for session days, sound choices, and timing.
- Insights can be premium later, but progress data remains visible without shame.

## Out Of Scope

- Medical claims.
- AI therapist or chatbot.
- Sleep diagnosis.
- Overwhelming dashboard.
- Passive sleep-tracker dependency.
- Claims that wind-down caused improved sleep.
- Claims that a technique, sound, frequency, or routine treats insomnia, anxiety, panic, or any medical condition.

## Acceptance Criteria

- Insight appears only after enough structured data exists.
- Insight copy uses cautious pattern language.
- Only one insight is emphasized at a time.
- Home card reveal is subtle and does not interrupt bedtime flows.
- Detail view is readable and not graph-heavy.
- Insight generation does not block app launch, sessions, audio, or check-in save.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Habit Loop Architecture](../product/habit-loop-architecture.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)
- [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Glass, Background, And Loading States](../engineering/glass-background-loading-states.md)

## Data And Backend Needs

- Uses morning check-ins, wind-down start time, technique used, sound mix, session duration, streak state, and day of week.
- Supabase `insight_cards`.
- Edge Function or queued worker can generate cards.
- No health integration dependency.
- Local app can show cached insight when offline.

## Analytics Events

- `insight_card_viewed`
- Existing events feeding insight logic:
  - `wind_down_completed`
  - `morning_check_in_completed`
  - `sound_mix_saved`
  - `breath_session_completed`

## Edge Cases And Failure States

- If fewer than 7 check-ins exist, show no claim.
- If data is contradictory, do not force an insight.
- If insight generation fails, retry in background and keep Home calm.
- If user disables sensitive data sync, keep local-only insights if allowed by privacy decision.
- If copy might imply treatment or diagnosis, rewrite before public release.
- If copy implies causation from a small self-reported dataset, rewrite to pattern language before public release.

## Task Checklist

- [ ] Define eligible data thresholds.
- [ ] Define insight types from existing docs.
- [ ] Add cautious copy templates.
- [ ] Add local cached insight state.
- [ ] Add Supabase `insight_cards` model.
- [ ] Add queued insight generation trigger.
- [ ] Build Home insight card.
- [ ] Add first-reveal subtle sparkle.
- [ ] Build detail view with 14-day timeline.
- [ ] Add premium/free entitlement behavior if needed.
- [ ] Add analytics event.
- [ ] Verify no insight appears before enough data.
- [ ] Review insight copy for non-clinical language.
