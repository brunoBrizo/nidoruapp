import type { PersonalizedOnboardingPlan, PersonalizedPlanAnswerRowId } from "@nidoru/domain";
import { colors, motion } from "@nidoru/ui-tokens";
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
import { Animated, Easing } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { CardFade } from "../surfaces/card-fade";
import { Pressable, ReactNativeAnimatedView, ScrollView, Text, View, cn } from "../tw";

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
    <View className="flex-1 bg-nidoru-dark-background" testID="personalized-plan-screen">
      <ReactNativeAnimatedView
        className="flex-1"
        style={{
          opacity: entranceProgress,
          transform: [{ translateY: screenTranslateY }],
        }}
      >
        <ScrollView
          bounces={false}
          contentContainerClassName="flex-grow justify-start px-[18px]"
          contentContainerStyle={{
            paddingBottom: 32,
            paddingTop: Math.max(safeAreaInsets.top - 8, 44),
          }}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-[66px] min-h-[30px] flex-row items-center self-center rounded-full border border-nidoru-dark-divider bg-[#14172B]/60 px-3">
            <View className="h-1.5 w-1.5 rounded-full bg-nidoru-dark-primary" />
            <Text
              className="ml-2 font-nidoru-primary-semibold text-xs leading-[17px] text-nidoru-dark-text-secondary"
              selectable
            >
              {statusLabel}
            </Text>
          </View>

          <View className="mb-6 items-center gap-1.5">
            <Text
              accessibilityRole="header"
              className="text-center font-nidoru-primary-semibold text-2xl leading-[30px] text-nidoru-dark-text-primary"
              selectable
            >
              Your plan
            </Text>
            <Text
              className="text-center font-nidoru-primary-semibold text-[15px] leading-5 text-nidoru-dark-primary-glow"
              selectable
            >
              {plan.label}
            </Text>
          </View>

          <View
            className="relative min-h-[224px] overflow-hidden rounded-[28px] border border-[#7C6FCD]/[0.24] bg-nidoru-dark-surface p-6 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
            style={{ borderCurve: "continuous" }}
            testID="personalized-plan-card"
          >
            <CardFade testID="personalized-plan-card-fade" variant="personalized-plan" />
            <View className="z-10 gap-6">
              <View className="flex-row gap-4">
                <View className="mt-px h-12 w-12 items-center justify-center">
                  <ReactNativeAnimatedView
                    className="absolute h-[58px] w-[58px] rounded-full bg-[#A89CE0]/25"
                    style={{
                      opacity: reduceMotionEnabled ? 0.32 : orbGlowOpacity,
                      transform: [{ scale: reduceMotionEnabled ? 1 : orbGlowScale }],
                    }}
                  />
                  <ReactNativeAnimatedView
                    className="absolute h-[34px] w-[34px] rounded-full bg-nidoru-dark-primary shadow-[0_0_18px_rgba(168,156,224,0.58)]"
                    style={{ transform: [{ scale: reduceMotionEnabled ? 1 : orbCoreScale }] }}
                  />
                  <View className="absolute h-[22px] w-[22px] rounded-full bg-[#EEF0FF]/[0.72]" />
                </View>
                <View className="flex-1 gap-1.5">
                  <Text
                    className="font-nidoru-primary-semibold text-[13px] leading-[18px] text-nidoru-dark-primary-glow"
                    selectable
                  >
                    {sessionEyebrow}
                  </Text>
                  <Text
                    className="font-nidoru-primary-semibold text-xl leading-[25px] text-nidoru-dark-text-primary"
                    selectable
                  >
                    {plan.firstSession.title}
                  </Text>
                  <Text
                    className="font-nidoru-primary-regular text-sm leading-[21px] text-nidoru-dark-text-secondary"
                    selectable
                  >
                    {plan.firstSession.subtitle}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2">
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

          <View
            className="mt-4 gap-[14px] rounded-[24px] border border-nidoru-dark-divider bg-[#14172B]/[0.62] p-4"
            style={{ borderCurve: "continuous" }}
            testID="personalized-plan-answer-card"
          >
            <View className="flex-row items-center gap-2">
              <ListChecks color={colors.dark.primary.value} size={16} />
              <Text
                className="font-nidoru-primary-semibold text-xs uppercase leading-4 text-nidoru-dark-text-secondary"
                selectable
              >
                Based on your answers
              </Text>
            </View>
            <View className="gap-3">
              {plan.answerRows.map((row) => {
                const Icon = answerRowIcons[row.id];

                return (
                  <View className="flex-row items-center gap-3" key={row.id}>
                    <View className="w-5 items-center">
                      <Icon color={colors.dark.primary.value} size={18} />
                    </View>
                    <Text
                      className="flex-1 font-nidoru-primary-semibold text-sm leading-5 text-[#EEF0FF]/[0.82]"
                      selectable
                    >
                      {row.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View
          className="bg-nidoru-dark-background px-[18px] pt-4"
          style={{ paddingBottom: Math.max(safeAreaInsets.bottom + 16, 40) }}
        >
          <Pressable
            accessibilityRole="button"
            className={cn(
              "h-[54px] w-full items-center justify-center rounded-[18px] border border-[#A89CE0]/[0.24] bg-[#4C427D] shadow-[0_8px_20px_rgba(0,0,0,0.22)] active:scale-[0.98]",
              isExiting ? "opacity-[0.72]" : null,
            )}
            disabled={isExiting}
            onPress={continueWithPlan}
            style={{ borderCurve: "continuous" }}
            testID="personalized-plan-cta"
          >
            <Text
              className="font-nidoru-primary-semibold text-base leading-[22px] text-nidoru-dark-text-primary"
              selectable={false}
            >
              {ctaLabel}
            </Text>
          </Pressable>
        </View>
      </ReactNativeAnimatedView>
    </View>
  );
}

function PlanChip({ icon, label }: { readonly icon: ReactNode; readonly label: string }) {
  return (
    <View className="min-h-[30px] flex-row items-center rounded-full border border-[#7C6FCD]/[0.32] bg-[#14172B]/80 px-3">
      {icon}
      <Text
        className="ml-1.5 font-nidoru-primary-semibold text-[13px] leading-[18px] text-[#EEF0FF]/90"
        selectable
      >
        {label}
      </Text>
    </View>
  );
}
