# Feature: Sleep Stories

Phase: Phase 3

## Summary

Sleep Stories are short, quiet, deliberately low-stimulation audio narratives that help users fall asleep by occupying the analytical brain without entertaining it. They are a post-MVP content investment and must use properly licensed or owned human narration.

## User Stories

- As a user with racing thoughts, I want a boring, calming story to occupy my mind.
- As a user at bedtime, I want stories to start without a spinner or long wait.
- As a user who dislikes celebrity content, I want neutral, human narration.
- As a returning listener, I want familiar stories I can repeat.

## MVP Scope

Phase 3 first version:

- Small set of original recordings, 5-15 minutes.
- Categories:
  - Nature Journey.
  - Slow Travel.
  - Domestic Calm.
  - Descriptive Imagery.
  - Repeated Familiar.
- Human narrator only.
- Studio quality, low noise floor, slower pacing, long pauses.
- Story fades naturally with no goodbye or musical sting.
- Story can flow into ambient sound automatically.
- Progressive 3-minute chunks from R2.

## Out Of Scope

- Sleep stories in MVP.
- AI voice synthesis.
- Celebrity-first positioning.
- Entertainment-style stories.
- Network spinner at bedtime.
- Unlicensed narration or music.

## Acceptance Criteria

- First story chunk starts in less than 2 seconds on normal LTE/Wi-Fi.
- Audio can continue into ambient sound.
- No "goodbye" or musical sting at story end.
- Story metadata supports locale-specific content records.
- App has a fallback if story stream fails.
- Rights and licenses are clear before public release.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Growth, Pricing, and Brand](../growth/growth-pricing-brand.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- Cloudflare R2 for story audio chunks.
- Supabase media metadata for story status, locale, duration, entitlement, checksum, and chunk info.
- Sleep stories represented as locale-specific content records.
- Entitlement can gate premium story access.
- Cached playable media remains usable if network is unavailable.

## Analytics Events

The current event list does not define story-specific events. If added later, keep events explicit and avoid sensitive bedtime content tracking.

## Edge Cases And Failure States

- If story chunk fails, fade to bundled ambient sound or show calm retry.
- If locale-specific story is missing, do not show broken content.
- If entitlement refresh fails during playback, do not interrupt active audio.
- If user falls asleep before story ends, no action is required.

## Task Checklist

- [ ] Confirm story rights and narrator agreements.
- [ ] Define first story categories.
- [ ] Produce first story scripts.
- [ ] Record human narration.
- [ ] Master audio for sleep pacing and noise floor.
- [ ] Split audio into 3-minute chunks.
- [ ] Upload chunks to R2.
- [ ] Add story metadata.
- [ ] Add story player.
- [ ] Add progressive buffering.
- [ ] Add ambient sound handoff.
- [ ] Add entitlement behavior.
- [ ] Verify no spinner appears at bedtime.
- [ ] Verify story failure fallback.
