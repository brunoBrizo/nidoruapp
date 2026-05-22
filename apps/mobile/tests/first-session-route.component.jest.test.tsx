import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";

const mockUseLocalSearchParams = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("../src/session/first-session-screen", () => ({
  BreathSessionRouteScreen: jest.fn(() => null),
  FirstSessionRouteScreen: jest.fn(() => null),
}));

import {
  BreathSessionRouteScreen,
  FirstSessionRouteScreen,
} from "../src/session/first-session-screen";
import BreatheTechniqueAnchorScreen from "../src/app/(tabs)/breathe/[technique]";

describe("BreatheTechniqueAnchorScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns first-launch reward completion to personalization through the first-session wrapper", () => {
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
    expect(BreathSessionRouteScreen).not.toHaveBeenCalled();
  });

  it("launches normal Breathe-tab sessions through the generic breath-session route", () => {
    mockUseLocalSearchParams.mockReturnValue({
      technique: "coherent-breathing",
    });

    render(<BreatheTechniqueAnchorScreen />);

    expect(BreathSessionRouteScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({
        postRewardRoute: "/post-value",
        source: "breathe_tab",
        techniqueId: "coherent-breathing",
      }),
      undefined,
    );
    expect(FirstSessionRouteScreen).not.toHaveBeenCalled();
  });

  it("falls back through the typed route policy for post-MVP techniques and invalid durations", () => {
    mockUseLocalSearchParams.mockReturnValue({
      durationSeconds: "1801",
      technique: "physiological-sigh",
    });

    render(<BreatheTechniqueAnchorScreen />);

    expect(BreathSessionRouteScreen).toHaveBeenLastCalledWith(
      expect.not.objectContaining({
        durationSeconds: expect.any(Number),
      }),
      undefined,
    );
    expect(BreathSessionRouteScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({
        postRewardRoute: "/post-value",
        source: "breathe_tab",
        techniqueId: "4-7-8-sleep",
      }),
      undefined,
    );
  });

  it("preserves valid duration bounds for regular sessions without a plan id", () => {
    mockUseLocalSearchParams.mockReturnValue({
      durationSeconds: "600",
      planId: "not-a-plan",
      technique: "box-breathing",
    });

    render(<BreatheTechniqueAnchorScreen />);

    expect(BreathSessionRouteScreen).toHaveBeenLastCalledWith(
      expect.objectContaining({
        durationSeconds: 600,
        postRewardRoute: "/post-value",
        source: "breathe_tab",
        techniqueId: "box-breathing",
      }),
      undefined,
    );
    expect(BreathSessionRouteScreen).toHaveBeenLastCalledWith(
      expect.not.objectContaining({
        planId: expect.any(String),
      }),
      undefined,
    );
  });
});
