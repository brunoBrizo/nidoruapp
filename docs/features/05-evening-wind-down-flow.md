# Feature: Evening Wind-Down Flow

Phase: MVP

## Summary

Evening Wind-Down is the anchor nightly ritual. One tap from Home sequences breathwork, a body relaxation cue, and ambient sound into a low-choice bedtime flow. It combines the breathwork and sleep-audio categories instead of forcing users to browse separate sections.

## User Stories

- As a user preparing for bed, I want one tap to start a complete wind-down routine.
- As a user trying not to scroll, I want the app to move from breathwork into sound without more choices.
- As a light-sensitive user, I want the screen to dim after active guidance.
- As a user who locks my phone, I want ambient audio to continue.

## MVP Scope

- One tap preferred, two taps maximum from Home.
- Fixed launch sequence:
  - 3-5 minutes of starter breathwork, with Coherent Breathing / Daily Calm as a 10-minute regular-practice option.
  - About 2 minutes of body relaxation cue.
  - Ambient sound continues until timer or user stop.
- Optional quick context check can ask tonight's goal and remember the last choice.
- Wind-down transition card lasts 5 seconds and auto-advances if user does nothing.
- Ambient sound starts dimly under breathwork where appropriate.
- Screen dims after breathwork completion.
- Session is recorded even if app backgrounds after the main exercise.
- Morning check-in is subtly prepared for the next day.

## Out Of Scope

- Complex routine marketplace.
- Fully custom routine builder in MVP.
- Sleep stories as a required MVP step.
- Brightness permission as a blocker.
- More than two taps from Home to start.

## Acceptance Criteria

- Taps from Home to evening wind-down are one preferred, two maximum.
- Wind-down can complete without looking at the screen after start.
- Ambient audio keeps working with the phone locked.
- Keep-awake or power-management locks release when timer playback ends.
- Audio stop/fade/continue state is visible before screen dims.
- Full wind-down run is recorded locally.
- Breathwork completion is saved before transition, share prompts, or upsell.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Navigation Architecture](../ux/navigation-architecture.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Mixer, Streak, Session, And Onboarding Animations](../engineering/mixer-streak-session-onboarding-animations.md)

## Data And Backend Needs

- Local `wind_down_runs` record with routine ID, step completions, total duration, ambient sound choice, and stop/completion state.
- Breath session record linked to wind-down run.
- Ambient sound layer state linked to run.
- Power-management state linked to active playback and released at timer end.
- Sync is idempotent and never blocks the active flow.

## Analytics Events

- `wind_down_started`
- `wind_down_completed`
- `breath_session_started`
- `breath_session_completed`
- `audio_started`
- `audio_failed`
- `sync_failed` only for background sync failure.

## Edge Cases And Failure States

- If brightness permission is unavailable, use app-level dimming.
- If audio interruption occurs, show whether audio stopped, faded, or resumed.
- If network is unavailable, use bundled sounds.
- If timer playback ends, release keep-awake or power-management locks so the device can dim and lock naturally.
- If app backgrounds after exercise, session completion remains saved.
- If the user exits during body cue, save partial wind-down state without guilt.

## Task Checklist

- [ ] Add Wind-Down primary action from Home.
- [ ] Build optional quick context check and remembered last choice.
- [ ] Start 3-5 minute breathwork step.
- [ ] Add Coherent Breathing / Daily Calm as a 10-minute regular-practice option.
- [ ] Add body relaxation cue step.
- [ ] Add 5-second transition card.
- [ ] Hand off into ambient sound mode.
- [ ] Add screen dimming after breathwork.
- [ ] Show timer and audio continuation state before dimming.
- [ ] Persist wind-down run start locally.
- [ ] Persist each step completion locally.
- [ ] Persist final completion or stop reason locally.
- [ ] Verify locked-screen audio continuation.
- [ ] Verify keep-awake or power-management locks release after timer playback ends.
- [ ] Verify flow can complete without extra screen interaction after start.
