# Feature: Breathing Visual Pacer and Sessions

Phase: MVP

## Summary

The breathing visual pacer is the core product animation: a multi-layer orb that guides inhale, hold, exhale, and optional hold phases with synchronized text, audio cues, and haptics. It must be smooth enough to communicate the app's value in a 15-second recording and reliable enough to complete full sessions without losing progress.

Evidence and copy boundaries are defined in [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md). Treat breathing sessions as wellness practices, not insomnia, anxiety, panic, or medical treatment.

## User Stories

- As a user, I want the orb to clearly show when to inhale, hold, and exhale.
- As a user with my eyes closed, I want audio and haptic cues to help me follow the session.
- As a user who knows breathwork, I want techniques named explicitly.
- As a user whose app backgrounds or crashes near completion, I want the session saved reliably.

## MVP Scope

- Five-layer orb with core, inner glow, mid diffusion, outer glow, and pulse ring. [Animation Source Alignment](../engineering/animation-source-alignment.md) resolves layer-count conflicts.
- Phase text: Inhale, Hold, Exhale.
- Audio modes: none, gentle bell, soft whoosh, nature ambient under phase audio.
- Haptics while active and screen-on:
  - Light haptic on inhale transition.
  - Soft or closest gentle haptic on exhale transition.
- Launch techniques from MVP roadmap:
  - 4-7-8 breathing as a bedtime relaxation cadence.
  - Box breathing for calm, focus, and grounding.
  - Coherent Breathing / Daily Calm, 5.5 seconds in and 5.5 seconds out, as a regular 10-minute Evening Wind-Down or Daily Practice session.
  - Diaphragmatic breathing as a no-hold stress-reset option.
- Source note: [Feature Deep Specs](../product/feature-deep-specs.md) also defines Physiological Sigh as a post-MVP acute-reset candidate. Preserve it in the technique catalog as post-MVP or an explicit replacement candidate before tickets are written.
- Hold-based techniques must include a simple "stop, skip holds, or switch to a no-hold rhythm if uncomfortable" safety path before public launch.
- Session completion persists before end screens, share prompts, animations, or upsells.

## Out Of Scope

- Large breathwork library.
- Clinical treatment claims.
- Claims that any technique guarantees sleep improvement, treats anxiety, treats panic, or replaces medical care.
- Decorative orb loops that can drift away from actual phase timing.
- Screen-lock haptic guarantee if platform behavior prevents it.
- Removing or weakening visual behavior after users depend on it.

## Acceptance Criteria

- 4-7-8 session runs smoothly for 5 minutes on real iOS and Android devices.
- Tap Start to first breath phase is less than 500 ms.
- All five orb layers derive from the same breath phase timer.
- Orb scale, phase text, audio cues, and phase state stay synchronized.
- App wake returns to the correct current phase.
- Audio cues remain the reliable locked-screen guidance layer.
- Session completion is saved before completion animation or paywall.
- The visual remains consistent with the Midnight Indigo palette.
- Technique descriptions stay aligned with the Sleep and Breathwork Technique Audit.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [Breathing Orb Implementation Spec](../design/breathing-orb-implementation-spec.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Animation Source Alignment](../engineering/animation-source-alignment.md)
- [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Animation Engineering Index](../engineering/animation-engineering-index.md)
- [Breathing Orb Code Pattern](../engineering/breathing-orb-code-pattern.md)
- [Haptics, Reduce Motion, And Timing](../engineering/haptics-reduce-motion-timing.md)

## Data And Backend Needs

- Local technique definitions include name, phase timings, labels, context, session role, free or premium availability, and localization keys.
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

## Active-Session Audio Implementation Notes

- Phase audio modes are none, gentle bell, soft whoosh, and nature ambient under phase cues.
- Phase cues use bundled local audio assets, so first breath does not depend on network or CDN availability.
- iOS background audio is declared with `UIBackgroundModes: ["audio"]`, and active sessions configure `expo-audio` with `shouldPlayInBackground`, `playsInSilentMode`, and non-recording playback.
- Locked-screen guidance is audio-first. Do not promise locked-screen haptics unless a real-device proof run confirms platform behavior.
- Real locked-screen proof requires a rebuilt iOS binary after the background audio config is present; JavaScript-only export is not enough to prove this native behavior.

## Task Checklist

- [ ] Define local technique catalog for MVP techniques.
- [ ] Add Coherent Breathing / Daily Calm as a 5.5/5.5 regular-practice technique.
- [ ] Add source note for Physiological Sigh conflict before ticket creation.
- [ ] Build breath session controller with phase, phase start time, duration, cycle count, and total duration.
- [ ] Build five-layer orb visual from the animation source alignment.
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
