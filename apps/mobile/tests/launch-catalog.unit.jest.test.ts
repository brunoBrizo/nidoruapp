import { describe, expect, it } from "@jest/globals";
import { breathTechniques, launchSoundCatalog, launchSoundIds } from "@nidoru/domain";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  shippableSoundMixerBundledAssets,
  soundMixerBundledAssetManifest,
} from "../src/audio/sound-mixer-asset-manifest";
import { soundMixerPlaybackAssetIds } from "../src/audio/sound-mixer-playback-assets";

const committedSleepAssetIds = [
  "light-rain",
  "heavy-rain",
  "rain-on-window",
  "thunderstorm",
  "ocean-waves",
  "forest",
  "river-stream",
  "wind",
  "brown-noise",
  "pink-noise",
  "fireplace-crackling",
  "cafe-ambience",
] as const;

const committedSleepAssetIdSet = new Set<string>(committedSleepAssetIds);

const committedSleepAssetMetadata = {
  "brown-noise": {
    durationSeconds: 604.251,
    licenseSource:
      "Brownoisebasstretch.mp3 by stoicalm -- https://freesound.org/s/148869/ -- License: Creative Commons 0",
  },
  "cafe-ambience": {
    durationSeconds: 266.433,
    licenseSource:
      "NYC-diner-2-ambience-ambiance-by-EDLUNDART.wav by edlundart -- https://freesound.org/s/515719/ -- License: Creative Commons 0",
  },
  "fireplace-crackling": {
    durationSeconds: 714,
    licenseSource:
      "Aachen_Burning Fireplace Crackling Fire Sounds.wav by visionear -- https://freesound.org/s/501417/ -- License: Creative Commons 0",
  },
  forest: {
    durationSeconds: 287.845,
    licenseSource:
      "a morning in spring by leserhia -- https://freesound.org/s/648731/ -- License: Creative Commons 0",
  },
  "heavy-rain": {
    durationSeconds: 254.208,
    licenseSource:
      "FloridaRainUnderTinRoofPorch20170828.mp3 by LonnieWest -- https://freesound.org/s/400825/ -- License: Creative Commons 0",
  },
  "light-rain": {
    durationSeconds: 400,
    licenseSource:
      "Rain heavy 1 (rural) by jmbphilmes -- https://freesound.org/s/200270/ -- License: Creative Commons 0",
  },
  "ocean-waves": {
    durationSeconds: 292.48,
    licenseSource:
      "waves_1.wav by haldigital97 -- https://freesound.org/s/241824/ -- License: Creative Commons 0",
  },
  "pink-noise": {
    durationSeconds: 243.213,
    licenseSource:
      "pink_noise_ref_-14dB.wav by lartti -- https://freesound.org/s/517215/ -- License: Creative Commons 0",
  },
  "rain-on-window": {
    durationSeconds: 861.465,
    licenseSource:
      "NATURE_RAIN_THUNDER_WINDOW_INTERIOR.wav by keng-wai-chane-chick-te -- https://freesound.org/s/554660/ -- License: Creative Commons 0",
  },
  "river-stream": {
    durationSeconds: 366.1,
    licenseSource:
      "Relaxing River Sound by IceVFX -- https://freesound.org/s/722875/ -- License: Creative Commons 0",
  },
  thunderstorm: {
    durationSeconds: 268.925,
    licenseSource:
      "LONG THUNDER ROLLS AND HEAVY RAIN.wav by Alex_hears_things -- https://freesound.org/s/376810/ -- License: Creative Commons 0",
  },
  wind: {
    durationSeconds: 407.389,
    licenseSource:
      "Pink Lakes Wind Atmos #2 by kangaroovindaloo -- https://freesound.org/s/266656/ -- License: Creative Commons 0",
  },
} as const;

describe("launch catalog", () => {
  it("keeps the first sleep technique and launch sounds available", () => {
    expect(breathTechniques["4-7-8-sleep"].phases).toHaveLength(3);
    expect(launchSoundIds).toContain("light-rain");
  });

  it("defines coherent breathing as the Daily Calm steady cadence", () => {
    expect(breathTechniques["coherent-breathing"].primaryContext).toBe(
      "Daily Calm / steady practice",
    );
    expect(breathTechniques["coherent-breathing"].phases).toEqual([
      { name: "inhale", durationMs: 5500 },
      { name: "exhale", durationMs: 5500 },
    ]);
  });

  it("keeps the Sound Mixer launch catalog aligned with the bundled asset manifest", () => {
    expect(launchSoundIds).toHaveLength(14);
    expect(launchSoundCatalog).toHaveLength(14);
    expect(soundMixerBundledAssetManifest).toHaveLength(14);
    expect(soundMixerBundledAssetManifest.map((sound) => sound.soundId)).toEqual([
      ...launchSoundIds,
    ]);
    expect(new Set(soundMixerBundledAssetManifest.map((sound) => sound.targetAssetPath)).size).toBe(
      14,
    );

    for (const sound of soundMixerBundledAssetManifest) {
      expect(sound.targetAssetPath).toBe(`apps/mobile/assets/audio/sleep/${sound.soundId}.m4a`);
      expect(sound.audioFormat).toBe("aac-lc-m4a");
      expect(sound.minimumDurationSeconds).toBe(240);
      expect(sound.loop).toBe(true);
    }
  });

  it("registers the committed static Sound Mixer playback assets", () => {
    expect(soundMixerPlaybackAssetIds).toEqual([...committedSleepAssetIds]);
    expect(soundMixerPlaybackAssetIds).not.toContain("432hz-tone");
    expect(soundMixerPlaybackAssetIds).not.toContain("delta-wave-binaural");
  });

  it("keeps licensed-but-unreviewed Sound Mixer loops blocked until final proof", () => {
    const repoRoot = resolve(__dirname, "../../..");

    expect(shippableSoundMixerBundledAssets).toHaveLength(0);

    for (const sound of soundMixerBundledAssetManifest) {
      expect(existsSync(resolve(repoRoot, sound.targetAssetPath))).toBe(
        committedSleepAssetIdSet.has(sound.soundId),
      );
      const metadata =
        committedSleepAssetMetadata[sound.soundId as keyof typeof committedSleepAssetMetadata];

      if (metadata) {
        expect(sound.durationSeconds).toBe(metadata.durationSeconds);
        expect(sound.licenseStatus).toBe("licensed");
        expect(sound.licenseSource).toBe(metadata.licenseSource);
        expect(sound.loopReviewStatus).toBe("blocked_loop_review_pending");
      } else {
        expect(sound.durationSeconds).toBeNull();
        expect(sound.licenseStatus).toBe("blocked_missing_license");
        expect(sound.licenseSource).toMatch(/^BLOCKED:/);
        expect(sound.loopReviewStatus).toBe("blocked_missing_audio");
      }

      expect(sound.shipStatus).toBe("blocked_missing_licensed_audio");
    }
  });
});
