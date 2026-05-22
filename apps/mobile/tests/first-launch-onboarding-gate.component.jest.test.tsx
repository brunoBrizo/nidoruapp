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

  it("does not re-check onboarding when only the route replacement callback changes", async () => {
    const loadShouldStartOnboarding = jest.fn<() => Promise<boolean>>(() => Promise.resolve(false));
    const firstReplaceRoute = jest.fn();

    const { rerender } = render(
      <FirstLaunchOnboardingGateBase
        loadShouldStartOnboarding={loadShouldStartOnboarding}
        replaceRoute={firstReplaceRoute}
      >
        <Text>Home content</Text>
      </FirstLaunchOnboardingGateBase>,
    );

    await screen.findByText("Home content");

    rerender(
      <FirstLaunchOnboardingGateBase
        loadShouldStartOnboarding={loadShouldStartOnboarding}
        replaceRoute={jest.fn()}
      >
        <Text>Home content</Text>
      </FirstLaunchOnboardingGateBase>,
    );

    await waitFor(() => {
      expect(loadShouldStartOnboarding).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId("onboarding-splash-screen")).toBeNull();
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

  it("allows the first-launch session route without querying completion", () => {
    const loadShouldStartOnboarding = jest.fn<() => Promise<boolean>>();
    const replaceRoute = jest.fn();

    render(
      <FirstLaunchOnboardingGateBase
        allowIncompleteOnboarding
        loadShouldStartOnboarding={loadShouldStartOnboarding}
        replaceRoute={replaceRoute}
      >
        <Text>First session content</Text>
      </FirstLaunchOnboardingGateBase>,
    );

    expect(screen.getByText("First session content")).toBeTruthy();
    expect(screen.queryByTestId("onboarding-splash-screen")).toBeNull();
    expect(loadShouldStartOnboarding).not.toHaveBeenCalled();
    expect(replaceRoute).not.toHaveBeenCalled();
  });
});
