# Feature: Morning Check-In

Phase: MVP

## Summary

Morning Check-In is the second daily habit anchor. It asks for a 1-5 sleep rating, one mood or energy tag, and offers a short morning breath session. This creates structured data for later insight cards without using passive sleep tracking.

## User Stories

- As a morning user, I want to record last night's sleep in less than 30 seconds.
- As a user who feels tired, I want a short morning breath suggestion, not a long routine.
- As a privacy-sensitive user, I want manual check-ins instead of microphone or health-data tracking.
- As a user building a pattern, I want check-ins to make the app smarter over time.

## MVP Scope

- Appears automatically when app opens between 5 AM and 12 PM if not completed that day.
- One screen, no scrolling.
- Sleep rating from 1 to 5.
- One mood or energy tag.
- Optional 2-3 minute morning breath session.
- Skip is always allowed with no guilt.
- Local confirmation happens immediately.
- Data powers later insight cards.

## Out Of Scope

- Push notification for morning check-in by default.
- Freeform sensitive notes unless a clear product need appears.
- Passive sleep tracking.
- Health permissions in MVP.
- Sleep score anxiety or detailed graphs in MVP.

## Acceptance Criteria

- Morning check-in save confirms locally immediately.
- Total check-in interaction can complete in 30 seconds or less.
- Morning breath suggestion is always 2-3 minutes maximum.
- Skipping is zero-friction and never creates guilt copy.
- Check-in data is structured enough for later insight cards.
- Check-in does not block normal app use.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Product Strategy](../product/product-strategy.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)

## Engineering References

- [Technical Foundation](../architecture/technical-foundation.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)

## Data And Backend Needs

- Local `morning_check_ins` record:
  - Date.
  - Sleep rating 1-5.
  - Mood or energy tag.
  - Morning session accepted or skipped.
- Sync to Supabase after auth exists.
- Server-side storage requires explicit consent if categorized as sensitive health-adjacent data.

## Analytics Events

- `morning_check_in_completed`
- `breath_session_started` if morning breath is accepted.
- `breath_session_completed` if morning breath completes.
- `sync_failed` for background sync failure.

## Edge Cases And Failure States

- If user opens outside 5 AM-12 PM, do not force the check-in.
- If check-in already completed today, show summary instead.
- If offline, save locally.
- If user skips, keep the app usable and do not nag.
- If sensitive-data consent is disabled later, keep local-only behavior according to privacy decisions.

## Task Checklist

- [ ] Add morning window detection.
- [ ] Add daily completion check.
- [ ] Build one-screen check-in layout.
- [ ] Add 1-5 sleep rating control.
- [ ] Add mood or energy tag control.
- [ ] Add optional morning breath suggestion.
- [ ] Add skip action with no guilt copy.
- [ ] Persist check-in locally immediately.
- [ ] Sync check-in after auth exists.
- [ ] Update Home sleep summary from local check-in.
- [ ] Feed streak/history state.
- [ ] Verify check-in completes in 30 seconds or less.
