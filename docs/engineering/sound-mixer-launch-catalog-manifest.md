# Sound Mixer Launch Catalog And Asset Manifest

Date: 2026-05-28
ClickUp task: `06.IMP.00 Resolve launch sound catalog, licensing, and bundled asset manifest`

## Source Of Truth

The launch Sound Mixer catalog is **12 sounds** after removing the unsuitable audio options from the app.

Current asset state: **12 of 12** target sleep loops are committed under `apps/mobile/assets/audio/sleep/`.

Implementation source:

- Typed catalog: `packages/domain/src/index.ts` exported `launchSoundCatalog`
- Validated ID list: `packages/domain/src/index.ts` exported `launchSoundIds`
- Mobile bundled asset manifest: `apps/mobile/src/audio/sound-mixer-asset-manifest.ts`
- App target asset directory: `apps/mobile/assets/audio/sleep/`

Existing files under `apps/mobile/assets/audio/breath/` are breath-session cue or ambient assets. They are not treated as launch Sound Mixer loops.

## Catalog Manifest

Every launch loop target must be AAC-LC `.m4a`, at least 240 seconds, loopable without an audible click, and licensed for bundled app distribution before playback tickets can treat it as shippable. The 12 committed files pass local format and duration checks and now have CC0 source records, but remain blocked for final shipping until manual loop review passes.

| ID | Display name | Category | Default volume | Target bundled asset | Duration | Loop review | License source | Ship status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `light-rain` | Light Rain | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/light-rain.m4a` | 400.000s verified | Blocked: manual review pending | Rain heavy 1 (rural) by jmbphilmes -- https://freesound.org/s/200270/ -- License: Creative Commons 0 | Blocked |
| `heavy-rain` | Heavy Rain | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/heavy-rain.m4a` | 254.208s verified | Blocked: manual review pending | FloridaRainUnderTinRoofPorch20170828.mp3 by LonnieWest -- https://freesound.org/s/400825/ -- License: Creative Commons 0 | Blocked |
| `rain-on-window` | Rain on Window | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/rain-on-window.m4a` | 861.465s verified | Blocked: manual review pending | NATURE_RAIN_THUNDER_WINDOW_INTERIOR.wav by keng-wai-chane-chick-te -- https://freesound.org/s/554660/ -- License: Creative Commons 0 | Blocked |
| `thunderstorm` | Thunderstorm | Rain | 70% on activation | `apps/mobile/assets/audio/sleep/thunderstorm.m4a` | 268.925s verified | Blocked: manual review pending | LONG THUNDER ROLLS AND HEAVY RAIN.wav by Alex_hears_things -- https://freesound.org/s/376810/ -- License: Creative Commons 0 | Blocked |
| `ocean-waves` | Ocean Waves | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/ocean-waves.m4a` | 292.480s verified | Blocked: manual review pending | waves_1.wav by haldigital97 -- https://freesound.org/s/241824/ -- License: Creative Commons 0 | Blocked |
| `forest` | Forest | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/forest.m4a` | 287.845s verified | Blocked: manual review pending | a morning in spring by leserhia -- https://freesound.org/s/648731/ -- License: Creative Commons 0 | Blocked |
| `river-stream` | River Stream | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/river-stream.m4a` | 366.100s verified | Blocked: manual review pending | Relaxing River Sound by IceVFX -- https://freesound.org/s/722875/ -- License: Creative Commons 0 | Blocked |
| `wind` | Wind | Nature | 70% on activation | `apps/mobile/assets/audio/sleep/wind.m4a` | 407.389s verified | Blocked: manual review pending | Pink Lakes Wind Atmos #2 by kangaroovindaloo -- https://freesound.org/s/266656/ -- License: Creative Commons 0 | Blocked |
| `brown-noise` | Brown Noise | Noise | 70% on activation | `apps/mobile/assets/audio/sleep/brown-noise.m4a` | 604.251s verified | Blocked: manual review pending | Brownoisebasstretch.mp3 by stoicalm -- https://freesound.org/s/148869/ -- License: Creative Commons 0 | Blocked |
| `pink-noise` | Pink Noise | Noise | 70% on activation | `apps/mobile/assets/audio/sleep/pink-noise.m4a` | 243.213s verified | Blocked: manual review pending | pink_noise_ref_-14dB.wav by lartti -- https://freesound.org/s/517215/ -- License: Creative Commons 0 | Blocked |
| `fireplace-crackling` | Fireplace Crackling | Environment | 70% on activation | `apps/mobile/assets/audio/sleep/fireplace-crackling.m4a` | 714.000s verified | Blocked: manual review pending | Aachen_Burning Fireplace Crackling Fire Sounds.wav by visionear -- https://freesound.org/s/501417/ -- License: Creative Commons 0 | Blocked |
| `cafe-ambience` | Cafe Ambience | Environment | 70% on activation | `apps/mobile/assets/audio/sleep/cafe-ambience.m4a` | 266.433s verified | Blocked: manual review pending | NYC-diner-2-ambience-ambiance-by-EDLUNDART.wav by edlundart -- https://freesound.org/s/515719/ -- License: Creative Commons 0 | Blocked |
## Evidence-Safe Notes

- Brown Noise and Pink Noise are preference and masking audio only. Do not make clinical sleep efficacy claims.
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

Missing target files: none.

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
- A real `apps/mobile/assets/audio/sleep/<sound-id>.m4a` file for all 12 launch sounds.
- AAC-LC encoding confirmation.
- Duration confirmation of at least 240 seconds.
- Manual loop review with no audible click at the loop point.
- No embedded private identifiers, creator watermarks, or source URLs in metadata.
- A catalog update changing `licenseStatus`, `durationSeconds`, `loopReviewStatus`, and `shipStatus` only after the file is verified.
