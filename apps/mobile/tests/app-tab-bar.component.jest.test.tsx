import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo, StyleSheet } from "react-native";

import { AppTabBar } from "../src/navigation/app-tab-bar";

const mockUsePathname = jest.fn(() => "/");

jest.mock("expo-router", () => ({
  usePathname: () => mockUsePathname(),
}));

const routes = [
  { key: "home-key", name: "index" },
  { key: "sleep-key", name: "sleep" },
  { key: "breathe-key", name: "breathe" },
  { key: "progress-key", name: "progress" },
  { key: "profile-key", name: "profile" },
] as const;

const tabLabels = ["Home", "Sleep", "Breathe", "Progress", "Profile"] as const;

const descriptors = Object.fromEntries(
  routes.map((route, index) => [
    route.key,
    {
      options: {
        tabBarAccessibilityLabel: `${tabLabels[index]} tab`,
      },
    },
  ]),
);

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

const renderTabBar = () =>
  render(
    <AppTabBar
      state={{ index: 0, routes }}
      descriptors={descriptors}
      navigation={{
        emit: jest.fn(() => ({ defaultPrevented: false })),
        navigate: jest.fn(),
      }}
    />,
  );

describe("AppTabBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the fixed five tab labels in product order", () => {
    renderTabBar();

    expect(
      screen.getAllByRole("tab").map((tab) => within(tab).getByText(/.+/).props.children),
    ).toEqual([...tabLabels]);
  });

  it("marks Home as the active landing tab without rendering badges", () => {
    renderTabBar();

    expect(screen.getByRole("tab", { name: "Home tab" })).toHaveProp("accessibilityState", {
      selected: true,
    });
    expect(screen.queryByText(/badge/i)).toBeNull();
  });

  it("hides the tab shell on full-screen breath session routes", () => {
    mockUsePathname.mockReturnValue("/breathe/4-7-8-sleep");

    renderTabBar();

    expect(screen.queryByRole("tab", { name: "Home tab" })).toBeNull();
    expect(screen.queryByText("Breathe")).toBeNull();
  });

  it("hides the tab shell on full-screen Rescue Me routes", () => {
    mockUsePathname.mockReturnValue("/rescue-me");

    renderTabBar();

    expect(screen.queryByRole("tab", { name: "Home tab" })).toBeNull();
    expect(screen.queryByText("Rescue Me")).toBeNull();
  });

  it("matches the home.png tab shell frame and active indicator", () => {
    renderTabBar();

    expect(StyleSheet.flatten(screen.getByTestId("app-tab-bar").props.style)).toEqual(
      expect.objectContaining({
        backgroundColor: "#0D0F1A",
        minHeight: 84,
        paddingHorizontal: 18,
      }),
    );
    expect(StyleSheet.flatten(screen.getByTestId("tab-active-indicator").props.style)).toEqual(
      expect.objectContaining({
        height: 4,
        width: 42,
      }),
    );
    for (const tab of ["home", "sleep", "breathe", "progress", "profile"]) {
      expect(StyleSheet.flatten(screen.getByTestId(`tab-item-${tab}`).props.style)).toEqual(
        expect.objectContaining({
          flex: 1,
          minWidth: 0,
        }),
      );
      expect(StyleSheet.flatten(screen.getByTestId(`tab-icon-frame-${tab}`).props.style)).toEqual(
        expect.objectContaining({
          alignItems: "center",
          height: 24,
          justifyContent: "center",
          width: 24,
        }),
      );
    }
  });
});
