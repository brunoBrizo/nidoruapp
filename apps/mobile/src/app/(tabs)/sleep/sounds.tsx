import { useLocalSearchParams } from "expo-router";

import { SoundMixerRouteScreen } from "../../../sleep/sound-mixer-route";
import { parseSoundMixerUIVariant } from "../../../sleep/sound-mixer-screen";

export default function SoundMixerAnchorScreen() {
  const params = useLocalSearchParams<{ uiVariant?: string | string[] }>();

  return <SoundMixerRouteScreen uiVariant={parseSoundMixerUIVariant(params.uiVariant)} />;
}
