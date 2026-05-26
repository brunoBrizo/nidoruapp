import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render, screen, within } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { AppTabBar } from "../src/navigation/app-tab-bar";
import { TabPlaceholderScreen } from "../src/navigation/tab-placeholder-screen";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

jest.mock("lucide-react-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);

  return {
    ChartColumn: Icon,
    House: Icon,
    Moon: Icon,
    UserRound: Icon,
    Wind: Icon,
  };
});

const mockUsePathname = jest.fn(() => "/");

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const Link = Object.assign(
    ({ children }: { readonly children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    {
      Menu: ({ children }: { readonly children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
      MenuAction: () => null,
      Preview: () => null,
      Trigger: ({ children }: { readonly children?: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
    },
  );

  return {
    Link,
    usePathname: () => mockUsePathname(),
  };
});

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

  it("hides the tab shell on the full-screen Wind-Down route", () => {
    mockUsePathname.mockReturnValue("/sleep/wind-down");

    renderTabBar();

    expect(screen.queryByRole("tab", { name: "Home tab" })).toBeNull();
    expect(screen.queryByText("Sleep")).toBeNull();
  });

  it("matches the home.png tab shell frame and active indicator", () => {
    renderTabBar();

    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("h-[84px]"),
    );
    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("bg-[#0D0F1A]/85"),
    );
    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("px-2 pt-2.5"),
    );
    expect(screen.getByTestId("tab-active-indicator").props.className).toEqual(
      expect.stringContaining("h-0.5 w-8"),
    );
    for (const tab of ["home", "sleep", "breathe", "progress", "profile"]) {
      expect(screen.getByTestId(`tab-item-${tab}`).props.className).toEqual(
        expect.stringContaining("w-16"),
      );
      expect(screen.getByTestId(`tab-icon-frame-${tab}`).props.className).toEqual(
        expect.stringContaining("h-6 w-6 items-center justify-center"),
      );
    }
  });

  it("uses the Home handoff classes for the fixed global tab menu states", () => {
    renderTabBar();

    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("h-[84px]"),
    );
    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("bg-[#0D0F1A]/85"),
    );
    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("backdrop-blur-2xl"),
    );
    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("border-t border-white/[0.06]"),
    );
    expect(screen.getByTestId("app-tab-bar").props.className).toEqual(
      expect.stringContaining("px-2 pt-2.5"),
    );
    expect(screen.getByTestId("tab-active-indicator").props.className).toEqual(
      expect.stringContaining("bg-[#A89CE0] shadow-[0_0_8px_rgba(168,156,224,0.8)]"),
    );
    expect(screen.getByTestId("tab-icon-home")).toHaveProp("color", "#A89CE0");
    expect(screen.getByTestId("tab-label-home").props.className).toEqual(
      expect.stringContaining("text-[11px] font-semibold text-[#A89CE0]"),
    );
    expect(screen.getByTestId("tab-icon-sleep")).toHaveProp("color", "#A0A5C0");
    expect(screen.getByTestId("tab-label-sleep").props.className).toEqual(
      expect.stringContaining("text-xs font-normal text-[#A0A5C0]"),
    );
  });

  it("uses the Solar icon set from the Home HTML handoff", () => {
    renderTabBar();

    expect(screen.getByTestId("tab-icon-home")).toHaveProp(
      "accessibilityLabel",
      "solar:home-smile-bold",
    );
    expect(screen.getByTestId("tab-icon-sleep")).toHaveProp(
      "accessibilityLabel",
      "solar:moon-sleep-linear",
    );
    expect(screen.getByTestId("tab-icon-breathe")).toHaveProp(
      "accessibilityLabel",
      "solar:wind-linear",
    );
    expect(screen.getByTestId("tab-icon-progress")).toHaveProp(
      "accessibilityLabel",
      "solar:chart-linear",
    );
    expect(screen.getByTestId("tab-icon-profile")).toHaveProp(
      "accessibilityLabel",
      "solar:user-linear",
    );
  });

  it("keeps each tab item at the Home handoff 64px width with press scale feedback", () => {
    renderTabBar();

    for (const tab of ["home", "sleep", "breathe", "progress", "profile"]) {
      expect(screen.getByTestId(`tab-item-${tab}`).props.className).toEqual(
        expect.stringContaining("w-16"),
      );
      expect(screen.getByTestId(`tab-item-${tab}`).props.className).toEqual(
        expect.stringContaining("active:scale-[0.95]"),
      );
      expect(screen.getByTestId(`tab-item-${tab}`).props.className).not.toEqual(
        expect.stringContaining("flex-1"),
      );
    }
  });

  it("renders intentional future placeholder routes with Tailwind shell primitives", () => {
    render(
      <TabPlaceholderScreen
        title="Future tab route"
        description="Intentionally scoped for a later migrated surface."
      />,
    );

    expect(screen.getByTestId("tab-placeholder-screen").props.className).toEqual(
      expect.stringContaining("bg-nidoru-dark-background"),
    );
    expect(screen.getByTestId("tab-placeholder-screen").props.contentContainerClassName).toEqual(
      expect.stringContaining("pb-[104px]"),
    );
    expect(screen.getByRole("header", { name: "Future tab route" }).props.className).toEqual(
      expect.stringContaining("font-nidoru-primary-bold text-nidoru-h1"),
    );
    expect(screen.getByText("Intentionally scoped for a later migrated surface.").props.className)
      .toEqual(expect.stringContaining("font-nidoru-primary-regular text-nidoru-body"));
  });
});
