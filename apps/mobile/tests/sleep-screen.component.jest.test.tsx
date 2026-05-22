import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import SleepTabScreen from "../src/app/(tabs)/sleep";

describe("SleepTabScreen", () => {
  it("renders the designed Sleep tab sections from the reference screen", () => {
    render(<SleepTabScreen />);

    expect(screen.getByRole("header", { name: "Sleep" })).toBeTruthy();
    expect(screen.getByText("Settle into tonight.")).toBeTruthy();

    expect(screen.getByText("Evening Wind-Down")).toBeTruthy();
    expect(screen.getByText("4-7-8 breath · body relax · sleep sounds")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Start wind-down" })).toHaveProp(
      "accessibilityHint",
      "Opens the Evening Wind-Down flow.",
    );

    expect(screen.getByRole("link", { name: "Sound Mixer" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sound Mixer anchor.",
    );
    expect(screen.getByText("Layer sounds for sleep.")).toBeTruthy();
    expect(screen.getByText("30 min")).toBeTruthy();
    expect(screen.getByText("70%")).toBeTruthy();
    expect(screen.getByText("55%")).toBeTruthy();
    expect(screen.getByText("35%")).toBeTruthy();
    expect(screen.getByText("Brown noise")).toBeTruthy();
    expect(screen.getByText("Fireplace")).toBeTruthy();

    expect(screen.getByRole("link", { name: "Rain quick sound" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sound Mixer anchor.",
    );
    expect(screen.getByRole("link", { name: "Ocean quick sound" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Fan quick sound" })).toBeTruthy();

    expect(screen.getByRole("link", { name: "Sleep Stories" })).toHaveProp(
      "accessibilityHint",
      "Opens the Sleep Stories anchor.",
    );
    expect(screen.getByText("Quiet narration for restless thoughts.")).toBeTruthy();
    expect(screen.getByText("The Quiet Shoreline")).toBeTruthy();
    expect(screen.getByText("45 min")).toBeTruthy();
  });
});
