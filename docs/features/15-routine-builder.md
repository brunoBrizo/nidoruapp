# Feature: Routine Builder

Phase: Phase 2

## Summary

Routine Builder lets users assemble simple bedtime sequences after the fixed wind-down flow proves valuable. The first version stays constrained: breathwork, body cue, story, and sound. It must not become a complex marketplace or create bedtime choice overload.

## User Stories

- As a returning user, I want to adjust my bedtime routine without rebuilding it every night.
- As a user with a favorite sequence, I want to save it and start quickly.
- As a user with a chosen bedtime, I want reminders to work backward from routine length.
- As a tired user, I do not want a complex routine marketplace.

## MVP Scope

Phase 2 first version:

- Build from existing session types:
  - Breathwork.
  - Body cue.
  - Story.
  - Sound.
- Keep sequence choices constrained.
- Reminder timing works backward from selected bedtime and routine length.
- Fixed wind-down flow remains the default.

## Out Of Scope

- Routine marketplace.
- Large automation rules engine.
- Social sharing of routines.
- Unlimited step types.
- Complex conditional logic.

## Acceptance Criteria

- A user can save a simple bedtime routine.
- Starting a saved routine remains one tap from the relevant Home or Sleep surface.
- Routine builder does not increase first-session friction.
- Reminder timing can account for routine length.
- Routine execution records step completions.

## UX References

- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Notification Strategy](../ux/notification-strategy.md)

## Engineering References

- [Technical Foundation](../architecture/technical-foundation.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)

## Data And Backend Needs

- `wind_down_routine` definitions.
- `wind_down_run` execution records.
- Local routine storage first.
- Sync after auth exists.
- Notification preference can reference routine duration.

## Analytics Events

- `wind_down_started`
- `wind_down_completed`
- Existing notification events if reminder timing changes.

## Edge Cases And Failure States

- If routine content is unavailable, keep the fixed default wind-down flow available.
- If reminder scheduling fails, routine still starts manually.
- If story audio is not downloaded, use sound-only fallback.
- If routine becomes too long, warn calmly without blocking.

## Task Checklist

- [ ] Define allowed routine step types.
- [ ] Add local routine model.
- [ ] Build constrained routine editor.
- [ ] Add routine duration calculation.
- [ ] Add saved routine start path.
- [ ] Add routine execution tracking.
- [ ] Connect reminder timing to routine length.
- [ ] Sync routines after auth exists.
- [ ] Verify fixed wind-down remains default.
- [ ] Verify no first-session dependency on Routine Builder.
