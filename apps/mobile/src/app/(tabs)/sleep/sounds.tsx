import { useLocalSearchParams } from "expo-router";

import { SoundMixerScreen, parseSoundMixerUIVariant } from "../../../sleep/sound-mixer-screen";

export default function SoundMixerAnchorScreen() {
  const params = useLocalSearchParams<{ uiVariant?: string | string[] }>();

  return <SoundMixerScreen uiVariant={parseSoundMixerUIVariant(params.uiVariant)} />;
}
