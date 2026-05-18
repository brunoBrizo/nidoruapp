# Feature: Onboarding and First Session

Phase: MVP

## Summary

Onboarding must demonstrate value before capture. The first launch starts with a short local breath demo, then asks at most five purposeful questions, shows a simple prebuilt plan, starts the first full session, and only then offers account linking or paywall.

## User Stories

- As a first-time user, I want to breathe before creating an account so I can trust the app.
- As a first-time user, I want the questions to feel short and useful.
- As a returning user after first value, I want my first session saved even if account creation or sync fails.
- As a privacy-sensitive user, I want to skip name entry and avoid permissions on first launch.

## MVP Scope

- Splash with dark night background, resting orb, app name, and no spinner.
- First interaction is a 30-second orb breath demo.
- No account, paywall, notification prompt, health permission, microphone permission, content library, or backend dependency before the first breath.
- Ask up to five questions:
  - What brings you here?
  - How do you sleep most nights?
  - When do you usually wind down?
  - Have you tried breathwork before?
  - What should we call you? Optional.
- Show one of four prebuilt plans: Sleep Focused, Anxiety Relief, Stress Reset, General Wellness.
- Start the first full session immediately.
- Ask post-session reflection: Same, Better, Much better.
- Offer social login or anonymous-to-account linking after the first full session.
- Ask notification permission on Day 3 after at least two completed sessions, not during onboarding.

## Out Of Scope

- Tutorial carousel.
- Password creation on Day 1.
- Health permissions during onboarding.
- Notification permission during onboarding.
- Paywall before first full session completion.
- AI-generated plan copy.
- More than five onboarding questions.

## Acceptance Criteria

- First breath cue appears within 60 seconds of first launch.
- First breath and first full session work without network.
- First session is saved locally before sync or account linking.
- Total question count is five or fewer.
- Every question changes plan, copy, timing, or first-session recommendation.
- Paywall and account prompts appear only after the reward moment.
- If initialization is slow, onboarding uses a calm skeleton or goes straight to the local breath demo.

## UX References

- [Onboarding Flow Screen-by-Screen](../ux/onboarding-flow-screen-by-screen.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Competitor UI/UX Onboarding Blueprint](../research/competitor-uiux-onboarding-blueprint.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)

## Engineering References

- [Technical Foundation](../architecture/technical-foundation.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)

## Data And Backend Needs

- Generate local install identity on first launch.
- Store onboarding response locally:
  - Goal.
  - Sleep baseline.
  - Wind-down target.
  - Breathwork familiarity.
  - Optional display name.
  - First recommended technique or plan.
- Attempt Supabase anonymous auth only after first value or in a non-blocking background retry.
- Map local records to `user_id` after auth succeeds.

## Analytics Events

- `onboarding_started`
- `onboarding_completed`
- `first_breath_started`
- `first_breath_completed`
- `first_session_started` or `breath_session_started`
- `first_session_completed` or `breath_session_completed`
- `notification_permission_prompted` on Day 3, not during onboarding.
- `notification_permission_accepted` if accepted.

## Edge Cases And Failure States

- If Supabase auth fails, continue locally and retry in background.
- If app crashes near first session completion, preserve progress locally.
- If user skips name, use non-personal copy.
- If user declines notification permission later, keep app fully usable and do not ask again during the same onboarding period.
- If user opens after 8 PM, use night-friendly presentation.

## Task Checklist

- [ ] Build splash with app name and resting orb.
- [ ] Build 30-second breath demo with no gates before it.
- [ ] Persist onboarding start locally.
- [ ] Build goal question.
- [ ] Build sleep baseline question.
- [ ] Build wind-down time question.
- [ ] Build breathwork familiarity question.
- [ ] Build optional name question with visible skip.
- [ ] Map answers to four prebuilt plans.
- [ ] Build personalized plan screen with one primary CTA.
- [ ] Start first full session from plan CTA.
- [ ] Persist first full session locally before sync.
- [ ] Build post-session reflection.
- [ ] Add account-link prompt after reflection.
- [ ] Ensure paywall can only appear after first full session completion.
- [ ] Add Day 3 notification pre-permission gate after at least two sessions.
- [ ] Verify first breath within 60 seconds on a development build.
