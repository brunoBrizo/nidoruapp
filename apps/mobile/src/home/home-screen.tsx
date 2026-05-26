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
  Defs,
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
    cardClass:
      "bg-[#1C2040]/85 shadow-[inset_0_1px_0_rgba(238,240,255,0.08),0_10px_30px_-10px_rgba(124,111,205,0.4)]",
    glowClass: "-right-8 -top-8 bg-[#A89CE0]/30",
    iconClass: "border-[#A89CE0]/25 bg-[#A89CE0]/15",
    accentColor: "#A89CE0",
  },
  {
    id: "coastal-rainfall",
    category: "Soundscape",
    title: "Coastal Rainfall",
    subtitle: "Loop · brown noise",
    duration: "∞",
    routeTarget: "/sleep/sounds",
    Icon: Droplets,
    cardClass:
      "bg-[#173344]/80 shadow-[inset_0_1px_0_rgba(238,240,255,0.08),0_10px_30px_-10px_rgba(94,196,212,0.3)]",
    glowClass: "-left-8 -top-8 bg-[#5EC4D4]/25",
    iconClass: "border-[#5EC4D4]/25 bg-[#5EC4D4]/15",
    accentColor: "#5EC4D4",
  },
  {
    id: "body-scan",
    category: "Meditation",
    title: "Body Scan",
    subtitle: "Guided · release tension",
    duration: "8 MIN",
    routeTarget: "/breathe/evening-prep",
    Icon: Sparkles,
    cardClass:
      "bg-[#181B32]/90 shadow-[inset_0_1px_0_rgba(238,240,255,0.08),0_10px_30px_-10px_rgba(168,156,224,0.3)]",
    glowClass: "-bottom-8 -right-8 bg-[#A89CE0]/20",
    iconClass: "border-[#A89CE0]/20 bg-[#A89CE0]/15",
    accentColor: "#A89CE0",
  },
] as const satisfies readonly {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly subtitle: string;
  readonly duration: string;
  readonly routeTarget: HomeRouteTarget;
  readonly Icon: LucideIcon;
  readonly cardClass: string;
  readonly glowClass: string;
  readonly iconClass: string;
  readonly accentColor: string;
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
  const homeState = createHomeOverview({ hasMorningCheckIn, now });
  const primaryAction = homeState.primaryAction;
  const summarySlot = homeState.summarySlot;
  const timestamp = useMemo(() => formatHomeTimestamp(now), [now]);

  return (
    <View className="flex-1 bg-[#0D0F1A]" testID="home-root">
      <HomeAmbientBackdrop />
      <ScrollView
        className="relative z-10 flex-1"
        contentContainerClassName="gap-4 px-5 pt-12 pb-[104px]"
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

          <Link asChild href={primaryAction.routeTarget}>
            <Pressable
              accessibilityHint={`Opens the ${primaryAction.label} anchor.`}
              accessibilityRole="link"
              className="relative z-10"
              onPress={() => markRescueMeTapIfNeeded(primaryAction.id)}
            >
              <View
                className="relative h-[52px] w-full flex-row items-center justify-center gap-2 overflow-hidden rounded-[16px] py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-5px_rgba(124,111,205,0.6)] active:scale-[0.97]"
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
          </Link>
        </View>

        <View className="flex-row gap-2.5" testID="home-quick-action-grid">
          {homeState.quickActions.map((action) => {
            const tone = quickActionToneById[action.id];
            const toneClasses = quickActionClassByTone[tone];
            const Icon = quickActionIcons[action.id];

            return (
              <View className="flex-1" key={action.id} testID={`home-quick-action-slot-${action.id}`}>
                <Link asChild href={action.routeTarget}>
                  <Pressable
                    accessibilityHint={action.accessibilityHint}
                    accessibilityLabel={`${action.label} quick action`}
                    accessibilityRole="link"
                    onPress={() => markRescueMeTapIfNeeded(action.id)}
                  >
                    <View
                      className={cn(
                        "min-h-[92px] items-center justify-center gap-2 rounded-[18px] bg-[#14172B]/70 px-2 py-3.5 active:scale-[0.96]",
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
                </Link>
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
          height={42}
          style={{ left: -8, position: "absolute", top: -1 }}
          testID="home-crescent-moon-disc"
          viewBox="-8 -1 50 42"
          width={50}
        >
          <Defs>
            <LinearGradient id="home-crescent-fill" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor="#EEF0FF" />
              <Stop offset="1" stopColor="#A89CE0" />
            </LinearGradient>
          </Defs>
          <Circle cx="20" cy="20" fill="url(#home-crescent-fill)" r="20" />
          <Circle cx="12" cy="18" fill="#0D0F1A" r="19.2" testID="home-crescent-moon-cutout" />
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
    <View className="relative overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#14172B]/70 p-4 active:scale-[0.98]">
      <View className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-[#5EC4D4]/10" />
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
              className="flex-row items-center gap-2"
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
              <Text className="font-nidoru-data-regular text-[11px] font-medium text-[#EEF0FF] tabular-nums">
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
          <Text className="font-nidoru-data-regular text-sm leading-[22px] text-[#8A8FA8]">
            {summarySlot.suggestion}
          </Text>
        </View>
        <View className="border-t border-white/[0.05] pt-2">
          <Link asChild href={summarySlot.routeTarget}>
            <Pressable
              accessibilityHint={
                summarySlot.kind === "check-in" ? summarySlot.accessibilityHint : undefined
              }
              accessibilityRole="link"
              className="min-h-8 flex-row items-center justify-between"
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

function WindDownLibrary() {
  return (
    <View className="gap-3 pt-1">
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <BookOpen color="#A89CE0" size={16} strokeWidth={1.8} />
          <Text className="font-nidoru-data-regular text-sm font-medium leading-[20px] text-[#EEF0FF]">
            Wind-down library
          </Text>
        </View>
        <Link asChild href="/sleep">
          <Pressable accessibilityRole="link" className="min-h-8 flex-row items-center gap-1">
            <Text className="font-nidoru-data-regular text-[10px] font-medium uppercase tracking-[0.15em] text-[#7C6FCD]">
              See all
            </Text>
            <ArrowRight color="#7C6FCD" size={12} strokeWidth={1.8} />
          </Pressable>
        </Link>
      </View>
      <ScrollView
        className="-mx-5"
        contentContainerClassName="gap-3 px-5 pb-1"
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
                    card.cardClass,
                  )}
                >
                  <View className={cn("absolute h-20 w-20 rounded-full", card.glowClass)} />
                  <View className="relative z-10 h-full justify-between">
                    <View className="flex-row items-center justify-between">
                      <View
                        className={cn(
                          "h-9 w-9 items-center justify-center rounded-full border",
                          card.iconClass,
                        )}
                      >
                        <Icon color={card.accentColor} size={18} strokeWidth={1.8} />
                      </View>
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
