# Feature: Rescue Me

Phase: MVP

## Summary

Rescue Me is the zero-friction emergency breathwork path. One tap from Home starts immediate 4-7-8 breathing with no account, network call, paywall, sound choice, timer setting, or setup. It is the MVP version of 3 AM Recovery Mode and the direct competitive response to Calm's Breathe Bubble.

## User Stories

- As an anxious user, I want one tap to start relief immediately.
- As a user awake at 2 AM, I want the lowest-friction, lowest-brightness experience possible.
- As a user in distress, I do not want technique choices, account prompts, or paywalls.
- As a returning user, I want my Rescue Me session to count locally even if sync fails.

## MVP Scope

- Home quick action/card labeled "Rescue Me".
- Uses `Ember #FF6B6B` only as a red accent for this emergency card.
- Tap starts immediate full-screen 4-7-8 breathing.
- Orb is visible before transition completes.
- No text or instructions at launch; after 2 cycles, subtle reassurance can appear.
- Fixed 5 rounds, approximately 3.5 minutes.
- End screen says: "That took courage to start. You completed 5 breath cycles."
- Optional next step: "Continue with a calming sound".
- Session progress is saved locally.

## Out Of Scope

- Technique selection.
- Sound choice before start.
- Timer selection before start.
- Network, account, paywall, analytics, or payment dependency before the orb appears.
- Medical or crisis-service positioning.

## Acceptance Criteria

- Rescue Me tap to visible orb is less than 300 ms.
- Rescue Me starts from a cold app state without a network call.
- Rescue Me works with no authenticated user.
- Copy stays minimal and non-clinical.
- Local session progress is saved even if app backgrounds.
- No paywall or account prompt can appear before or during Rescue Me.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)

## Engineering References

- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)

## Data And Backend Needs

- Local Rescue Me state uses the breath session controller with fixed 4-7-8 timing.
- Local record includes `rescue_me` source or equivalent session context.
- Sync can later create `breath_sessions` rows, but failure never blocks the feature.
- No personalization is required.

## Analytics Events

- `rescue_me_started`
- `rescue_me_completed`
- `audio_failed` if cues fail.
- `sync_failed` only if local-to-server sync fails later.

## Edge Cases And Failure States

- If opened after midnight, use low-brightness presentation.
- If haptics are unavailable, audio and visual cues remain enough.
- If the app is offline, start normally.
- If the user stops early, save partial session locally without shame copy.
- If user continues with calming sound, hand off to bundled/offline sound.

## Task Checklist

- [ ] Add Rescue Me Home quick action/card.
- [ ] Apply Ember accent only to Rescue Me emergency surface.
- [ ] Build immediate route into fixed 4-7-8 session.
- [ ] Ensure no network/auth/paywall code runs before orb visibility.
- [ ] Add subtle reassurance overlay after 2 cycles.
- [ ] Add fixed 5-round completion behavior.
- [ ] Add optional calming sound handoff.
- [ ] Persist Rescue Me start locally.
- [ ] Persist Rescue Me completion or partial stop locally.
- [ ] Add analytics events.
- [ ] Verify tap-to-orb under 300 ms.
- [ ] Verify cold start works offline.
