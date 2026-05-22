import { messages, type LocaleMessages } from "@nidoru/i18n";
import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { StatusBar } from "expo-status-bar";
import { Bell, Moon, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";

export const NOTIFICATION_GATE_MOTION = {
  enterDurationMs: 600,
  exitDurationMs: 400,
  enterTranslateY: 16,
  exitTranslateY: 20,
} as const;

type NotificationGateCopy = LocaleMessages["notificationGate"];

type NotificationTrustBullet = {
  readonly Icon: LucideIcon;
  readonly label: string;
};

export type NotificationPermissionGateScreenProps = {
  readonly copy?: NotificationGateCopy;
  readonly onAccept: () => Promise<void> | void;
  readonly onDecline: () => Promise<void> | void;
  readonly onDismiss?: () => void;
};

export function NotificationPermissionGateScreen({
  copy = messages.en.notificationGate,
  onAccept,
  onDecline,
  onDismiss,
}: NotificationPermissionGateScreenProps) {
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    !reduceMotionPreference.isResolved || reduceMotionPreference.reduceMotionEnabled;
  const entranceProgress = useRef(new Animated.Value(reduceMotionEnabled ? 1 : 0)).current;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headlineParts = splitHeadline(copy.headline);
  const bullets: readonly NotificationTrustBullet[] = [
    {
      Icon: Moon,
      label: copy.oneEveningReminder,
    },
    {
      Icon: Bell,
      label: copy.silentIfOpened,
    },
    {
      Icon: ShieldCheck,
      label: copy.noPressure,
    },
  ];
  const translateY = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [NOTIFICATION_GATE_MOTION.enterTranslateY, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!reduceMotionPreference.isResolved) {
      return;
    }

    if (reduceMotionEnabled) {
      entranceProgress.setValue(1);
      return;
    }

    Animated.timing(entranceProgress, {
      duration: NOTIFICATION_GATE_MOTION.enterDurationMs,
      easing: Easing.out(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entranceProgress, reduceMotionEnabled, reduceMotionPreference.isResolved]);

  const dismissWith = async (action: () => Promise<void> | void) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    await action();

    if (reduceMotionEnabled) {
      onDismiss?.();
      return;
    }

    Animated.timing(entranceProgress, {
      duration: NOTIFICATION_GATE_MOTION.exitDurationMs,
      easing: Easing.in(Easing.ease),
      toValue: 0,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  const gate = (
    <View
      accessibilityLabel={copy.contextLabel}
      style={styles.screen}
      testID="notification-permission-gate"
    >
      <StatusBar hidden />
      <NotificationGateAmbientFade />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: entranceProgress,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.main} testID="notification-gate-main-content">
          <Text style={styles.contextLabel}>{copy.contextLabel}</Text>
          <Text accessibilityRole="header" style={styles.headline}>
            {headlineParts.first}
            {headlineParts.second ? `\n${headlineParts.second}` : null}
          </Text>
          <Text style={styles.body}>{copy.body}</Text>

          <View style={styles.bulletStack}>
            {bullets.map(({ Icon, label }) => (
              <View key={label} style={styles.bulletRow}>
                <View style={styles.iconCircle}>
                  <Icon color={colors.dark.accent.value} size={18} strokeWidth={1.8} />
                </View>
                <Text style={styles.bulletLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions} testID="notification-gate-actions">
          <NotificationGateActionFade />
          <Pressable
            accessibilityHint="Shows the system notification permission prompt."
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void dismissWith(onAccept)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !isSubmitting && styles.primaryButtonPressed,
              isSubmitting && styles.disabledAction,
            ]}
            testID="notification-gate-accept"
          >
            <Text style={styles.primaryButtonText}>{copy.primaryCta}</Text>
          </Pressable>

          <Pressable
            accessibilityHint="Keeps the app usable without showing the system prompt."
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void dismissWith(onDecline)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && !isSubmitting && styles.secondaryButtonPressed,
              isSubmitting && styles.disabledAction,
            ]}
            testID="notification-gate-decline"
          >
            <Text style={styles.secondaryButtonText}>{copy.secondaryCta}</Text>
          </Pressable>

          <Text style={styles.helper}>{copy.helper}</Text>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <Modal animationType="none" presentationStyle="fullScreen" visible>
      {gate}
    </Modal>
  );
}

function splitHeadline(headline: string) {
  const splitPoint = headline.indexOf(" for ");

  if (splitPoint === -1) {
    return {
      first: headline,
      second: "",
    };
  }

  return {
    first: headline.slice(0, splitPoint),
    second: headline.slice(splitPoint + 1),
  };
}

function NotificationGateAmbientFade() {
  return (
    <View
      pointerEvents="none"
      style={styles.ambientFadeLayer}
      testID="notification-gate-ambient-fade"
    >
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 844" width="100%">
        <Defs>
          <RadialGradient
            cx="195"
            cy="148"
            fx="195"
            fy="148"
            gradientUnits="userSpaceOnUse"
            id="notification-gate-top-glow"
            r="285"
          >
            <Stop offset="0" stopColor={colors.dark.primary.value} stopOpacity="0.1" />
            <Stop offset="0.42" stopColor={colors.dark.primary.value} stopOpacity="0.055" />
            <Stop offset="0.76" stopColor={colors.dark.primary.value} stopOpacity="0.016" />
            <Stop offset="1" stopColor={colors.dark.primary.value} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#notification-gate-top-glow)" height="844" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}

function NotificationGateActionFade() {
  return (
    <View pointerEvents="none" style={styles.actionFadeLayer}>
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 260" width="100%">
        <Defs>
          <LinearGradient id="notification-gate-action-fade" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={colors.dark.background.value} stopOpacity="0" />
            <Stop offset="0.18" stopColor={colors.dark.background.value} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.dark.background.value} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#notification-gate-action-fade)" height="260" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark.background.value,
    overflow: "hidden",
    zIndex: 20,
  },
  ambientFadeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  actionFadeLayer: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
  },
  content: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 64,
  },
  contextLabel: {
    color: colors.dark.primaryGlow.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0,
    marginBottom: 16,
  },
  headline: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 34,
    marginBottom: 12,
  },
  body: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 26,
    marginBottom: 40,
  },
  bulletStack: {
    gap: 20,
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.surfaceRaised.value,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    marginTop: 2,
    width: 32,
  },
  bulletLabel: {
    color: colors.dark.textPrimary.value,
    flex: 1,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    paddingTop: 4,
  },
  actions: {
    backgroundColor: colors.dark.background.value,
    paddingBottom: 112,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.dark.primary.value,
    borderRadius: radii.button + 2,
    height: 56,
    justifyContent: "center",
    marginBottom: 8,
    minHeight: 44,
    position: "relative",
    boxShadow: "0 4px 16px rgba(124, 111, 205, 0.12)",
    transform: [{ scale: 1 }],
  },
  primaryButtonPressed: {
    backgroundColor: "#685BB3",
    transform: [{ scale: 0.97 }],
  },
  primaryButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    minHeight: 44,
    transform: [{ scale: 1 }],
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
    fontWeight: "600",
  },
  helper: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    textAlign: "center",
  },
  disabledAction: {
    opacity: 0.72,
  },
});
