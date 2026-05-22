import type { PersonalizedOnboardingPlan, PersonalizedPlanAnswerRowId } from "@nidoru/domain";
import { colors, motion, spacing, typography } from "@nidoru/ui-tokens";
import {
  AudioLines,
  CircleUserRound,
  Clock3,
  Leaf,
  ListChecks,
  Moon,
  Wind,
} from "lucide-react-native";
import { useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { CardFade } from "../surfaces/card-fade";

export const PERSONALIZED_PLAN_SCREEN_EXIT_MS = motion.duration.screenExitMs;

type PersonalizedPlanScreenProps = {
  readonly ctaLabel?: string;
  readonly localProofChipLabel?: string;
  readonly onContinue: (plan: PersonalizedOnboardingPlan) => void;
  readonly plan: PersonalizedOnboardingPlan;
  readonly screenExitMs?: number;
  readonly sessionEyebrow?: string;
  readonly statusLabel?: string;
};

const answerRowIcons = {
  familiarity: Wind,
  sleep_baseline: Leaf,
  wind_down: Moon,
} as const satisfies Record<PersonalizedPlanAnswerRowId, typeof Moon>;

export function PersonalizedPlanScreen({
  ctaLabel = "Continue",
  localProofChipLabel = "No account needed",
  onContinue,
  plan,
  screenExitMs = PERSONALIZED_PLAN_SCREEN_EXIT_MS,
  sessionEyebrow = "Next session",
  statusLabel = plan.greeting,
}: PersonalizedPlanScreenProps) {
  const safeAreaInsets = useContext(SafeAreaInsetsContext) ?? {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };
  const reduceMotionPreference = useReduceMotionPreference();
  const reduceMotionEnabled =
    reduceMotionPreference.isResolved && reduceMotionPreference.reduceMotionEnabled;
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const orbPulseProgress = useRef(new Animated.Value(0)).current;
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    Animated.timing(entranceProgress, {
      duration: reduceMotionEnabled ? 0 : motion.duration.screenEnterMs,
      easing: Easing.out(Easing.ease),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [entranceProgress, reduceMotionEnabled]);

  useEffect(() => {
    if (reduceMotionEnabled) {
      orbPulseProgress.stopAnimation();
      orbPulseProgress.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulseProgress, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(orbPulseProgress, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [orbPulseProgress, reduceMotionEnabled]);

  const screenTranslateY = entranceProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const orbGlowScale = orbPulseProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const orbCoreScale = orbPulseProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });
  const orbGlowOpacity = orbPulseProgress.interpolate({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [0.22, 0.42],
  });

  const continueWithPlan = () => {
    if (isExiting) {
      return;
    }

    setIsExiting(true);
    Animated.timing(entranceProgress, {
      duration: reduceMotionEnabled ? 0 : screenExitMs,
      easing: Easing.in(Easing.ease),
      toValue: 0,
      useNativeDriver: true,
    }).start();

    setTimeout(
      () => {
        onContinue(plan);
      },
      reduceMotionEnabled ? 0 : screenExitMs,
    );
  };

  return (
    <View style={styles.screen} testID="personalized-plan-screen">
      <Animated.View
        style={[
          styles.stage,
          {
            opacity: entranceProgress,
            transform: [{ translateY: screenTranslateY }],
          },
        ]}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: spacing.lg,
              paddingTop: Math.max(safeAreaInsets.top - 8, 44),
            },
          ]}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.readyPill}>
            <View style={styles.readyDot} />
            <Text selectable style={styles.readyPillText}>
              {statusLabel}
            </Text>
          </View>

          <View style={styles.titleBlock}>
            <Text accessibilityRole="header" selectable style={styles.title}>
              Your plan
            </Text>
            <Text selectable style={styles.planLabel}>
              {plan.label}
            </Text>
          </View>

          <View style={styles.planCard} testID="personalized-plan-card">
            <CardFade testID="personalized-plan-card-fade" variant="personalized-plan" />
            <View style={styles.planCardContent}>
              <View style={styles.sessionHeaderRow}>
                <View style={styles.planOrb}>
                  <Animated.View
                    style={[
                      styles.planOrbGlow,
                      {
                        opacity: reduceMotionEnabled ? 0.32 : orbGlowOpacity,
                        transform: [{ scale: reduceMotionEnabled ? 1 : orbGlowScale }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.planOrbCore,
                      {
                        transform: [{ scale: reduceMotionEnabled ? 1 : orbCoreScale }],
                      },
                    ]}
                  />
                  <View style={styles.planOrbHighlight} />
                </View>
                <View style={styles.sessionCopy}>
                  <Text selectable style={styles.sessionEyebrow}>
                    {sessionEyebrow}
                  </Text>
                  <Text selectable style={styles.sessionTitle}>
                    {plan.firstSession.title}
                  </Text>
                  <Text selectable style={styles.sessionSubtitle}>
                    {plan.firstSession.subtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                <PlanChip
                  icon={<Clock3 color={colors.dark.primaryGlow.value} size={14} />}
                  label={`${Math.round(plan.firstSession.durationSeconds / 60)} min`}
                />
                <PlanChip
                  icon={<AudioLines color={colors.dark.primaryGlow.value} size={14} />}
                  label={plan.firstSession.guidanceLabel}
                />
                <PlanChip
                  icon={<CircleUserRound color={colors.dark.primaryGlow.value} size={14} />}
                  label={localProofChipLabel}
                />
              </View>
            </View>
          </View>

          <View style={styles.answerCard} testID="personalized-plan-answer-card">
            <View style={styles.answerHeader}>
              <ListChecks color={colors.dark.primary.value} size={16} />
              <Text selectable style={styles.answerHeaderText}>
                Based on your answers
              </Text>
            </View>
            <View style={styles.answerRows}>
              {plan.answerRows.map((row) => {
                const Icon = answerRowIcons[row.id];

                return (
                  <View key={row.id} style={styles.answerRow}>
                    <View style={styles.answerIconSlot}>
                      <Icon color={colors.dark.primary.value} size={18} />
                    </View>
                    <Text selectable style={styles.answerText}>
                      {row.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(safeAreaInsets.bottom + 16, 40),
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            disabled={isExiting}
            onPress={continueWithPlan}
            testID="personalized-plan-cta"
            style={({ pressed }) => [
              styles.startButton,
              pressed && !isExiting ? styles.startButtonPressed : null,
              isExiting ? styles.startButtonDisabled : null,
            ]}
          >
            <Text selectable={false} style={styles.startButtonText}>
              {ctaLabel}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function PlanChip({ icon, label }: { readonly icon: ReactNode; readonly label: string }) {
  return (
    <View style={styles.chip}>
      {icon}
      <Text selectable style={styles.chipText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  stage: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 18,
  },
  readyPill: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(20, 23, 43, 0.6)",
    borderColor: colors.dark.divider.value,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 66,
    minHeight: 30,
    paddingHorizontal: 12,
  },
  readyDot: {
    backgroundColor: colors.dark.primary.value,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  readyPillText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 17,
  },
  titleBlock: {
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 24,
    letterSpacing: 0,
    lineHeight: 30,
    textAlign: "center",
  },
  planLabel: {
    color: colors.dark.primaryGlow.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: "center",
  },
  planCard: {
    backgroundColor: colors.dark.surface.value,
    borderColor: "rgba(124, 111, 205, 0.24)",
    borderCurve: "continuous",
    borderRadius: 28,
    borderWidth: 1,
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
    minHeight: 224,
    overflow: "hidden",
    padding: 24,
  },
  planCardContent: {
    gap: 24,
    zIndex: 1,
  },
  sessionHeaderRow: {
    flexDirection: "row",
    gap: 16,
  },
  planOrb: {
    alignItems: "center",
    height: 48,
    justifyContent: "center",
    marginTop: 1,
    width: 48,
  },
  planOrbGlow: {
    backgroundColor: "rgba(168, 156, 224, 0.25)",
    borderRadius: 29,
    height: 58,
    position: "absolute",
    width: 58,
  },
  planOrbCore: {
    backgroundColor: colors.dark.primary.value,
    borderRadius: 17,
    boxShadow: "0 0 18px rgba(168, 156, 224, 0.58)",
    height: 34,
    position: "absolute",
    width: 34,
  },
  planOrbHighlight: {
    backgroundColor: "rgba(238, 240, 255, 0.72)",
    borderRadius: 11,
    height: 22,
    position: "absolute",
    width: 22,
  },
  sessionCopy: {
    flex: 1,
    gap: 6,
  },
  sessionEyebrow: {
    color: colors.dark.primaryGlow.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
  sessionTitle: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 25,
  },
  sessionSubtitle: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 21,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(20, 23, 43, 0.8)",
    borderColor: "rgba(124, 111, 205, 0.32)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
    paddingHorizontal: 12,
  },
  chipText: {
    color: "rgba(238, 240, 255, 0.9)",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18,
  },
  answerCard: {
    backgroundColor: "rgba(20, 23, 43, 0.62)",
    borderColor: colors.dark.divider.value,
    borderCurve: "continuous",
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    marginTop: 16,
    padding: 16,
  },
  answerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  answerHeaderText: {
    color: colors.dark.textSecondary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  answerRows: {
    gap: 12,
  },
  answerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  answerIconSlot: {
    alignItems: "center",
    width: 20,
  },
  answerText: {
    color: "rgba(238, 240, 255, 0.82)",
    flex: 1,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: colors.dark.background.value,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  startButton: {
    alignItems: "center",
    backgroundColor: "#4C427D",
    borderColor: "rgba(168, 156, 224, 0.24)",
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
    height: 54,
    justifyContent: "center",
    width: "100%",
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  startButtonDisabled: {
    opacity: 0.72,
  },
  startButtonText: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },
});
