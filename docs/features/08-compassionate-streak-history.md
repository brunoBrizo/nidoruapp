# Feature: Compassionate Streak and History

Phase: MVP

## Summary

The streak system tracks consistency without punishment. Missed days pause the streak instead of resetting it to zero, returning users get a comeback moment, and weekly summaries celebrate completed sessions rather than perfect behavior.

## User Stories

- As a user who misses a day, I want the app to encourage me back instead of making me feel like I failed.
- As a consistent user, I want milestones and history to show my progress.
- As a user who finds streaks stressful, I want to hide streak display.
- As a returning user, I want my comeback recognized positively.

## MVP Scope

- Track total breath sessions.
- Track total breath minutes.
- Track total sleep sessions.
- Show current streak without resetting to zero after one missed day.
- Missing a day pauses the streak.
- Returning after missed days creates a comeback moment.
- Simple calendar history.
- Ghost mode hides streak display while preserving data.
- Milestone badges: 3, 7, 14, 30, 60, 100, 365 sessions.

## Out Of Scope

- Shame reset to zero.
- Red failure states.
- Guilt notifications.
- Public leaderboard.
- Social feed.
- Aggressive gamification.

## Acceptance Criteria

- A missed day does not reset the streak to zero.
- Paused, active, and comeback states are visible and understandable.
- Weekly summary emphasizes completed sessions, not only consecutive days.
- Streak/session data survives a crash at the session-complete moment.
- Ghost mode hides streak UI without deleting data.
- Milestone badges remain permanent.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Habit Loop Architecture](../product/habit-loop-architecture.md)

## Engineering References

- [Technical Foundation](../architecture/technical-foundation.md)
- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Mixer, Streak, Session, And Onboarding Animations](../engineering/mixer-streak-session-onboarding-animations.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)

## Data And Backend Needs

- Local daily completion records.
- Local streak cache with active, paused, comeback, ghost mode, totals, and badges.
- Supabase `streak_states` and session/check-in records for sync.
- Daily streak reconciliation can later run through Supabase Cron, but client must show local state immediately.

## Analytics Events

- `streak_paused`
- `comeback_completed`
- `breath_session_completed`
- `wind_down_completed`
- `morning_check_in_completed`

## Edge Cases And Failure States

- If session completion is interrupted, persist completion before animation.
- If multiple devices conflict, remote reconciliation can update later, but local emotional state should not flicker during bedtime use.
- If user disables streak display, still track history silently.
- If user returns after several days, show comeback without shame.
- If milestone and comeback happen together, keep copy calm and non-aggressive.

## Task Checklist

- [ ] Define streak state model: active, paused, comeback, ghost mode.
- [ ] Persist daily completion records locally.
- [ ] Calculate breath sessions, breath minutes, and sleep sessions.
- [ ] Build quiet Home streak strip.
- [ ] Build simple calendar view.
- [ ] Add paused-day representation.
- [ ] Add comeback moment.
- [ ] Add milestone badge model.
- [ ] Add ghost mode setting.
- [ ] Persist completion before streak animation.
- [ ] Sync streak state after auth exists.
- [ ] Verify missed day pauses instead of reset.
- [ ] Verify crash-after-session does not lose completion.
