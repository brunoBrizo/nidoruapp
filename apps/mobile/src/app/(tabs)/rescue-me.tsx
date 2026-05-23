import { useLocalSearchParams } from "expo-router";

import { RescueMeScreen, parseRescueMeScreenState } from "../../rescue/rescue-me-screen";

export default function RescueMeAnchorScreen() {
  const params = useLocalSearchParams<{ state?: string | string[] }>();

  return <RescueMeScreen state={parseRescueMeScreenState(params.state)} />;
}
