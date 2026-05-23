import { colors, radii, spacing, typography } from "@nidoru/ui-tokens";
import { Link } from "expo-router";
import { ArrowRight, Heart, Moon, Music, Wind, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { CardFade } from "../surfaces/card-fade";
import { HomeBreathingOrb, HOME_ORB_MOTION } from "./home-breathing-orb";
import { type HomeQuickActionId } from "./home-actions";
import { createHomeOverview, type HomeRhythmSegment } from "./home-state";
import { markRescueMeHomeTap } from "../rescue/rescue-me-launch-performance";

export { HOME_ORB_MOTION };

const homeColors = {
  backgroundEnd: "#0F1230",
  cardGlass: "rgba(20, 23, 43, 0.62)",
  cardGlassStrong: "rgba(20, 23, 43, 0.78)",
  borderSilk: "rgba(238, 240, 255, 0.08)",
  textPrimary: "#E8E6F2",
} as const;

export const HOME_CONTENT_ENTRANCE_MOTION = {
  durationMs: 400,
  easing: "ease-out",
  isDecorativeOnly: true,
} as const;

export const getHomeContentEntranceMotionConfig = (reduceMotionEnabled: boolean) => ({
  durationMs: reduceMotionEnabled ? 0 : HOME_CONTENT_ENTRANCE_MOTION.durationMs,
  easing: HOME_CONTENT_ENTRANCE_MOTION.easing,
  translateY: reduceMotionEnabled ? 0 : 12,
});

export type HomeScreenProps = {
  readonly hasMorningCheckIn?: boolean;
  readonly notificationGateController?: ReactNode;
  readonly now?: Date;
};

const quickActionIcons: Record<HomeQuickActionId, LucideIcon> = {
  "rescue-me": Heart,
  sounds: Music,
  breathe: Wind,
};

const quickActionIconSizes: Record<HomeQuickActionId, number> = {
  "rescue-me": 20,
  sounds: 20,
  breathe: 20,
};

const getRhythmSegmentStyles = (segment: HomeRhythmSegment) => [
  styles.rhythmSegment,
  segment.filled ? styles.rhythmSegmentFilled : styles.rhythmSegmentEmpty,
  { opacity: segment.opacity },
];

function HomeEntrancePolish({ children }: { readonly children: ReactNode }) {
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    !reduceMotionPreference.isResolved || reduceMotionPreference.reduceMotionEnabled;
  const motionConfig = getHomeContentEntranceMotionConfig(reduceMotionEnabled);
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const entranceTranslateY = entranceProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [motionConfig.translateY, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    if (!reduceMotionPreference.isResolved) {
      return;
    }

    if (motionConfig.durationMs === 0) {
      entranceProgress.setValue(1);
      return;
    }

    entranceProgress.setValue(0);
    Animated.timing(entranceProgress, {
      duration: motionConfig.durationMs,
      easing: Easing.out(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entranceProgress, motionConfig.durationMs, reduceMotionPreference.isResolved]);

  return (
    <Animated.View
      style={[
        styles.entrancePolish,
        {
          opacity: entranceProgress,
          transform: [{ translateY: entranceTranslateY }],
        },
      ]}
      testID="home-entrance-polish"
    >
      {children}
    </Animated.View>
  );
}

export function HomeScreen({
  hasMorningCheckIn = true,
  notificationGateController = null,
  now = new Date(),
}: HomeScreenProps) {
  const homeState = createHomeOverview({ hasMorningCheckIn, now });
  const primaryAction = homeState.primaryAction;
  const summarySlot = homeState.summarySlot;
  const rhythm = homeState.rhythm;
  const markRescueMeTapIfNeeded = (actionId: string) => {
    if (actionId === "rescue-me") {
      markRescueMeHomeTap();
    }
  };

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View style={styles.greetingCopy}>
            <Text accessibilityRole="header" selectable style={styles.greeting}>
              Good evening, Bruno
            </Text>
            <Text selectable style={styles.subtitle}>
              Tonight’s wind-down is ready
            </Text>
          </View>
          <View
            accessibilityLabel={`Current rhythm, ${rhythm.streakText}`}
            style={styles.streakChip}
          >
            <Moon color={colors.dark.primary.value} size={16} strokeWidth={1.6} />
            <Text selectable style={styles.streakText}>
              {rhythm.streakText}
            </Text>
          </View>
        </View>

        <View
          style={[styles.primaryCard, primaryAction.isDistressUrgent && styles.distressPrimaryCard]}
          testID="home-primary-card"
        >
          <CardFade testID="home-primary-card-fade" variant="home-primary" />
          <View style={styles.primaryCopy}>
            <Text accessibilityRole="header" selectable style={styles.primaryTitle}>
              {primaryAction.label}
            </Text>
            <Text selectable style={styles.primarySubtitle}>
              {primaryAction.subtitle}
            </Text>
          </View>

          <HomeBreathingOrb style={styles.primaryOrb} testID="home-resting-breathing-orb" />

          <Link asChild href={primaryAction.routeTarget}>
            <Pressable
              accessibilityHint={`Opens the ${primaryAction.label} anchor.`}
              accessibilityRole="link"
              onPress={() => markRescueMeTapIfNeeded(primaryAction.id)}
              style={({ pressed }) => [styles.primaryButtonPressable, pressed && styles.pressed]}
            >
              <View style={styles.primaryButtonFrame} testID="home-primary-button-frame">
                <Text style={styles.primaryButtonText}>{primaryAction.ctaText}</Text>
              </View>
            </Pressable>
          </Link>
        </View>

        <View style={styles.quickActionGrid} testID="home-quick-action-grid">
          {homeState.quickActions.map((action) => {
            const Icon = quickActionIcons[action.id];
            const isRescueAction = action.id === "rescue-me";

            return (
              <View
                key={action.id}
                style={styles.quickActionSlot}
                testID={`home-quick-action-slot-${action.id}`}
              >
                <Link asChild href={action.routeTarget}>
                  <Pressable
                    accessibilityHint={action.accessibilityHint}
                    accessibilityLabel={`${action.label} quick action`}
                    accessibilityRole="link"
                    onPress={() => markRescueMeTapIfNeeded(action.id)}
                    style={({ pressed }) => [
                      styles.quickActionPressable,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[styles.quickAction, isRescueAction && styles.rescueQuickAction]}
                      testID={`home-quick-action-card-${action.id}`}
                    >
                      <View
                        style={styles.quickActionIconBox}
                        testID={`home-quick-action-icon-box-${action.id}`}
                      >
                        <Icon
                          color={
                            isRescueAction
                              ? colors.dark.danger.value
                              : colors.dark.textSecondary.value
                          }
                          size={quickActionIconSizes[action.id]}
                          strokeWidth={1.5}
                        />
                      </View>
                      <View style={styles.quickActionCopy}>
                        <Text style={styles.quickActionLabel}>{action.label}</Text>
                        <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              </View>
            );
          })}
        </View>

        <HomeEntrancePolish>
          <View style={styles.lastNightCard}>
            <View style={styles.cardRow}>
              <Text
                accessibilityRole={summarySlot.kind === "check-in" ? "header" : undefined}
                selectable
                style={styles.cardEyebrow}
              >
                {summarySlot.title}
              </Text>
              {summarySlot.kind === "last-night" ? (
                <Text
                  accessibilityLabel={summarySlot.ratingAccessibilityLabel}
                  selectable
                  style={styles.scorePill}
                >
                  {summarySlot.ratingText}
                </Text>
              ) : null}
            </View>
            <View style={styles.lastNightCopy}>
              <Text selectable style={styles.lastNightTitle}>
                {summarySlot.summary}
              </Text>
              <Text selectable style={styles.lastNightBody}>
                {summarySlot.suggestion}
              </Text>
            </View>
            <Link asChild href={summarySlot.routeTarget}>
              <Pressable
                accessibilityHint={
                  summarySlot.kind === "check-in" ? summarySlot.accessibilityHint : undefined
                }
                accessibilityRole="link"
                style={({ pressed }) => [styles.insightPressable, pressed && styles.pressed]}
              >
                <View style={styles.insightLink}>
                  <Text style={styles.insightText}>{summarySlot.actionLabel}</Text>
                  <ArrowRight color={colors.dark.primary.value} size={15} strokeWidth={1.8} />
                </View>
              </Pressable>
            </Link>
          </View>

          <View style={styles.rhythmSection}>
            <View style={styles.cardRow}>
              <Text selectable style={styles.rhythmTitle}>
                {rhythm.title}
              </Text>
              <Text selectable style={styles.rhythmMeta}>
                {rhythm.meta}
              </Text>
            </View>
            <View
              accessibilityLabel={rhythm.accessibilityLabel}
              accessibilityRole="image"
              style={styles.rhythmStrip}
            >
              {rhythm.segments.map((segment) => (
                <View key={segment.id} style={getRhythmSegmentStyles(segment)}>
                  {segment.today ? <View style={styles.todayDot} /> : null}
                </View>
              ))}
            </View>
            <Text selectable style={styles.rhythmCopy}>
              {rhythm.compassionateCopy}
            </Text>
          </View>
        </HomeEntrancePolish>
      </ScrollView>
      {notificationGateController}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  content: {
    gap: 14,
    paddingBottom: spacing.bottomNavigationHeight + spacing.md,
    paddingHorizontal: 30,
    paddingTop: 4,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  greetingCopy: {
    flex: 1,
    gap: 4,
  },
  greeting: {
    color: homeColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 26,
  },
  subtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 22,
  },
  streakChip: {
    alignItems: "center",
    backgroundColor: homeColors.cardGlassStrong,
    borderColor: homeColors.borderSilk,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  streakText: {
    color: homeColors.textPrimary,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: typography.scale.label.size,
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  primaryCard: {
    backgroundColor: "rgba(20, 23, 43, 0.5)",
    borderColor: homeColors.borderSilk,
    borderRadius: 24,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.1), 0 8px 32px rgba(124, 111, 205, 0.25)",
    gap: 10,
    height: 280,
    overflow: "hidden",
    paddingBottom: 24,
    paddingHorizontal: spacing.sm,
    paddingTop: 28,
  },
  distressPrimaryCard: {
    backgroundColor: "rgba(13, 15, 26, 0.82)",
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.08), 0 8px 28px rgba(124, 111, 205, 0.16)",
  },
  primaryCopy: {
    alignItems: "center",
    gap: 3,
    zIndex: 1,
  },
  primaryTitle: {
    color: homeColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 24,
  },
  primarySubtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 21,
  },
  primaryOrb: {
    alignSelf: "center",
    transform: [{ scale: 1 }],
    zIndex: 1,
  },
  primaryButtonPressable: {
    marginTop: "auto",
    transform: [{ scale: 1 }],
    zIndex: 1,
  },
  primaryButtonFrame: {
    alignItems: "center",
    backgroundColor: "rgba(124, 111, 205, 0.88)",
    borderRadius: 16,
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    minHeight: 48,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  primaryButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  quickActionGrid: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  quickActionSlot: {
    flex: 1,
  },
  quickActionPressable: {
    minHeight: 86,
    transform: [{ scale: 1 }],
    width: "100%",
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: "rgba(20, 23, 43, 0.5)",
    borderColor: "rgba(238, 240, 255, 0.03)",
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.08)",
    gap: 6,
    height: 86,
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 10,
    transform: [{ scale: 1 }],
    width: "100%",
  },
  rescueQuickAction: {
    borderColor: "rgba(255, 107, 107, 0.12)",
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.08), 0 0 18px rgba(255, 107, 107, 0.08)",
  },
  quickActionIconBox: {
    alignItems: "center",
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  quickActionCopy: {
    alignItems: "center",
    gap: 1,
    width: "100%",
  },
  quickActionLabel: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    lineHeight: 17,
    textAlign: "center",
  },
  quickActionSubtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
  },
  entrancePolish: {
    gap: spacing.sm,
  },
  lastNightCard: {
    backgroundColor: homeColors.cardGlass,
    borderColor: homeColors.borderSilk,
    borderRadius: radii.card,
    borderWidth: 1,
    boxShadow: "inset 0 1px 0 rgba(238, 240, 255, 0.08)",
    gap: 9,
    padding: spacing.sm,
  },
  cardRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardEyebrow: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  scorePill: {
    backgroundColor: "rgba(13, 15, 26, 0.48)",
    borderColor: homeColors.borderSilk,
    borderRadius: 8,
    borderWidth: 1,
    color: homeColors.textPrimary,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    lineHeight: 16,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lastNightCopy: {
    gap: 2,
  },
  lastNightTitle: {
    color: homeColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.bodyLarge.size,
    lineHeight: 22,
  },
  lastNightBody: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  insightPressable: {
    alignSelf: "flex-start",
    transform: [{ scale: 1 }],
  },
  insightLink: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    minHeight: 24,
  },
  insightText: {
    color: colors.dark.primary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  rhythmSection: {
    gap: 14,
    paddingHorizontal: 2,
  },
  rhythmTitle: {
    color: homeColors.textPrimary,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: typography.scale.body.size,
    lineHeight: 20,
  },
  rhythmMeta: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: typography.scale.caption.size,
    lineHeight: 16,
  },
  rhythmCopy: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: typography.scale.caption.size,
    lineHeight: 18,
  },
  rhythmStrip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    height: 28,
    justifyContent: "space-between",
  },
  rhythmSegment: {
    borderRadius: 9999,
    flex: 1,
    height: 6,
  },
  rhythmSegmentFilled: {
    backgroundColor: colors.dark.primary.value,
  },
  rhythmSegmentEmpty: {
    backgroundColor: homeColors.backgroundEnd,
    borderColor: colors.dark.surfaceRaised.value,
    borderWidth: 1,
  },
  todayDot: {
    alignSelf: "center",
    backgroundColor: colors.dark.primaryGlow.value,
    borderRadius: 3,
    height: 6,
    position: "absolute",
    top: -11,
    width: 6,
  },
});
