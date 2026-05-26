import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

jest.mock("../src/observability/environment", () => ({
  getAppEnvironment: () => "staging",
  isObservabilityProofModeEnabled: () => true,
}));

jest.mock("../src/observability/posthog", () => ({
  capturePostHogProofEvent: jest.fn(() =>
    Promise.resolve({
      eventName: "observability_test_event",
      status: "queued",
    }),
  ),
  posthogProofEventName: "observability_test_event",
}));

jest.mock("../src/observability/sentry", () => ({
  captureSentryProofError: jest.fn(() => ({
    environment: "staging",
    release: "nidoru@test",
    status: "queued",
  })),
  sentryRelease: "nidoru@test",
}));

jest.mock("../src/tw/tailwind-runtime-proof", () => ({
  TailwindRuntimeProof: () => null,
}));

import ObservabilityProofScreen from "../src/app/observability-proof";
import { capturePostHogProofEvent } from "../src/observability/posthog";
import { captureSentryProofError } from "../src/observability/sentry";

const mockCapturePostHogProofEvent = capturePostHogProofEvent as jest.MockedFunction<
  typeof capturePostHogProofEvent
>;
const mockCaptureSentryProofError = captureSentryProofError as jest.MockedFunction<
  typeof captureSentryProofError
>;

describe("ObservabilityProofScreen", () => {
  it("keeps the developer proof route primitive-based and privacy-safe", async () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = "https://public@example.ingest.sentry.io/1";
    process.env.EXPO_PUBLIC_POSTHOG_API_KEY = "phc_public_key";
    process.env.EXPO_PUBLIC_LOCAL_INSTALL_ID = "install_secret";

    render(<ObservabilityProofScreen />);

    expect(screen.getByTestId("observability-proof-screen").props.className).toEqual(
      expect.stringContaining("bg-nidoru-dark-background"),
    );
    expect(screen.getByRole("header", { name: "Observability Proof" })).toBeTruthy();
    expect(screen.getByText("staging / nidoru@test")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Capture Sentry Test Error" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send PostHog Test Event" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Capture Sentry Test Error" }));
    expect(screen.getByText("Sentry queued: staging / nidoru@test")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Send PostHog Test Event" }));
    await waitFor(() => {
      expect(screen.getByText("PostHog queued: observability_test_event")).toBeTruthy();
    });

    expect(mockCaptureSentryProofError).toHaveBeenCalledTimes(1);
    expect(mockCapturePostHogProofEvent).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(screen.toJSON())).not.toMatch(
      /phc_public_key|public@example|install_secret|session|account/i,
    );
  });
});
