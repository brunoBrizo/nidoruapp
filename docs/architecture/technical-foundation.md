# Technical Foundation

Related docs:

- Use [Tech Stack Decision Record](tech-stack-proposal.md) for final stack decisions and scale posture.
- Use [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md) for build order and product priority.
- Use [Feature Deep Specs](../product/feature-deep-specs.md) for feature behavior that drives module boundaries.
- Use [Assumptions, Risks, and Open Questions](../research/assumptions-risks-open-questions.md) for unresolved legal, privacy, and launch decisions.

## Current Architecture Assumption

The blueprint proposes React Native, NestJS, and Supabase. The simplest first implementation is probably:

- Expo React Native app.
- Supabase for auth, Postgres, storage metadata, and row-level security.
- RevenueCat for subscriptions.
- PostHog for product analytics.
- Cloud storage/CDN for audio files.
- A small server layer only where needed for webhooks, entitlement sync, scheduled jobs, and private operations.

Simpler approach: do not start with a full NestJS API unless there is a clear server-side requirement. Supabase plus serverless functions can cover the first product more directly. Add NestJS later only if backend complexity justifies it.

## Important 2026 Tech Note

The source blueprint mentions `expo-av` for audio. Current Expo documentation points new audio work at `expo-audio`, including background playback support. Treat `expo-audio` as the first package to evaluate before using older `expo-av` patterns.

## Mobile App Modules

### Onboarding

Responsibilities:

- Demonstrate a 30-second breath before data capture.
- Capture goal type.
- Capture sleep baseline.
- Capture wind-down time.
- Capture breathwork familiarity.
- Capture optional name.
- Select one recommended first session.
- Avoid account, paywall, and permissions before first value.

Data produced:

- Initial goal.
- Sleep baseline.
- Wind-down target.
- Breathwork familiarity.
- Optional display name.
- First recommended technique.

### Breathwork Session

Responsibilities:

- Run timed breathing phases.
- Display pacer animation.
- Play optional audio cues.
- Trigger haptics.
- Save session completion reliably.

Data produced:

- Technique.
- Started at.
- Completed at.
- Duration.
- Breath count estimate.
- Completion state.

### Wind-Down Flow

Responsibilities:

- Sequence breathwork, body cue, and ambient sound.
- Dim or simplify the screen after active guidance.
- Continue audio when app is backgrounded.
- Record the full routine.

Data produced:

- Routine ID.
- Step completions.
- Total routine duration.
- Ambient sound choice.

### Ambient Sound Mixer

Responsibilities:

- Play 1-3 sound layers.
- Control per-layer volume.
- Support timer and fade-out.
- Cache core sounds offline.

Data produced:

- Sound layers.
- Volumes.
- Timer choice.
- Playback completion or stop reason.

### Morning Check-In

Responsibilities:

- Ask sleep rating.
- Ask mood or energy tag.
- Offer one morning breath session.

Data produced:

- Sleep rating from 1 to 5.
- Mood or energy tag.
- Optional notes only if later justified.
- Morning session accepted or skipped.

### Streak And History

Responsibilities:

- Calculate active, paused, and comeback states.
- Show total sessions and total minutes.
- Show calendar history.

Data produced:

- Daily completion records.
- Streak state.
- Comeback events.

### Paywall And Entitlements

Responsibilities:

- Read RevenueCat entitlement state.
- Keep free tier useful.
- Avoid first-session paywall.
- Handle renewal and cancellation messaging.

Data produced:

- Current entitlement.
- Trial start and end.
- Conversion events.

## Backend Responsibilities

Keep backend responsibilities narrow:

- User account and identity.
- Subscription webhook ingestion.
- Entitlement mirror for server-side checks.
- Streak calculation if client-side manipulation becomes a concern.
- Scheduled summary or insight generation.
- Audio catalog metadata.
- Analytics event governance.

Do not build backend endpoints for simple client reads and writes that Supabase can safely handle with row-level security.

## Draft Data Model

This is a product-level draft, not a database migration.

| Entity | Purpose |
| --- | --- |
| user_profile | Anonymous or authenticated user preferences and bedtime target |
| onboarding_response | Goal, sleep baseline, wind-down time, breathwork familiarity, optional name |
| breathing_technique | Technique metadata, phase timing, labels, free or paid availability |
| breath_session | Completed or abandoned breathwork session |
| wind_down_routine | Routine definition, initially fixed, later user-customized |
| wind_down_run | One execution of a routine |
| sound_asset | Audio metadata, category, duration, offline eligibility |
| sound_mix | User-selected sound layers and volumes |
| morning_check_in | Sleep rating and mood or energy tag |
| streak_state | Current streak, paused state, comeback status |
| subscription_state | Entitlement mirror from RevenueCat |
| insight_card | Generated pattern shown to user |
| challenge | Curated 7-day challenge definition |
| challenge_progress | User progress through a challenge |

## Privacy And Safety Constraints

- Do not use microphone sleep tracking in V1.
- Do not require health permissions for MVP.
- Do not claim diagnosis, treatment, or guaranteed sleep improvement.
- Make analytics event names intentional and limited.
- Keep health data optional and permissioned.
- Avoid collecting freeform sensitive notes unless a clear product need appears.

## Audio Requirements

Audio is the highest technical risk in the MVP because it intersects product trust, background behavior, offline support, and app store review.

Acceptance criteria:

- Background playback works with screen locked.
- Fade-out works at timer end.
- Multiple layers stay in sync enough for ambient use.
- Offline sounds start without network.
- Audio stop/fade/continue state is visible before the screen dims.
- App resumes gracefully after interruption from calls, alarms, or headphones.

## Analytics Events

Track only what supports product decisions:

- onboarding_started
- onboarding_completed
- first_session_started
- first_session_completed
- wind_down_started
- wind_down_completed
- breath_session_started
- breath_session_completed
- sound_mix_started
- morning_check_in_completed
- streak_paused
- comeback_completed
- paywall_viewed
- trial_started
- subscription_started

Avoid event sprawl. Every event should answer a product question.

## Build Order

1. Static app shell and design system.
2. Breathwork pacer with hardcoded 4-7-8 session.
3. Rescue Me from Home with no network dependency.
4. Audio and haptic cue proof.
5. Ambient playback proof with background and timer.
6. Fixed evening wind-down flow.
7. Morning check-in persistence.
8. Compassionate streak.
9. Offline sound cache.
10. RevenueCat entitlements.
11. Analytics instrumentation.
12. Phase 2 features.

## Engineering Risks

| Risk | Mitigation |
| --- | --- |
| Background audio fails or store review rejects configuration | Prototype before broad app work and document platform permissions. |
| Offline audio cache is unreliable | Start with a small default pack and explicit cache state. |
| Session completion lost at the end | Persist completion before animations, share cards, or upsells. |
| Health integration delays launch | Defer to Phase 3; keep morning check-in manual first. |
| Backend overbuild slows MVP | Use Supabase directly where RLS is sufficient. |
| Analytics becomes invasive | Maintain a short event list tied to product questions. |
