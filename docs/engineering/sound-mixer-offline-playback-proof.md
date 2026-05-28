# Sound Mixer Offline Playback Proof

Date: 2026-05-28
ClickUp task: `06.IMP.10 Prove all bundled sounds offline, loop quality, and startup performance`

## Result

This ticket cannot be completed in the current checkout because the launch Sound Mixer audio files are not committed. The catalog and playback controller are covered by focused automated tests, but native offline startup and loop quality cannot be honestly proven until the 14 licensed launch loops exist under `apps/mobile/assets/audio/sleep/`.

Current file inventory:

```sh
test -d apps/mobile/assets/audio/sleep && find apps/mobile/assets/audio/sleep -maxdepth 1 -type f | sort || printf 'apps/mobile/assets/audio/sleep: absent\n'
```

Result:

```text
apps/mobile/assets/audio/sleep: absent
```

Existing audio files are breath-session assets only:

```text
apps/mobile/assets/audio/breath/gentle-bell-transition.m4a
apps/mobile/assets/audio/breath/nature-ambient-loop.m4a
apps/mobile/assets/audio/breath/soft-whoosh-exhale.m4a
apps/mobile/assets/audio/breath/soft-whoosh-inhale.m4a
```

## Per-Sound Proof Matrix

| Sound | Target bundled asset | Offline playback result | Startup measurement | Loop review result |
| --- | --- | --- | --- | --- |
| Light Rain | `apps/mobile/assets/audio/sleep/light-rain.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Heavy Rain | `apps/mobile/assets/audio/sleep/heavy-rain.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Rain on Window | `apps/mobile/assets/audio/sleep/rain-on-window.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Thunderstorm | `apps/mobile/assets/audio/sleep/thunderstorm.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Ocean Waves | `apps/mobile/assets/audio/sleep/ocean-waves.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Forest | `apps/mobile/assets/audio/sleep/forest.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| River Stream | `apps/mobile/assets/audio/sleep/river-stream.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Wind | `apps/mobile/assets/audio/sleep/wind.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Brown Noise | `apps/mobile/assets/audio/sleep/brown-noise.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Pink Noise | `apps/mobile/assets/audio/sleep/pink-noise.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Fireplace Crackling | `apps/mobile/assets/audio/sleep/fireplace-crackling.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
| Cafe Ambience | `apps/mobile/assets/audio/sleep/cafe-ambience.m4a` | Blocked: file missing, no network fallback allowed | Not measured: no local asset exists to start | Blocked: no audio to review |
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

This proves the controller behavior, not native launch-catalog playback, because there are currently zero shippable launch Sound Mixer assets.

## Verification

Passed:

```sh
pnpm --filter @nidoru/mobile exec jest --runInBand --selectProjects unit apps/mobile/tests/launch-catalog.unit.jest.test.ts apps/mobile/tests/sound-mixer-playback-controller.unit.jest.test.ts
```

Result: 25 unit suites passed, 161 tests passed.

```sh
pnpm --filter @nidoru/mobile typecheck
```

Result: passed.

```sh
pnpm --filter @nidoru/mobile exec expo export --platform ios
```

Result: passed; export listed only the four breath audio files and no `assets/audio/sleep/*.m4a` launch loops.

Blocked or failed:

```sh
pnpm --filter @nidoru/mobile lint
```

Result: failed on an unrelated existing lint issue in `apps/mobile/tests/post-value-sync.unit.jest.test.ts:432` where `values` is defined but unused.

Native network-disabled playback proof was not attempted because every launch Sound Mixer asset is missing. With no local sleep-loop file to load, any startup latency or loop-quality number would be fabricated.

## Closeout Decision

Move ClickUp task `86e1k5hm1` to `Needs Review`, not `complete`.

Exact next step: commit the 16 licensed AAC-LC `.m4a` files under `apps/mobile/assets/audio/sleep/`, update the catalog entries from blocked to verified, then rerun native network-disabled startup and loop review for each sound.

No audio assets, lockfiles, dependency inventories, or scan results were uploaded to external services for this proof.
