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

  it("does not treat incomplete or unlicensed Sound Mixer loops as shippable", () => {
    const repoRoot = resolve(__dirname, "../../..");

    expect(shippableSoundMixerBundledAssets).toHaveLength(0);

    for (const sound of soundMixerBundledAssetManifest) {
      expect(existsSync(resolve(repoRoot, sound.targetAssetPath))).toBe(
        committedSleepAssetIdSet.has(sound.soundId),
      );
      expect(sound.durationSeconds).toBeNull();
      expect(sound.licenseStatus).toBe("blocked_missing_license");
      expect(sound.licenseSource).toMatch(/^BLOCKED:/);
      expect(sound.loopReviewStatus).toBe("blocked_missing_audio");
      expect(sound.shipStatus).toBe("blocked_missing_licensed_audio");
    }
  });
});
