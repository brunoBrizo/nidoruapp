import type { LaunchSoundId } from "@nidoru/domain";

import brownNoiseAsset from "../../assets/audio/sleep/brown-noise.m4a";
import cafeAmbienceAsset from "../../assets/audio/sleep/cafe-ambience.m4a";
import fireplaceCracklingAsset from "../../assets/audio/sleep/fireplace-crackling.m4a";
import forestAsset from "../../assets/audio/sleep/forest.m4a";
import heavyRainAsset from "../../assets/audio/sleep/heavy-rain.m4a";
import lightRainAsset from "../../assets/audio/sleep/light-rain.m4a";
import oceanWavesAsset from "../../assets/audio/sleep/ocean-waves.m4a";
import pinkNoiseAsset from "../../assets/audio/sleep/pink-noise.m4a";
import rainOnWindowAsset from "../../assets/audio/sleep/rain-on-window.m4a";
import riverStreamAsset from "../../assets/audio/sleep/river-stream.m4a";
import thunderstormAsset from "../../assets/audio/sleep/thunderstorm.m4a";
import windAsset from "../../assets/audio/sleep/wind.m4a";
import type { SoundMixerPlaybackAssetSources } from "./sound-mixer-playback-controller";

export const soundMixerPlaybackAssetSources = {
  "light-rain": lightRainAsset,
  "heavy-rain": heavyRainAsset,
  "rain-on-window": rainOnWindowAsset,
  thunderstorm: thunderstormAsset,
  "ocean-waves": oceanWavesAsset,
  forest: forestAsset,
  "river-stream": riverStreamAsset,
  wind: windAsset,
  "brown-noise": brownNoiseAsset,
  "pink-noise": pinkNoiseAsset,
  "fireplace-crackling": fireplaceCracklingAsset,
  "cafe-ambience": cafeAmbienceAsset,
} as const satisfies SoundMixerPlaybackAssetSources;

export const soundMixerPlaybackAssetIds = Object.keys(
  soundMixerPlaybackAssetSources,
) as readonly LaunchSoundId[];
