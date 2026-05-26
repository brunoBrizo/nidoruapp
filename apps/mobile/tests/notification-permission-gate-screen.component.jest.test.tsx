import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Modal } from "react-native";

jest.mock("react-native-css", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useCssElement: (Component: React.ElementType, props: Record<string, unknown>) =>
      React.createElement(Component, props),
    useNativeVariable: (variable: string) => `mocked-${variable}`,
  };
});

import {
  NOTIFICATION_GATE_MOTION,
  NotificationPermissionGateScreen,
} from "../src/notifications/notification-permission-gate-screen";

jest
  .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
  .mockImplementation(() => new Promise<boolean>(() => undefined));
jest.spyOn(AccessibilityInfo, "addEventListener").mockImplementation(() => ({ remove: jest.fn() }));

describe("NotificationPermissionGateScreen", () => {
  it("renders the supplied notification-gate design copy and no-pressure trust bullets", () => {
    render(<NotificationPermissionGateScreen onAccept={jest.fn()} onDecline={jest.fn()} />);

    expect(NOTIFICATION_GATE_MOTION).toEqual({
      enterDurationMs: 600,
      exitDurationMs: 400,
      enterTranslateY: 16,
      exitTranslateY: 20,
    });
    expect(screen.getByTestId("notification-permission-gate")).toBeTruthy();
    expect(screen.getByText("Gentle reminders")).toBeTruthy();
    expect(screen.getByRole("header", { name: /Want one quiet reminder/ })).toBeTruthy();
    expect(screen.getByText(/No spam, no sales/)).toBeTruthy();
    expect(screen.getByText("One evening reminder")).toBeTruthy();
    expect(screen.getByText("Silent if you already opened Nidoru")).toBeTruthy();
    expect(screen.getByText("No sales, pressure, or red badges")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn on evening reminder" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not now" })).toBeTruthy();
    expect(screen.getByText("You can change this later in Profile.")).toBeTruthy();
    expect(screen.queryByText(/streak|discount|sale ends|missed|guilt/i)).toBeNull();
  });

  it("keeps touch targets and visual styling aligned with the reference", () => {
    render(<NotificationPermissionGateScreen onAccept={jest.fn()} onDecline={jest.fn()} />);

    const mainClassName = screen.getByTestId("notification-gate-main-content").props.className;
    const actionsClassName = screen.getByTestId("notification-gate-actions").props.className;
    const modal = screen.UNSAFE_getByType(Modal);
    const acceptClassName = screen.getByTestId("notification-gate-accept").props.className;
    const declineClassName = screen.getByTestId("notification-gate-decline").props.className;

    expect(screen.getByTestId("notification-gate-ambient-fade")).toBeTruthy();
    expect(modal.props.visible).toBe(true);
    expectClassNameContains(mainClassName, ["flex-1", "px-nidoru-screen", "pt-16"]);
    expectClassNameContains(actionsClassName, ["px-nidoru-screen", "pt-4", "pb-28"]);
    expectClassNameContains(acceptClassName, [
      "h-14",
      "min-h-11",
      "rounded-[16px]",
      "bg-[#7C6FCD]",
      "active:scale-[0.97]",
    ]);
    expectClassNameContains(declineClassName, ["h-12", "min-h-11", "active:scale-[0.98]"]);
  });

  it("routes the primary CTA to the OS prompt path without invoking decline", async () => {
    const accept = jest.fn(() => Promise.resolve());
    const decline = jest.fn(() => Promise.resolve());
    const dismissed = jest.fn();

    render(
      <NotificationPermissionGateScreen
        onAccept={accept}
        onDecline={decline}
        onDismiss={dismissed}
      />,
    );

    fireEvent.press(screen.getByTestId("notification-gate-accept"));

    await waitFor(() => {
      expect(accept).toHaveBeenCalledTimes(1);
    });
    expect(decline).not.toHaveBeenCalled();
    expect(dismissed).toHaveBeenCalledTimes(1);
  });

  it("routes accept and decline separately so decline never invokes the OS prompt path", async () => {
    const accept = jest.fn(() => Promise.resolve());
    const decline = jest.fn(() => Promise.resolve());
    const dismissed = jest.fn();

    render(
      <NotificationPermissionGateScreen
        onAccept={accept}
        onDecline={decline}
        onDismiss={dismissed}
      />,
    );

    fireEvent.press(screen.getByTestId("notification-gate-decline"));

    await waitFor(() => {
      expect(decline).toHaveBeenCalledTimes(1);
    });
    expect(accept).not.toHaveBeenCalled();
    expect(dismissed).toHaveBeenCalledTimes(1);
  });
});

function expectClassNameContains(className: string | undefined, expectedParts: readonly string[]) {
  expect(className).toBeTruthy();

  for (const expectedPart of expectedParts) {
    expect(className).toContain(expectedPart);
  }
}
