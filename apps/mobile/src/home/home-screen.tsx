import { useRouter } from "expo-router";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  CloudRain,
  Droplets,
  HeartPulse,
  Moon,
  Music,
  Play,
  Sparkles,
  Wind,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { useReduceMotionPreference } from "../motion/use-reduce-motion-enabled";
import { markRescueMeHomeTap } from "../rescue/rescue-me-launch-performance";
import { Link, Pressable, ReactNativeAnimatedView, ScrollView, Text, View, cn } from "../tw";
import { type HomeQuickActionId, type HomeRouteTarget } from "./home-actions";
import { createHomeOverview } from "./home-state";

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

type QuickActionTone = "accent" | "danger" | "primary";
type LibraryCardVariant = "meditation" | "rainfall" | "story";

const quickActionIcons: Record<HomeQuickActionId, LucideIcon> = {
  "rescue-me": HeartPulse,
  sounds: Music,
  breathe: Wind,
};

const quickActionToneById: Record<HomeQuickActionId, QuickActionTone> = {
  "rescue-me": "danger",
  sounds: "accent",
  breathe: "primary",
};

const quickActionClassByTone: Record<
  QuickActionTone,
  {
    readonly card: string;
    readonly iconBox: string;
    readonly iconColor: string;
    readonly subtitle: string;
  }
> = {
  danger: {
    card: "border-[#FF6B6B]/15 shadow-[inset_0_1px_0_rgba(255,107,107,0.12),0_4px_20px_-8px_rgba(255,107,107,0.25)]",
    iconBox: "border-[#FF6B6B]/20 bg-[#FF6B6B]/15",
    iconColor: "#FF8A8A",
    subtitle: "text-[#FF8A8A]/80",
  },
  accent: {
    card: "border-white/[0.06] shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]",
    iconBox: "border-[#5EC4D4]/15 bg-[#5EC4D4]/10",
    iconColor: "#5EC4D4",
    subtitle: "text-[#8A8FA8]",
  },
  primary: {
    card: "border-white/[0.06] shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]",
    iconBox: "border-[#A89CE0]/20 bg-[#A89CE0]/10",
    iconColor: "#A89CE0",
    subtitle: "text-[#8A8FA8]",
  },
};

const libraryCards = [
  {
    id: "lantern-keeper",
    category: "Story",
    title: "The Lantern Keeper",
    subtitle: "Narrated · soft rain",
    duration: "12 MIN",
    routeTarget: "/sleep/wind-down",
    Icon: BookOpen,
    shadowClass: "shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]",
    accentColor: "#A89CE0",
    iconColor: "#EEF0FF",
    variant: "story",
  },
  {
    id: "coastal-rainfall",
    category: "Soundscape",
    title: "Coastal Rainfall",
    subtitle: "Loop · brown noise",
    duration: "∞",
    routeTarget: "/sleep/sounds",
    Icon: Droplets,
    shadowClass: "shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]",
    accentColor: "#5EC4D4",
    iconColor: "#5EC4D4",
    variant: "rainfall",
  },
  {
    id: "body-scan",
    category: "Meditation",
    title: "Body Scan",
    subtitle: "Guided · release tension",
    duration: "8 MIN",
    routeTarget: "/breathe/4-7-8-sleep?durationSeconds=300",
    Icon: Sparkles,
    shadowClass: "shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]",
    accentColor: "#A89CE0",
    iconColor: "#A89CE0",
    variant: "meditation",
  },
] as const satisfies readonly {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly subtitle: string;
  readonly duration: string;
  readonly routeTarget: HomeRouteTarget;
  readonly Icon: LucideIcon;
  readonly accentColor: string;
  readonly iconColor: string;
  readonly shadowClass: string;
  readonly variant: LibraryCardVariant;
}[];

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
    <ReactNativeAnimatedView
      className="gap-4"
      style={{
        opacity: entranceProgress,
        transform: [{ translateY: entranceTranslateY }],
      }}
      testID="home-entrance-polish"
    >
      {children}
    </ReactNativeAnimatedView>
  );
}

const formatHomeTimestamp = (date: Date) => {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
  }).format(date);

  return `${weekday} · ${time}`;
};

const markRescueMeTapIfNeeded = (actionId: string) => {
  if (actionId === "rescue-me") {
    markRescueMeHomeTap();
  }
};

export function HomeScreen({
  hasMorningCheckIn = true,
  notificationGateController = null,
  now = new Date(),
}: HomeScreenProps) {
  const router = useRouter();
  const homeState = createHomeOverview({ hasMorningCheckIn, now });
  const primaryAction = homeState.primaryAction;
  const summarySlot = homeState.summarySlot;
  const timestamp = useMemo(() => formatHomeTimestamp(now), [now]);
  const handleHomeActionPress = (actionId: string, routeTarget: HomeRouteTarget) => {
    markRescueMeTapIfNeeded(actionId);
    router.push(routeTarget);
  };

  return (
    <View className="flex-1 bg-[#0D0F1A]" testID="home-root">
      <HomeAmbientBackdrop />
      <ScrollView
        className="relative z-10 flex-1"
        contentContainerClassName="gap-4 px-nidoru-screen pt-12 pb-[104px]"
        contentInsetAdjustmentBehavior="automatic"
        testID="home-screen"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1.5">
            <Text className="font-nidoru-data-regular text-[11px] font-medium uppercase tracking-[0.18em] text-[#7C6FCD]/80">
              {timestamp}
            </Text>
            <Text
              accessibilityLabel="Good evening, Bruno"
              accessibilityRole="header"
              className="font-nidoru-data-regular text-[26px] leading-[32px] text-[#EEF0FF]"
              selectable
            >
              {"Good evening,\n"}
              <Text className="text-[#A89CE0]">Bruno</Text>
            </Text>
            <Text className="pt-0.5 font-nidoru-data-regular text-sm leading-[20px] text-[#8A8FA8]">
              Tonight&apos;s wind-down is ready
            </Text>
          </View>
          <View
            accessibilityLabel={`Current rhythm, ${homeState.rhythm.streakText}`}
            className="flex-row items-center gap-1.5 rounded-full border border-[#A89CE0]/15 bg-[#1C2040]/80 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(238,240,255,0.08)]"
          >
            <Moon color="#A89CE0" size={16} strokeWidth={1.6} />
            <Text className="font-nidoru-data-regular text-sm font-medium leading-[20px] text-[#EEF0FF]">
              {homeState.rhythm.streakText}
            </Text>
          </View>
        </View>

        <View
          className={cn(
            "relative overflow-hidden rounded-[28px] border border-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(238,240,255,0.08),0_20px_60px_-15px_rgba(124,111,205,0.45)]",
            primaryAction.isDistressUrgent ? "border-[#FF6B6B]/16" : null,
          )}
          testID="home-primary-card"
        >
          <PrimaryCardBackdrop />

          <View className="relative z-10 mb-1 flex-row items-center justify-between">
            <Text className="font-nidoru-data-regular text-[10px] font-medium uppercase tracking-[0.2em] text-[#A89CE0]/90">
              Tonight&apos;s Ritual
            </Text>
            <Text className="font-nidoru-data-regular text-[10px] text-[#8A8FA8]">
              ~22 min
            </Text>
          </View>
          <View className="relative z-10 mb-5">
            <Text
              accessibilityRole="header"
              className="font-nidoru-data-regular text-[22px] leading-[28px] text-[#EEF0FF]"
              selectable
            >
              {primaryAction.label}
            </Text>
            <Text className="mt-1 font-nidoru-data-regular text-sm leading-[20px] text-[#A0A5C0]">
              {primaryAction.subtitle}
            </Text>
          </View>

          <RitualScene />

          <Pressable
            accessibilityHint={`Opens the ${primaryAction.label} anchor.`}
            accessibilityRole="link"
            className="relative z-10 active:scale-[0.97]"
            onPress={() => {
              handleHomeActionPress(primaryAction.id, primaryAction.routeTarget);
            }}
            testID="home-primary-action-link"
          >
            <View
              className="relative h-[52px] w-full flex-row items-center justify-center gap-2 overflow-hidden rounded-[16px] py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-5px_rgba(124,111,205,0.6)]"
              testID="home-primary-button-frame"
            >
              <View
                className="absolute inset-0 overflow-hidden rounded-[16px]"
                pointerEvents="none"
                testID="home-primary-button-gradient"
              >
                <Svg height={52} preserveAspectRatio="none" viewBox="0 0 310 52" width="100%">
                  <Defs>
                    <LinearGradient id="home-start-button-bg" x1="0" x2="0" y1="0" y2="1">
                      <Stop offset="0" stopColor="#A89CE0" />
                      <Stop offset="1" stopColor="#7C6FCD" />
                    </LinearGradient>
                  </Defs>
                  <Rect fill="url(#home-start-button-bg)" height="52" rx="16" width="310" />
                </Svg>
              </View>
              <View className="relative z-10 flex-row items-center gap-2">
                <Play color="#0D0F1A" fill="#0D0F1A" size={15} strokeWidth={2} />
                <Text className="font-nidoru-data-regular text-sm font-semibold leading-[20px] text-[#0D0F1A]">
                  {primaryAction.ctaText}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View className="flex-row gap-2.5" testID="home-quick-action-grid">
          {homeState.quickActions.map((action) => {
            const tone = quickActionToneById[action.id];
            const toneClasses = quickActionClassByTone[tone];
            const Icon = quickActionIcons[action.id];

            return (
              <View
                className="flex-1"
                key={action.id}
                testID={`home-quick-action-slot-${action.id}`}
              >
                <Pressable
                  accessibilityHint={action.accessibilityHint}
                  accessibilityLabel={`${action.label} quick action`}
                  accessibilityRole="link"
                  className="active:scale-[0.96]"
                  onPress={() => {
                    handleHomeActionPress(action.id, action.routeTarget);
                  }}
                  testID={`home-quick-action-link-${action.id}`}
                >
                  <View
                    className={cn(
                      "min-h-[92px] items-center justify-center gap-2 rounded-[18px] border bg-[#14172B]/70 px-2 py-3.5",
                      toneClasses.card,
                    )}
                    testID={`home-quick-action-card-${action.id}`}
                  >
                    <View
                      className={cn(
                        "h-9 w-9 rounded-full border items-center justify-center",
                        toneClasses.iconBox,
                      )}
                      testID={`home-quick-action-icon-box-${action.id}`}
                    >
                      <Icon color={toneClasses.iconColor} size={18} strokeWidth={1.7} />
                    </View>
                    <View className="items-center">
                      <Text className="text-center font-nidoru-data-regular text-[13px] font-semibold leading-[18px] text-[#EEF0FF]">
                        {action.label}
                      </Text>
                      <Text
                        className={cn(
                          "font-nidoru-data-regular text-[10px] font-normal tracking-wide",
                          toneClasses.subtitle,
                        )}
                      >
                        {action.subtitle}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>

        <HomeEntrancePolish>
          <SleepInsightCard summarySlot={summarySlot} />
          <WindDownLibrary />
        </HomeEntrancePolish>
      </ScrollView>
      {notificationGateController}
    </View>
  );
}

function PrimaryCardBackdrop() {
  return (
    <View
      className="absolute inset-0"
      pointerEvents="none"
      testID="home-primary-card-backdrop"
    >
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 350 310" width="100%">
        <Defs>
          <LinearGradient id="home-primary-card-bg" x1="0.18" x2="0.82" y1="0" y2="1">
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.22" />
            <Stop offset="0.5" stopColor="#14172B" stopOpacity="0.85" />
            <Stop offset="1" stopColor="#0F1230" stopOpacity="0.95" />
          </LinearGradient>
          <RadialGradient
            cx="238"
            cy="112"
            gradientUnits="userSpaceOnUse"
            id="home-primary-card-lavender-glow"
            r="172"
          >
            <Stop offset="0" stopColor="#A89CE0" stopOpacity="0.2" />
            <Stop offset="0.65" stopColor="#A89CE0" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#A89CE0" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="56"
            cy="366"
            gradientUnits="userSpaceOnUse"
            id="home-primary-card-moonstone-glow"
            r="156"
          >
            <Stop offset="0" stopColor="#5EC4D4" stopOpacity="0.1" />
            <Stop offset="0.62" stopColor="#5EC4D4" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#5EC4D4" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect
          fill="url(#home-primary-card-bg)"
          height="310"
          testID="home-primary-card-gradient"
          width="350"
        />
        <Rect
          fill="url(#home-primary-card-lavender-glow)"
          height="310"
          testID="home-primary-card-lavender-glow"
          width="350"
        />
        <Rect
          fill="url(#home-primary-card-moonstone-glow)"
          height="310"
          testID="home-primary-card-moonstone-glow"
          width="350"
        />
      </Svg>
    </View>
  );
}

function HomeAmbientBackdrop() {
  return (
    <View
      className="absolute inset-0 overflow-hidden"
      pointerEvents="none"
      testID="home-ambient-backdrop"
    >
      <Svg
        height="100%"
        preserveAspectRatio="none"
        testID="home-backdrop-svg"
        viewBox="0 0 390 844"
        width="100%"
      >
        <Defs>
          <RadialGradient
            cx="90"
            cy="42"
            gradientUnits="userSpaceOnUse"
            id="home-backdrop-top-left-glow"
            r="275"
          >
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.25" />
            <Stop offset="0.45" stopColor="#7C6FCD" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#7C6FCD" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="444"
            cy="310"
            gradientUnits="userSpaceOnUse"
            id="home-backdrop-right-glow"
            r="265"
          >
            <Stop offset="0" stopColor="#5EC4D4" stopOpacity="0.15" />
            <Stop offset="0.48" stopColor="#5EC4D4" stopOpacity="0.07" />
            <Stop offset="1" stopColor="#5EC4D4" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="76"
            cy="624"
            gradientUnits="userSpaceOnUse"
            id="home-backdrop-bottom-left-glow"
            r="250"
          >
            <Stop offset="0" stopColor="#A89CE0" stopOpacity="0.15" />
            <Stop offset="0.5" stopColor="#A89CE0" stopOpacity="0.07" />
            <Stop offset="1" stopColor="#A89CE0" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient
            cx="195"
            cy="0"
            gradientUnits="userSpaceOnUse"
            id="home-backdrop-vignette"
            r="680"
          >
            <Stop offset="0" stopColor="#000000" stopOpacity="0" />
            <Stop offset="0.4" stopColor="#000000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000000" stopOpacity="0.5" />
          </RadialGradient>
          <Pattern height="3" id="home-dot-grid" patternUnits="userSpaceOnUse" width="3">
            <Circle cx="1" cy="1" fill="#FFFFFF" fillOpacity="0.6" r="1" />
          </Pattern>
        </Defs>
        <Rect
          fill="#0D0F1A"
          height="844"
          testID="home-backdrop-base-color"
          width="390"
        />
        <Rect fill="url(#home-backdrop-top-left-glow)" height="844" width="390" />
        <Rect fill="url(#home-backdrop-right-glow)" height="844" width="390" />
        <Rect fill="url(#home-backdrop-bottom-left-glow)" height="844" width="390" />
        <Rect
          fill="url(#home-dot-grid)"
          height="844"
          opacity="0.05"
          testID="home-backdrop-dot-grid"
          width="390"
        />
        <Rect
          fill="url(#home-backdrop-vignette)"
          height="844"
          testID="home-backdrop-vignette"
          width="390"
        />
      </Svg>
    </View>
  );
}

function RitualScene() {
  return (
    <View
      className="relative z-10 mb-6 h-36 overflow-hidden rounded-[20px] border border-white/[0.05]"
      testID="home-ritual-scene"
    >
      <Svg
        height="100%"
        preserveAspectRatio="none"
        style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
        testID="home-ritual-scene-svg"
        viewBox="0 0 390 144"
        width="100%"
      >
        <Defs>
          <LinearGradient id="home-ritual-scene-bg" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor="#0D0F1A" stopOpacity="0" />
            <Stop offset="0.7" stopColor="#0D0F1A" stopOpacity="0.35" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="0.6" />
          </LinearGradient>
          <LinearGradient
            gradientUnits="userSpaceOnUse"
            id="home-mountain-far"
            x1="0"
            x2="0"
            y1="64"
            y2="144"
          >
            <Stop offset="0" stopColor="#7C6FCD" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#14172B" stopOpacity="0.9" />
          </LinearGradient>
          <LinearGradient
            gradientUnits="userSpaceOnUse"
            id="home-mountain-near"
            x1="0"
            x2="0"
            y1="64"
            y2="144"
          >
            <Stop offset="0" stopColor="#1C2040" />
            <Stop offset="1" stopColor="#0D0F1A" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#home-ritual-scene-bg)" height="144" width="390" />
        <Circle cx="70.2" cy="40.32" fill="#EEF0FF" opacity="0.7" r="1" />
        <Circle cx="280.8" cy="25.92" fill="#A89CE0" opacity="0.7" r="1" />
        <Circle cx="163.8" cy="63.36" fill="#EEF0FF" opacity="0.7" r="1" />
        <Circle cx="343.2" cy="54.72" fill="#5EC4D4" opacity="0.7" r="1" />
        <Circle cx="46.8" cy="89.28" fill="#EEF0FF" opacity="0.7" r="1" />
        <Circle cx="226.2" cy="43.2" fill="#EEF0FF" opacity="0.7" r="1.5" />
        <Circle cx="124.8" cy="17.28" fill="#A89CE0" opacity="0.7" r="1" />
        <Circle cx="312" cy="86.4" fill="#EEF0FF" opacity="0.7" r="1" />
        <Path
          d="M0 124 L60 94 L110 114 L160 86 L220 119 L280 92 L340 112 L390 96 L390 144 L0 144 Z"
          fill="url(#home-mountain-far)"
          opacity="0.55"
          testID="home-mountain-far"
        />
        <Path
          d="M0 134 L40 114 L90 129 L150 106 L210 132 L260 114 L320 130 L390 116 L390 144 L0 144 Z"
          fill="url(#home-mountain-near)"
          testID="home-mountain-near"
        />
      </Svg>
      <View className="absolute right-5 top-4 h-10 w-10" testID="home-scene-crescent-moon">
        <Svg
          height={64}
          style={{ left: -12, position: "absolute", top: -12 }}
          viewBox="0 0 64 64"
          width={64}
        >
          <Defs>
            <RadialGradient
              cx="32"
              cy="32"
              gradientUnits="userSpaceOnUse"
              id="home-moon-glow"
              r="32"
            >
              <Stop offset="0" stopColor="#A89CE0" stopOpacity="0.3" />
              <Stop offset="1" stopColor="#A89CE0" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="32" cy="32" fill="url(#home-moon-glow)" r="32" />
        </Svg>
        <Svg
          height={40}
          testID="home-crescent-moon-disc"
          viewBox="0 0 40 40"
          width={40}
        >
          <Defs>
            <LinearGradient id="home-crescent-fill" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor="#EEF0FF" />
              <Stop offset="1" stopColor="#A89CE0" />
            </LinearGradient>
            <ClipPath id="home-crescent-outer-clip">
              <Circle cx="20" cy="20" r="20" />
            </ClipPath>
          </Defs>
          <G clipPath="url(#home-crescent-outer-clip)" testID="home-crescent-moon-clipped-disc">
            <Circle cx="20" cy="20" fill="url(#home-crescent-fill)" r="20" />
            <Circle
              cx="12"
              cy="18"
              fill="#0D0F1A"
              r="19.2"
              testID="home-crescent-moon-cutout"
            />
          </G>
        </Svg>
      </View>
      <View className="absolute bottom-2 left-0 right-0 z-10 flex-row justify-between px-4">
        <BreathPhase accentClass="text-[#7C6FCD]" label="In" value="4s" />
        <BreathPhase alignment="center" accentClass="text-[#A89CE0]" label="Hold" value="7s" />
        <BreathPhase alignment="end" accentClass="text-[#5EC4D4]" label="Out" value="8s" />
      </View>
    </View>
  );
}

function BreathPhase({
  accentClass,
  alignment = "start",
  label,
  value,
}: {
  readonly accentClass: string;
  readonly alignment?: "center" | "end" | "start";
  readonly label: string;
  readonly value: string;
}) {
  return (
    <View
      className={cn(
        "flex-1 gap-0.5",
        alignment === "center" ? "items-center" : null,
        alignment === "end" ? "items-end" : "items-start",
      )}
    >
      <Text
        className={cn(
          "font-nidoru-data-regular text-[9px] font-medium uppercase tracking-[0.18em]",
          accentClass,
        )}
      >
        {label}
      </Text>
      <Text className="font-nidoru-data-regular text-[11px] text-[#EEF0FF]/90">
        {value}
      </Text>
    </View>
  );
}

function SleepInsightCard({
  summarySlot,
}: {
  readonly summarySlot: ReturnType<typeof createHomeOverview>["summarySlot"];
}) {
  const isLastNight = summarySlot.kind === "last-night";

  return (
    <View
      className={cn(
        "relative overflow-hidden rounded-[22px] border border-white/[0.06] p-4 active:scale-[0.98]",
        isLastNight ? "bg-[#14172B]/60" : "bg-[#14172B]/70",
      )}
      testID={isLastNight ? "home-last-night-card" : undefined}
    >
      {isLastNight ? <LastNightCardBackdrop /> : null}
      <View className="relative z-10">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {isLastNight ? <CloudRain color="#5EC4D4" size={16} strokeWidth={1.7} /> : null}
            <Text
              accessibilityRole={summarySlot.kind === "check-in" ? "header" : undefined}
              className="font-nidoru-data-regular text-[11px] font-medium uppercase tracking-[0.15em] text-[#8A8FA8]"
              selectable
            >
              {summarySlot.title}
            </Text>
          </View>
          {isLastNight ? (
            <View
              accessibilityLabel={summarySlot.ratingAccessibilityLabel}
              className="flex-row items-center gap-1"
              testID="home-last-night-rating"
            >
              <View className="flex-row gap-0.5">
                {[0, 1, 2, 3, 4].map((index) => (
                  <View
                    className={cn(
                      "h-3 w-1 rounded-full",
                      index < 4 ? "bg-[#A89CE0]" : "bg-[#1C2040]",
                    )}
                    key={index}
                  />
                ))}
              </View>
              <Text
                className="ml-1 font-nidoru-data-regular text-[11px] font-medium text-[#EEF0FF] tabular-nums"
                testID="home-last-night-rating-text"
              >
                {summarySlot.ratingText}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="mb-3 gap-1">
          <Text
            accessibilityRole={summarySlot.kind === "check-in" ? "header" : undefined}
            className="font-nidoru-data-regular text-[17px] font-medium leading-[22px] text-[#EEF0FF]"
            selectable
          >
            {summarySlot.summary}
          </Text>
          {isLastNight ? (
            <LastNightSuggestionText suggestion={summarySlot.suggestion} />
          ) : (
            <Text className="font-nidoru-data-regular text-sm leading-[22px] text-[#8A8FA8]">
              {summarySlot.suggestion}
            </Text>
          )}
        </View>
        <View className="border-t border-white/[0.05] pt-2">
          <Link asChild href={summarySlot.routeTarget}>
            <Pressable
              accessibilityHint={
                summarySlot.kind === "check-in" ? summarySlot.accessibilityHint : undefined
              }
              accessibilityRole="link"
              className="flex-row items-center justify-between"
              testID={isLastNight ? "home-last-night-action-row" : undefined}
            >
              <View className="flex-row items-center gap-1.5">
                <Text className="font-nidoru-data-regular text-sm font-medium leading-[20px] text-[#A89CE0]">
                  {summarySlot.actionLabel}
                </Text>
                <ArrowRight color="#A89CE0" size={14} strokeWidth={1.8} />
              </View>
              {isLastNight ? (
                <View className="flex-row items-center gap-1">
                  <Clock3 color="#8A8FA8" size={12} strokeWidth={1.7} />
                  <Text className="font-nidoru-data-regular text-[11px] text-[#8A8FA8]">
                    {summarySlot.durationText}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

function LastNightCardBackdrop() {
  return (
    <View
      className="pointer-events-none absolute inset-0"
      pointerEvents="none"
      testID="home-last-night-card-backdrop"
    >
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 156" width="100%">
        <Defs>
          <LinearGradient id="home-last-night-card-bg" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#5EC4D4" stopOpacity="0.08" />
            <Stop offset="0.6" stopColor="#5EC4D4" stopOpacity="0" />
            <Stop offset="1" stopColor="#5EC4D4" stopOpacity="0" />
          </LinearGradient>
          <RadialGradient
            cx="390"
            cy="0"
            gradientUnits="userSpaceOnUse"
            id="home-last-night-card-glow"
            r="128"
          >
            <Stop offset="0" stopColor="#5EC4D4" stopOpacity="0.1" />
            <Stop offset="0.45" stopColor="#5EC4D4" stopOpacity="0.04" />
            <Stop offset="1" stopColor="#5EC4D4" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect
          fill="url(#home-last-night-card-bg)"
          height="156"
          testID="home-last-night-card-base-gradient"
          width="390"
        />
        <Rect
          fill="url(#home-last-night-card-glow)"
          height="156"
          testID="home-last-night-card-cyan-glow"
          width="390"
        />
      </Svg>
    </View>
  );
}

function LastNightSuggestionText({ suggestion }: { readonly suggestion: string }) {
  const [prefix, suffix] = suggestion.split("14 min");

  if (suffix === undefined) {
    return (
      <Text
        className="font-nidoru-data-regular text-sm leading-[22px] text-[#8A8FA8]"
        testID="home-last-night-suggestion"
      >
        {suggestion}
      </Text>
    );
  }

  const [beforeLineBreak, afterLineBreak] = suffix.split(" tonight.");

  return (
    <Text
      className="font-nidoru-data-regular text-sm leading-[22px] text-[#8A8FA8]"
      testID="home-last-night-suggestion"
    >
      {prefix}
      <Text className="text-[#EEF0FF]" testID="home-last-night-highlight-duration">
        14 min
      </Text>
      {afterLineBreak === undefined ? (
        suffix
      ) : (
        <>
          {beforeLineBreak}
          <Text testID="home-last-night-suggestion-line-break">{"\ntonight."}</Text>
        </>
      )}
    </Text>
  );
}

function WindDownLibrary() {
  return (
    <View className="gap-3 pt-1">
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <BookOpen color="#A89CE0" size={16} strokeWidth={2.1} />
          <Text className="font-nidoru-data-regular text-sm font-medium leading-[20px] text-[#EEF0FF]">
            Wind-down library
          </Text>
        </View>
      </View>
      <ScrollView
        className="-mx-nidoru-screen"
        contentContainerClassName="gap-3 px-nidoru-screen pb-1"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {libraryCards.map((card) => {
          const Icon = card.Icon;

          return (
            <Link asChild href={card.routeTarget} key={card.id}>
              <Pressable accessibilityRole="link" className="active:scale-[0.97]">
                <View
                  className={cn(
                    "relative h-[180px] w-[148px] shrink-0 overflow-hidden rounded-[22px] border border-white/[0.06] p-3.5",
                    card.shadowClass,
                  )}
                  testID={`home-library-card-${card.id}`}
                >
                  <LibraryCardBackdrop id={card.id} variant={card.variant} />
                  <View className="relative z-10 h-full justify-between">
                    <View className="flex-row items-center justify-between">
                      <LibraryIconBadge
                        accentColor={card.accentColor}
                        iconColor={card.iconColor}
                        Icon={Icon}
                        id={card.id}
                        variant={card.variant}
                      />
                      <Text
                        className="font-nidoru-data-regular text-[10px] tracking-wider"
                        style={{ color: card.accentColor }}
                      >
                        {card.duration}
                      </Text>
                    </View>
                    <View className="gap-1">
                      <Text
                        className="font-nidoru-data-regular text-[10px] font-medium uppercase tracking-[0.18em]"
                        style={{ color: card.accentColor }}
                      >
                        {card.category}
                      </Text>
                      <Text className="font-nidoru-data-regular text-[15px] font-medium leading-[18px] text-[#EEF0FF]">
                        {card.title}
                      </Text>
                      <Text className="font-nidoru-data-regular text-[11px] text-[#8A8FA8]">
                        {card.subtitle}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}

function LibraryCardBackdrop({
  id,
  variant,
}: {
  readonly id: string;
  readonly variant: LibraryCardVariant;
}) {
  const isStory = variant === "story";
  const isRainfall = variant === "rainfall";
  const isMeditation = variant === "meditation";
  const firstStopColor = isRainfall ? "#5EC4D4" : isStory ? "#7C6FCD" : "#A89CE0";
  const firstStopOpacity = isRainfall ? "0.28" : isStory ? "0.35" : "0.22";
  const glowColor = isRainfall ? "#5EC4D4" : "#A89CE0";
  const glowOpacity = isRainfall ? "0.25" : isStory ? "0.3" : "0.2";
  const glowCx = isRainfall ? "0" : "148";
  const glowCy = isMeditation ? "180" : "0";

  return (
    <View
      className="absolute inset-0"
      pointerEvents="none"
      testID={`home-library-card-backdrop-${id}`}
    >
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 148 180" width="100%">
        <Defs>
          <LinearGradient id={`home-library-card-bg-${variant}`} x1="0.1" x2="0.9" y1="0" y2="1">
            <Stop offset="0" stopColor={firstStopColor} stopOpacity={firstStopOpacity} />
            <Stop offset="0.65" stopColor="#14172B" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#14172B" stopOpacity="0.9" />
          </LinearGradient>
          <RadialGradient
            cx={glowCx}
            cy={glowCy}
            gradientUnits="userSpaceOnUse"
            id={`home-library-card-glow-${variant}`}
            r="66"
          >
            <Stop offset="0" stopColor={glowColor} stopOpacity={glowOpacity} />
            <Stop offset="0.56" stopColor={glowColor} stopOpacity="0.1" />
            <Stop offset="1" stopColor={glowColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect
          fill={`url(#home-library-card-bg-${variant})`}
          height="180"
          testID={`home-library-card-gradient-${id}`}
          width="148"
        />
        <Rect
          fill={`url(#home-library-card-glow-${variant})`}
          height="180"
          testID={`home-library-card-glow-${id}`}
          width="148"
        />
        {isStory ? (
          <G opacity="0.5" testID="home-library-card-stars-lantern-keeper">
            <Circle cx="44" cy="45" fill="#EEF0FF" r="1" />
            <Circle cx="104" cy="72" fill="#A89CE0" r="1" />
            <Circle cx="74" cy="117" fill="#EEF0FF" r="1" />
          </G>
        ) : null}
        {isRainfall ? (
          <G
            opacity="0.6"
            testID="home-library-card-wave-coastal-rainfall"
            transform="translate(0 124)"
          >
            <Path
              d="M0 32 Q18 18 36 30 T74 28 T112 26 T148 22 L148 56 L0 56 Z"
              fill="#5EC4D4"
              fillOpacity="0.15"
              testID="home-library-card-wave-fill-coastal-rainfall"
            />
            <Path
              d="M0 40 Q18 30 36 38 T74 36 T112 34 T148 32"
              fill="none"
              stroke="#5EC4D4"
              strokeOpacity="0.5"
              strokeWidth="1"
              testID="home-library-card-wave-line-coastal-rainfall"
            />
          </G>
        ) : null}
      </Svg>
    </View>
  );
}

function LibraryIconBadge({
  accentColor,
  Icon,
  iconColor,
  id,
  variant,
}: {
  readonly accentColor: string;
  readonly Icon: LucideIcon;
  readonly iconColor: string;
  readonly id: string;
  readonly variant: LibraryCardVariant;
}) {
  const secondStopColor = variant === "story" ? "#7C6FCD" : accentColor;
  const firstStopOpacity = variant === "meditation" ? "0.25" : "0.3";
  const secondStopOpacity = variant === "meditation" ? "0.05" : "0.1";
  const borderClass =
    variant === "rainfall"
      ? "border-[#5EC4D4]/25"
      : variant === "meditation"
        ? "border-[#A89CE0]/20"
        : "border-[#A89CE0]/25";

  return (
    <View
      className={cn(
        "relative h-9 w-9 items-center justify-center overflow-hidden rounded-full border",
        borderClass,
      )}
      testID={`home-library-icon-badge-${id}`}
    >
      <Svg
        height="100%"
        preserveAspectRatio="none"
        style={{ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }}
        viewBox="0 0 36 36"
        width="100%"
      >
        <Defs>
          <LinearGradient id={`home-library-icon-bg-${variant}`} x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={accentColor} stopOpacity={firstStopOpacity} />
            <Stop offset="1" stopColor={secondStopColor} stopOpacity={secondStopOpacity} />
          </LinearGradient>
        </Defs>
        <Circle
          cx="18"
          cy="18"
          fill={`url(#home-library-icon-bg-${variant})`}
          r="18"
          testID={`home-library-icon-gradient-${id}`}
        />
      </Svg>
      <View className="relative z-10" testID={`home-library-icon-${id}`}>
        <Icon color={iconColor} size={18} strokeWidth={2.2} />
      </View>
    </View>
  );
}
