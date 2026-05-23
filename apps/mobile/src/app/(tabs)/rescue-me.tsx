import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";

import { RescueMeScreen, parseOptionalRescueMeScreenState } from "../../rescue/rescue-me-screen";
import { RescueMeSessionRoute } from "../../rescue/rescue-me-session-route";

export default function RescueMeAnchorScreen() {
  const params = useLocalSearchParams<{ state?: string | string[] }>();
  const router = useRouter();
  const state = parseOptionalRescueMeScreenState(params.state);
  const returnHome = useCallback(() => {
    router.navigate("/");
  }, [router]);

  if (state) {
    return <RescueMeScreen onReturnHome={returnHome} state={state} />;
  }

  return <RescueMeSessionRoute />;
}
