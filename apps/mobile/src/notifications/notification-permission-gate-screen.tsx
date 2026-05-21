import { messages, type LocaleMessages } from "@nidoru/i18n";
import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { Bell, Moon, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  return (
    <SafeAreaView
      accessibilityLabel={copy.contextLabel}
      style={styles.screen}
      testID="notification-permission-gate"
    >
      <View pointerEvents="none" style={styles.ambientOrb} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: entranceProgress,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.main}>
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

        <View style={styles.actions}>
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
    </SafeAreaView>
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

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.dark.background.value,
    overflow: "hidden",
    zIndex: 20,
  },
  ambientOrb: {
    backgroundColor: colors.dark.primary.value,
    borderRadius: 190,
    height: 380,
    left: -16,
    opacity: 0.12,
    position: "absolute",
    shadowColor: colors.dark.primaryGlow.value,
    shadowOpacity: 0.3,
    shadowRadius: 90,
    top: -48,
    width: 380,
  },
  content: {
    flex: 1,
  },
  main: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xl,
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
    marginBottom: 14,
  },
  body: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 25,
    marginBottom: 40,
  },
  bulletStack: {
    gap: 20,
  },
  bulletRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    minHeight: 40,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: colors.dark.surface.value,
    borderColor: colors.dark.surfaceRaised.value,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  bulletLabel: {
    color: colors.dark.textPrimary.value,
    flex: 1,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  actions: {
    backgroundColor: colors.dark.background.value,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
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
    shadowColor: colors.dark.primary.value,
    shadowOpacity: 0.18,
    shadowRadius: 16,
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
