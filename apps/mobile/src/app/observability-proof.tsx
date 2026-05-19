import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAppEnvironment, isObservabilityProofModeEnabled } from "../observability/environment";
import { capturePostHogProofEvent, posthogProofEventName } from "../observability/posthog";
import { captureSentryProofError, sentryRelease } from "../observability/sentry";

export default function ObservabilityProofScreen() {
  const [message, setMessage] = useState("No proof event sent yet.");
  const proofModeEnabled = isObservabilityProofModeEnabled();

  const captureSentry = () => {
    const result = captureSentryProofError();
    setMessage(`Sentry ${result.status}: ${result.environment} / ${result.release}`);
  };

  const capturePostHog = async () => {
    const result = await capturePostHogProofEvent();
    setMessage(`PostHog ${result.status}: ${result.eventName}`);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.kicker}>Observability Proof</Text>
        <Text style={styles.title}>
          {getAppEnvironment()} / {sentryRelease}
        </Text>
        <Text style={styles.body}>
          Proof mode: {proofModeEnabled ? "enabled" : "disabled"}. PostHog test event:{" "}
          {posthogProofEventName}.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={!proofModeEnabled}
          onPress={captureSentry}
          style={[styles.button, !proofModeEnabled && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Capture Sentry Test Error</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!proofModeEnabled}
          onPress={capturePostHog}
          style={[styles.button, !proofModeEnabled && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Send PostHog Test Event</Text>
        </Pressable>
        <Text style={styles.result}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background.value,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.screenPadding,
  },
  kicker: {
    color: colors.dark.accent.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.label.size,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.h1.size,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 32,
    marginBottom: 16,
  },
  body: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.body.size,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.dark.accent.value,
    borderRadius: radii.button,
    marginBottom: 12,
    padding: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: colors.dark.background.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.body.size,
    fontWeight: "700",
    letterSpacing: 0,
  },
  result: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.label.size,
    lineHeight: 18,
    marginTop: 8,
  },
});
