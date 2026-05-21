import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

const mockUseLocalSearchParams = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("../src/session/first-session-screen", () => ({
  FirstSessionRouteScreen: jest.fn(() => null),
}));

import { FirstSessionRouteScreen } from "../src/session/first-session-screen";
import BreatheTechniqueAnchorScreen from "../src/app/(tabs)/breathe/[technique]";

describe("BreatheTechniqueAnchorScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns first-launch reward completion to personalization instead of post-value", () => {
    mockUseLocalSearchParams.mockReturnValue({
      durationSeconds: "240",
      firstLaunch: "1",
      planId: "sleep_focused",
      technique: "4-7-8-sleep",
    });

    render(<BreatheTechniqueAnchorScreen />);

    expect(FirstSessionRouteScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        durationSeconds: 240,
        planId: "sleep_focused",
        postRewardRoute: {
          params: { stage: "personalization" },
          pathname: "/onboarding",
        },
        techniqueId: "4-7-8-sleep",
      }),
      undefined,
    );
  });

  it("keeps normal Breathe-tab sessions on the post-value reward route", () => {
    mockUseLocalSearchParams.mockReturnValue({
      technique: "coherent-breathing",
    });

    render(<BreatheTechniqueAnchorScreen />);

    expect(FirstSessionRouteScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({
        postRewardRoute: "/post-value",
        techniqueId: "coherent-breathing",
      }),
      undefined,
    );
  });
});
