# Feature: Watch App

Phase: Future

## Summary

The watch app is deferred until the phone-based cue system is proven. The product docs repeatedly prioritize local phone breath cues, audio, haptics, and first-session reliability before wearable expansion.

## User Stories

- As a future user, I may want breath cues on my wrist without looking at my phone.
- As a bedtime user, I want the phone app to work reliably before adding a companion device.
- As the product team, we want evidence from phone sessions before committing to watch scope.

## MVP Scope

- No watch app in MVP.
- Phone-based visual, audio, and haptic cue system is the proof point.
- Watch exploration begins after Month 6 or after phone-based cues prove retention and reliability.

## Out Of Scope

- Native watch app in MVP.
- Watch-only onboarding.
- Watch dependency for core breath sessions.
- Wearable health-data dependency.

## Acceptance Criteria

- MVP does not require a watch for any core flow.
- Phone app supports screen-off guidance through audio first.
- Watch work does not start until real device phone proof is complete.
- Any future watch feature preserves the same no-account-before-value principle.

## UX References

- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Product Strategy](../product/product-strategy.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)

## Data And Backend Needs

- No MVP data model requirement.
- Future watch sessions should reuse breath session records and local-first sync principles.

## Analytics Events

No MVP analytics events.

## Edge Cases And Failure States

- If users request watch support early, keep it in feedback backlog and do not block MVP.
- If watch haptics become part of future scope, verify platform behavior on real devices.
- If watch app cannot preserve offline-first behavior, keep phone as primary.

## Task Checklist

- [ ] Keep watch app out of MVP scope.
- [ ] Gather phone-session retention and reliability evidence first.
- [ ] Define future watch use cases after phone proof.
- [ ] Verify native watch haptic constraints before implementation.
- [ ] Reuse breath session data model for future watch sessions.
- [ ] Keep phone app fully functional without wearable dependency.
