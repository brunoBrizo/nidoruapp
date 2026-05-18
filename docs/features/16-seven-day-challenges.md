# Feature: 7-Day Challenges

Phase: Phase 3

## Summary

7-day challenges create a short, shareable structure around existing sessions. They should reuse existing breathwork, wind-down, check-in, and progress mechanics rather than requiring a separate content system at first.

## User Stories

- As a motivated user, I want a 7-day path that feels achievable.
- As a creator, I want challenge progress that can be shared visually.
- As a user who misses a day, I want the challenge to continue without shame.
- As a beginner, I want challenges to guide me without becoming a large course library.

## MVP Scope

Phase 3 first version:

- Curated challenges:
  - 7 Days of Better Sleep.
  - 7 Days to Calm.
  - No-Scroll Bedtime Week.
- Reuse existing sessions and routines.
- Progress cards at Day 1, Day 3, and Day 7.
- Compatible with compassionate streak rules.

## Out Of Scope

- Large course library.
- Social leaderboard.
- Punitive challenge failure.
- Complex challenge marketplace.
- Medical claims.

## Acceptance Criteria

- Challenge can be completed using existing session surfaces.
- Missing a day does not shame or erase progress.
- Challenge progress is visible and simple.
- Challenge progress card is shareable without sensitive sleep details.
- Challenge copy stays non-clinical.

## UX References

- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md)
- [Habit Loop Architecture](../product/habit-loop-architecture.md)
- [Feature Deep Specs](../product/feature-deep-specs.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- Supabase `challenges`.
- Supabase `challenge_translations`.
- Supabase `challenge_progress`.
- Local challenge progress cache.
- Uses existing session/check-in completion records.

## Analytics Events

No dedicated challenge events are currently defined in the architecture docs. If added later, keep them explicit and limited to product questions.

## Edge Cases And Failure States

- If user misses a day, keep progress visible and offer comeback copy.
- If network is unavailable, update local progress and sync later.
- If localized challenge copy is missing, do not show broken strings.
- If challenge conflicts with bedtime flow, default to the simpler wind-down action.

## Task Checklist

- [ ] Define first three challenge templates.
- [ ] Define challenge translation model.
- [ ] Define challenge progress model.
- [ ] Reuse existing session IDs and completion records.
- [ ] Build challenge entry surface.
- [ ] Build challenge progress screen.
- [ ] Build Day 1 progress card.
- [ ] Build Day 3 progress card.
- [ ] Build Day 7 progress card.
- [ ] Add local progress cache.
- [ ] Add sync after auth exists.
- [ ] Verify missed day behavior is compassionate.
