import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { AccessibilityInfo, Modal, StyleSheet } from "react-native";

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

    const mainStyle = StyleSheet.flatten(
      screen.getByTestId("notification-gate-main-content").props.style,
    );
    const actionsStyle = StyleSheet.flatten(
      screen.getByTestId("notification-gate-actions").props.style,
    );
    const modal = screen.UNSAFE_getByType(Modal);
    const acceptStyle = resolvePressableStyle(
      screen.getByTestId("notification-gate-accept").props.style,
    );
    const declineStyle = resolvePressableStyle(
      screen.getByTestId("notification-gate-decline").props.style,
    );

    expect(screen.getByTestId("notification-gate-ambient-fade")).toBeTruthy();
    expect(modal.props.visible).toBe(true);
    expect(mainStyle).toMatchObject({
      paddingHorizontal: 24,
      paddingTop: 64,
    });
    expect(actionsStyle).toMatchObject({
      paddingBottom: 112,
      paddingHorizontal: 20,
      paddingTop: 16,
    });
    expect(StyleSheet.flatten(acceptStyle)).toMatchObject({
      backgroundColor: "#7C6FCD",
      borderRadius: 16,
      height: 56,
      minHeight: 44,
    });
    expect(StyleSheet.flatten(declineStyle)).toMatchObject({
      height: 48,
      minHeight: 44,
    });
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

function resolvePressableStyle(style: unknown) {
  return typeof style === "function" ? style({ pressed: false }) : style;
}
