# Feature: Sleep Sound Mixer and Offline Audio

Phase: MVP

## Summary

The sleep sound mixer lets users layer curated ambient sounds with independent volume and a sleep timer that fades out cleanly. It is both a retention feature and a shareable product surface. The default sound experience must work offline and avoid buffering at bedtime. Sound copy should frame audio as masking, preference, and routine support rather than proven sleep treatment.

## User Stories

- As a user going to sleep, I want reliable sounds that do not buffer or stop suddenly.
- As a user who likes customization, I want to combine 2-3 sounds and control each volume.
- As a user with a favorite mix, I want to save it and reuse it quickly.
- As a light sleeper, I want the timer to fade out gradually instead of cutting off.

## MVP Scope

- Launch library: 15 curated sounds from the accepted Sound Mixer UI contract.
- Categories:
  - Rain: Light Rain, Heavy Rain, Rain on Window, Thunderstorm.
  - Nature: Ocean Waves, Forest, River Stream, Wind.
  - Noise: Brown Noise, Pink Noise.
  - Environment: Fireplace Crackling, Cafe Ambience, Fan.
  - Tones: 432Hz Tone, Delta Wave Binaural as experimental/preference audio, not premium proof points.
- Each sound is minimum 4 minutes, seamlessly looped with no audible click.
- Two-column sound-card grid.
- Active sounds highlighted with Iris; inactive sounds use Haze.
- Circular volume ring per sound.
- Users can mix 2-3 layers with independent volume.
- Sleep timer supports 20, 30, 45, 60, and infinity where product UI allows.
- Timer fade-out lasts 2 minutes.
- Timer-ended playback releases keep-awake or power-management locks so the device can dim and lock naturally.
- Save up to 3 mixes.
- Base sound pack works offline.

## Out Of Scope

- Network-required default sleep sound.
- Large ambient library at launch.
- AI-generated audio.
- Unlicensed audio.
- Abrupt timer cutoff.
- Complex Smart Mix in MVP.
- Claims that pink/brown noise, 432 Hz, binaural, or delta-wave tracks are clinically proven to improve sleep.

## Acceptance Criteria

- Cached or bundled audio starts in less than 500 ms.
- All 15 bundled sounds play offline.
- All 15 bundled sounds loop without audible clicks.
- Three-layer sound mix works with independent volume.
- Sleep timer begins a 2-minute fade before the end.
- Sleep timer releases keep-awake or power-management locks when playback ends.
- Interface fades to fully dark after 30 seconds of no interaction while audio continues.
- User always knows whether audio will stop, fade, or continue.
- Public copy avoids clinical efficacy claims for tones, binaural tracks, and colored noise.
- Launch catalog, licensing, and asset readiness source of truth lives in `docs/engineering/sound-mixer-launch-catalog-manifest.md` and `packages/domain/src/index.ts`.

## UX References

- [Feature Deep Specs](../product/feature-deep-specs.md)
- [MVP Scope and Roadmap](../product/mvp-scope-and-roadmap.md)
- [Onboarding and Retention](../ux/onboarding-retention.md)
- [Competitor UI/UX Response Plan](../research/competitor-uiux-response-plan.md)
- [Sleep and Breathwork Technique Audit](../research/sleep-breathwork-technique-audit.md)

## Engineering References

- [Tech Stack Decision Record](../architecture/tech-stack-proposal.md)
- [Technical Foundation](../architecture/technical-foundation.md)
- [Motion, Animation, And Haptics](../design/motion-animation-haptics.md)
- [Glass, Background, And Loading States](../engineering/glass-background-loading-states.md)

## Data And Backend Needs

- Local sound asset catalog for bundled sounds.
- Local saved mixes with sound IDs, volumes, and timer preference.
- Playback state includes whether a keep-awake or power-management lock is active.
- Supabase `sound_assets`, `sound_asset_translations`, and `sound_mixes` for metadata and sync.
- Cloudflare R2 for remote story, premium, or large audio; default MVP sounds do not depend on R2 to play.
- Entitlement can limit premium access, but active audio is never interrupted by entitlement checks.

## Analytics Events

- `audio_started`
- `audio_failed`
- `sound_mix_saved`
- `sync_failed` for saved-mix sync failure.

## Edge Cases And Failure States

- If network is unavailable, bundled sounds still work.
- If remote media metadata is stale, cached playable media remains usable.
- If audio is interrupted by call, alarm, headphone, or Bluetooth change, app resumes gracefully or shows clear stop state.
- If entitlement fetch fails, do not interrupt active audio.
- If fade-out starts while app is backgrounded, timer behavior remains consistent.
- If timer playback ends while the app is backgrounded or locked, release keep-awake or power-management locks.

## Task Checklist

- [ ] Confirm licensing source for each launch sound.
- [ ] Prepare AAC-LC `.m4a` loop files.
- [ ] Verify each loop has no audible click.
- [ ] Add bundled sound catalog metadata.
- [ ] Build sound-card grid.
- [ ] Add active/inactive sound states.
- [ ] Add circular volume ring control.
- [ ] Add 2-3 layer mixing.
- [ ] Add sleep timer options.
- [ ] Add 2-minute fade-out.
- [ ] Release keep-awake or power-management locks after timer-ended playback.
- [ ] Add idle UI fade to dark after 30 seconds.
- [ ] Add saved mixes with max 3.
- [ ] Persist mixes locally.
- [ ] Sync saved mixes after auth exists.
- [ ] Verify all 15 bundled sounds offline.
- [ ] Verify locked-screen/background playback.
- [ ] Verify timer-ended playback lets the device dim and lock naturally.
