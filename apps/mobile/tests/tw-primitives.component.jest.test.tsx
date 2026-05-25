import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { Pressable, ScrollView, Text, View } from "../src/tw";

const cssElementCalls: Array<{
  componentName: string;
  mapping: Record<string, string>;
}> = [];

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (
      Component: React.ElementType,
      props: Record<string, unknown>,
      mapping: Record<string, string>,
    ) => {
      cssElementCalls.push({
        componentName:
          typeof Component === "string" ? Component : Component.displayName || Component.name,
        mapping,
      });
      return React.createElement(Component, props);
    },
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

describe("CSS-enabled Tailwind primitives", () => {
  it("maps className onto style while preserving press handlers and accessibility props", () => {
    const onPress = jest.fn();

    render(
      <View className="flex-1">
        <Pressable
          accessibilityRole="button"
          className="rounded-nidoru-button bg-nidoru-dark-primary px-6"
          onPress={onPress}
          testID="tw-pressable"
        >
          <Text className="text-nidoru-dark-text-primary">Begin</Text>
        </Pressable>
      </View>,
    );

    fireEvent.press(screen.getByTestId("tw-pressable"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toHaveProp("testID", "tw-pressable");
    expect(cssElementCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: "View", mapping: { className: "style" } }),
        expect.objectContaining({ componentName: "Text", mapping: { className: "style" } }),
        expect.objectContaining({ componentName: "Pressable", mapping: { className: "style" } }),
      ]),
    );
  });

  it("maps ScrollView contentContainerClassName without requiring screen migration", () => {
    render(
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-nidoru-screen">
        <Text className="text-nidoru-dark-text-secondary">Foundation proof</Text>
      </ScrollView>,
    );

    expect(screen.getByText("Foundation proof")).toBeTruthy();
    expect(cssElementCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          componentName: "ScrollView",
          mapping: {
            className: "style",
            contentClassName: "contentContainerStyle",
            contentContainerClassName: "contentContainerStyle",
          },
        }),
      ]),
    );
  });
});
