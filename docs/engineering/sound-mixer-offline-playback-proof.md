# Sound Mixer Offline Playback Proof

Date: 2026-05-28
ClickUp task: `06.IMP.10 Prove all bundled sounds offline, loop quality, and startup performance`

## Result

This ticket cannot be completed in the current checkout because only 12 of the 14 launch Sound Mixer audio files are committed, the two Tones files are still missing, and manual loop review plus physical locked-device startup proof are still outstanding.

The 12 committed files are normalized to the expected catalog slugs, carry CC0 source records, statically import into the Expo asset graph, and wire through the Sound Mixer route into the native playback controller.

Current file inventory:

```sh
test -d apps/mobile/assets/audio/sleep && find apps/mobile/assets/audio/sleep -maxdepth 1 -type f | sort || printf 'apps/mobile/assets/audio/sleep: absent\n'
```

Result on 2026-05-28:

```text
apps/mobile/assets/audio/sleep/brown-noise.m4a
apps/mobile/assets/audio/sleep/cafe-ambience.m4a
apps/mobile/assets/audio/sleep/fireplace-crackling.m4a
apps/mobile/assets/audio/sleep/forest.m4a
apps/mobile/assets/audio/sleep/heavy-rain.m4a
apps/mobile/assets/audio/sleep/light-rain.m4a
apps/mobile/assets/audio/sleep/ocean-waves.m4a
apps/mobile/assets/audio/sleep/pink-noise.m4a
apps/mobile/assets/audio/sleep/rain-on-window.m4a
apps/mobile/assets/audio/sleep/river-stream.m4a
apps/mobile/assets/audio/sleep/thunderstorm.m4a
apps/mobile/assets/audio/sleep/wind.m4a
```

Missing launch target files:

```text
apps/mobile/assets/audio/sleep/432hz-tone.m4a
apps/mobile/assets/audio/sleep/delta-wave-binaural.m4a
```

Bundle weight:

```text
81M apps/mobile/assets/audio/sleep
```

## Per-Sound Proof Matrix

| Sound | Target bundled asset | Offline playback result | Startup measurement | Loop review result |
| --- | --- | --- | --- | --- |
| Light Rain | `apps/mobile/assets/audio/sleep/light-rain.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Heavy Rain | `apps/mobile/assets/audio/sleep/heavy-rain.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Rain on Window | `apps/mobile/assets/audio/sleep/rain-on-window.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Thunderstorm | `apps/mobile/assets/audio/sleep/thunderstorm.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Ocean Waves | `apps/mobile/assets/audio/sleep/ocean-waves.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Forest | `apps/mobile/assets/audio/sleep/forest.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| River Stream | `apps/mobile/assets/audio/sleep/river-stream.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Wind | `apps/mobile/assets/audio/sleep/wind.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Brown Noise | `apps/mobile/assets/audio/sleep/brown-noise.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Pink Noise | `apps/mobile/assets/audio/sleep/pink-noise.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Fireplace Crackling | `apps/mobile/assets/audio/sleep/fireplace-crackling.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| Cafe Ambience | `apps/mobile/assets/audio/sleep/cafe-ambience.m4a` | Wired to bundled static asset, no network fallback | Automated route/controller proof only; device startup not measured | Blocked: manual audible loop review pending |
| 432Hz Tone | `apps/mobile/assets/audio/sleep/432hz-tone.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Delta Wave Binaural | `apps/mobile/assets/audio/sleep/delta-wave-binaural.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |

## Three-Layer Mix Proof

`apps/mobile/tests/sound-mixer-playback-controller.unit.jest.test.ts` verifies the playback controller with injected bundled-local asset sources:

- starts three offline layers,
- creates one `expo-audio` player per layer,
- sets `loop = true` on every layer,
- keeps independent volumes,
- keeps missing launch assets blocked without network fallback,
- avoids leaking local paths or URLs into audio failure telemetry.

`apps/mobile/tests/sound-mixer-screen.component.jest.test.tsx` verifies that the screen starts the default three active layers when a native playback controller is provided. `SoundMixerRouteScreen` now provides the static asset-backed controller in app runtime.

This proves automated route/controller behavior for the available files, not final shippability, because there are currently zero manually loop-reviewed launch Sound Mixer assets.

## Verification

Passed:

```sh
pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects unit apps/mobile/tests/launch-catalog.unit.jest.test.ts apps/mobile/tests/sound-mixer-playback-controller.unit.jest.test.ts
```

Result: 25 unit suites passed, 162 tests passed.

```sh
pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects component apps/mobile/tests/sound-mixer-screen.component.jest.test.tsx
```

Result: 22 component suites passed, 194 tests passed.

```sh
pnpm --filter @nidoru/mobile typecheck
```

Result: passed.

```sh
pnpm --filter @nidoru/mobile lint
```

Result: passed.

```sh
pnpm --filter @nidoru/mobile exec expo export --platform ios
```

Result: passed; export listed all 12 committed `assets/audio/sleep/*.m4a` files in the iOS asset bundle.

```text
XcodeBuildMCP build_run_sim
```

Result: passed on iPhone 17 simulator. The development build launched and loaded the app through Metro.

Blocked or failed:

Native network-disabled playback proof on a physical locked device was not completed in this pass. With two missing Tones files and no manual loop review, final startup latency or all-sound loop-quality numbers would still be incomplete.

## Closeout Decision

Move ClickUp task `86e1k5hm1` to `Needs Review`, not `complete`.

Exact next step: add the two missing licensed AAC-LC `.m4a` files, attach license records for those Tones sounds, complete manual loop review, update the catalog entries from blocked to verified, then rerun native network-disabled startup and locked-device loop review for each sound.

No audio assets, lockfiles, dependency inventories, or scan results were uploaded to external services for this proof.
