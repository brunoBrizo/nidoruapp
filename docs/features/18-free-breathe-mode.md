# Feature: Free Breathe Mode

Phase: Post-MVP

## Summary

Free Breathe is the pure, configurable breathwork mode for power users. It lets users set custom inhale, hold, exhale, hold-out, and duration values, then breathe with the orb without guidance, content, or tracking pressure.

## User Stories

- As an experienced breathwork user, I want to set my own timing.
- As a user who wants minimalism, I want the orb without extra instructions.
- As a user practicing at night, I want the timer hidden unless I tap.
- As a user experimenting, I want custom durations without entering a full routine builder.

## MVP Scope

Post-MVP first version:

- Bottom-sheet settings panel.
- Controls:
  - Inhale: 2-10 seconds.
  - Hold in: 0-10 seconds, default 0.
  - Exhale: 2-15 seconds.
  - Hold out: 0-10 seconds, default 0.
  - Duration: 3, 5, 10, 20 minutes, or infinity.
- Full-screen orb.
- No text and no visible timer by default.
- Timer appears only if user taps.
- Uses the same phase controller as guided sessions.

## Out Of Scope

- MVP launch requirement unless explicitly pulled forward.
- Medical claims.
- Complex saved custom programs.
- Social comparison.
- Technique education.

## Acceptance Criteria

- User can start a custom breathing cycle from Breathe tab.
- Custom timing drives the same orb phase controller.
- No visible timer by default during active session.
- Infinity duration does not create memory leaks or runaway timers.
- Session can be stopped clearly.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Navigation Architecture](../ux/navigation-architecture.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Breathing Orb Code Pattern](../engineering/breathing-orb-code-pattern.md)
- [Transitions, Tabs, And Sheets](../engineering/transitions-tabs-sheets.md)

## Data And Backend Needs

- Local custom session settings.
- Breath session record can store custom timing pattern.
- Sync after auth exists if custom sessions should appear in history.

## Analytics Events

- `breath_session_started`
- `breath_session_completed`

## Edge Cases And Failure States

- If duration is infinity, user must have a clear stop control.
- If custom timing is invalid, constrain controls rather than showing errors.
- If user backgrounds app, phase reconciliation still uses elapsed time.
- If haptics are disabled, audio/visual still work.

## Task Checklist

- [ ] Add Free Breathe entry in Breathe tab.
- [ ] Build custom timing bottom sheet.
- [ ] Add inhale control.
- [ ] Add hold-in control.
- [ ] Add exhale control.
- [ ] Add hold-out control.
- [ ] Add duration control.
- [ ] Connect custom timing to breath session controller.
- [ ] Hide timer by default.
- [ ] Reveal timer on tap.
- [ ] Add stop control.
- [ ] Persist custom session summary locally.
- [ ] Verify infinity duration stability.
