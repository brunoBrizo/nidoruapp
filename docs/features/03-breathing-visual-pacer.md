# Feature: Breathing Visual Pacer and Sessions

Phase: MVP

## Summary

The breathing visual pacer is the core product animation: a multi-layer orb that guides inhale, hold, exhale, and optional hold phases with synchronized text, audio cues, and haptics. It must be smooth enough to communicate the app's value in a 15-second recording and reliable enough to complete full sessions without losing progress.

## User Stories

- As a user, I want the orb to clearly show when to inhale, hold, and exhale.
- As a user with my eyes closed, I want audio and haptic cues to help me follow the session.
- As a user who knows breathwork, I want techniques named explicitly.
- As a user whose app backgrounds or crashes near completion, I want the session saved reliably.

## MVP Scope

- Multi-layer orb with core, inner glow, outer ring, and pulse ring.
- Phase text: Inhale, Hold, Exhale.
- Audio modes: none, gentle bell, soft whoosh, nature ambient under phase audio.
- Haptics while active and screen-on:
  - Light haptic on inhale transition.
  - Soft or closest gentle haptic on exhale transition.
- Launch techniques from MVP roadmap:
  - 4-7-8 breathing for sleep.
  - Box breathing for anxiety and calm.
  - Coherent breathing, 5 seconds in and 5 seconds out.
  - Diaphragmatic breathing for stress.
- Source note: [Feature Deep Specs](../product/feature-deep-specs.md) also defines Physiological Sigh for panic or acute stress. Preserve it in the technique catalog as a post-MVP or explicit replacement candidate before tickets are written.
- Session completion persists before end screens, share prompts, animations, or upsells.

## Out Of Scope

- Large breathwork library.
- Clinical treatment claims.
- Decorative orb loops that can drift away from actual phase timing.
- Screen-lock haptic guarantee if platform behavior prevents it.
- Removing or weakening visual behavior after users depend on it.

## Acceptance Criteria

- 4-7-8 session runs smoothly for 5 minutes on real iOS and Android devices.
- Tap Start to first breath phase is less than 500 ms.
- Orb scale, phase text, audio cues, and phase state stay synchronized.
- App wake returns to the correct current phase.
- Audio cues remain the reliable locked-screen guidance layer.
- Session completion is saved before completion animation or paywall.
- The visual remains consistent with the Midnight Indigo palette.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Animation Engineering Index](../engineering/animation-engineering-index.md)
- [Breathing Orb Code Pattern](../engineering/breathing-orb-code-pattern.md)
- [Haptics, Reduce Motion, And Timing](../engineering/haptics-reduce-motion-timing.md)

## Data And Backend Needs

- Local technique definitions include name, phase timings, labels, context, free or premium availability, and localization keys.
- Breath session local record includes technique, started at, completed at, duration, breath count estimate, and completion state.
- Sync creates `breath_sessions` rows after auth exists.
- Server state never becomes the source of truth for an in-progress breath session.

## Analytics Events

- `first_breath_started`
- `first_breath_completed`
- `breath_session_started`
- `breath_session_completed`
- `audio_failed` if phase or ambient audio cannot play.

## Edge Cases And Failure States

- If haptics are disabled or unavailable, session still works through visual and audio cues.
- If app backgrounds, phase state is computed from phase start time and elapsed time.
- If user enables Reduce Motion, preserve core breathing scale cue and remove decorative motion.
- If audio interruption occurs, session resumes gracefully or makes stop state clear.
- If completion happens during crash or backgrounding, local persistence wins.

## Task Checklist

- [ ] Define local technique catalog for MVP techniques.
- [ ] Add source note for Physiological Sigh conflict before ticket creation.
- [ ] Build breath session controller with phase, phase start time, duration, cycle count, and total duration.
- [ ] Build multi-layer orb visual.
- [ ] Connect Reanimated shared values to phase progress.
- [ ] Add phase label crossfade.
- [ ] Add inhale pulse ring.
- [ ] Add active-session audio cue modes.
- [ ] Add haptic cues for inhale and exhale.
- [ ] Add Reduce Motion behavior.
- [ ] Persist session start locally.
- [ ] Persist completion before end sequence.
- [ ] Add wake-from-background phase reconciliation.
- [ ] Verify 5-minute 4-7-8 session on real iOS.
- [ ] Verify 5-minute 4-7-8 session on real Android.
