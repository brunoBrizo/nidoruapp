# Sound Mixer Launch Catalog And Asset Manifest

Date: 2026-05-28
ClickUp task: `06.IMP.00 Resolve launch sound catalog, licensing, and bundled asset manifest`

## Source Of Truth

The launch Sound Mixer catalog is **14 sounds** after reducing launch scope. The accepted Sound Mixer UI contract, the handoff HTML, and `packages/domain/src/index.ts` all include two Tones entries, so no named launch sound is dropped from the remaining catalog.

Current asset state: **12 of 14** target sleep loops are committed under `apps/mobile/assets/audio/sleep/`. The missing target assets are `432hz-tone.m4a` and `delta-wave-binaural.m4a`.

Implementation source:

- Typed catalog: `packages/domain/src/index.ts` exported `launchSoundCatalog`
- Validated ID list: `packages/domain/src/index.ts` exported `launchSoundIds`
- Mobile bundled asset manifest: `apps/mobile/src/audio/sound-mixer-asset-manifest.ts`
- App target asset directory: `apps/mobile/assets/audio/sleep/`

Existing files under `apps/mobile/assets/audio/breath/` are breath-session cue or ambient assets. They are not treated as launch Sound Mixer loops.

## Catalog Manifest

Every launch loop target must be AAC-LC `.m4a`, at least 240 seconds, loopable without an audible click, and licensed for bundled app distribution before playback tickets can treat it as shippable. The 12 committed files pass local format and duration checks, but remain blocked for final shipping until license records and manual loop review are attached.

| ID | Display name | Category | Default volume | Target bundled asset | Duration | Loop review | License source | Ship status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `light-rain` | Light Rain | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/light-rain.m4a` | 400.000s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `heavy-rain` | Heavy Rain | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/heavy-rain.m4a` | 254.208s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `rain-on-window` | Rain on Window | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/rain-on-window.m4a` | 861.465s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `thunderstorm` | Thunderstorm | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/thunderstorm.m4a` | 268.925s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `ocean-waves` | Ocean Waves | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/ocean-waves.m4a` | 292.480s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `forest` | Forest | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/forest.m4a` | 287.845s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `river-stream` | River Stream | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/river-stream.m4a` | 366.100s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `wind` | Wind | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/wind.m4a` | 407.389s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `brown-noise` | Brown Noise | Noise | 70% on activation | `apps/mobile/assets/audio/sleep/brown-noise.m4a` | 604.251s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `pink-noise` | Pink Noise | Noise | 70% on activation | `apps/mobile/assets/audio/sleep/pink-noise.m4a` | 243.213s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `fireplace-crackling` | Fireplace Crackling | Environment | 70% on activation | `apps/mobile/assets/audio/sleep/fireplace-crackling.m4a` | 714.000s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `cafe-ambience` | Cafe Ambience | Environment | 70% on activation | `apps/mobile/assets/audio/sleep/cafe-ambience.m4a` | 266.433s verified | Blocked: manual review pending | Blocked: no licensed source committed | Blocked |
| `432hz-tone` | 432Hz Tone | Tones | 70% on activation | `apps/mobile/assets/audio/sleep/432hz-tone.m4a` | Blocked: file missing | Blocked: no audio to review | Blocked: no licensed source committed | Blocked |
| `delta-wave-binaural` | Delta Wave Binaural | Tones | 70% on activation | `apps/mobile/assets/audio/sleep/delta-wave-binaural.m4a` | Blocked: file missing | Blocked: no audio to review | Blocked: no licensed source committed | Blocked |

## Evidence-Safe Notes

- Brown Noise and Pink Noise are preference and masking audio only. Do not make clinical sleep efficacy claims.
- 432Hz Tone and Delta Wave Binaural are experimental preference audio only. Do not present them as clinical sleep aids or premium proof points.
- No network-required, AI-generated, placeholder, or unlicensed audio is shippable for the launch catalog.

## File Inventory

Current launch sleep asset inventory:

```sh
find apps/mobile/assets/audio/sleep -maxdepth 1 -type f
```

Result on 2026-05-28:

- `apps/mobile/assets/audio/sleep/brown-noise.m4a`
- `apps/mobile/assets/audio/sleep/cafe-ambience.m4a`
- `apps/mobile/assets/audio/sleep/fireplace-crackling.m4a`
- `apps/mobile/assets/audio/sleep/forest.m4a`
- `apps/mobile/assets/audio/sleep/heavy-rain.m4a`
- `apps/mobile/assets/audio/sleep/light-rain.m4a`
- `apps/mobile/assets/audio/sleep/ocean-waves.m4a`
- `apps/mobile/assets/audio/sleep/pink-noise.m4a`
- `apps/mobile/assets/audio/sleep/rain-on-window.m4a`
- `apps/mobile/assets/audio/sleep/river-stream.m4a`
- `apps/mobile/assets/audio/sleep/thunderstorm.m4a`
- `apps/mobile/assets/audio/sleep/wind.m4a`

Missing target files:

- `apps/mobile/assets/audio/sleep/432hz-tone.m4a`
- `apps/mobile/assets/audio/sleep/delta-wave-binaural.m4a`

Current total sleep-loop bundle weight:

```text
81M apps/mobile/assets/audio/sleep
```

Current breath audio inventory:

```sh
find apps/mobile/assets/audio -maxdepth 3 -type f | sort
```

Result:

- `apps/mobile/assets/audio/breath/gentle-bell-transition.m4a`
- `apps/mobile/assets/audio/breath/nature-ambient-loop.m4a`
- `apps/mobile/assets/audio/breath/soft-whoosh-exhale.m4a`
- `apps/mobile/assets/audio/breath/soft-whoosh-inhale.m4a`

## Audio Loop Review Checklist

Before moving playback implementation tickets beyond Needs Review, each catalog entry must have:

- A committed source/license record proving bundled app distribution rights.
- A real `apps/mobile/assets/audio/sleep/<sound-id>.m4a` file for all 14 launch sounds.
- AAC-LC encoding confirmation.
- Duration confirmation of at least 240 seconds.
- Manual loop review with no audible click at the loop point.
- No embedded private identifiers, creator watermarks, or source URLs in metadata.
- A catalog update changing `licenseStatus`, `durationSeconds`, `loopReviewStatus`, and `shipStatus` only after the file is verified.
