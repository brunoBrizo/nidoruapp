import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import HomeScreen from "../src/app/index";

describe("HomeScreen", () => {
  it("renders the mobile design proof content", () => {
    render(<HomeScreen />);

    expect(screen.getByText("Mobile design foundation")).toBeTruthy();
    expect(screen.getByText("Nunito 800")).toBeTruthy();
    expect(screen.getByText("Inter 300")).toBeTruthy();
    expect(screen.getByText("Midnight Indigo palette")).toBeTruthy();
    expect(screen.getByText("#0D0F1A")).toBeTruthy();
    expect(screen.getByText("#7C6FCD")).toBeTruthy();
  });
});
