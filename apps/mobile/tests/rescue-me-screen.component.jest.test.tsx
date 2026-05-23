import { describe, expect, it } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import {
  RESCUE_ME_SCREEN_STATES,
  RescueMeScreen,
  type RescueMeScreenState,
} from "../src/rescue/rescue-me-screen";

const forbiddenSurfacePattern =
  /account|paywall|permission|choose|pick|setup|loading|spinner|network|medical|crisis|badge|streak|reward|ember/i;

describe("RescueMeScreen", () => {
  it("renders every accepted visual state without setup or gate surfaces", () => {
    for (const state of RESCUE_ME_SCREEN_STATES) {
      const { unmount } = render(<RescueMeScreen state={state} />);

      expect(screen.queryByText(forbiddenSurfacePattern)).toBeNull();
      expect(screen.queryByRole("button", { name: /choose|pick|setup/i })).toBeNull();

      unmount();
    }
  });

  it("matches the active launch contract with an immediate full-screen orb", () => {
    render(<RescueMeScreen state="active-launch" />);

    expect(screen.getByTestId("rescue-me-screen-active-launch")).toBeTruthy();
    expect(screen.getByLabelText("Inhale breathing phase")).toBeTruthy();
    expect(screen.getByText("Inhale")).toBeTruthy();
    expect(screen.getByText("03:29")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Audio cue: Bell" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pause Rescue Me session" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Haptics on" })).toBeTruthy();
    expect(screen.queryByText("You’re doing enough. Stay with the next breath.")).toBeNull();
  });

  it("keeps reassurance as subtle bottom copy only after two cycles", () => {
    render(<RescueMeScreen state="active-reassurance" />);

    const reassurance = screen.getByText("You’re doing enough. Stay with the next breath.");

    expect(screen.getByLabelText("Exhale breathing phase")).toBeTruthy();
    expect(reassurance).toBeTruthy();
    expect(StyleSheet.flatten(reassurance.props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: undefined,
        color: "rgba(138, 143, 168, 0.78)",
        fontSize: 12,
        textAlign: "center",
      }),
    );
  });

  it("renders completion copy and quiet actions exactly", () => {
    render(<RescueMeScreen state="complete" />);

    expect(screen.getByText("That took courage to start.")).toBeTruthy();
    expect(screen.getByText("You completed 5 breath cycles.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue with a calming sound" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Return home" })).toBeTruthy();
  });

  it("renders the offline sound handoff variants without a sound picker", () => {
    for (const state of ["sound-handoff", "sound-handoff-alt"] satisfies RescueMeScreenState[]) {
      const { unmount } = render(<RescueMeScreen state={state} />);

      expect(screen.getByText("Rain is playing")).toBeTruthy();
      expect(screen.getByText("Works offline. You can stop anytime.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Pause Rain sound" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Return home" })).toBeTruthy();
      expect(screen.queryByText(/sound picker|choose sound|select sound/i)).toBeNull();

      unmount();
    }
  });

  it("does not use Ember on active, completion, or handoff screen surfaces", () => {
    for (const state of RESCUE_ME_SCREEN_STATES) {
      const { unmount } = render(<RescueMeScreen state={state} />);
      const screenRoot = screen.getByTestId(`rescue-me-screen-${state}`);

      expect(JSON.stringify(screenRoot.props.style)).not.toContain("#FF6B6B");
      expect(JSON.stringify(screenRoot.props.style)).not.toContain("255, 107, 107");

      unmount();
    }
  });

  it("keeps controls at accessible touch sizes", () => {
    render(<RescueMeScreen state="active-phase" />);

    for (const label of ["Audio cue: Bell", "Pause Rescue Me session", "Haptics on"]) {
      const button = screen.getByRole("button", { name: label });

      expect(StyleSheet.flatten(button.props.style)).toEqual(
        expect.objectContaining({
          minHeight: 44,
          minWidth: 44,
        }),
      );
    }

    const pauseButton = within(screen.getByTestId("rescue-me-controls")).getByRole("button", {
      name: "Pause Rescue Me session",
    });

    expect(StyleSheet.flatten(pauseButton.props.style)).toEqual(
      expect.objectContaining({
        height: 68,
        width: 68,
      }),
    );
  });
});
