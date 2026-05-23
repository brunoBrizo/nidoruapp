import { useLocalSearchParams } from "expo-router";

import { RescueMeScreen, parseOptionalRescueMeScreenState } from "../../rescue/rescue-me-screen";
import { RescueMeSessionRoute } from "../../rescue/rescue-me-session-route";

export default function RescueMeAnchorScreen() {
  const params = useLocalSearchParams<{ state?: string | string[] }>();
  const state = parseOptionalRescueMeScreenState(params.state);

  if (state) {
    return <RescueMeScreen state={state} />;
  }

  return <RescueMeSessionRoute />;
}
