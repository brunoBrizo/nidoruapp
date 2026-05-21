import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { FirstLaunchOnboardingGateBase } from "../src/onboarding/first-launch-onboarding-gate";

describe("FirstLaunchOnboardingGate", () => {
  it("keeps first launch on the splash while routing unfinished installs into onboarding", async () => {
    const replaceRoute = jest.fn();

    render(
      <FirstLaunchOnboardingGateBase
        loadShouldStartOnboarding={() => Promise.resolve(true)}
        replaceRoute={replaceRoute}
      >
        <Text>Home content</Text>
      </FirstLaunchOnboardingGateBase>,
    );

    expect(screen.getByTestId("onboarding-splash-screen")).toBeTruthy();
    expect(screen.queryByText("Home content")).toBeNull();

    await waitFor(() => {
      expect(replaceRoute).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("renders Home after local onboarding completion is already recorded", async () => {
    render(
      <FirstLaunchOnboardingGateBase
        loadShouldStartOnboarding={() => Promise.resolve(false)}
        replaceRoute={jest.fn()}
      >
        <Text>Home content</Text>
      </FirstLaunchOnboardingGateBase>,
    );

    await screen.findByText("Home content");
    expect(screen.queryByTestId("onboarding-splash-screen")).toBeNull();
  });
});
