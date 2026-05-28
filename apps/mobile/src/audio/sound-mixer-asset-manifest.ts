import {
  launchSoundCatalog,
  type LaunchSoundCatalogItem,
  type LaunchSoundId,
} from "@nidoru/domain";

export type SoundMixerBundledAssetManifestItem = {
  readonly audioFormat: LaunchSoundCatalogItem["audioFormat"];
  readonly durationSeconds: LaunchSoundCatalogItem["durationSeconds"];
  readonly licenseSource: LaunchSoundCatalogItem["licenseSource"];
  readonly licenseStatus: LaunchSoundCatalogItem["licenseStatus"];
  readonly loop: LaunchSoundCatalogItem["loop"];
  readonly loopReviewStatus: LaunchSoundCatalogItem["loopReviewStatus"];
  readonly minimumDurationSeconds: LaunchSoundCatalogItem["minimumDurationSeconds"];
  readonly shipStatus: LaunchSoundCatalogItem["shipStatus"];
  readonly soundId: LaunchSoundId;
  readonly targetAssetPath: LaunchSoundCatalogItem["bundledAssetPath"];
};

export const soundMixerBundledAssetManifest: readonly SoundMixerBundledAssetManifestItem[] =
  launchSoundCatalog.map((sound) => ({
    audioFormat: sound.audioFormat,
    durationSeconds: sound.durationSeconds,
    licenseSource: sound.licenseSource,
    licenseStatus: sound.licenseStatus,
    loop: sound.loop,
    loopReviewStatus: sound.loopReviewStatus,
    minimumDurationSeconds: sound.minimumDurationSeconds,
    shipStatus: sound.shipStatus,
    soundId: sound.id,
    targetAssetPath: sound.bundledAssetPath,
  }));

export const shippableSoundMixerBundledAssets = soundMixerBundledAssetManifest.filter(
  (sound) => sound.shipStatus === "bundled_verified",
);

export function getSoundMixerBundledAssetManifestItem(soundId: LaunchSoundId) {
  return soundMixerBundledAssetManifest.find((sound) => sound.soundId === soundId);
}
