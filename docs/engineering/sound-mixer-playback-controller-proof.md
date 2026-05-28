# Sound Mixer Playback Controller Proof

Ticket: `06.IMP.02 Implement bundled offline multi-layer playback with independent volume`

Date: 2026-05-28

## Implemented

- Added `apps/mobile/src/audio/sound-mixer-playback-controller.ts` as the Feature 06 native playback seam.
- Added `apps/mobile/src/audio/sound-mixer-playback-assets.ts` as the static Expo asset-source map for the 12 committed sleep loops.
- Wired `SoundMixerRouteScreen` to create the native playback controller with the committed sleep-loop sources.
- The controller uses `expo-audio`, background-safe audio mode, one `AudioPlayer` per active layer, looping playback, lock-screen metadata, and the shared sleep-timer power controller.
- Active layers are limited to the domain maximum of three layers.
- Each layer keeps an independent base volume and timer fade scales those volumes proportionally.
- The controller supports active-layer sync, timer ticks, manual stop, interruption stop, and route release cleanup.
- Missing bundled asset sources fail closed without network fallback.
- Sound Mixer analytics are limited to coarse privacy-safe properties: mode, failure class, active layer count, and timer duration.

## Verified

- `pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects unit apps/mobile/tests/sound-mixer-playback-controller.unit.jest.test.ts`
- `pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects component apps/mobile/tests/sound-mixer-screen.component.jest.test.tsx`
- `pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects unit apps/mobile/tests/observability-privacy.unit.jest.test.ts`
- `pnpm --filter @nidoru/mobile typecheck`
- `pnpm --filter @nidoru/mobile lint`

## Remaining Proof Boundary

Twelve launch Sound Mixer loop files are now committed under `apps/mobile/assets/audio/sleep/` and statically imported for native playback. The two Tones assets are still missing:

- `apps/mobile/assets/audio/sleep/432hz-tone.m4a`
- `apps/mobile/assets/audio/sleep/delta-wave-binaural.m4a`

The source of truth in `docs/engineering/sound-mixer-launch-catalog-manifest.md`, `packages/domain/src/index.ts`, and `apps/mobile/tests/launch-catalog.unit.jest.test.ts` intentionally keeps every launch sound blocked from shipping. The 12 committed loops now carry CC0 source records, while the two missing Tones files still carry missing-license status:

- `licenseStatus = licensed` for the 12 committed CC0 loops.
- `licenseStatus = blocked_missing_license` for the two missing Tones files.
- `loopReviewStatus = blocked_loop_review_pending` for the 12 committed loops.
- `loopReviewStatus = blocked_missing_audio` for the two missing Tones files.
- `shipStatus = blocked_missing_licensed_audio`

Because manual loop review, two Tones files, and physical locked-device audio proof are still outstanding, this work proves controller behavior and route wiring for the available files, but it cannot honestly close all 14 launch sounds as shippable.
