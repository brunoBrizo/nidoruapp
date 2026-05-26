import { messages, type LocaleMessages } from "@nidoru/i18n";
import { StatusBar } from "expo-status-bar";
import { Bell, Moon, ShieldCheck, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { Pressable, ReactNativeAnimatedView, Text, View, cn } from "../tw";

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
      className="absolute inset-0 z-20 flex-1 overflow-hidden bg-[#0D0F1A]"
      testID="notification-permission-gate"
    >
      <StatusBar hidden />
      <NotificationGateAmbientFade />
      <ReactNativeAnimatedView
        className="flex-1"
        style={{
          opacity: entranceProgress,
          transform: [{ translateY }],
        }}
      >
        <View className="flex-1 px-nidoru-screen pt-16" testID="notification-gate-main-content">
          <Text className="mb-4 font-nidoru-primary-semibold text-[13px] leading-[18px] tracking-normal text-[#A89CE0]">
            {copy.contextLabel}
          </Text>
          <Text
            accessibilityRole="header"
            className="mb-3 font-nidoru-primary-semibold text-[28px] leading-[34px] tracking-normal text-[#EEF0FF]"
          >
            {headlineParts.first}
            {headlineParts.second ? `\n${headlineParts.second}` : null}
          </Text>
          <Text className="mb-10 font-nidoru-primary-regular text-base leading-[26px] text-[#8A8FA8]">
            {copy.body}
          </Text>

          <View className="gap-5">
            {bullets.map(({ Icon, label }) => (
              <View className="flex-row items-start gap-4" key={label}>
                <View className="mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1C2040] bg-[#14172B]">
                  <Icon color="#5EC4D4" size={18} strokeWidth={1.8} />
                </View>
                <Text className="flex-1 pt-1 font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          className="relative z-20 w-full bg-[#0D0F1A] px-nidoru-screen pb-28 pt-4"
          testID="notification-gate-actions"
        >
          <NotificationGateActionFade />
          <Pressable
            accessibilityHint="Shows the system notification permission prompt."
            accessibilityRole="button"
            className={cn(
              "relative mb-2 h-14 min-h-11 w-full items-center justify-center rounded-[16px] bg-[#7C6FCD] shadow-[0_4px_16px_rgba(124,111,205,0.12)] active:scale-[0.97] active:bg-[#685BB3]",
              isSubmitting ? "opacity-[0.72]" : null,
            )}
            disabled={isSubmitting}
            onPress={() => void dismissWith(onAccept)}
            testID="notification-gate-accept"
          >
            <Text className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]">
              {copy.primaryCta}
            </Text>
          </Pressable>

          <Pressable
            accessibilityHint="Keeps the app usable without showing the system prompt."
            accessibilityRole="button"
            className={cn(
              "h-12 min-h-11 w-full items-center justify-center active:scale-[0.98]",
              isSubmitting ? "opacity-[0.72]" : null,
            )}
            disabled={isSubmitting}
            onPress={() => void dismissWith(onDecline)}
            testID="notification-gate-decline"
          >
            <Text className="font-nidoru-primary-semibold text-[15px] leading-5 text-[#8A8FA8]">
              {copy.secondaryCta}
            </Text>
          </Pressable>

          <Text className="mt-0.5 text-center font-nidoru-data-regular text-[13px] leading-[18px] text-[#8A8FA8]">
            {copy.helper}
          </Text>
        </View>
      </ReactNativeAnimatedView>
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
    <View className="absolute inset-0" pointerEvents="none" testID="notification-gate-ambient-fade">
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
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.1" />
            <Stop offset="0.42" stopColor="#7C6FCD" stopOpacity="0.055" />
            <Stop offset="0.76" stopColor="#7C6FCD" stopOpacity="0.016" />
            <Stop offset="1" stopColor="#7C6FCD" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#notification-gate-top-glow)" height="844" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}

function NotificationGateActionFade() {
  return (
    <View className="absolute inset-0" pointerEvents="none">
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 260" width="100%">
        <Defs>
          <LinearGradient id="notification-gate-action-fade" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#0D0F1A" stopOpacity="0" />
            <Stop offset="0.18" stopColor="#0D0F1A" stopOpacity="1" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#notification-gate-action-fade)" height="260" width="390" x="0" y="0" />
      </Svg>
    </View>
  );
}
