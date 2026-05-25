import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import {
  GlassCard,
  MidnightScrollScreen,
  NidoruButton,
  NidoruSegmentedControl,
  NidoruText,
  ProgressMeterRow,
} from "../src/design-system";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

describe("Nidoru Tailwind design-system primitives", () => {
  it("provides screen and typography primitives with safe-area and tabular-number defaults", () => {
    render(
      <MidnightScrollScreen testID="midnight-screen">
        <NidoruText testID="screen-title" variant="title">
          Wind down
        </NidoruText>
        <NidoruText testID="timer-copy" variant="timer">
          04:00
        </NidoruText>
      </MidnightScrollScreen>,
    );

    expect(screen.getByTestId("midnight-screen")).toHaveProp(
      "contentInsetAdjustmentBehavior",
      "automatic",
    );
    expect(screen.getByTestId("midnight-screen").props.className).toEqual(
      expect.stringContaining("bg-nidoru-dark-background"),
    );
    expect(screen.getByTestId("screen-title").props.className).toEqual(
      expect.stringContaining("font-nidoru-primary-bold"),
    );
    expect(screen.getByTestId("timer-copy")).toHaveProp("selectable", true);
    expect(screen.getByTestId("timer-copy").props.className).toEqual(
      expect.stringContaining("font-nidoru-data-light"),
    );
    expect(screen.getByTestId("timer-copy").props.className).toEqual(
      expect.stringContaining("tabular-nums"),
    );
  });

  it("provides button, segmented control, and surface primitives with accessible state classes", () => {
    const onPrimaryPress = jest.fn();
    const onSegmentChange = jest.fn();

    render(
      <GlassCard testID="glass-card">
        <NidoruButton onPress={onPrimaryPress} testID="primary-button" variant="primary">
          Start now
        </NidoruButton>
        <NidoruSegmentedControl
          accessibilityLabel="Session mode"
          onValueChange={onSegmentChange}
          options={[
            { label: "Sleep", value: "sleep" },
            { label: "Breathe", value: "breathe" },
          ]}
          testID="session-mode"
          value="sleep"
        />
        <ProgressMeterRow label="Week rhythm" testID="progress-row" value={0.75} />
      </GlassCard>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Start now" }));
    fireEvent.press(screen.getByRole("tab", { name: "Breathe" }));

    expect(onPrimaryPress).toHaveBeenCalledTimes(1);
    expect(onSegmentChange).toHaveBeenCalledWith("breathe");
    expect(screen.getByTestId("glass-card").props.className).toEqual(
      expect.stringContaining("border-white/[0.06]"),
    );
    expect(screen.getByTestId("primary-button").props.className).toEqual(
      expect.stringContaining("min-h-[48px]"),
    );
    expect(screen.getByTestId("primary-button").props.className).toEqual(
      expect.stringContaining("active:scale-[0.96]"),
    );
    expect(screen.getByRole("tab", { name: "Sleep" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.getByTestId("progress-row-fill").props.style).toEqual(
      expect.objectContaining({ width: "75%" }),
    );
  });
});
